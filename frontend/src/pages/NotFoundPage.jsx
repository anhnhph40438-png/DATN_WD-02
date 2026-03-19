import { Link } from 'react-router-dom';
import { FiHome, FiArrowLeft } from 'react-icons/fi';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-50 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-display font-bold text-dark-900">404</h1>
        <div className="w-24 h-1 bg-primary-500 mx-auto my-6"></div>
        <h2 className="text-3xl font-bold text-dark-900 mt-4">Không tìm thấy trang</h2>
        <p className="text-dark-900/60 mt-2 max-w-md mx-auto">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-dark-900 text-white rounded-lg hover:bg-dark-950 transition-colors"
          >
            <FiHome className="w-5 h-5" />
            <span>Về trang chủ</span>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center space-x-2 px-6 py-3 border border-dark-200 text-dark-900 rounded-lg hover:bg-dark-100 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Quay lại</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
