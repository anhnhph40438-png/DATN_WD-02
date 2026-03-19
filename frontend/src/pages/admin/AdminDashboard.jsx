import { useState, useEffect } from 'react';
import {
  FiCalendar,
  FiDollarSign,
  FiUsers,
  FiScissors,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle
} from 'react-icons/fi';
import { statisticsService, barberService } from '../../services';
import { formatCurrency, formatDate, formatTime } from '../../utils/formatters';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashRes, appointmentRes, barberRes] = await Promise.all([
        statisticsService.getDashboardStats().catch(() => null),
        statisticsService.getAppointmentStats({ period: 'month' }).catch(() => null),
        statisticsService.getBarberStats({ period: 'month' }).catch(() => null),
      ]);

      const dashData = dashRes?.data || dashRes;
      const appointmentData = appointmentRes?.data || appointmentRes;
      const barberData = barberRes?.data || barberRes;

      if (dashData) {
        // Build appointmentsByStatus from appointment stats
        let appointmentsByStatus = null;
        if (appointmentData?.byStatus) {
          const bs = appointmentData.byStatus;
          if (typeof bs === 'object' && !Array.isArray(bs)) {
            appointmentsByStatus = bs;
          }
        }
        if (!appointmentsByStatus) {
          // Fallback: use pendingAppointments from dashboard
          appointmentsByStatus = {
            pending: dashData.pendingAppointments || 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0,
          };
        }

        // Build topBarbers from barber stats
        let topBarbers = [];
        if (barberData?.barbers && barberData.barbers.length > 0) {
          topBarbers = barberData.barbers.map(b => ({
            _id: b.barber?._id || b._id,
            user: b.barber?.user || b.user || { name: 'N/A' },
            totalAppointments: b.appointmentCount || b.completedCount || 0,
            revenue: b.revenue || 0,
          }));
        }

        setStats({
          ...dashData,
          appointmentsByStatus,
          topBarbers,
        });
      } else {
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        setStats(getMockData());
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      setStats(getMockData());
    } finally {
      setLoading(false);
    }
  };

  const getMockData = () => ({
    totalCustomers: 856,
    totalBarbers: 12,
    todayAppointments: 24,
    totalRevenue: 125500000,
    pendingAppointments: 8,
    recentAppointments: [
      { _id: '1', customer: { name: 'Nguyễn Văn A' }, barber: { user: { name: 'Trần Minh B' } }, date: new Date(), status: 'confirmed' },
      { _id: '2', customer: { name: 'Lê Thị C' }, barber: { user: { name: 'Phạm Văn D' } }, date: new Date(Date.now() - 3600000), status: 'completed' },
      { _id: '3', customer: { name: 'Hoàng Văn E' }, barber: { user: { name: 'Trần Minh B' } }, date: new Date(Date.now() - 7200000), status: 'pending' },
      { _id: '4', customer: { name: 'Nguyễn Thị F' }, barber: { user: { name: 'Võ Văn G' } }, date: new Date(Date.now() - 10800000), status: 'completed' },
      { _id: '5', customer: { name: 'Trần Văn H' }, barber: { user: { name: 'Phạm Văn D' } }, date: new Date(Date.now() - 14400000), status: 'cancelled' },
    ],
    appointmentsByStatus: {
      pending: 8,
      confirmed: 12,
      completed: 156,
      cancelled: 14
    },
    topBarbers: [
      { _id: '1', user: { name: 'Trần Minh B' }, totalAppointments: 48, revenue: 32000000 },
      { _id: '2', user: { name: 'Phạm Văn D' }, totalAppointments: 42, revenue: 28000000 },
      { _id: '3', user: { name: 'Võ Văn G' }, totalAppointments: 35, revenue: 24000000 },
    ]
  });

  const statsCards = stats ? [
    {
      label: 'Tổng khách hàng',
      value: stats.totalCustomers?.toLocaleString() || '0',
      subtext: 'Khách hàng đã đăng ký',
      icon: FiUsers,
      color: 'bg-primary-100',
      iconColor: 'text-primary-600',
    },
    {
      label: 'Tổng barber',
      value: stats.totalBarbers?.toString() || '0',
      subtext: 'Đang hoạt động',
      icon: FiScissors,
      color: 'bg-primary-100',
      iconColor: 'text-primary-600',
    },
    {
      label: 'Lịch hẹn hôm nay',
      value: stats.todayAppointments?.toString() || '0',
      subtext: `${stats.pendingAppointments || 0} đang chờ xác nhận`,
      icon: FiCalendar,
      color: 'bg-primary-100',
      iconColor: 'text-primary-600',
    },
    {
      label: 'Tổng doanh thu',
      value: formatCurrency(stats.totalRevenue || 0),
      subtext: 'Từ thanh toán online',
      icon: FiDollarSign,
      color: 'bg-primary-100',
      iconColor: 'text-primary-600',
    },
  ] : [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-primary-100 text-primary-700';
      case 'confirmed': return 'bg-primary-100 text-primary-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-dark-100 text-dark-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-dark-900">Dashboard</h1>
        <p className="text-dark-600">Tổng quan hoạt động của tiệm</p>
      </div>

      {error && (
        <div className="mb-6 bg-primary-50 border border-primary-200 text-primary-700 px-4 py-3 rounded-xl flex items-center">
          <FiAlertCircle className="mr-2" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat) => (
          <div key={stat.label} className="bg-white border border-dark-100 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.color} rounded-full flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-dark-900">{stat.value}</p>
            <p className="text-sm text-dark-600">{stat.label}</p>
            <p className="text-xs text-dark-500 mt-1">{stat.subtext}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Appointments by status */}
        <div className="bg-white border border-dark-100 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-dark-900 mb-6">Lịch hẹn theo trạng thái</h2>

          {stats?.appointmentsByStatus && (
            <div className="space-y-4">
              {[
                { key: 'pending', label: 'Chờ xác nhận', color: 'bg-primary-500', icon: FiClock },
                { key: 'confirmed', label: 'Đã xác nhận', color: 'bg-primary-500', icon: FiCheckCircle },
                { key: 'completed', label: 'Hoàn thành', color: 'bg-green-500', icon: FiCheckCircle },
                { key: 'cancelled', label: 'Đã hủy', color: 'bg-red-500', icon: FiXCircle },
              ].map((status) => {
                const total = Object.values(stats.appointmentsByStatus).reduce((a, b) => a + b, 0);
                const value = stats.appointmentsByStatus[status.key] || 0;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;

                return (
                  <div key={status.key} className="flex items-center">
                    <div className={`w-8 h-8 ${status.color} rounded-lg flex items-center justify-center mr-3`}>
                      <status.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-dark-600">{status.label}</span>
                        <span className="text-sm font-medium text-dark-900">{value}</span>
                      </div>
                      <div className="h-2 bg-dark-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${status.color} rounded-full transition-all duration-300`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Barbers */}
        <div className="bg-white border border-dark-100 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-dark-900 mb-4">Barbers nổi bật</h2>
          <div className="space-y-4">
            {stats?.topBarbers?.map((barber, index) => (
              <div key={barber._id || index} className="flex items-center p-3 rounded-lg hover:bg-dark-50">
                <div className="flex-shrink-0 mr-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-primary-500' : index === 1 ? 'bg-dark-400' : index === 2 ? 'bg-primary-600' : 'bg-dark-300'
                  }`}>
                    {barber.user?.avatar ? (
                      <img
                        src={barber.user.avatar}
                        alt={barber.user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark-900 truncate">
                    {barber.user?.name || 'N/A'}
                  </p>
                  <p className="text-xs text-dark-500">
                    {barber.totalAppointments} lịch hẹn
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-dark-900">
                    {formatCurrency(barber.revenue || 0)}
                  </p>
                  <p className="text-xs text-dark-500">Doanh thu</p>
                </div>
              </div>
            ))}
            {(!stats?.topBarbers || stats.topBarbers.length === 0) && (
              <p className="text-center text-dark-500 py-8">Chưa có dữ liệu</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent appointments */}
      <div className="bg-white border border-dark-100 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-dark-900 mb-4">Lịch hẹn gần đây</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-dark-100">
                <th className="text-left py-3 px-2 text-xs font-medium text-dark-600 uppercase tracking-wider">Khách hàng</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-dark-600 uppercase tracking-wider">Barber</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-dark-600 uppercase tracking-wider">Thời gian</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-dark-600 uppercase tracking-wider">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {stats?.recentAppointments?.map((appointment) => (
                <tr key={appointment._id} className="hover:bg-dark-50">
                  <td className="py-3 px-2">
                    <span className="text-sm font-medium text-dark-900">
                      {appointment.customer?.name || 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-sm text-dark-600">
                      {appointment.barber?.user?.name || 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-sm text-dark-600">
                      {formatDate(appointment.date)}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                      {getStatusText(appointment.status)}
                    </span>
                  </td>
                </tr>
              ))}
              {(!stats?.recentAppointments || stats.recentAppointments.length === 0) && (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-dark-500">
                    Không có lịch hẹn nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
