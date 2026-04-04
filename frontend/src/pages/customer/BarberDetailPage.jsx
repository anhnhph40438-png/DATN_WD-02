import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiStar, FiCalendar, FiArrowLeft, FiUser, FiClock, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { barberService } from '../../services';
import { formatDate } from '../../utils/formatters';

const BarberDetailPage = () => {
  const { id } = useParams();
  const [barber, setBarber] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (id) {
      fetchBarber();
      fetchReviews();
    }
  }, [id]);

  const fetchBarber = async () => {
    try {
      setLoading(true);
      const response = await barberService.getBarberById(id);
      setBarber(response.data?.barber || null);
    } catch (error) {
      console.error('Error fetching barber:', error);
      toast.error('Không thể tải thông tin barber');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const response = await barberService.getBarberReviews(id);
      setReviews(response.data?.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const renderStars = (rating, size = 'w-4 h-4') => {
    return [...Array(5)].map((_, i) => (
      <FiStar
        key={i}
        className={`${size} ${i < Math.floor(rating) ? 'text-primary-500 fill-current' : 'text-dark-200'}`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="bg-dark-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="bg-white rounded-xl border border-dark-100 h-64 mb-6"></div>
            <div className="bg-white rounded-xl border border-dark-100 h-96"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="bg-dark-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl border border-dark-200 p-12 text-center">
            <FiUser className="w-16 h-16 text-dark-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-dark-900 mb-2">Không tìm thấy barber</h3>
            <p className="text-dark-600 mb-6">Barber này không tồn tại hoặc đã bị xóa.</p>
            <Link
              to="/barbers"
              className="inline-flex items-center text-primary-600 hover:text-primary-500 font-medium"
            >
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Quay lại danh sách barbers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link
          to="/barbers"
          className="inline-flex items-center text-dark-600 hover:text-dark-900 mb-6"
        >
          <FiArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Link>

        {/* Header Section */}
        <div className="bg-white rounded-xl border border-dark-200 overflow-hidden mb-6">
          <div className="md:flex">
            {/* Avatar */}
            <div className="md:w-1/3 bg-dark-100">
              {barber.user?.avatar ? (
                <img
                  src={barber.user.avatar}
                  alt={barber.user?.name}
                  className="w-full h-64 md:h-full object-cover"
                />
              ) : (
                <div className="w-full h-64 md:h-full flex items-center justify-center bg-primary-50">
                  <FiUser className="w-24 h-24 text-primary-300" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="md:w-2/3 p-6 md:p-8">
              <h1 className="text-3xl font-display font-bold text-dark-900 mb-2">{barber.user?.name}</h1>

              {/* Rating */}
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  {renderStars(barber.rating || 0, 'w-5 h-5')}
                </div>
                <span className="text-lg font-semibold text-dark-900 ml-2">
                  {(barber.rating || 0).toFixed(1)}
                </span>
                <span className="text-dark-600 ml-2">
                  ({barber.totalReviews || 0} đánh giá)
                </span>
              </div>

              {/* Bio */}
              {barber.bio && (
                <p className="text-dark-700 mb-6">{barber.bio}</p>
              )}

              {/* Skills */}
              {barber.skills && barber.skills.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-dark-600 uppercase mb-2">Kỹ năng</h3>
                  <div className="flex flex-wrap gap-2">
                    {barber.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary-50 text-primary-600 border border-primary-200 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {barber.experience && (
                <div className="flex items-center text-dark-700 mb-6">
                  <FiClock className="w-5 h-5 mr-2" />
                  <span>{barber.experience} năm kinh nghiệm</span>
                </div>
              )}

              {/* Book Button */}
              <Link
                to={`/booking?barber=${barber._id}`}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-dark-900 text-white rounded-lg font-semibold hover:bg-dark-950 transition-colors"
              >
                <FiCalendar className="w-5 h-5" />
                <span>Đặt lịch ngay</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-dark-200 overflow-hidden">
          <div className="border-b border-dark-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info'
                    ? 'border-primary-500 text-primary-600 bg-primary-50'
                    : 'border-transparent text-dark-600 hover:text-dark-900 hover:border-dark-200'
                  }`}
              >
                Thông tin
              </button>
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'portfolio'
                    ? 'border-primary-500 text-primary-600 bg-primary-50'
                    : 'border-transparent text-dark-600 hover:text-dark-900 hover:border-dark-200'
                  }`}
              >
                Portfolio
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'reviews'
                    ? 'border-primary-500 text-primary-600 bg-primary-50'
                    : 'border-transparent text-dark-600 hover:text-dark-900 hover:border-dark-200'
                  }`}
              >
                Đánh giá ({reviews.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Info Tab */}
            {activeTab === 'info' && (
              <div>
                <h3 className="text-lg font-display font-semibold text-dark-900 mb-4">Giới thiệu</h3>
                <p className="text-dark-700 mb-6">
                  {barber.bio || `${barber.user?.name} là một barber chuyên nghiệp tại Haircut.`}
                </p>

                {barber.workingHours && (
                  <div className="mb-6">
                    <h3 className="text-lg font-display font-semibold text-dark-900 mb-4">Giờ làm việc</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(barber.workingHours).map(([day, hours]) => (
                        <div key={day} className="border border-dark-200 p-3 rounded-lg">
                          <p className="font-medium text-dark-900 capitalize">{day}</p>
                          <p className="text-sm text-dark-600">
                            {hours.isWorking ? `${hours.start} - ${hours.end}` : 'Nghỉ'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {barber.services && barber.services.length > 0 && (
                  <div>
                    <h3 className="text-lg font-display font-semibold text-dark-900 mb-4">Dịch vụ</h3>
                    <ul className="space-y-2">
                      {barber.services.map((service, index) => (
                        <li key={index} className="flex items-center text-dark-700">
                          <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                          {typeof service === 'string' ? service : service.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Portfolio Tab */}
            {activeTab === 'portfolio' && (
              <div>
                {barber.portfolio && barber.portfolio.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {barber.portfolio.map((image, index) => (
                      <div key={index} className="aspect-square bg-dark-100 rounded-lg overflow-hidden border border-dark-200">
                        <img
                          src={image}
                          alt={`Portfolio ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiImage className="w-12 h-12 text-dark-300 mx-auto mb-4" />
                    <p className="text-dark-600">Chưa có ảnh portfolio nào.</p>
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div>
                {loadingReviews ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-dark-50 rounded-lg h-24 animate-pulse"></div>
                    ))}
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review._id} className="border-b border-dark-100 pb-6 last:border-0 last:pb-0">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0 border border-primary-200">
                            {review.customer?.avatar ? (
                              <img
                                src={review.customer.avatar}
                                alt={review.customer.name}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <span className="text-primary-600 font-semibold">
                                {review.customer?.name?.charAt(0)?.toUpperCase() || 'K'}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-dark-900">
                                {review.customer?.name || 'Khách hàng'}
                              </h4>
                              <span className="text-sm text-dark-600">
                                {formatDate(review.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center mb-2">
                              {renderStars(review.rating)}
                            </div>
                            {review.comment && (
                              <p className="text-dark-700">{review.comment}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiStar className="w-12 h-12 text-dark-300 mx-auto mb-4" />
                    <p className="text-dark-600">Chưa có đánh giá nào.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarberDetailPage;
