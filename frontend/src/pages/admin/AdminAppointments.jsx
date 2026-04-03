import { useState, useEffect } from 'react';
import {
  FiSearch,
  FiFilter,
  FiEye,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiCalendar,
  FiClock,
  FiScissors,
  FiDollarSign,
  FiAlertCircle,
  FiXCircle,
  FiPhone,
  FiMail,
  FiCheck,
  FiPlay,
  FiCheckCircle
} from 'react-icons/fi';
import { adminService, barberService } from '../../services';
import { formatDate, formatTime, formatCurrency, formatPhoneNumber } from '../../utils/formatters';

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [barberFilter, setBarberFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const itemsPerPage = 10;
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBarbers();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [currentPage, search, startDate, endDate, statusFilter, barberFilter]);

  const fetchBarbers = async () => {
    try {
      const response = await barberService.getBarbers();
      setBarbers(response.data?.barbers || []);
    } catch (err) {
      console.error('Error fetching barbers:', err);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: search || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        barberId: barberFilter !== 'all' ? barberFilter : undefined,
        sort: '-date',
      };
      const response = await adminService.getAllAppointments(params);
      const data = response.data || response;
      const rawAppointments = data.appointments || [];
      // Sắp xếp: pending lên đầu tiên
      const statusOrder = { pending: 0, confirmed: 1, 'in-progress': 2, completed: 3, cancelled: 4 };
      const sorted = [...rawAppointments].sort((a, b) => {
        const orderDiff = (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5);
        if (orderDiff !== 0) return orderDiff;
        return new Date(b.date) - new Date(a.date);
      });
      setAppointments(sorted);
      setTotalPages(data.pagination?.totalPages || Math.ceil((data.pagination?.total || 0) / itemsPerPage));
      setTotalAppointments(data.pagination?.total || data.appointments?.length || 0);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Không thể tải danh sách lịch hẹn');
      setAppointments(getMockAppointments());
      setTotalAppointments(25);
      setTotalPages(3);
    } finally {
      setLoading(false);
    }
  };

  const getMockAppointments = () => [
    {
      _id: '1',
      customer: { name: 'Nguyễn Văn A', phone: '0901234567', email: 'nguyenvana@email.com' },
      barber: { name: 'Barber Minh', phone: '0912345678' },
      date: new Date('2024-06-15'),
      time: '09:00',
      services: [{ name: 'Cắt tóc nam', price: 100000 }, { name: 'Gội đầu', price: 50000 }],
      totalPrice: 150000,
      status: 'completed',
      paymentStatus: 'paid',
      paymentMethod: 'vnpay',
      notes: 'Khách hàng yêu cầu cắt ngắn',
      createdAt: new Date('2024-06-10'),
    },
    {
      _id: '2',
      customer: { name: 'Lê Thị B', phone: '0923456789', email: 'lethib@email.com' },
      barber: { name: 'Barber Tuấn', phone: '0934567890' },
      date: new Date('2024-06-16'),
      time: '14:00',
      services: [{ name: 'Nhuộm tóc', price: 200000 }],
      totalPrice: 200000,
      status: 'confirmed',
      paymentStatus: 'unpaid',
      paymentMethod: 'cash',
      notes: '',
      createdAt: new Date('2024-06-12'),
    },
    {
      _id: '3',
      customer: { name: 'Trần Văn C', phone: '0945678901', email: 'tranvanc@email.com' },
      barber: { name: 'Barber Minh', phone: '0912345678' },
      date: new Date('2024-06-17'),
      time: '10:30',
      services: [{ name: 'Cắt tóc nam', price: 100000 }],
      totalPrice: 100000,
      status: 'pending',
      paymentStatus: 'unpaid',
      paymentMethod: 'cash',
      notes: '',
      createdAt: new Date('2024-06-14'),
    },
    {
      _id: '4',
      customer: { name: 'Phạm Thị D', phone: '0956789012', email: 'phamthid@email.com' },
      barber: { name: 'Barber Hùng', phone: '0967890123' },
      date: new Date('2024-06-14'),
      time: '16:00',
      services: [{ name: 'Cắt tóc nữ', price: 150000 }, { name: 'Duỗi tóc', price: 100000 }],
      totalPrice: 250000,
      status: 'cancelled',
      paymentStatus: 'refunded',
      paymentMethod: 'vnpay',
      cancelReason: 'Khách hàng có việc bận',
      notes: '',
      createdAt: new Date('2024-06-08'),
    },
  ];

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleCancelAppointment = async () => {
    if (!appointmentToCancel || !cancelReason.trim()) return;
    try {
      setActionLoading(true);
      await adminService.cancelAppointment(appointmentToCancel._id, cancelReason);
      setAppointments(appointments.map(a =>
        a._id === appointmentToCancel._id
          ? { ...a, status: 'cancelled', cancelReason }
          : a
      ));
      setShowCancelModal(false);
      setAppointmentToCancel(null);
      setCancelReason('');
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      alert('Không thể hủy lịch hẹn');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmAppointment = async (appointment) => {
    try {
      setActionLoading(true);
      await adminService.confirmAppointment(appointment._id);
      setAppointments(appointments.map(a =>
        a._id === appointment._id ? { ...a, status: 'confirmed' } : a
      ));
    } catch (err) {
      console.error('Error confirming appointment:', err);
      alert('Không thể xác nhận lịch hẹn');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartAppointment = async (appointment) => {
    try {
      setActionLoading(true);
      await adminService.startAppointment(appointment._id);
      setAppointments(appointments.map(a =>
        a._id === appointment._id ? { ...a, status: 'in-progress' } : a
      ));
    } catch (err) {
      console.error('Error starting appointment:', err);
      alert('Không thể xác nhận khách đến');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteAppointment = async (appointment) => {
    try {
      setActionLoading(true);
      await adminService.completeAppointment(appointment._id);
      setAppointments(appointments.map(a =>
        a._id === appointment._id ? { ...a, status: 'completed', paymentStatus: 'paid' } : a
      ));
    } catch (err) {
      console.error('Error completing appointment:', err);
      alert('Không thể xác nhận khách đi');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectAppointment = async () => {
    if (!appointmentToCancel || !cancelReason.trim()) return;
    try {
      setActionLoading(true);
      await adminService.rejectAppointment(appointmentToCancel._id, cancelReason);
      setAppointments(appointments.map(a =>
        a._id === appointmentToCancel._id
          ? { ...a, status: 'cancelled', cancelReason }
          : a
      ));
      setShowCancelModal(false);
      setAppointmentToCancel(null);
      setCancelReason('');
    } catch (err) {
      console.error('Error rejecting appointment:', err);
      alert('Không thể từ chối lịch hẹn');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowViewModal(true);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-primary-100 text-primary-700',
      confirmed: 'bg-primary-100 text-primary-700',
      in_progress: 'bg-primary-100 text-primary-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return statusColors[status] || 'bg-dark-100 text-dark-600';
  };

  const getStatusText = (status) => {
    const statusTexts = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      in_progress: 'Đang thực hiện',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
    };
    return statusTexts[status] || status;
  };

  const getPaymentBadge = (status) => {
    const paymentColors = {
      unpaid: 'bg-primary-100 text-primary-700',
      paid: 'bg-green-100 text-green-700',
      refunded: 'bg-dark-100 text-dark-600',
      failed: 'bg-red-100 text-red-700',
    };
    return paymentColors[status] || 'bg-dark-100 text-dark-600';
  };

  const getPaymentText = (status) => {
    const paymentTexts = {
      unpaid: 'Chưa thanh toán',
      paid: 'Đã thanh toán',
      refunded: 'Đã hoàn tiền',
      failed: 'Thất bại',
    };
    return paymentTexts[status] || status;
  };

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalAppointments);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-dark-900">Quản lý lịch hẹn</h1>
        <p className="text-dark-600">Xem và quản lý tất cả lịch hẹn</p>
      </div>

      {error && (
        <div className="mb-6 bg-primary-50 border border-primary-200 text-primary-700 px-4 py-3 rounded-xl flex items-center">
          <FiAlertCircle className="mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white border border-dark-100 rounded-xl p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, số điện thoại khách hàng..."
              value={search}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
            />
          </div>

          <div className="flex items-center space-x-2">
            <FiCalendar className="text-dark-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
            />
            <span className="text-dark-400">đến</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
            />
          </div>

          <div className="flex items-center space-x-2">
            <FiFilter className="text-dark-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="in_progress">Đang thực hiện</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          <div>
            <select
              value={barberFilter}
              onChange={(e) => { setBarberFilter(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
            >
              <option value="all">Tất cả barber</option>
              {barbers.map(barber => (
                <option key={barber._id} value={barber._id}>{barber.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-dark-100">
                <thead className="bg-dark-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-600 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-600 uppercase tracking-wider">
                      Khách hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-600 uppercase tracking-wider">
                      Barber
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-600 uppercase tracking-wider">
                      Ngày / Giờ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-600 uppercase tracking-wider">
                      Dịch vụ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-600 uppercase tracking-wider">
                      Tổng tiền
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-600 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-600 uppercase tracking-wider">
                      Thanh toán
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-dark-600 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-dark-100">
                  {appointments.map((appointment) => (
                    <tr key={appointment._id} className="hover:bg-dark-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-dark-600">
                          #{appointment._id.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <FiUser className="h-5 w-5 text-primary-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-dark-900">
                              {appointment.customer?.name || 'N/A'}
                            </div>
                            <div className="text-sm text-dark-500">
                              {formatPhoneNumber(appointment.customer?.phone)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-dark-900">
                          {appointment.barber?.user?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-dark-900">
                          {formatDate(appointment.date, { year: 'numeric', month: '2-digit', day: '2-digit' })}
                        </div>
                        <div className="text-sm text-dark-500">{appointment.startTime} - {appointment.endTime}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-dark-900">
                          {appointment.services?.map(s => s.name).join(', ') || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {appointment.discount > 0 ? (
                          <div>
                            <div className="text-xs line-through text-dark-400">
                              {formatCurrency(appointment.totalPrice || 0)}
                            </div>
                            <div className="text-sm font-medium text-primary-600">
                              {formatCurrency(appointment.finalPrice || 0)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm font-medium text-dark-900">
                            {formatCurrency(appointment.totalPrice || 0)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(appointment.status)}`}>
                          {getStatusText(appointment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentBadge(appointment.paymentStatus)}`}>
                          {getPaymentText(appointment.paymentStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewAppointment(appointment)}
                            className="p-2 text-dark-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          {appointment.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleConfirmAppointment(appointment)}
                                disabled={actionLoading}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Xác nhận"
                              >
                                <FiCheck className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setAppointmentToCancel(appointment); setShowCancelModal(true); }}
                                disabled={actionLoading}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Từ chối"
                              >
                                <FiXCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {appointment.status === 'confirmed' && (
                            <>
                              <button
                                onClick={() => handleStartAppointment(appointment)}
                                disabled={actionLoading}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Xác nhận khách đến"
                              >
                                <FiPlay className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setAppointmentToCancel(appointment); setShowCancelModal(true); }}
                                className="p-2 text-dark-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hủy lịch hẹn"
                              >
                                <FiXCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {appointment.status === 'in-progress' && (
                            <button
                              onClick={() => handleCompleteAppointment(appointment)}
                              disabled={actionLoading}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Xác nhận khách đi (hoàn thành + đã thanh toán)"
                            >
                              <FiCheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {appointments.length === 0 && (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center text-dark-500">
                        Không tìm thấy lịch hẹn nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-dark-100 flex items-center justify-between">
                <div className="text-sm text-dark-700">
                  Hiển thị <span className="font-medium">{startIndex}</span> đến{' '}
                  <span className="font-medium">{endIndex}</span> trong{' '}
                  <span className="font-medium">{totalAppointments}</span> lịch hẹn
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-dark-200 rounded-lg text-sm font-medium text-dark-700 hover:bg-dark-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                    Math.max(0, currentPage - 3),
                    Math.min(totalPages, currentPage + 2)
                  ).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        currentPage === page
                          ? 'bg-dark-900 text-white'
                          : 'text-dark-600 hover:bg-dark-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-dark-200 rounded-lg text-sm font-medium text-dark-700 hover:bg-dark-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showViewModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowViewModal(false)} />
          <div className="relative bg-white border border-dark-200 rounded-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-dark-900">
                Chi tiết lịch hẹn #{selectedAppointment._id.slice(-6).toUpperCase()}
              </h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 text-dark-400 hover:text-dark-600 rounded-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-dark-50 rounded-lg p-4">
                <h4 className="font-medium text-dark-900 mb-3 flex items-center">
                  <FiUser className="mr-2" /> Thông tin khách hàng
                </h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-dark-500">Tên:</span> {selectedAppointment.customer?.name}</p>
                  <p className="flex items-center">
                    <FiPhone className="mr-2 text-dark-400" />
                    {formatPhoneNumber(selectedAppointment.customer?.phone)}
                  </p>
                  <p className="flex items-center">
                    <FiMail className="mr-2 text-dark-400" />
                    {selectedAppointment.customer?.email || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="bg-dark-50 rounded-lg p-4">
                <h4 className="font-medium text-dark-900 mb-3 flex items-center">
                  <FiScissors className="mr-2" /> Barber
                </h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-dark-500">Tên:</span> {selectedAppointment.barber?.user?.name}</p>
                  <p className="flex items-center">
                    <FiPhone className="mr-2 text-dark-400" />
                    {formatPhoneNumber(selectedAppointment.barber?.user?.phone)}
                  </p>
                </div>
              </div>

              <div className="bg-dark-50 rounded-lg p-4">
                <h4 className="font-medium text-dark-900 mb-3 flex items-center">
                  <FiCalendar className="mr-2" /> Thời gian
                </h4>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center">
                    <FiCalendar className="mr-2 text-dark-400" />
                    {formatDate(selectedAppointment.date)}
                  </p>
                  <p className="flex items-center">
                    <FiClock className="mr-2 text-dark-400" />
                    {selectedAppointment.startTime} - {selectedAppointment.endTime}
                  </p>
                  <p>
                    <span className="text-dark-500">Ngày đặt:</span>{' '}
                    {formatDate(selectedAppointment.createdAt)}
                  </p>
                </div>
              </div>

              <div className="bg-dark-50 rounded-lg p-4">
                <h4 className="font-medium text-dark-900 mb-3 flex items-center">
                  <FiDollarSign className="mr-2" /> Thanh toán
                </h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-dark-500">Tổng tiền:</span>{' '}
                    {selectedAppointment.discount > 0 ? (
                      <>
                        <span className="line-through text-dark-400 mr-2">{formatCurrency(selectedAppointment.totalPrice)}</span>
                        <span className="font-medium text-primary-600">{formatCurrency(selectedAppointment.finalPrice)}</span>
                      </>
                    ) : (
                      <span className="font-medium">{formatCurrency(selectedAppointment.totalPrice)}</span>
                    )}
                  </p>
                  <p>
                    <span className="text-dark-500">Phương thức:</span>{' '}
                    {selectedAppointment.paymentMethod === 'vnpay' ? 'VNPay' : 'Tiền mặt'}
                  </p>
                  <p>
                    <span className="text-dark-500">Trạng thái:</span>{' '}
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentBadge(selectedAppointment.paymentStatus)}`}>
                      {getPaymentText(selectedAppointment.paymentStatus)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-dark-50 rounded-lg p-4">
              <h4 className="font-medium text-dark-900 mb-3">Dịch vụ</h4>
              <div className="space-y-2">
                {selectedAppointment.services?.map((service, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{service.name}</span>
                    <span className="font-medium">{formatCurrency(service.price)}</span>
                  </div>
                ))}
                {selectedAppointment.discount > 0 && (
                  <div className="border-t border-dark-200 pt-2 mt-2 flex justify-between text-sm text-dark-500">
                    <span>Giảm giá ({selectedAppointment.promoCode})</span>
                    <span>-{formatCurrency(selectedAppointment.discount)}</span>
                  </div>
                )}
                <div className={`${selectedAppointment.discount > 0 ? '' : 'border-t border-dark-200 pt-2 mt-2'} flex justify-between font-medium`}>
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(selectedAppointment.discount > 0 ? selectedAppointment.finalPrice : selectedAppointment.totalPrice)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div>
                <span className="text-dark-500 mr-2">Trạng thái:</span>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(selectedAppointment.status)}`}>
                  {getStatusText(selectedAppointment.status)}
                </span>
              </div>
            </div>

            {selectedAppointment.status === 'cancelled' && selectedAppointment.cancelReason && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-800">
                  <span className="font-medium">Lý do hủy:</span> {selectedAppointment.cancelReason}
                </p>
              </div>
            )}

            {selectedAppointment.notes && (
              <div className="mt-4 p-4 bg-primary-50 rounded-lg">
                <p className="text-sm text-primary-800">
                  <span className="font-medium">Ghi chú:</span> {selectedAppointment.notes}
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-dark-100 text-dark-700 rounded-lg hover:bg-dark-200 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && appointmentToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowCancelModal(false)} />
          <div className="relative bg-white border border-dark-200 rounded-xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <FiXCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-dark-900 mb-2">Hủy lịch hẹn</h3>
              <p className="text-dark-600 mb-4">
                Bạn có chắc chắn muốn hủy lịch hẹn của khách hàng{' '}
                <strong>{appointmentToCancel.customer?.name}</strong>?
              </p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-dark-700 text-left mb-2">
                  Lý do hủy *
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Nhập lý do hủy lịch hẹn..."
                  className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                  className="px-4 py-2 bg-dark-100 text-dark-700 rounded-lg hover:bg-dark-200 transition-colors"
                >
                  Quay lại
                </button>
                <button
                  onClick={handleCancelAppointment}
                  disabled={actionLoading || !cancelReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Đang xử lý...' : 'Xác nhận hủy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAppointments;
