import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiStar, FiSearch, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { barberService } from '../../services';

const BarbersPage = () => {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBarbers();
  }, []);

  const fetchBarbers = async () => {
    try {
      setLoading(true);
      const response = await barberService.getBarbers({ isActive: true });
      setBarbers(response.data?.barbers || []);
    } catch (error) {
      console.error('Error fetching barbers:', error);
      toast.error('Không thể tải danh sách barbers');
    } finally {
      setLoading(false);
    }
  };

  const filteredBarbers = barbers.filter((barber) => {
    const name = barber.user?.name || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (barber.skills && barber.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())));
    return matchesSearch;
  });

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <FiStar
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="bg-dark-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="section-title font-display text-dark-900 mb-3">Đội ngũ Barbers</h1>
          <div className="divider mx-auto"></div>
          <p className="text-dark-600 max-w-2xl mx-auto mt-4">
            Gặp gỡ đội ngũ barber tài năng và chuyên nghiệp của chúng tôi.
            Chọn barber yêu thích và đặt lịch ngay.
          </p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-dark-100 p-4 mb-8">
          <div className="relative max-w-md mx-auto">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc kỹ năng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Barbers Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-80 animate-pulse border border-dark-100"></div>
            ))}
          </div>
        ) : filteredBarbers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBarbers.map((barber) => (
              <Link
                key={barber._id}
                to={`/barbers/${barber._id}`}
                className="bg-white rounded-xl border border-dark-100 overflow-hidden hover:border-primary-300 hover:shadow-sm transition-all group"
              >
                <div className="h-56 bg-dark-100 overflow-hidden relative">
                  {barber.user?.avatar ? (
                    <img
                      src={barber.user.avatar}
                      alt={barber.user?.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary-50">
                      <FiUser className="w-20 h-20 text-primary-300" />
                    </div>
                  )}
                  {/* Rating Badge */}
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 border border-dark-100">
                    <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium text-dark-900">
                      {(barber.rating || 0).toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-dark-900 mb-2">{barber.user?.name}</h3>

                  {/* Rating and Reviews */}
                  <div className="flex items-center mb-3">
                    <div className="flex items-center">
                      {renderStars(barber.rating || 0)}
                    </div>
                    <span className="text-sm text-dark-500 ml-2">
                      ({barber.totalReviews || 0} đánh giá)
                    </span>
                  </div>

                  {/* Skills */}
                  {barber.skills && barber.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {barber.skills.slice(0, 4).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-dark-50 text-dark-600 text-xs rounded-full border border-dark-100"
                        >
                          {skill}
                        </span>
                      ))}
                      {barber.skills.length > 4 && (
                        <span className="px-2 py-1 bg-dark-50 text-dark-500 text-xs rounded-full border border-dark-100">
                          +{barber.skills.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dark-100 p-12 text-center">
            <FiUser className="w-16 h-16 text-dark-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-dark-900 mb-2">Không tìm thấy barber</h3>
            <p className="text-dark-500 mb-4">
              {searchTerm
                ? `Không có barber nào phù hợp với "${searchTerm}"`
                : 'Chưa có barber nào trong hệ thống.'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-primary-500 hover:text-primary-600 font-medium"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BarbersPage;
