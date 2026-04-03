import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import authService from '../../services/authService';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const validateEmail = () => {
    if (!email) {
      setError('Email là bắt buộc');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email không hợp lệ');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail()) {
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
      toast.success('Email khôi phục mật khẩu đã được gửi!');
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Không thể gửi email khôi phục. Vui lòng thử lại.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) {
      setError('');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Dark Branding Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-dark-950 relative overflow-hidden">
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(232, 163, 23, 0.1) 10px, rgba(232, 163, 23, 0.1) 11px)' }}></div>

        <div className="relative z-10 flex flex-col justify-center px-16 w-full">
          <Link to="/" className="inline-flex items-center space-x-3 mb-12">
            <div className="w-16 h-16 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-dark-950 font-bold text-3xl font-display">B</span>
            </div>
            <span className="text-2xl font-display font-bold text-white">Haircut</span>
          </Link>

          <h2 className="text-5xl font-display font-bold text-white mb-6 leading-tight">
            Đừng lo lắng,<br />
            chúng tôi hỗ trợ
          </h2>

          <p className="text-gray-400 text-lg leading-relaxed max-w-md">
            Khôi phục mật khẩu của bạn chỉ trong vài bước đơn giản. Chúng tôi sẽ gửi hướng dẫn qua email.
          </p>

          {/* Decorative elements */}
          <div className="mt-16 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-0.5 bg-primary-500"></div>
              <span className="text-gray-500 text-sm">Secure & Fast</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - White Form Section */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-3">
              <div className="w-14 h-14 bg-dark-950 rounded-lg flex items-center justify-center">
                <span className="text-primary-500 font-bold text-2xl font-display">B</span>
              </div>
              <span className="text-2xl font-display font-bold text-dark-950">Haircut</span>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-display font-bold text-dark-900 mb-2">
              Quên mật khẩu
            </h1>
            <p className="text-gray-600">
              {submitted
                ? 'Kiểm tra email của bạn'
                : 'Nhập email để lấy lại mật khẩu'}
            </p>
          </div>

          {submitted ? (
            // Success State
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-dark-900 mb-2">
                Đã gửi email!
              </h3>
              <p className="text-gray-600 mb-6">
                Chúng tôi đã gửi hướng dẫn khôi phục mật khẩu đến{' '}
                <span className="font-medium text-dark-900">{email}</span>. Vui
                lòng kiểm tra hộp thư của bạn.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Không nhận được email? Kiểm tra thư mục spam hoặc{' '}
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  thử lại
                </button>
              </p>
            </div>
          ) : (
            // Form State
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-dark-900 mb-2">
                  Email
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FiMail className="w-5 h-5" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="Nhập email của bạn"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500 transition-colors ${
                      error ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-dark-900 text-white rounded-lg hover:bg-dark-950 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Đang gửi...
                  </span>
                ) : (
                  'Gửi yêu cầu'
                )}
              </button>
            </form>
          )}

          {/* Back to Login Link */}
          <Link
            to="/login"
            className="flex items-center justify-center space-x-2 text-gray-600 hover:text-dark-900 mt-6 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Quay lại đăng nhập</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
