import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiCreditCard,
  FiDollarSign,
  FiCalendar,
  FiClock,
  FiUser,
  FiTag,
  FiArrowLeft,
  FiCheck
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { appointmentService, paymentService, promotionService } from '../../services';
import { formatCurrency, formatDate } from '../../utils/formatters';

const PaymentPage = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [applyingPromo, setApplyingPromo] = useState(false);

  useEffect(() => {
    if (appointmentId) {
      fetchAppointment();
    }
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getAppointmentById(appointmentId);
      setAppointment(response.data?.appointment || null);

      // If already applied promo from booking
      if (response.data?.appointment?.discount) {
        const apt = response.data.appointment;
        setPromoDiscount(apt.discount || 0);
        setPromoApplied(apt.discount > 0);
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      toast.error('Không thể tải thông tin lịch hẹn');
      navigate('/my-appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast.error('Vui lòng nhập mã khuyến mãi');
      return;
    }

    try {
      setApplyingPromo(true);
      const serviceIds = appointment.services?.map(s => s._id || s) || [];
      const response = await promotionService.applyPromotion(promoCode, totalPrice, serviceIds);
      setPromoDiscount(response.data?.discount || 0);
      setPromoApplied(true);
      toast.success('Áp dụng mã khuyến mãi thành công!');
    } catch (error) {
      console.error('Error applying promo:', error);
      toast.error(error.response?.data?.message || 'Mã khuyến mãi không hợp lệ');
      setPromoDiscount(0);
      setPromoApplied(false);
    } finally {
      setApplyingPromo(false);
    }
  };

  const handlePayment = async () => {
    try {
      setProcessing(true);

      if (paymentMethod === 'vnpay') {
        // Create VNPay payment
        const response = await paymentService.createPayment(appointmentId);
        if (response.data?.paymentUrl) {
          window.location.href = response.data.paymentUrl;
        } else {
          toast.error('Không thể tạo liên kết thanh toán');
        }
      } else {
        // Cash payment - just redirect to confirmation
        toast.success('Đặt lịch thành công! Vui lòng thanh toán tại cửa hàng.');
        navigate('/my-appointments');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xử lý thanh toán');
    } finally {
      setProcessing(false);
    }
  };

  const totalPrice = appointment?.totalPrice || appointment?.total || 0;
  const finalPrice = totalPrice - promoDiscount;

  if (loading) {
    return (
      <div className="bg-dark-50 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white border border-dark-100 rounded w-1/3"></div>
            <div className="h-64 bg-white border border-dark-100 rounded-xl"></div>
            <div className="h-48 bg-white border border-dark-100 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="bg-dark-50 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl border border-dark-200 p-12 text-center">
            <FiCreditCard className="w-16 h-16 text-dark-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-dark-900 mb-2">Không tìm thấy lịch hẹn</h3>
            <p className="text-dark-600 mb-6">Lịch hẹn này không tồn tại hoặc đã bị xóa.</p>
            <Link
              to="/my-appointments"
              className="inline-flex items-center text-primary-600 hover:text-primary-500 font-medium"
            >
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Quay lại danh sách lịch hẹn
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-50 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link
          to="/my-appointments"
          className="inline-flex items-center text-dark-600 hover:text-dark-900 mb-6"
        >
          <FiArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-dark-900 mb-2">Thanh toán</h1>
          <p className="text-dark-600">Hoàn tất thanh toán cho lịch hẹn của bạn</p>
        </div>

        {/* Appointment Summary */}
        <div className="bg-white rounded-xl border border-dark-200 p-6 mb-6">
          <h2 className="text-lg font-display font-semibold text-dark-900 mb-4">Chi tiết lịch hẹn</h2>

          {/* Barber */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-dark-100">
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
              <h3 className="font-semibold text-dark-900">{appointment.barber?.user?.name || 'Barber'}</h3>
              <p className="text-sm text-dark-600">Barber</p>
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-dark-100 text-dark-700">
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
          <div className="mb-4 pb-4 border-b border-dark-100">
            <h3 className="text-sm font-semibold text-dark-600 uppercase mb-2">Dịch vụ</h3>
            {appointment.services?.map((service, index) => (
              <div key={index} className="flex justify-between items-center py-1">
                <span className="text-dark-700">{typeof service === 'string' ? service : service.name}</span>
                {service.price && (
                  <span className="text-dark-900 font-medium">{formatCurrency(service.price)}</span>
                )}
              </div>
            ))}
          </div>

          {/* Total */}
          <div>
            <div className="flex justify-between items-center text-dark-700">
              <span>Tạm tính</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
            {promoApplied && promoDiscount > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span>Giảm giá</span>
                <span>-{formatCurrency(promoDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-dark-200">
              <span className="text-lg font-semibold text-dark-900">Tổng cộng</span>
              <span className="text-2xl font-bold text-primary-600">{formatCurrency(finalPrice)}</span>
            </div>
          </div>
        </div>

        {/* Promo Code */}
        {!promoApplied && (
          <div className="bg-white rounded-xl border border-dark-200 p-6 mb-6">
            <h2 className="text-lg font-display font-semibold text-dark-900 mb-4">Mã khuyến mãi</h2>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 w-4 h-4" />
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã khuyến mãi"
                  className="w-full pl-10 pr-4 py-3 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleApplyPromo}
                disabled={applyingPromo}
                className="px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:bg-dark-300"
              >
                {applyingPromo ? 'Đang áp dụng...' : 'Áp dụng'}
              </button>
            </div>
          </div>
        )}

        {promoApplied && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <FiCheck className="w-5 h-5 text-green-600" />
            <span className="text-green-700">Đã áp dụng mã khuyến mãi thành công!</span>
          </div>
        )}

        {/* Payment Methods */}
        <div className="bg-white rounded-xl border border-dark-200 p-6 mb-6">
          <h2 className="text-lg font-display font-semibold text-dark-900 mb-4">Phương thức thanh toán</h2>

          <div className="space-y-3">
            {/* Cash */}
            <label
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                paymentMethod === 'cash'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-dark-200 hover:border-dark-300'
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="hidden"
              />
              <div
                className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                  paymentMethod === 'cash' ? 'border-primary-500' : 'border-dark-300'
                }`}
              >
                {paymentMethod === 'cash' && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-500"></div>
                )}
              </div>
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FiDollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-dark-900">Thanh toán tiền mặt</p>
                  <p className="text-sm text-dark-600">Thanh toán tại cửa hàng</p>
                </div>
              </div>
            </label>

            {/* VNPay */}
            <label
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                paymentMethod === 'vnpay'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-dark-200 hover:border-dark-300'
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="vnpay"
                checked={paymentMethod === 'vnpay'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="hidden"
              />
              <div
                className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                  paymentMethod === 'vnpay' ? 'border-primary-500' : 'border-dark-300'
                }`}
              >
                {paymentMethod === 'vnpay' && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-500"></div>
                )}
              </div>
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiCreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-dark-900">VNPay</p>
                  <p className="text-sm text-dark-600">Thanh toán qua cổng VNPay</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Payment Button */}
        <button
          onClick={handlePayment}
          disabled={processing}
          className="w-full inline-flex items-center justify-center px-6 py-4 bg-dark-900 text-white rounded-xl font-semibold text-lg hover:bg-dark-950 transition-colors disabled:bg-dark-300"
        >
          {processing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Đang xử lý...
            </>
          ) : paymentMethod === 'vnpay' ? (
            <>
              <FiCreditCard className="w-5 h-5 mr-2" />
              Thanh toán {formatCurrency(finalPrice)}
            </>
          ) : (
            <>
              <FiCheck className="w-5 h-5 mr-2" />
              Xác nhận đặt lịch
            </>
          )}
        </button>

        {paymentMethod === 'cash' && (
          <p className="text-center text-sm text-dark-600 mt-4">
            Bạn sẽ thanh toán {formatCurrency(finalPrice)} tại cửa hàng khi đến làm dịch vụ.
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
