import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiScissors, FiClock, FiSearch, FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { serviceService } from '../../services';
import { formatCurrency } from '../../utils/formatters';

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await serviceService.getServices({ isActive: true });
      setServices(response.data?.services || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Không thể tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter((service) => {
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const uniqueCategories = [...new Set(services.map((s) => s.category).filter(Boolean))];

  return (
    <div className="bg-dark-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="section-title font-display text-dark-900 mb-3">Dịch vụ của chúng tôi</h1>
          <div className="divider mx-auto"></div>
          <p className="text-dark-600 max-w-2xl mx-auto mt-4">
            Khám phá các dịch vụ cắt tóc và chăm sóc tóc chuyên nghiệp.
            Chọn dịch vụ phù hợp và đặt lịch ngay hôm nay.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-dark-100 p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm dịch vụ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <FiFilter className="text-dark-400 w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">Tất cả danh mục</option>
                {uniqueCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        {uniqueCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${selectedCategory === 'all'
                  ? 'bg-dark-900 text-white'
                  : 'bg-dark-50 text-dark-600 hover:bg-dark-100 border border-dark-200'
                }`}
            >
              Tất cả
            </button>
            {uniqueCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${selectedCategory === category
                    ? 'bg-dark-900 text-white'
                    : 'bg-dark-50 text-dark-600 hover:bg-dark-100 border border-dark-200'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Services Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-80 animate-pulse border border-dark-100"></div>
            ))}
          </div>
        ) : filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service._id}
                className="bg-white rounded-xl border border-dark-100 overflow-hidden hover:border-primary-300 hover:shadow-sm transition-all"
              >
                <div className="h-48 bg-dark-100 overflow-hidden">
                  {service.image ? (
                    <img
                      src={service.image}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary-50">
                      <FiScissors className="w-16 h-16 text-primary-300" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  {service.category && (
                    <span className="inline-block px-3 py-1 bg-primary-50 text-primary-600 text-xs font-medium rounded-full mb-3 border border-primary-200">
                      {service.category}
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-dark-900 mb-2">{service.name}</h3>
                  <p className="text-dark-600 text-sm mb-4 line-clamp-2">
                    {service.description || 'Dịch vụ chuyên nghiệp tại Haircut'}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold text-primary-500">
                      {formatCurrency(service.price)}
                    </span>
                    <span className="text-sm text-dark-500 flex items-center">
                      <FiClock className="w-4 h-4 mr-1" />
                      {service.duration} phút
                    </span>
                  </div>
                  <Link
                    to={`/booking?service=${service._id}`}
                    className="block w-full text-center py-2 bg-dark-900 text-white rounded-lg font-medium hover:bg-dark-950 transition-colors"
                  >
                    Đặt lịch ngay
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dark-100 p-12 text-center">
            <FiScissors className="w-16 h-16 text-dark-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-dark-900 mb-2">Không tìm thấy dịch vụ</h3>
            <p className="text-dark-500 mb-4">
              {searchTerm
                ? `Không có dịch vụ nào phù hợp với "${searchTerm}"`
                : 'Chưa có dịch vụ nào trong danh mục này.'}
            </p>
            {(searchTerm || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
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

export default ServicesPage;
