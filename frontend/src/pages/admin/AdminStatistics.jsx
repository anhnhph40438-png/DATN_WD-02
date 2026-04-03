import { useState, useEffect } from 'react';
import {
  FiDollarSign,
  FiCalendar,
  FiUsers,
  FiStar,
  FiTrendingUp,
  FiTrendingDown,
  FiDownload,
  FiAlertCircle,
  FiScissors,
  FiUser,
  FiBarChart2,
  FiPieChart
} from 'react-icons/fi';
import { statisticsService } from '../../services';
import { formatCurrency } from '../../utils/formatters';

const AdminStatistics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [overview, setOverview] = useState({
    totalRevenue: 0,
    totalAppointments: 0,
    newCustomers: 0,
    avgRating: 0,
    revenueChange: 0,
    appointmentsChange: 0,
    customersChange: 0,
    ratingChange: 0,
  });
  const [revenueData, setRevenueData] = useState([]);
  const [appointmentsByStatus, setAppointmentsByStatus] = useState([]);
  const [appointmentsByDay, setAppointmentsByDay] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [topBarbers, setTopBarbers] = useState([]);
  const [customerStats, setCustomerStats] = useState({ new: 0, returning: 0, topCustomers: [] });

  useEffect(() => {
    fetchStatistics();
  }, [period, customStartDate, customEndDate]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = { period };
      if (period === 'custom' && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }

      const [revenueRes, appointmentRes, customerRes, barberRes, serviceRes] = await Promise.all([
        statisticsService.getRevenueStats(params).catch(() => null),
        statisticsService.getAppointmentStats(params).catch(() => null),
        statisticsService.getCustomerStats(params).catch(() => null),
        statisticsService.getBarberStats(params).catch(() => null),
        statisticsService.getServiceStats(params).catch(() => null),
      ]);

      const revData = revenueRes?.data || revenueRes;
      const appointmentData = appointmentRes?.data || appointmentRes;
      const customerData = customerRes?.data || customerRes;
      const barberData = barberRes?.data || barberRes;
      const serviceData = serviceRes?.data || serviceRes;

      if (revData) {
        setOverview(prev => ({
          ...prev,
          totalRevenue: revData.total || revData.totalRevenue || 0,
          revenueChange: revData.percentageChange || 0,
        }));
        // Backend returns { labels: [...], data: [...] }
        if (revData.labels && revData.data && revData.labels.length > 0) {
          setRevenueData(revData.labels.map((label, i) => ({
            label,
            value: revData.data[i] || 0,
          })));
        } else {
          setRevenueData(getMockRevenueData());
        }
      } else {
        setRevenueData(getMockRevenueData());
      }

      if (appointmentData) {
        setOverview(prev => ({
          ...prev,
          totalAppointments: appointmentData.total || 0,
          appointmentsChange: appointmentData.percentageChange || 0,
        }));
        const statusColors = { completed: '#10B981', confirmed: '#e8a317', pending: '#f59e0b', 'in-progress': '#3B82F6', cancelled: '#EF4444' };
        const rawStatus = appointmentData.byStatus;
        if (rawStatus && !Array.isArray(rawStatus)) {
          setAppointmentsByStatus(
            Object.entries(rawStatus)
              .filter(([, count]) => count > 0)
              .map(([status, count]) => ({ status, count, color: statusColors[status] || '#9CA3AF' }))
          );
        } else {
          setAppointmentsByStatus(rawStatus || getMockStatusData());
        }
        // Backend returns byPeriod: [{ date, count }]
        if (appointmentData.byPeriod && appointmentData.byPeriod.length > 0) {
          setAppointmentsByDay(appointmentData.byPeriod.map(d => ({
            label: d.date,
            value: d.count,
          })));
        } else {
          setAppointmentsByDay(getMockDayData());
        }
      }

      if (customerData) {
        const newCust = customerData.newCustomers;
        const newCustCount = typeof newCust === 'object' ? (newCust.thisMonth || newCust.thisWeek || 0) : (newCust || 0);
        setOverview(prev => ({
          ...prev,
          newCustomers: newCustCount,
          customersChange: customerData.percentageChange || 0,
        }));
        setCustomerStats({
          new: newCustCount,
          returning: customerData.totalCustomers ? customerData.totalCustomers - newCustCount : 0,
          topCustomers: (customerData.topCustomers || []).map(c => ({
            name: c.user?.name || c.name || 'N/A',
            visits: c.appointmentCount || c.visits || 0,
            totalSpent: c.totalSpent || 0,
          })),
        });
      }

      if (serviceData && serviceData.services && serviceData.services.length > 0) {
        setTopServices(serviceData.services.map(s => ({
          name: s.name,
          count: s.count,
          revenue: s.revenue,
          category: s.category,
        })));
      } else {
        setTopServices(getMockTopServices());
      }

      if (barberData) {
        const normalizedBarbers = (barberData.barbers || []).map(b => ({
          name: b.barber?.user?.name || b.name || 'N/A',
          appointments: b.appointmentCount || b.appointments || 0,
          revenue: b.revenue || 0,
          rating: b.averageRating || b.barber?.rating || b.rating || 0,
        }));
        setTopBarbers(normalizedBarbers.length > 0 ? normalizedBarbers : getMockTopBarbers());
        setOverview(prev => ({
          ...prev,
          avgRating: barberData.avgRating || 4.5,
          ratingChange: barberData.ratingChange || 0,
        }));
      }

      if (!revData && !appointmentData && !customerData && !barberData) {
        setMockData();
      }

    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('Không thể tải dữ liệu thống kê');
      setMockData();
    } finally {
      setLoading(false);
    }
  };

  const setMockData = () => {
    setOverview({
      totalRevenue: 15750000,
      totalAppointments: 128,
      newCustomers: 34,
      avgRating: 4.7,
      revenueChange: 12.5,
      appointmentsChange: 8.3,
      customersChange: 15.2,
      ratingChange: 0.2,
    });
    setRevenueData(getMockRevenueData());
    setAppointmentsByStatus(getMockStatusData());
    setAppointmentsByDay(getMockDayData());
    setTopServices(getMockTopServices());
    setTopBarbers(getMockTopBarbers());
    setCustomerStats({
      new: 34,
      returning: 94,
      topCustomers: getMockTopCustomers(),
    });
  };

  const getMockRevenueData = () => [
    { label: 'T2', value: 2100000 },
    { label: 'T3', value: 1800000 },
    { label: 'T4', value: 2400000 },
    { label: 'T5', value: 2200000 },
    { label: 'T6', value: 2800000 },
    { label: 'T7', value: 3200000 },
    { label: 'CN', value: 1250000 },
  ];

  const getMockStatusData = () => [
    { status: 'completed', count: 98, color: '#10B981' },
    { status: 'confirmed', count: 15, color: '#e8a317' },
    { status: 'pending', count: 8, color: '#e8a317' },
    { status: 'cancelled', count: 7, color: '#EF4444' },
  ];

  const getMockDayData = () => [
    { label: 'T2', value: 18 },
    { label: 'T3', value: 15 },
    { label: 'T4', value: 20 },
    { label: 'T5', value: 17 },
    { label: 'T6', value: 22 },
    { label: 'T7', value: 28 },
    { label: 'CN', value: 8 },
  ];

  const getMockTopServices = () => [
    { name: 'Cắt tóc nam', count: 85, revenue: 8500000 },
    { name: 'Gội đầu', count: 62, revenue: 3100000 },
    { name: 'Nhuộm tóc', count: 28, revenue: 5600000 },
    { name: 'Uốn tóc', count: 22, revenue: 4400000 },
    { name: 'Cắt râu', count: 45, revenue: 1350000 },
  ];

  const getMockTopBarbers = () => [
    { name: 'Barber Minh', appointments: 42, revenue: 5250000, rating: 4.9 },
    { name: 'Barber Tuấn', appointments: 38, revenue: 4750000, rating: 4.8 },
    { name: 'Barber Hùng', appointments: 30, revenue: 3750000, rating: 4.7 },
    { name: 'Barber Nam', appointments: 18, revenue: 2000000, rating: 4.5 },
  ];

  const getMockTopCustomers = () => [
    { name: 'Nguyễn Văn A', visits: 8, totalSpent: 1200000 },
    { name: 'Lê Thị B', visits: 6, totalSpent: 900000 },
    { name: 'Trần Văn C', visits: 5, totalSpent: 750000 },
  ];

  const getStatusLabel = (status) => {
    const labels = {
      completed: 'Hoàn thành',
      confirmed: 'Đã xác nhận',
      pending: 'Chờ xác nhận',
      cancelled: 'Đã hủy',
    };
    return labels[status] || status;
  };

  const handleExport = () => {
    const report = {
      period,
      generatedAt: new Date().toISOString(),
      overview,
      topServices,
      topBarbers,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bao-cao-thong-ke-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxRevenueValue = Math.max(...revenueData.map(d => d.value), 1);
  const maxDayValue = Math.max(...appointmentsByDay.map(d => d.value), 1);
  const totalAppointmentsByStatus = appointmentsByStatus.reduce((sum, s) => sum + s.count, 0) || 1;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-dark-900">Thống kê</h1>
          <p className="text-dark-600 mt-1">Xem báo cáo và thống kê chi tiết</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center px-4 py-2 bg-dark-900 text-white rounded-lg hover:bg-dark-950 transition-colors"
        >
          <FiDownload className="mr-2" />
          Xuất báo cáo
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-primary-50 border border-primary-200 text-primary-800 px-4 py-3 rounded-lg flex items-center">
          <FiAlertCircle className="mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white border border-dark-100 rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-dark-600">Kỳ báo cáo:</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500"
            >
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
              <option value="year">Năm nay</option>
              <option value="custom">Tự chọn</option>
            </select>
          </div>

          {period === 'custom' && (
            <div className="flex items-center space-x-2">
              <FiCalendar className="text-dark-400" />
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500"
              />
              <span className="text-dark-400">đến</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500"
              />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white border border-dark-100 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-dark-500 mb-1">Tổng doanh thu</p>
                  <p className="text-2xl font-bold text-dark-900">{formatCurrency(overview.totalRevenue)}</p>
                  <div className={`flex items-center mt-2 text-sm ${overview.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {overview.revenueChange >= 0 ? <FiTrendingUp className="mr-1" /> : <FiTrendingDown className="mr-1" />}
                    <span>{Math.abs(overview.revenueChange)}% so với kỳ trước</span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FiDollarSign className="h-6 w-6 text-primary-600" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-dark-100 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-dark-500 mb-1">Tổng lịch hẹn</p>
                  <p className="text-2xl font-bold text-dark-900">{overview.totalAppointments}</p>
                  <div className={`flex items-center mt-2 text-sm ${overview.appointmentsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {overview.appointmentsChange >= 0 ? <FiTrendingUp className="mr-1" /> : <FiTrendingDown className="mr-1" />}
                    <span>{Math.abs(overview.appointmentsChange)}% so với kỳ trước</span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FiCalendar className="h-6 w-6 text-primary-600" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-dark-100 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-dark-500 mb-1">Khách hàng mới</p>
                  <p className="text-2xl font-bold text-dark-900">{overview.newCustomers}</p>
                  <div className={`flex items-center mt-2 text-sm ${overview.customersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {overview.customersChange >= 0 ? <FiTrendingUp className="mr-1" /> : <FiTrendingDown className="mr-1" />}
                    <span>{Math.abs(overview.customersChange)}% so với kỳ trước</span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FiUsers className="h-6 w-6 text-primary-600" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-dark-100 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-dark-500 mb-1">Đánh giá trung bình</p>
                  <p className="text-2xl font-bold text-dark-900">{overview.avgRating.toFixed(1)}</p>
                  <div className={`flex items-center mt-2 text-sm ${overview.ratingChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {overview.ratingChange >= 0 ? <FiTrendingUp className="mr-1" /> : <FiTrendingDown className="mr-1" />}
                    <span>{overview.ratingChange >= 0 ? '+' : ''}{overview.ratingChange.toFixed(1)} điểm</span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FiStar className="h-6 w-6 text-primary-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white border border-dark-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-display font-semibold text-dark-900 flex items-center">
                  <FiBarChart2 className="mr-2 text-primary-600" />
                  Doanh thu theo ngày
                </h3>
              </div>
              <div className="flex items-end h-48 space-x-2">
                {revenueData.map((item, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center">
                      <span className="text-xs text-dark-500 mb-1">
                        {(item.value / 1000000).toFixed(1)}M
                      </span>
                      <div
                        className="w-full bg-primary-500 rounded-t hover:bg-primary-600 transition-colors"
                        style={{ height: `${(item.value / maxRevenueValue) * 150}px` }}
                      />
                    </div>
                    <span className="text-xs text-dark-600 mt-2">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-dark-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-display font-semibold text-dark-900 flex items-center">
                  <FiPieChart className="mr-2 text-primary-600" />
                  Lịch hẹn theo trạng thái
                </h3>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-40 h-40">
                  <div
                    className="w-full h-full rounded-full"
                    style={{
                      background: `conic-gradient(
                        ${appointmentsByStatus.map((s, i) => {
                          const startPercent = appointmentsByStatus.slice(0, i).reduce((sum, x) => sum + (x.count / totalAppointmentsByStatus) * 100, 0);
                          const endPercent = startPercent + (s.count / totalAppointmentsByStatus) * 100;
                          return `${s.color} ${startPercent}% ${endPercent}%`;
                        }).join(', ')}
                      )`
                    }}
                  />
                  <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-dark-900">{totalAppointmentsByStatus}</span>
                  </div>
                </div>
                <div className="ml-6 space-y-2">
                  {appointmentsByStatus.map((status, i) => (
                    <div key={i} className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="text-sm text-dark-600">
                        {getStatusLabel(status.status)}: {status.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-dark-100 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-display font-semibold text-dark-900 flex items-center">
                <FiBarChart2 className="mr-2 text-primary-600" />
                Lịch hẹn theo ngày trong tuần
              </h3>
            </div>
            <div className="flex items-end h-40 space-x-4">
              {appointmentsByDay.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <span className="text-sm font-medium text-dark-700 mb-1">{item.value}</span>
                  <div
                    className="w-full bg-primary-500 rounded-t hover:bg-primary-600 transition-colors"
                    style={{ height: `${(item.value / maxDayValue) * 120}px` }}
                  />
                  <span className="text-xs text-dark-600 mt-2">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-dark-100 rounded-xl p-6">
              <h3 className="text-lg font-display font-semibold text-dark-900 flex items-center mb-4">
                <FiScissors className="mr-2 text-primary-600" />
                Dịch vụ phổ biến
              </h3>
              <div className="space-y-4">
                {topServices.map((service, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs flex items-center justify-center mr-3">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-dark-900">{service.name}</p>
                        <p className="text-xs text-dark-500">{service.count} lượt</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-primary-600">
                      {formatCurrency(service.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-dark-100 rounded-xl p-6">
              <h3 className="text-lg font-display font-semibold text-dark-900 flex items-center mb-4">
                <FiUser className="mr-2 text-primary-600" />
                Top Barber
              </h3>
              <div className="space-y-4">
                {topBarbers.map((barber, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`w-6 h-6 rounded-full text-white text-xs flex items-center justify-center mr-3 ${
                        i === 0 ? 'bg-primary-500' : i === 1 ? 'bg-dark-400' : i === 2 ? 'bg-primary-400' : 'bg-dark-300'
                      }`}>
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-dark-900">{barber.name}</p>
                        <p className="text-xs text-dark-500">{barber.appointments} lịch hẹn</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-primary-600">{formatCurrency(barber.revenue)}</p>
                      <div className="flex items-center text-xs text-primary-600">
                        <FiStar className="w-3 h-3 mr-1" />
                        {barber.rating}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-dark-100 rounded-xl p-6">
              <h3 className="text-lg font-display font-semibold text-dark-900 flex items-center mb-4">
                <FiUsers className="mr-2 text-primary-600" />
                Khách hàng
              </h3>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-dark-600">Khách mới: {customerStats.new}</span>
                  <span className="text-dark-600">Quay lại: {customerStats.returning}</span>
                </div>
                <div className="w-full h-3 bg-dark-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500"
                    style={{
                      width: `${(customerStats.new / (customerStats.new + customerStats.returning || 1)) * 100}%`
                    }}
                  />
                </div>
              </div>

              <p className="text-sm text-dark-500 mb-3">Khách hàng tích cực</p>
              <div className="space-y-3">
                {customerStats.topCustomers.map((customer, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-2">
                        <FiUser className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-dark-900">{customer.name}</p>
                        <p className="text-xs text-dark-500">{customer.visits} lần ghé</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-primary-600">
                      {formatCurrency(customer.totalSpent)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminStatistics;
