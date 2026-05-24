import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiX,
  FiCreditCard,
  FiStar,
  FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { appointmentService } from '../../services';
import { formatDate, formatCurrency } from '../../utils/formatters';
import Modal from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui';

const MyAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [cancellingId, setCancellingId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [respondLoading, setRespondLoading] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getMyAppointments();
      const rawAppointments = response.data?.appointments || [];
      // Sắp xếp: chưa xác nhận, chưa hoàn thành lên trên
      const statusOrder = { pending: 0, confirmed: 1, 'in-progress': 2, completed: 3, cancelled: 4 };
      const sorted = [...rawAppointments].sort((a, b) => {
        const orderDiff = (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5);
        if (orderDiff !== 0) return orderDiff;
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

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: 'Chờ xác nhận', color: 'bg-primary-100 text-primary-700 border border-primary-200' },
      confirmed: { text: 'Đã xác nhận', color: 'bg-green-100 text-green-700 border border-green-200' },
      completed: { text: 'Hoàn thành', color: 'bg-dark-100 text-dark-700 border border-dark-200' },
      cancelled: { text: 'Đã hủy', color: 'bg-red-100 text-red-700 border border-red-200' },
      noshow: { text: 'Không đến', color: 'bg-dark-100 text-dark-600 border border-dark-200' },
    };
    const { text, color } = statusMap[status] || { text: status, color: 'bg-dark-100 text-dark-700 border border-dark-200' };
    return <span className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>{text}</span>;
  };

  const getPaymentBadge = (paymentStatus) => {
    const statusMap = {
      unpaid: { text: 'Chưa thanh toán', color: 'bg-orange-100 text-orange-700 border border-orange-200' },
      paid: { text: 'Đã thanh toán', color: 'bg-green-100 text-green-700 border border-green-200' },
      refunded: { text: 'Đã hoàn tiền', color: 'bg-purple-100 text-purple-700 border border-purple-200' },
    };
    const { text, color } = statusMap[paymentStatus] || { text: paymentStatus, color: 'bg-dark-100 text-dark-700 border border-dark-200' };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>{text}</span>;
  };

const filterAppointments = () => {
  const now = new Date();
  // Lấy đầu ngày hôm nay (00:00:00) để so sánh
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return appointments.filter((apt) => {
    const aptDate = new Date(apt.date);
    switch (activeTab) {
      case 'upcoming':
        return ['pending', 'confirmed'].includes(apt.status) && aptDate >= today;
      case 'completed':
        return apt.status === 'completed';
      case 'cancelled':
        return ['cancelled', 'noshow'].includes(apt.status);
      default:
        return true;
    }
  });
};

  const handleCancelClick = (appointment) => {
    setSelectedAppointment(appointment);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleConfirmAction = async () => {
    setConfirmLoading(true);
    try {
      const { type, appointmentId } = confirmAction;
      if (type === 'cancel') await appointmentService.cancelAppointment(appointmentId, '');
      toast.success('Đã hủy lịch hẹn thành công');
      setConfirmAction(null);
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!selectedAppointment) return;

    try {
      setCancellingId(selectedAppointment._id);
      await appointmentService.cancelAppointment(selectedAppointment._id, cancelReason);
      toast.success('Đã hủy lịch hẹn thành công');
      setShowCancelModal(false);
      fetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error(error.response?.data?.message || 'Không thể hủy lịch hẹn');
    } finally {
      setCancellingId(null);
    }
  };

  const handleReviewClick = (appointment) => {
    setSelectedAppointment(appointment);
    setReviewRating(5);
    setReviewComment('');
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async () => {
    if (!selectedAppointment) return;

    try {
      setSubmittingReview(true);
      await appointmentService.addReview(selectedAppointment._id, {
        rating: reviewRating,
        comment: reviewComment,
      });
      toast.success('Cảm ơn bạn đã đánh giá!');
      setShowReviewModal(false);
      fetchAppointments();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.message || 'Không thể gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) {
      toast.error('Vui lòng chọn ngày và giờ mới');
      return;
    }
    setRescheduleLoading(true);
    try {
      await appointmentService.rescheduleAppointment(rescheduleTarget._id, {
        date: rescheduleDate,
        startTime: rescheduleTime,
      });
      toast.success('Đổi lịch thành công!');
      setRescheduleModalOpen(false);
      setRescheduleTarget(null);
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể đổi lịch');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleRespondReschedule = async (appointmentId, action) => {
    setRespondLoading(true);
    try {
      await appointmentService.respondToReschedule(appointmentId, action);
      toast.success(action === 'accept' ? 'Đã chấp nhận đổi lịch!' : 'Đã từ chối đổi lịch!');
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xử lý yêu cầu');
    } finally {
      setRespondLoading(false);
    }
  };

  const openRescheduleModal = (apt) => {
    setRescheduleTarget(apt);
    setRescheduleDate('');
    setRescheduleTime('');
    setRescheduleModalOpen(true);
  };

  const filteredAppointments = filterAppointments();

  const tabs = [
    { id: 'upcoming', label: 'Sắp tới' },
    { id: 'completed', label: 'Đã hoàn thành' },
    { id: 'cancelled', label: 'Đã hủy' },
  ];

  return (
    <div className="bg-dark-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-dark-900 mb-2">Lịch hẹn của tôi</h1>
          <p className="text-dark-600">Quản lý và theo dõi các lịch hẹn cắt tóc của bạn</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-dark-200 mb-6 overflow-hidden">
          <div className="flex border-b border-dark-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === tab.id
                    ? 'text-dark-900 border-b-2 border-primary-500 bg-primary-50'
                    : 'text-dark-600 hover:text-dark-900'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-dark-100 h-40 animate-pulse"></div>
            ))}
          </div>
        ) : filteredAppointments.length > 0 ? (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment._id}
                className="bg-white rounded-xl border border-dark-200 overflow-hidden"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-dark-100">
                        {appointment.barber?.user?.avatar ? (
                          <img
                            src={appointment.barber.user.avatar}
                            alt={appointment.barber.user?.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary-50">
                            <FiUser className="w-6 h-6 text-primary-300" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-dark-900">
                          {appointment.barber?.user?.name || 'Barber'}
                        </h3>
                        <p className="text-sm text-dark-600">Barber</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(appointment.status)}
                      {getPaymentBadge(appointment.paymentStatus)}
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="flex items-center gap-4 mb-4 text-dark-700">
                    <div className="flex items-center gap-2">
                      <FiCalendar className="w-4 h-4" />
                      <span>{formatDate(appointment.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiClock className="w-4 h-4" />
                      <span>{appointment.startTime} - {appointment.endTime}</span>
                    </div>
                  </div>

                  {/* Services */}
                  <div className="mb-4">
                    <p className="text-sm text-dark-600 mb-1">Dịch vụ:</p>
                    <div className="flex flex-wrap gap-2">
                      {appointment.services?.map((service, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-dark-50 text-dark-700 text-sm rounded border border-dark-200"
                        >
                          {typeof service === 'string' ? service : service.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Reschedule Request Banner */}
                  {appointment.rescheduleRequest && appointment.rescheduleRequest.status === 'pending' && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800 mb-1">Yêu cầu đổi lịch từ thợ cắt tóc</p>
                      <p className="text-xs text-yellow-700">
                        Ngày mới: {new Date(appointment.rescheduleRequest.newDate).toLocaleDateString('vi-VN')} | Giờ: {appointment.rescheduleRequest.newStartTime} - {appointment.rescheduleRequest.newEndTime}
                      </p>
                      {appointment.rescheduleRequest.reason && (
                        <p className="text-xs text-yellow-600 mt-1">Lý do: {appointment.rescheduleRequest.reason}</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleRespondReschedule(appointment._id, 'accept')}
                          disabled={respondLoading}
                          className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          Chấp nhận
                        </button>
                        <button
                          onClick={() => handleRespondReschedule(appointment._id, 'reject')}
                          disabled={respondLoading}
                          className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          Từ chối
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Total & Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-dark-100">
                    <div>
                      <p className="text-sm text-dark-600">Tổng cộng</p>
                      {appointment.discount > 0 ? (
                        <>
                          <p className="text-sm line-through text-dark-400">
                            {formatCurrency(appointment.totalPrice || 0)}
                          </p>
                          <p className="text-xl font-bold text-primary-600">
                            {formatCurrency(appointment.finalPrice || 0)}
                          </p>
                        </>
                      ) : (
                        <p className="text-xl font-bold text-primary-600">
                          {formatCurrency(appointment.totalPrice || appointment.total || 0)}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {/* Cancel button for pending/confirmed */}
                      {['pending', 'confirmed'].includes(appointment.status) && (
                        <button
                          onClick={() => setConfirmAction({ type: 'cancel', appointmentId: appointment._id, title: 'Hủy lịch hẹn', message: 'Bạn có chắc chắn muốn hủy lịch hẹn này? Hành động này không thể hoàn tác.', variant: 'danger', confirmText: 'Hủy lịch' })}
                          className="inline-flex items-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <FiX className="w-4 h-4 mr-1" />
                          Hủy lịch
                        </button>
                      )}

                      {/* Reschedule button for pending/confirmed */}
                      {['pending', 'confirmed'].includes(appointment.status) && (
                        <button
                          onClick={() => openRescheduleModal(appointment)}
                          className="px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100"
                        >
                          Đổi lịch
                        </button>
                      )}

                      {/* Pay button for unpaid pending/confirmed */}
                      {['pending', 'confirmed'].includes(appointment.status) &&
                        appointment.paymentStatus === 'unpaid' && (
                          <Link
                            to={`/payment/${appointment._id}`}
                            className="inline-flex items-center px-4 py-2 bg-dark-900 text-white rounded-lg hover:bg-dark-950 transition-colors"
                          >
                            <FiCreditCard className="w-4 h-4 mr-1" />
                            Thanh toán
                          </Link>
                        )}

                      {/* Review button for completed without review */}
                      {appointment.status === 'completed' && !appointment.hasReview && (
                        <button
                          onClick={() => handleReviewClick(appointment)}
                          className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                        >
                          <FiStar className="w-4 h-4 mr-1" />
                          Đánh giá
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dark-200 p-12 text-center">
            <FiCalendar className="w-16 h-16 text-dark-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-dark-900 mb-2">
              {activeTab === 'upcoming' && 'Không có lịch hẹn sắp tới'}
              {activeTab === 'completed' && 'Chưa có lịch hẹn hoàn thành'}
              {activeTab === 'cancelled' && 'Không có lịch hẹn đã hủy'}
            </h3>
            <p className="text-dark-600 mb-6">
              {activeTab === 'upcoming'
                ? 'Đặt lịch ngay để trải nghiệm dịch vụ của chúng tôi!'
                : 'Không có lịch hẹn nào trong danh mục này.'}
            </p>
            {activeTab === 'upcoming' && (
              <Link
                to="/booking"
                className="inline-flex items-center px-6 py-3 bg-dark-900 text-white rounded-lg font-medium hover:bg-dark-950 transition-colors"
              >
                <FiCalendar className="w-5 h-5 mr-2" />
                Đặt lịch ngay
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Confirm Action Modal */}
      <ConfirmModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        variant={confirmAction?.variant || 'danger'}
        confirmText={confirmAction?.confirmText || 'Xác nhận'}
        loading={confirmLoading}
      />

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-dark-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <FiAlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-display font-semibold text-dark-900">Xác nhận hủy lịch</h3>
            </div>
            <p className="text-dark-700 mb-4">
              Bạn có chắc chắn muốn hủy lịch hẹn này không? Hành động này không thể hoàn tác.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-dark-700 mb-1">
                Lý do hủy (tùy chọn)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy..."
                rows={3}
                className="w-full px-3 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 border border-dark-200 text-dark-700 rounded-lg hover:bg-dark-50 transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={cancellingId}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-dark-300"
              >
                {cancellingId ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      <Modal isOpen={rescheduleModalOpen} onClose={() => setRescheduleModalOpen(false)} title="Đổi lịch hẹn">
        <div className="space-y-4">
          {rescheduleTarget && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <p className="text-gray-600">Lịch hiện tại: {new Date(rescheduleTarget.date).toLocaleDateString('vi-VN')} lúc {rescheduleTarget.startTime}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày mới</label>
            <input
              type="date"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giờ mới</label>
            <input
              type="time"
              value={rescheduleTime}
              onChange={(e) => setRescheduleTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button onClick={() => setRescheduleModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</button>
            <button onClick={handleReschedule} disabled={rescheduleLoading} className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 disabled:opacity-50">
              {rescheduleLoading ? 'Đang xử lý...' : 'Đổi lịch'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-dark-200">
            <h3 className="text-lg font-display font-semibold text-dark-900 mb-4">Đánh giá dịch vụ</h3>

            {/* Rating Stars */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-dark-700 mb-2">Đánh giá</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="focus:outline-none"
                  >
                    <FiStar
                      className={`w-8 h-8 ${star <= reviewRating
                          ? 'text-primary-500 fill-current'
                          : 'text-dark-200'
                        }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-dark-700 mb-1">
                Nhận xét (tùy chọn)
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn..."
                rows={4}
                className="w-full px-3 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 px-4 py-2 border border-dark-200 text-dark-700 rounded-lg hover:bg-dark-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleReviewSubmit}
                disabled={submittingReview}
                className="flex-1 px-4 py-2 bg-dark-900 text-white rounded-lg hover:bg-dark-950 transition-colors disabled:bg-dark-300"
              >
                {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointmentsPage;
