import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiCheckCircle, FiXCircle, FiHome, FiCalendar, FiLoader } from 'react-icons/fi';
import { paymentService } from '../../services';

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentResult, setPaymentResult] = useState(null);

  // Get VNPay response parameters
  const vnpResponseCode = searchParams.get('vnp_ResponseCode');
  const vnpTransactionNo = searchParams.get('vnp_TransactionNo');
  const vnpAmount = searchParams.get('vnp_Amount');
  const vnpOrderInfo = searchParams.get('vnp_OrderInfo');
  const vnpBankCode = searchParams.get('vnp_BankCode');
  const vnpPayDate = searchParams.get('vnp_PayDate');

  // Fallback to simple status param if not VNPay
  const statusParam = searchParams.get('status');
  const txnRefParam = searchParams.get('txnRef');
  const messageParam = searchParams.get('message');

  useEffect(() => {
    if (vnpResponseCode) {
      verifyVNPayPayment();
    } else {
      // Simple status check (from backend redirect)
      setPaymentResult({
        success: statusParam === 'success',
        message: messageParam || (statusParam === 'success' ? 'Thanh toán thành công!' : 'Thanh toán thất bại'),
        transactionNo: txnRefParam || null,
      });
      setLoading(false);
    }
  }, [vnpResponseCode, statusParam]);

  const verifyVNPayPayment = async () => {
    try {
      setLoading(true);
      // Convert all search params to object
      const params = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });

      const response = await paymentService.verifyPayment(params);
      setPaymentResult({
        success: response.success || vnpResponseCode === '00',
        message: response.message || (vnpResponseCode === '00' ? 'Thanh toán thành công!' : 'Thanh toán thất bại'),
        transactionNo: vnpTransactionNo,
        amount: vnpAmount ? parseInt(vnpAmount) / 100 : null,
        bankCode: vnpBankCode,
        orderInfo: vnpOrderInfo,
      });
    } catch (error) {
      console.error('Error verifying payment:', error);
      // If verification fails, check response code directly
      setPaymentResult({
        success: vnpResponseCode === '00',
        message: vnpResponseCode === '00' ? 'Thanh toán thành công!' : 'Thanh toán thất bại',
        transactionNo: vnpTransactionNo,
      });
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (code) => {
    const errorMessages = {
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
      '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.',
      '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
      '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
      '13': 'Giao dịch không thành công do: Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).',
      '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch.',
      '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
      '65': 'Giao dịch không thành công do: Tài khoản của quý khách đã vượt quá hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng thanh toán đang bảo trì.',
      '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định.',
      '99': 'Các lỗi khác.',
    };
    return errorMessages[code] || 'Có lỗi xảy ra trong quá trình thanh toán.';
  };

  const formatAmount = (amount) => {
    if (!amount) return '';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-dark-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FiLoader className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-dark-700">Đang xác nhận thanh toán...</p>
        </div>
      </div>
    );
  }

  const isSuccess = paymentResult?.success;

  return (
    <div className="bg-dark-50 min-h-screen flex items-center justify-center py-12">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl border border-dark-200 p-8 text-center">
          {isSuccess ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiCheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-display font-bold text-dark-900 mb-2">Thanh toán thành công!</h1>
              <p className="text-dark-700 mb-6">
                Cảm ơn bạn đã sử dụng dịch vụ. Chúng tôi sẽ gửi thông tin xác nhận qua email.
              </p>

              {/* Payment Details */}
              {(paymentResult.transactionNo || paymentResult.amount) && (
                <div className="border border-dark-200 rounded-lg p-4 mb-6 text-left">
                  <h3 className="text-sm font-semibold text-dark-600 uppercase mb-3">Chi tiết giao dịch</h3>
                  {paymentResult.transactionNo && (
                    <div className="flex justify-between py-1">
                      <span className="text-dark-700">Mã giao dịch:</span>
                      <span className="text-dark-900 font-medium">{paymentResult.transactionNo}</span>
                    </div>
                  )}
                  {paymentResult.amount && (
                    <div className="flex justify-between py-1">
                      <span className="text-dark-700">Số tiền:</span>
                      <span className="text-dark-900 font-medium">{formatAmount(paymentResult.amount)}</span>
                    </div>
                  )}
                  {paymentResult.bankCode && (
                    <div className="flex justify-between py-1">
                      <span className="text-dark-700">Ngân hàng:</span>
                      <span className="text-dark-900 font-medium">{paymentResult.bankCode}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiXCircle className="w-10 h-10 text-red-600" />
              </div>
              <h1 className="text-2xl font-display font-bold text-dark-900 mb-2">Thanh toán thất bại</h1>
              <p className="text-dark-700 mb-6">
                {vnpResponseCode
                  ? getErrorMessage(vnpResponseCode)
                  : paymentResult?.message || 'Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.'}
              </p>

              {/* Error Details */}
              {vnpResponseCode && vnpResponseCode !== '00' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm text-red-600">
                    Mã lỗi: {vnpResponseCode}
                  </p>
                </div>
              )}
            </>
          )}

          <div className="flex flex-col space-y-3">
            <Link
              to="/my-appointments"
              className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-dark-900 text-white rounded-lg hover:bg-dark-950 transition-colors"
            >
              <FiCalendar className="w-5 h-5" />
              <span>Xem lịch hẹn</span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center space-x-2 px-6 py-3 border border-dark-200 text-dark-700 rounded-lg hover:bg-dark-50 transition-colors"
            >
              <FiHome className="w-5 h-5" />
              <span>Về trang chủ</span>
            </Link>
          </div>

          {!isSuccess && (
            <p className="text-sm text-dark-600 mt-6">
              Nếu bạn cần hỗ trợ, vui lòng liên hệ với chúng tôi qua số điện thoại hotline hoặc email.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentResultPage;
