import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiLock, FiEye, FiEyeOff, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import authService from '../../services/authService';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  useEffect(() => {
    // Check if token exists in URL
    if (!token) {
      setTokenError(true);
    }
  }, [token]);

  const validateForm = () => {
    const newErrors = {};

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, formData.password);
      setSuccess(true);
      toast.success('Mật khẩu đã được đặt lại thành công!');
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      const message = error.response?.data?.message;
      if (
        message?.includes('invalid') ||
        message?.includes('expired') ||
        error.response?.status === 400
      ) {
        setTokenError(true);
        toast.error('Liên kết đã hết hạn hoặc không hợp lệ');
      } else {
        toast.error(message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Token Error State
  if (tokenError) {
    return (
      <div className="min-h-screen flex">
        {/* Left Panel - Dark Branding Section */}
        <div className="hidden lg:flex lg:w-1/2 bg-dark-950 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(232, 163, 23, 0.1) 10px, rgba(232, 163, 23, 0.1) 11px)' }}></div>

          <div className="relative z-10 flex flex-col justify-center px-16 w-full">
            <Link to="/" className="inline-flex items-center space-x-3 mb-12">
              <div className="w-16 h-16 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-dark-950 font-bold text-3xl font-display">B</span>
              </div>
              <span className="text-2xl font-display font-bold text-white">Barberly</span>
            </Link>

            <h2 className="text-5xl font-display font-bold text-white mb-6 leading-tight">
              Đã xảy ra<br />
              sự cố
            </h2>

            <p className="text-gray-400 text-lg leading-relaxed max-w-md">
              Liên kết không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu liên kết mới để đặt lại mật khẩu.
            </p>
          </div>
        </div>

        {/* Right Panel - White Form Section */}
        <div className="flex-1 flex items-center justify-center px-4 py-12 bg-white">
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-8">
              <Link to="/" className="inline-flex items-center space-x-3">
                <div className="w-14 h-14 bg-dark-950 rounded-lg flex items-center justify-center">
                  <span className="text-primary-500 font-bold text-2xl font-display">B</span>
                </div>
                <span className="text-2xl font-display font-bold text-dark-950">Barberly</span>
              </Link>
            </div>

            <div className="text-center py-4">
              <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiAlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-dark-900 mb-2">
                Liên kết không hợp lệ
              </h3>
              <p className="text-gray-600 mb-6">
                Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng
                yêu cầu liên kết mới.
              </p>
              <Link
                to="/forgot-password"
                className="inline-block w-full py-3 bg-dark-900 text-white rounded-lg hover:bg-dark-950 transition-colors font-medium"
              >
                Yêu cầu liên kết mới
              </Link>
            </div>

            <p className="text-center text-gray-600 mt-6">
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Quay lại đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success State
  if (success) {
    return (
      <div className="min-h-screen flex">
        {/* Left Panel - Dark Branding Section */}
        <div className="hidden lg:flex lg:w-1/2 bg-dark-950 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(232, 163, 23, 0.1) 10px, rgba(232, 163, 23, 0.1) 11px)' }}></div>

          <div className="relative z-10 flex flex-col justify-center px-16 w-full">
            <Link to="/" className="inline-flex items-center space-x-3 mb-12">
              <div className="w-16 h-16 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-dark-950 font-bold text-3xl font-display">B</span>
              </div>
              <span className="text-2xl font-display font-bold text-white">Barberly</span>
            </Link>

            <h2 className="text-5xl font-display font-bold text-white mb-6 leading-tight">
              Hoàn tất!<br />
              Rất tốt
            </h2>

            <p className="text-gray-400 text-lg leading-relaxed max-w-md">
              Mật khẩu của bạn đã được cập nhật thành công. Bạn có thể đăng nhập ngay bây giờ.
            </p>
          </div>
        </div>

        {/* Right Panel - White Form Section */}
        <div className="flex-1 flex items-center justify-center px-4 py-12 bg-white">
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-8">
              <Link to="/" className="inline-flex items-center space-x-3">
                <div className="w-14 h-14 bg-dark-950 rounded-lg flex items-center justify-center">
                  <span className="text-primary-500 font-bold text-2xl font-display">B</span>
                </div>
                <span className="text-2xl font-display font-bold text-dark-950">Barberly</span>
              </Link>
            </div>

            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-dark-900 mb-2">
                Đặt lại mật khẩu thành công!
              </h3>
              <p className="text-gray-600 mb-6">
                Mật khẩu của bạn đã được cập nhật. Bạn sẽ được chuyển hướng đến
                trang đăng nhập trong giây lát...
              </p>
              <Link
                to="/login"
                className="inline-block w-full py-3 bg-dark-900 text-white rounded-lg hover:bg-dark-950 transition-colors font-medium"
              >
                Đăng nhập ngay
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <span className="text-2xl font-display font-bold text-white">Barberly</span>
          </Link>

          <h2 className="text-5xl font-display font-bold text-white mb-6 leading-tight">
            Mật khẩu mới,<br />
            khởi đầu mới
          </h2>

          <p className="text-gray-400 text-lg leading-relaxed max-w-md">
            Tạo mật khẩu mạnh để bảo vệ tài khoản của bạn. Chúng tôi khuyến nghị sử dụng ít nhất 6 ký tự.
          </p>

          {/* Decorative elements */}
          <div className="mt-16 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-0.5 bg-primary-500"></div>
              <span className="text-gray-500 text-sm">Secure Account</span>
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
              <span className="text-2xl font-display font-bold text-dark-950">Barberly</span>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-display font-bold text-dark-900 mb-2">
              Đặt lại mật khẩu
            </h1>
            <p className="text-gray-600">Nhập mật khẩu mới của bạn</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-dark-900 mb-2">
                Mật khẩu mới
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <FiLock className="w-5 h-5" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500 transition-colors ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <FiEyeOff className="w-5 h-5" />
                  ) : (
                    <FiEye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-medium text-dark-900 mb-2">
                Xác nhận mật khẩu mới
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <FiLock className="w-5 h-5" />
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu mới"
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500 transition-colors ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className="w-5 h-5" />
                  ) : (
                    <FiEye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
              )}
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
                  Đang xử lý...
                </span>
              ) : (
                'Đặt lại mật khẩu'
              )}
            </button>
          </form>

          {/* Back to Login Link */}
          <p className="text-center text-gray-600 mt-6">
            Nhớ mật khẩu?{' '}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
