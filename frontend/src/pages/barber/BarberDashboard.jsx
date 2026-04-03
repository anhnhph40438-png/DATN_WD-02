import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCalendar,
  FiDollarSign,
  FiUsers,
  FiTrendingUp,
  FiClock,
  FiCheck,
  FiPlay,
  FiStar,
  FiChevronRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { barberService } from '../../services';
import { formatCurrency, formatDate } from '../../utils/formatters';

const BarberDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    weekAppointments: 0,
    monthCustomers: 0,
    monthRevenue: 0,
  });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Get barber's profile to get the barber ID
      const barberProfile = await barberService.getMyBarberProfile();
      const barber = barberProfile.data?.barber;
      const barberId = barber?._id;

      // Fetch statistics
      const statsResponse = await barberService.getBarberStatistics(barberId);
      const statsData = statsResponse.data || {};
      if (statsData) {
        setStats({
          todayAppointments: statsData.todayAppointments || 0,
          weekAppointments: statsData.weekAppointments || 0,
          monthCustomers: statsData.monthCustomers || 0,
          monthRevenue: statsData.monthRevenue || 0,
        });
      }

      // Fetch today's appointments
      const today = new Date().toISOString().split('T')[0];
      const appointmentsResponse = await barberService.getBarberAppointments({ date: today });
      setTodayAppointments(appointmentsResponse.data?.appointments || []);

      // Fetch recent reviews
      const reviewsResponse = await barberService.getBarberReviews(barberId, { limit: 3 });
      setRecentReviews(reviewsResponse.data?.reviews || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      setActionLoading(appointmentId);
      if (newStatus === 'confirmed') {
        await barberService.confirmAppointment(appointmentId);
      } else if (newStatus === 'in-progress') {
        await barberService.startAppointment(appointmentId);
      } else if (newStatus === 'completed') {
        await barberService.completeAppointment(appointmentId);
      }
      toast.success(getStatusMessage(newStatus));
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật trạng thái');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusMessage = (status) => {
    const messages = {
      confirmed: 'Đã xác nhận lịch hẹn',
      'in-progress': 'Đã bắt đầu dịch vụ',
      completed: 'Đã hoàn thành dịch vụ',
    };
    return messages[status] || 'Cập nhật thành công';
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: 'Chờ xác nhận', color: 'bg-primary-100 text-primary-700' },
      confirmed: { text: 'Đã xác nhận', color: 'bg-green-100 text-green-700' },
      'in-progress': { text: 'Đang thực hiện', color: 'bg-primary-100 text-primary-700' },
      completed: { text: 'Hoàn thành', color: 'bg-dark-100 text-dark-700' },
      cancelled: { text: 'Đã hủy', color: 'bg-red-100 text-red-700' },
    };
    const { text, color } = statusMap[status] || { text: status, color: 'bg-dark-100 text-dark-700' };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{text}</span>;
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-primary-500 fill-current' : 'text-dark-200'}`}
          />
        ))}
      </div>
    );
  };

  const statsCards = [
    {
      label: 'Lịch hẹn hôm nay',
      value: stats.todayAppointments,
      icon: FiCalendar,
      bgLight: 'bg-primary-100',
      textColor: 'text-primary-600'
    },
    {
      label: 'Lịch hẹn tuần này',
      value: stats.weekAppointments,
      icon: FiClock,
      bgLight: 'bg-primary-100',
      textColor: 'text-primary-600'
    },
    {
      label: 'Khách tháng này',
      value: stats.monthCustomers,
      icon: FiUsers,
      bgLight: 'bg-primary-100',
      textColor: 'text-primary-600'
    },
    {
      label: 'Doanh thu tháng',
      value: formatCurrency(stats.monthRevenue),
      icon: FiDollarSign,
      bgLight: 'bg-primary-100',
      textColor: 'text-primary-600'
    },
  ];

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="mb-8">
          <div className="h-8 w-48 bg-dark-100 rounded mb-2"></div>
          <div className="h-5 w-64 bg-dark-100 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-dark-100 p-6 h-32"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-dark-100 p-6 h-64"></div>
          <div className="bg-white rounded-xl border border-dark-100 p-6 h-64"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-dark-900">Dashboard</h1>
        <p className="text-dark-600">Chào mừng quay trở lại, {user?.name || 'Barber'}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-dark-100 p-6 hover:border-dark-200 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-500 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-dark-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.bgLight} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <div className="bg-white rounded-xl border border-dark-100">
          <div className="p-6 border-b border-dark-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-semibold text-dark-900">Lịch hẹn hôm nay</h2>
              <Link
                to="/barber/appointments"
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                Xem tất cả
                <FiChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="divide-y divide-dark-100">
            {todayAppointments.length > 0 ? (
              todayAppointments.slice(0, 5).map((appointment) => (
                <div key={appointment._id} className="p-4 hover:bg-dark-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <FiUsers className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-dark-900">
                          {appointment.customer?.name || 'Khách hàng'}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-dark-500">
                          <FiClock className="w-3 h-3" />
                          <span>{appointment.startTime} - {appointment.endTime}</span>
                          <span className="text-dark-200">|</span>
                          <span>
                            {appointment.services?.map(s => typeof s === 'string' ? s : s.name).join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(appointment.status)}

                      {/* Quick Actions */}
                      <div className="flex items-center gap-1 ml-2">
                        {appointment.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(appointment._id, 'confirmed')}
                            disabled={actionLoading === appointment._id}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Xác nhận"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                        )}
                        {appointment.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusChange(appointment._id, 'in-progress')}
                            disabled={actionLoading === appointment._id}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Bắt đầu"
                          >
                            <FiPlay className="w-4 h-4" />
                          </button>
                        )}
                        {appointment.status === 'in-progress' && (
                          <button
                            onClick={() => handleStatusChange(appointment._id, 'completed')}
                            disabled={actionLoading === appointment._id}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Hoàn thành"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <FiCalendar className="w-12 h-12 text-dark-200 mx-auto mb-3" />
                <p className="text-dark-500">Không có lịch hẹn hôm nay</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="bg-white rounded-xl border border-dark-100">
          <div className="p-6 border-b border-dark-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-semibold text-dark-900">Đánh giá gần đây</h2>
              <Link
                to="/barber/statistics"
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                Xem tất cả
                <FiChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="divide-y divide-dark-100">
            {recentReviews.length > 0 ? (
              recentReviews.map((review) => (
                <div key={review._id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-dark-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {review.customer?.avatar ? (
                        <img
                          src={review.customer.avatar}
                          alt={review.customer.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <FiUsers className="w-5 h-5 text-dark-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-dark-900">
                          {review.customer?.name || 'Khách hàng'}
                        </p>
                        {renderStars(review.rating)}
                      </div>
                      {review.comment && (
                        <p className="text-sm text-dark-600 line-clamp-2">{review.comment}</p>
                      )}
                      <p className="text-xs text-dark-400 mt-1">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <FiStar className="w-12 h-12 text-dark-200 mx-auto mb-3" />
                <p className="text-dark-500">Chưa có đánh giá nào</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="mt-6 bg-gradient-to-r from-dark-900 to-dark-950 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-display font-semibold mb-1">Tổng quan hiệu suất</h3>
            <p className="text-dark-200 text-sm">
              Bạn đã phục vụ {stats.monthCustomers} khách hàng trong tháng này
            </p>
          </div>
          <Link
            to="/barber/statistics"
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg text-sm font-medium transition-colors"
          >
            Xem chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BarberDashboard;
