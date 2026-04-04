import { useState, useEffect } from 'react';
import {
  FiCalendar,
  FiCheck,
  FiPercent,
  FiDollarSign,
  FiStar,
  FiUser,
  FiTrendingUp,
  FiChevronDown
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { barberService } from '../../services';
import { formatCurrency, formatDate } from '../../utils/formatters';

const BarberStatistics = () => {
  const [loading, setLoading] = useState(true);
  const [barberId, setBarberId] = useState(null);
  const [period, setPeriod] = useState('month'); // week, month, year, custom
  const [customDateRange, setCustomDateRange] = useState({ from: '', to: '' });
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  const [stats, setStats] = useState({
    totalAppointments: 0,
    completedAppointments: 0,
    completionRate: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalReviews: 0,
    dailyAppointments: [],
    dailyRevenue: [],
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });

  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchStatistics();
  }, [period, customDateRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);

      // Get barber profile
      const barberProfile = await barberService.getMyBarberProfile();
      const barber = barberProfile.data?.barber;
      setBarberId(barber?._id);

      // Build params based on period
      const params = {};
      if (period === 'week') {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        params.dateFrom = weekAgo.toISOString().split('T')[0];
        params.dateTo = now.toISOString().split('T')[0];
      } else if (period === 'month') {
        const now = new Date();
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        params.dateFrom = monthAgo.toISOString().split('T')[0];
        params.dateTo = now.toISOString().split('T')[0];
      } else if (period === 'year') {
        const now = new Date();
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        params.dateFrom = yearAgo.toISOString().split('T')[0];
        params.dateTo = now.toISOString().split('T')[0];
      } else if (period === 'custom' && customDateRange.from && customDateRange.to) {
        params.dateFrom = customDateRange.from;
        params.dateTo = customDateRange.to;
      }

      // Fetch statistics
      const statsResponse = await barberService.getBarberStatistics(barber?._id, params);
      const statsData = statsResponse.data || {};
      const statistics = statsData.statistics || {};
      const barberInfo = statsData.barber || {};
      if (statsData) {
        setStats({
          totalAppointments: statistics.totalAppointments || 0,
          completedAppointments: statistics.byStatus?.completed || 0,
          completionRate: statistics.completionRate || 0,
          totalRevenue: statistics.revenue || 0,
          averageRating: barberInfo.rating || barber?.rating || 0,
          totalReviews: barberInfo.totalReviews || barber?.reviewCount || 0,
          dailyAppointments: statsData.dailyAppointments || [],
          dailyRevenue: statsData.dailyRevenue || [],
          ratingDistribution: statsData.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        });
      }

      // Fetch reviews
      const reviewsResponse = await barberService.getBarberReviews(barber?._id, { limit: 10 });
      setReviews(reviewsResponse.data?.reviews || []);

    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error('Không thể tải thống kê');
    } finally {
      setLoading(false);
    }
  };

  const periodOptions = [
    { value: 'week', label: 'Tuần này' },
    { value: 'month', label: 'Tháng này' },
    { value: 'year', label: 'Năm nay' },
    { value: 'custom', label: 'Tùy chọn' },
  ];

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

  const renderBigStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className={`w-8 h-8 ${star <= Math.round(rating) ? 'text-primary-500 fill-current' : 'text-dark-200'}`}
          />
        ))}
      </div>
    );
  };

  // Simple bar chart component
  const BarChart = ({ data, label, valueFormatter = (v) => v }) => {
    const maxValue = Math.max(...data.map((d) => d.value), 1);

    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-dark-600">{item.label}</span>
              <span className="font-medium text-dark-900">{valueFormatter(item.value)}</span>
            </div>
            <div className="h-3 bg-dark-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-500"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Generate last 7 days data for demo
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        label: date.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric' }),
        value: stats.dailyAppointments[6 - i] || Math.floor(Math.random() * 10),
      });
    }
    return days;
  };

  const getLast7DaysRevenue = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        label: date.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric' }),
        value: stats.dailyRevenue[6 - i] || Math.floor(Math.random() * 500000),
      });
    }
    return days;
  };

  const statsCards = [
    {
      label: 'Tổng lịch hẹn',
      value: stats.totalAppointments,
      icon: FiCalendar,
      bgLight: 'bg-primary-100',
      textColor: 'text-primary-600'
    },
    {
      label: 'Hoàn thành',
      value: stats.completedAppointments,
      icon: FiCheck,
      bgLight: 'bg-primary-100',
      textColor: 'text-primary-600'
    },
    {
      label: 'Tỷ lệ hoàn thành',
      value: `${stats.completionRate.toFixed(1)}%`,
      icon: FiPercent,
      bgLight: 'bg-primary-100',
      textColor: 'text-primary-600'
    },
    {
      label: 'Doanh thu',
      value: formatCurrency(stats.totalRevenue),
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
            <div key={i} className="bg-white rounded-xl h-32 animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl h-64 animate-pulse"></div>
          <div className="bg-white rounded-xl h-64 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-dark-900">Thống kê</h1>
          <p className="text-dark-600">Xem thống kê hiệu suất làm việc của bạn</p>
        </div>

        {/* Period Selector */}
        <div className="relative">
          <button
            onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
            className="inline-flex items-center px-4 py-2 bg-white border border-dark-200 rounded-lg hover:bg-dark-50 transition-colors"
          >
            <FiCalendar className="w-4 h-4 mr-2 text-dark-500" />
            <span>{periodOptions.find((p) => p.value === period)?.label}</span>
            <FiChevronDown className="w-4 h-4 ml-2 text-dark-500" />
          </button>

          {showPeriodDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-dark-200 z-10">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setPeriod(option.value);
                    setShowPeriodDropdown(false);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-dark-50 first:rounded-t-lg last:rounded-b-lg ${
                    period === option.value ? 'bg-primary-50 text-primary-600' : 'text-dark-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Custom Date Range */}
      {period === 'custom' && (
        <div className="bg-white rounded-xl border border-dark-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-dark-600">Từ:</label>
              <input
                type="date"
                value={customDateRange.from}
                onChange={(e) => setCustomDateRange({ ...customDateRange, from: e.target.value })}
                className="px-3 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-dark-600">Đến:</label>
              <input
                type="date"
                value={customDateRange.to}
                onChange={(e) => setCustomDateRange({ ...customDateRange, to: e.target.value })}
                className="px-3 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Appointments Chart */}
        <div className="bg-white rounded-xl border border-dark-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-display font-semibold text-dark-900">Lịch hẹn theo ngày</h2>
            <FiTrendingUp className="w-5 h-5 text-dark-400" />
          </div>
          <BarChart data={getLast7Days()} label="Lịch hẹn" />
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-xl border border-dark-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-display font-semibold text-dark-900">Doanh thu theo ngày</h2>
            <FiDollarSign className="w-5 h-5 text-dark-400" />
          </div>
          <BarChart
            data={getLast7DaysRevenue()}
            label="Doanh thu"
            valueFormatter={(v) => formatCurrency(v)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Average Rating */}
        <div className="bg-white rounded-xl border border-dark-100 p-6">
          <h2 className="text-lg font-display font-semibold text-dark-900 mb-6">Đánh giá trung bình</h2>
          <div className="text-center">
            <div className="text-5xl font-bold text-dark-900 mb-2">
              {stats.averageRating.toFixed(1)}
            </div>
            <div className="flex justify-center mb-2">
              {renderBigStars(stats.averageRating)}
            </div>
            <p className="text-sm text-dark-500">
              Từ {stats.totalReviews} đánh giá
            </p>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-white rounded-xl border border-dark-100 p-6">
          <h2 className="text-lg font-display font-semibold text-dark-900 mb-6">Phân bố đánh giá</h2>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.ratingDistribution[rating] || 0;
              const total = Object.values(stats.ratingDistribution).reduce((a, b) => a + b, 0) || 1;
              const percentage = (count / total) * 100;

              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm font-medium text-dark-700">{rating}</span>
                    <FiStar className="w-4 h-4 text-primary-500 fill-current" />
                  </div>
                  <div className="flex-1 h-2 bg-dark-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-dark-500 w-12 text-right">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="bg-white rounded-xl border border-dark-100">
          <div className="p-6 border-b border-dark-100">
            <h2 className="text-lg font-display font-semibold text-dark-900">Đánh giá gần đây</h2>
          </div>
          <div className="divide-y divide-dark-100 max-h-80 overflow-y-auto">
            {reviews.length > 0 ? (
              reviews.map((review) => (
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
                        <FiUser className="w-5 h-5 text-dark-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-dark-900 text-sm">
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
                <p className="text-dark-500 text-sm">Chưa có đánh giá nào</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="mt-6 bg-gradient-to-r from-dark-900 to-dark-950 rounded-xl p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-dark-200 text-sm mb-1">Tổng lịch hẹn</p>
            <p className="text-3xl font-bold">{stats.totalAppointments}</p>
          </div>
          <div>
            <p className="text-dark-200 text-sm mb-1">Tỷ lệ hoàn thành</p>
            <p className="text-3xl font-bold">{stats.completionRate.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-dark-200 text-sm mb-1">Tổng doanh thu</p>
            <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarberStatistics;
