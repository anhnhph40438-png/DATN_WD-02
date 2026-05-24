import { useState, useEffect } from 'react';
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiCheck,
  FiX,
  FiPlay,
  FiFilter,
  FiList,
  FiGrid,
  FiDollarSign,
  FiPhone,
  FiMail,
  FiFileText
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { barberService } from '../../services';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Modal from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui';

const BarberAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    fetchAppointments();
  }, [filters]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;

      const response = await barberService.getBarberAppointments(params);
      const rawAppointments = response.data?.appointments || [];
      // Sắp xếp: pending lên đầu tiên
      const statusOrder = { pending: 0, confirmed: 1, 'in-progress': 2, completed: 3, cancelled: 4 };
      const sorted = [...rawAppointments].sort((a, b) => {
        const orderDiff = (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5);
        if (orderDiff !== 0) return orderDiff;
        // Cùng status thì sắp xếp theo ngày mới nhất
        return new Date(b.date) - new Date(a.date);
      });
      setAppointments(sorted);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Không thể tải danh sách lịch hẹn');
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
      fetchAppointments();
      setShowDetailModal(false);
      setShowRejectModal(false);
      setRejectReason('');
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật trạng thái');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedAppointment) return;
    try {
      setActionLoading(selectedAppointment._id);
      await barberService.rejectAppointment(selectedAppointment._id, rejectReason);
      toast.success('Đã từ chối lịch hẹn');
      fetchAppointments();
      setShowDetailModal(false);
      setShowRejectModal(false);
      setRejectReason('');
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      toast.error(error.response?.data?.message || 'Không thể từ chối lịch hẹn');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusMessage = (status) => {
    const messages = {
      confirmed: 'Đã xác nhận lịch hẹn',
      'in-progress': 'Đã bắt đầu dịch vụ',
      completed: 'Đã hoàn thành dịch vụ',
      cancelled: 'Đã từ chối lịch hẹn',
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
      noshow: { text: 'Không đến', color: 'bg-dark-100 text-dark-700' },
    };
    const { text, color } = statusMap[status] || { text: status, color: 'bg-dark-100 text-dark-700' };
    return <span className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>{text}</span>;
  };

  const getPaymentBadge = (paymentStatus) => {
    const statusMap = {
      unpaid: { text: 'Chưa thanh toán', color: 'bg-primary-100 text-primary-700' },
      paid: { text: 'Đã thanh toán', color: 'bg-green-100 text-green-700' },
      refunded: { text: 'Đã hoàn tiền', color: 'bg-dark-100 text-dark-700' },
    };
    const { text, color } = statusMap[paymentStatus] || { text: paymentStatus, color: 'bg-dark-100 text-dark-700' };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>{text}</span>;
  };

  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailModal(true);
  };

  const openRejectModal = (appointment) => {
    setSelectedAppointment(appointment);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleBarberReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) {
      toast.error('Vui lòng chọn ngày và giờ mới');
      return;
    }
    setRescheduleLoading(true);
    try {
      await api.put(`/appointments/${rescheduleTarget._id}/reschedule`, {
        date: rescheduleDate,
        startTime: rescheduleTime,
        reason: rescheduleReason,
      });
      toast.success('Đã gửi yêu cầu đổi lịch cho khách hàng!');
      setRescheduleModalOpen(false);
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể gửi yêu cầu');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    setConfirmLoading(true);
    try {
      const { type, appointmentId } = confirmAction;
      if (type === 'confirm') await api.patch(`/appointments/${appointmentId}/confirm`);
      else if (type === 'reject') await api.patch(`/appointments/${appointmentId}/reject`);
      else if (type === 'start') await api.patch(`/appointments/${appointmentId}/start`);
      else if (type === 'complete') await api.patch(`/appointments/${appointmentId}/complete`);
      else if (type === 'cancel') await api.patch(`/appointments/${appointmentId}/cancel`);
      toast.success('Thao tác thành công!');
      setConfirmAction(null);
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setConfirmLoading(false);
    }
  };

  const openRescheduleModal = (apt) => {
    setRescheduleTarget(apt);
    setRescheduleDate('');
    setRescheduleTime('');
    setRescheduleReason('');
    setRescheduleModalOpen(true);
  };

  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'pending', label: 'Chờ xác nhận' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'in-progress', label: 'Đang thực hiện' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'cancelled', label: 'Đã hủy' },
  ];

  // Group appointments by date for calendar view
  const groupedAppointments = appointments.reduce((groups, apt) => {
    const date = new Date(apt.date).toLocaleDateString('vi-VN');
    if (!groups[date]) groups[date] = [];
    groups[date].push(apt);
    return groups;
  }, {});

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-dark-900">Lịch hẹn</h1>
        <p className="text-dark-600">Quản lý lịch hẹn với khách hàng</p>
      </div>

      {/* Filters and View Toggle */}
      <div className="bg-white rounded-xl border border-dark-100 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <FiFilter className="w-4 h-4 text-dark-400" />
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent text-sm"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <FiCalendar className="w-4 h-4 text-dark-400" />
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="px-3 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent text-sm"
              />
              <span className="text-dark-400">-</span>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="px-3 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list'
                  ? 'bg-dark-900 text-white'
                  : 'text-dark-500 hover:bg-dark-50'
                }`}
              title="Xem danh sách"
            >
              <FiList className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'calendar'
                  ? 'bg-dark-900 text-white'
                  : 'text-dark-500 hover:bg-dark-50'
                }`}
              title="Xem theo ngày"
            >
              <FiGrid className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-24 animate-pulse"></div>
          ))}
        </div>
      ) : appointments.length > 0 ? (
        viewMode === 'list' ? (
          /* List View */
          <div className="bg-white rounded-xl border border-dark-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-50 border-b border-dark-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                      Ngày & Giờ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                      Khách hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                      Dịch vụ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                      Tổng tiền
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-dark-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-100">
                  {appointments.map((appointment) => (
                    <tr
                      key={appointment._id}
                      className="hover:bg-dark-50 cursor-pointer"
                      onClick={() => handleAppointmentClick(appointment)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-dark-900">
                          {formatDate(appointment.date, { year: 'numeric', month: '2-digit', day: '2-digit' })}
                        </div>
                        <div className="text-sm text-dark-500 flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          {appointment.startTime} - {appointment.endTime}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <FiUser className="w-4 h-4 text-primary-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-dark-900">
                              {appointment.customer?.name || 'Khách hàng'}
                            </div>
                            <div className="text-xs text-dark-500">
                              {appointment.customer?.phone || ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {appointment.services?.slice(0, 2).map((service, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-dark-100 text-dark-700 text-xs rounded"
                            >
                              {typeof service === 'string' ? service : service.name}
                            </span>
                          ))}
                          {appointment.services?.length > 2 && (
                            <span className="px-2 py-0.5 bg-dark-100 text-dark-500 text-xs rounded">
                              +{appointment.services.length - 2}
                            </span>
                          )}
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
                            {formatCurrency(appointment.totalPrice || appointment.total || 0)}
                          </div>
                        )}
                        <div className="text-xs">
                          {getPaymentBadge(appointment.paymentStatus)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(appointment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          {appointment.rescheduleRequest?.status === 'pending' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              Chờ khách xác nhận
                            </span>
                          )}
                          {['pending', 'confirmed'].includes(appointment.status) && appointment.rescheduleRequest?.status !== 'pending' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); openRescheduleModal(appointment); }}
                              className="px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100"
                            >
                              Đề xuất đổi lịch
                            </button>
                          )}
                          {appointment.status === 'pending' && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'confirm', appointmentId: appointment._id, title: 'Xác nhận lịch hẹn', message: 'Bạn có chắc chắn muốn xác nhận lịch hẹn này?', variant: 'info', confirmText: 'Xác nhận' }); }}
                                disabled={actionLoading === appointment._id}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Xác nhận"
                              >
                                <FiCheck className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'reject', appointmentId: appointment._id, title: 'Từ chối lịch hẹn', message: 'Bạn có chắc chắn muốn từ chối lịch hẹn này?', variant: 'danger', confirmText: 'Từ chối' }); }}
                                disabled={actionLoading === appointment._id}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Từ chối"
                              >
                                <FiX className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {appointment.status === 'confirmed' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'start', appointmentId: appointment._id, title: 'Bắt đầu dịch vụ', message: 'Bạn có chắc chắn muốn bắt đầu dịch vụ cho lịch hẹn này?', variant: 'info', confirmText: 'Bắt đầu' }); }}
                              disabled={actionLoading === appointment._id}
                              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="Bắt đầu"
                            >
                              <FiPlay className="w-4 h-4" />
                            </button>
                          )}
                          {appointment.status === 'in-progress' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'complete', appointmentId: appointment._id, title: 'Hoàn thành dịch vụ', message: 'Bạn có chắc chắn muốn đánh dấu hoàn thành dịch vụ này?', variant: 'info', confirmText: 'Hoàn thành' }); }}
                              disabled={actionLoading === appointment._id}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Hoàn thành"
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAppointmentClick(appointment); }}
                            className="p-2 text-dark-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <FiFileText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Calendar/Grouped View */
          <div className="space-y-6">
            {Object.entries(groupedAppointments).map(([date, dateAppointments]) => (
              <div key={date} className="bg-white rounded-xl border border-dark-100 overflow-hidden">
                <div className="bg-dark-50 px-6 py-3 border-b border-dark-100">
                  <div className="flex items-center gap-2">
                    <FiCalendar className="w-4 h-4 text-dark-500" />
                    <span className="font-medium text-dark-900">{date}</span>
                    <span className="text-sm text-dark-500">
                      ({dateAppointments.length} lịch hẹn)
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-dark-100">
                  {dateAppointments.map((appointment) => (
                    <div
                      key={appointment._id}
                      className="p-4 hover:bg-dark-50 cursor-pointer"
                      onClick={() => handleAppointmentClick(appointment)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-lg font-semibold text-primary-600 w-24">
                            {appointment.startTime}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <FiUser className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                              <p className="font-medium text-dark-900">
                                {appointment.customer?.name || 'Khách hàng'}
                              </p>
                              <p className="text-sm text-dark-500">
                                {appointment.services?.map(s => typeof s === 'string' ? s : s.name).join(', ')}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(appointment.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Empty State */
        <div className="bg-white rounded-xl border border-dark-100 p-12 text-center">
          <FiCalendar className="w-16 h-16 text-dark-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-dark-900 mb-2">Không có lịch hẹn nào</h3>
          <p className="text-dark-500">
            {filters.status !== 'all' || filters.dateFrom || filters.dateTo
              ? 'Thử thay đổi bộ lọc để xem thêm lịch hẹn'
              : 'Chưa có lịch hẹn nào được đặt'}
          </p>
        </div>
      )}

      {/* Appointment Detail Modal */}
      {showDetailModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-dark-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-display font-semibold text-dark-900">Chi tiết lịch hẹn</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 text-dark-400 hover:text-dark-600 rounded-lg"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h4 className="text-sm font-medium text-dark-500 mb-3">Thông tin khách hàng</h4>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    {selectedAppointment.customer?.avatar ? (
                      <img
                        src={selectedAppointment.customer.avatar}
                        alt={selectedAppointment.customer.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <FiUser className="w-6 h-6 text-primary-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-dark-900">
                      {selectedAppointment.customer?.name || 'Khách hàng'}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-dark-500">
                      {selectedAppointment.customer?.phone && (
                        <span className="flex items-center gap-1">
                          <FiPhone className="w-3 h-3" />
                          {selectedAppointment.customer.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {selectedAppointment.customer?.email && (
                  <div className="flex items-center gap-2 text-sm text-dark-500">
                    <FiMail className="w-4 h-4" />
                    {selectedAppointment.customer.email}
                  </div>
                )}
              </div>

              {/* Date & Time */}
              <div>
                <h4 className="text-sm font-medium text-dark-500 mb-3">Ngày & Giờ</h4>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <FiCalendar className="w-5 h-5 text-dark-400" />
                    <span className="font-medium">
                      {formatDate(selectedAppointment.date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiClock className="w-5 h-5 text-dark-400" />
                    <span className="font-medium">{selectedAppointment.startTime} - {selectedAppointment.endTime}</span>
                  </div>
                </div>
              </div>

              {/* Services */}
              <div>
                <h4 className="text-sm font-medium text-dark-500 mb-3">Dịch vụ</h4>
                <div className="space-y-2">
                  {selectedAppointment.services?.map((service, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2 border-b border-dark-100 last:border-0"
                    >
                      <span className="text-dark-900">
                        {typeof service === 'string' ? service : service.name}
                      </span>
                      {typeof service !== 'string' && service.price && (
                        <span className="text-dark-600">
                          {formatCurrency(service.price)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedAppointment.notes && (
                <div>
                  <h4 className="text-sm font-medium text-dark-500 mb-3">Ghi chú</h4>
                  <div className="flex items-start gap-2 p-3 bg-dark-50 rounded-lg">
                    <FiFileText className="w-4 h-4 text-dark-400 mt-0.5" />
                    <p className="text-dark-700">{selectedAppointment.notes}</p>
                  </div>
                </div>
              )}

              {/* Total & Payment Status */}
              <div className="bg-dark-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-dark-600">Tổng cộng</span>
                  {selectedAppointment.discount > 0 ? (
                    <div className="text-right">
                      <span className="text-sm line-through text-dark-400 block">
                        {formatCurrency(selectedAppointment.totalPrice || 0)}
                      </span>
                      <span className="text-xl font-bold text-primary-600">
                        {formatCurrency(selectedAppointment.finalPrice || 0)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xl font-bold text-primary-600">
                      {formatCurrency(selectedAppointment.totalPrice || selectedAppointment.total || 0)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-dark-600">Thanh toán</span>
                  {getPaymentBadge(selectedAppointment.paymentStatus)}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-dark-600">Trạng thái</span>
                {getStatusBadge(selectedAppointment.status)}
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-dark-50 border-t border-dark-100">
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-dark-200 text-dark-700 rounded-lg hover:bg-dark-100 transition-colors"
                >
                  Đóng
                </button>
                {selectedAppointment.status === 'pending' && (
                  <>
                    <button
                      onClick={() => setConfirmAction({ type: 'reject', appointmentId: selectedAppointment._id, title: 'Từ chối lịch hẹn', message: 'Bạn có chắc chắn muốn từ chối lịch hẹn này?', variant: 'danger', confirmText: 'Từ chối' })}
                      disabled={actionLoading === selectedAppointment._id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-dark-400"
                    >
                      Từ chối
                    </button>
                    <button
                      onClick={() => setConfirmAction({ type: 'confirm', appointmentId: selectedAppointment._id, title: 'Xác nhận lịch hẹn', message: 'Bạn có chắc chắn muốn xác nhận lịch hẹn này?', variant: 'info', confirmText: 'Xác nhận' })}
                      disabled={actionLoading === selectedAppointment._id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-dark-400"
                    >
                      Xác nhận
                    </button>
                  </>
                )}
                {selectedAppointment.status === 'confirmed' && (
                  <button
                    onClick={() => setConfirmAction({ type: 'start', appointmentId: selectedAppointment._id, title: 'Bắt đầu dịch vụ', message: 'Bạn có chắc chắn muốn bắt đầu dịch vụ cho lịch hẹn này?', variant: 'info', confirmText: 'Bắt đầu' })}
                    disabled={actionLoading === selectedAppointment._id}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-dark-400"
                  >
                    Bắt đầu dịch vụ
                  </button>
                )}
                {selectedAppointment.status === 'in-progress' && (
                  <button
                    onClick={() => setConfirmAction({ type: 'complete', appointmentId: selectedAppointment._id, title: 'Hoàn thành dịch vụ', message: 'Bạn có chắc chắn muốn đánh dấu hoàn thành dịch vụ này?', variant: 'info', confirmText: 'Hoàn thành' })}
                    disabled={actionLoading === selectedAppointment._id}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-dark-400"
                  >
                    Hoàn thành
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      <Modal isOpen={rescheduleModalOpen} onClose={() => setRescheduleModalOpen(false)} title="Đề xuất đổi lịch">
        <div className="space-y-4">
          {rescheduleTarget && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <p className="text-gray-600">Lịch hiện tại: {new Date(rescheduleTarget.date).toLocaleDateString('vi-VN')} lúc {rescheduleTarget.startTime}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày mới</label>
            <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giờ mới</label>
            <input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lý do đổi lịch</label>
            <textarea value={rescheduleReason} onChange={(e) => setRescheduleReason(e.target.value)}
              rows={3} placeholder="Nhập lý do đổi lịch..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button onClick={() => setRescheduleModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</button>
            <button onClick={handleBarberReschedule} disabled={rescheduleLoading} className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 disabled:opacity-50">
              {rescheduleLoading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm Action Modal */}
      <ConfirmModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        variant={confirmAction?.variant || 'info'}
        confirmText={confirmAction?.confirmText || 'Xác nhận'}
        loading={confirmLoading}
      />

      {/* Reject Modal */}
      {showRejectModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <FiX className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-display font-semibold text-dark-900">Từ chối lịch hẹn</h3>
            </div>

            <p className="text-dark-600 mb-4">
              Bạn có chắc chắn muốn từ chối lịch hẹn của{' '}
              <span className="font-medium">{selectedAppointment.customer?.name}</span>?
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-dark-700 mb-1">
                Lý do từ chối (tùy chọn)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối..."
                rows={3}
                className="w-full px-3 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-dark-200 text-dark-700 rounded-lg hover:bg-dark-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-dark-400"
              >
                {actionLoading ? 'Đang xử lý...' : 'Từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarberAppointments;
