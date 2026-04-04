import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiScissors, FiStar, FiClock, FiCreditCard, FiMessageSquare, FiArrowRight } from 'react-icons/fi';
import { serviceService, barberService } from '../../services';
import { formatCurrency } from '../../utils/formatters';

const HomePage = () => {
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingBarbers, setLoadingBarbers] = useState(true);

  useEffect(() => {
    fetchServices();
    fetchBarbers();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await serviceService.getServices({ limit: 4 });
      setServices(response.data?.services || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoadingServices(false);
    }
  };

  const fetchBarbers = async () => {
    try {
      const response = await barberService.getBarbers({ limit: 4 });
      setBarbers(response.data?.barbers || []);
    } catch (error) {
      console.error('Error fetching barbers:', error);
    } finally {
      setLoadingBarbers(false);
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <FiStar
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-dark-950 bg-noise text-white relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center animate-fade-in-up">
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">
              Haircut - Đặt lịch cắt tóc online
            </h1>
            <p className="text-xl text-dark-300 mb-8 max-w-2xl mx-auto">
              Hệ thống đặt lịch cắt tóc trực tuyến hàng đầu. Chọn barber yêu thích,
              đặt lịch nhanh chóng chỉ với vài thao tác.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/booking"
                className="inline-flex items-center space-x-2 px-8 py-4 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors"
              >
                <FiCalendar className="w-5 h-5" />
                <span>Đặt lịch ngay</span>
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center space-x-2 px-8 py-4 border-2 border-dark-200 text-white rounded-lg font-semibold hover:bg-dark-900 transition-colors"
              >
                <FiScissors className="w-5 h-5" />
                <span>Xem dịch vụ</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title font-display text-dark-900 mb-3">Tại sao chọn Haircut?</h2>
            <div className="divider mx-auto"></div>
            <p className="text-dark-600 max-w-2xl mx-auto mt-4">
              Chúng tôi mang đến trải nghiệm đặt lịch cắt tóc tốt nhất với nhiều tiện ích hữu ích.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-xl border border-dark-100 text-center hover:border-primary-300 transition-colors">
              <div className="w-16 h-16 bg-primary-50 border border-primary-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCalendar className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-dark-900 mb-2">Đặt lịch dễ dàng</h3>
              <p className="text-dark-600">Đặt lịch chỉ với vài click, chọn thời gian phù hợp nhất.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-dark-100 text-center hover:border-primary-300 transition-colors">
              <div className="w-16 h-16 bg-primary-50 border border-primary-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiScissors className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-dark-900 mb-2">Chọn barber yêu thích</h3>
              <p className="text-dark-600">Lựa chọn barber phù hợp với phong cách của bạn.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-dark-100 text-center hover:border-primary-300 transition-colors">
              <div className="w-16 h-16 bg-primary-50 border border-primary-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCreditCard className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-dark-900 mb-2">Thanh toán tiện lợi</h3>
              <p className="text-dark-600">Hỗ trợ nhiều hình thức thanh toán: tiền mặt, VNPay.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-dark-100 text-center hover:border-primary-300 transition-colors">
              <div className="w-16 h-16 bg-primary-50 border border-primary-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiMessageSquare className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-dark-900 mb-2">Đánh giá & nhận xét</h3>
              <p className="text-dark-600">Đọc đánh giá từ khách hàng khác để chọn dịch vụ tốt nhất.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview Section */}
      <section className="py-20 bg-dark-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="section-title font-display text-dark-900 mb-3">Dịch vụ nổi bật</h2>
              <div className="divider"></div>
              <p className="text-dark-600 mt-4">Khám phá các dịch vụ cắt tóc chuyên nghiệp của chúng tôi.</p>
            </div>
            <Link
              to="/services"
              className="hidden sm:inline-flex items-center space-x-2 text-primary-500 hover:text-primary-600 font-semibold"
            >
              <span>Xem tất cả</span>
              <FiArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {loadingServices ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-dark-100 rounded-xl h-72 animate-pulse"></div>
              ))}
            </div>
          ) : services.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service) => (
                <div
                  key={service._id}
                  className="bg-white border border-dark-100 rounded-xl overflow-hidden hover:border-primary-300 hover:shadow-sm transition-all"
                >
                  <div className="h-40 bg-dark-100 overflow-hidden">
                    {service.image ? (
                      <img
                        src={service.image}
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary-50">
                        <FiScissors className="w-12 h-12 text-primary-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-dark-900 mb-1">{service.name}</h3>
                    <p className="text-sm text-dark-500 mb-3 line-clamp-2">{service.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-primary-500 font-bold">{formatCurrency(service.price)}</span>
                      <span className="text-sm text-dark-500 flex items-center">
                        <FiClock className="w-4 h-4 mr-1" />
                        {service.duration} phút
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-dark-100">
              <FiScissors className="w-12 h-12 text-dark-400 mx-auto mb-4" />
              <p className="text-dark-500">Chưa có dịch vụ nào.</p>
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link
              to="/services"
              className="inline-flex items-center space-x-2 text-primary-500 hover:text-primary-600 font-semibold"
            >
              <span>Xem tất cả dịch vụ</span>
              <FiArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Barbers Preview Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="section-title font-display text-dark-900 mb-3">Đội ngũ thợ cắt tóc</h2>
              <div className="divider"></div>
              <p className="text-dark-600 mt-4">Gặp gỡ những barber tài năng và chuyên nghiệp.</p>
            </div>
            <Link
              to="/barbers"
              className="hidden sm:inline-flex items-center space-x-2 text-primary-500 hover:text-primary-600 font-semibold"
            >
              <span>Xem tất cả</span>
              <FiArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {loadingBarbers ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white border border-dark-100 rounded-xl h-80 animate-pulse"></div>
              ))}
            </div>
          ) : barbers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {barbers.map((barber) => (
                <Link
                  key={barber._id}
                  to={`/barbers/${barber._id}`}
                  className="bg-white rounded-xl overflow-hidden border border-dark-100 hover:border-primary-300 hover:shadow-sm transition-all group"
                >
                  <div className="h-48 bg-dark-100 overflow-hidden">
                    {barber.user?.avatar ? (
                      <img
                        src={barber.user.avatar}
                        alt={barber.user?.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary-50">
                        <span className="text-4xl font-bold text-primary-300">
                          {barber.user?.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-dark-900 mb-1">{barber.user?.name}</h3>
                    <div className="flex items-center mb-2">
                      <div className="flex items-center">
                        {renderStars(barber.rating || 0)}
                      </div>
                      <span className="text-sm text-dark-500 ml-2">
                        ({barber.reviewCount || 0} đánh giá)
                      </span>
                    </div>
                    {barber.skills && barber.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {barber.skills.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-dark-50 text-dark-600 text-xs rounded-full border border-dark-100"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white border border-dark-100 rounded-xl">
              <FiScissors className="w-12 h-12 text-dark-400 mx-auto mb-4" />
              <p className="text-dark-500">Chưa có barber nào.</p>
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link
              to="/barbers"
              className="inline-flex items-center space-x-2 text-primary-500 hover:text-primary-600 font-semibold"
            >
              <span>Xem tất cả barbers</span>
              <FiArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-dark-950 bg-noise text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl font-bold mb-4">Sẵn sàng đặt lịch?</h2>
          <p className="text-dark-300 mb-8 max-w-xl mx-auto">
            Tham gia cùng hàng nghìn khách hàng hài lòng. Đặt lịch ngay để trải nghiệm dịch vụ tốt nhất.
          </p>
          <Link
            to="/booking"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors"
          >
            <FiCalendar className="w-5 h-5" />
            <span>Đặt lịch ngay</span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
