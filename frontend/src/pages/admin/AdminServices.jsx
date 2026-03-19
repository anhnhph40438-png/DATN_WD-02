import { useState, useEffect, useRef } from 'react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiToggleLeft,
  FiToggleRight,
  FiX,
  FiClock,
  FiDollarSign,
  FiImage,
  FiAlertCircle,
  FiUpload,
  FiTag
} from 'react-icons/fi';
import { adminService, serviceService } from '../../services';
import { formatCurrency } from '../../utils/formatters';

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    duration: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getAllServices();
      setServices(response.data?.services || []);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('Không thể tải danh sách dịch vụ');
      setServices(getMockServices());
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    // Use category values matching backend enum: ['haircut', 'shave', 'styling', 'combo', 'other']
    setCategories([
      { value: 'haircut', label: 'Cắt tóc' },
      { value: 'shave', label: 'Cạo râu' },
      { value: 'styling', label: 'Tạo kiểu' },
      { value: 'combo', label: 'Combo' },
      { value: 'other', label: 'Khác' },
    ]);
  };

  const getMockServices = () => [
    { _id: '1', name: 'Cắt tóc nam cơ bản', description: 'Dịch vụ cắt tóc nam cơ bản với các kiểu tóc thông dụng', category: 'Cắt tóc', price: 80000, duration: 30, image: null, status: 'active' },
    { _id: '2', name: 'Cắt tóc Fade', description: 'Cắt tóc kiểu Fade hiện đại, chuyên nghiệp', category: 'Cắt tóc', price: 120000, duration: 45, image: null, status: 'active' },
    { _id: '3', name: 'Gội đầu massage', description: 'Gội đầu kết hợp massage thư giãn', category: 'Gội đầu', price: 50000, duration: 20, image: null, status: 'active' },
    { _id: '4', name: 'Cạo râu tạo kiểu', description: 'Cạo râu chuyên nghiệp, tạo kiểu theo yêu cầu', category: 'Cạo râu', price: 40000, duration: 15, image: null, status: 'active' },
    { _id: '5', name: 'Combo cắt gội', description: 'Cắt tóc + gội đầu massage', category: 'Combo', price: 120000, duration: 50, image: null, status: 'active' },
    { _id: '6', name: 'Nhuộm tóc', description: 'Nhuộm tóc theo màu yêu cầu', category: 'Khác', price: 200000, duration: 90, image: null, status: 'inactive' },
  ];

  const filteredServices = categoryFilter === 'all'
    ? services
    : services.filter(s => s.category === categoryFilter);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      price: '',
      duration: '',
      image: null
    });
    setImagePreview(null);
    setFormErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openAddModal = () => {
    setEditingService(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name || '',
      description: service.description || '',
      category: service.category || '',
      price: service.price?.toString() || '',
      duration: service.duration?.toString() || '',
      image: null
    });
    setImagePreview(service.image || null);
    setFormErrors({});
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors(prev => ({ ...prev, image: 'Kích thước ảnh tối đa 5MB' }));
        return;
      }
      if (!file.type.startsWith('image/')) {
        setFormErrors(prev => ({ ...prev, image: 'Vui lòng chọn file ảnh' }));
        return;
      }
      setFormData(prev => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
      setFormErrors(prev => ({ ...prev, image: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Vui lòng nhập tên dịch vụ';
    if (!formData.category) errors.category = 'Vui lòng chọn danh mục';
    if (!formData.price || isNaN(formData.price) || Number(formData.price) <= 0) {
      errors.price = 'Vui lòng nhập giá hợp lệ';
    }
    if (!formData.duration || isNaN(formData.duration) || Number(formData.duration) <= 0) {
      errors.duration = 'Vui lòng nhập thời gian hợp lệ';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setActionLoading(true);
      const data = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: Number(formData.price),
        duration: Number(formData.duration)
      };

      if (!editingService) {
        const createResponse = await adminService.createService(data);
        const newService = createResponse.data?.service || createResponse;
        setServices([...services, newService]);
      } else {
        const updateResponse = await adminService.updateService(editingService._id, data);
        const updatedService = updateResponse.data?.service || updateResponse;
        setServices(services.map(s =>
          s._id === editingService._id ? updatedService : s
        ));
      }

      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error('Error saving service:', err);
      const errorMsg = err.response?.data?.message || 'Không thể lưu dịch vụ';
      setFormErrors({ submit: errorMsg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (service) => {
    try {
      setActionLoading(true);
      await adminService.toggleServiceStatus(service._id);
      setServices(services.map(s =>
        s._id === service._id
          ? { ...s, isActive: !s.isActive }
          : s
      ));
    } catch (err) {
      console.error('Error toggling service status:', err);
      alert('Không thể thay đổi trạng thái dịch vụ');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;
    try {
      setActionLoading(true);
      await adminService.deleteService(serviceToDelete._id);
      setServices(services.filter(s => s._id !== serviceToDelete._id));
      setShowDeleteModal(false);
      setServiceToDelete(null);
    } catch (err) {
      console.error('Error deleting service:', err);
      alert('Không thể xóa dịch vụ');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (isActive) => {
    return isActive
      ? 'bg-green-100 text-green-700'
      : 'bg-dark-100 text-dark-600';
  };

  const getStatusText = (isActive) => {
    return isActive ? 'Hoạt động' : 'Tạm ngưng';
  };

  const categoryLabelMap = {
    haircut: 'Cắt tóc',
    shave: 'Cạo râu',
    styling: 'Tạo kiểu',
    combo: 'Combo',
    other: 'Khác',
  };

  const getCategoryLabel = (value) => categoryLabelMap[value] || value;

  const uniqueCategories = [...new Set(services.map(s => s.category).filter(Boolean))];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-dark-900">Quản lý dịch vụ</h1>
          <p className="text-dark-600">Thêm, sửa, xóa các dịch vụ của tiệm</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center px-4 py-2 bg-dark-900 text-white rounded-lg hover:bg-dark-950 transition-colors"
        >
          <FiPlus className="w-5 h-5 mr-2" />
          Thêm dịch vụ
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-primary-50 border border-primary-200 text-primary-700 px-4 py-3 rounded-xl flex items-center">
          <FiAlertCircle className="mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white border border-dark-100 rounded-xl p-2 mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            categoryFilter === 'all'
              ? 'bg-dark-900 text-white'
              : 'text-dark-500 hover:bg-dark-50'
          }`}
        >
          Tất cả ({services.length})
        </button>
        {uniqueCategories.map((category) => (
          <button
            key={category}
            onClick={() => setCategoryFilter(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              categoryFilter === category
                ? 'bg-dark-900 text-white'
                : 'text-dark-500 hover:bg-dark-50'
            }`}
          >
            {getCategoryLabel(category)} ({services.filter(s => s.category === category).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div key={service._id} className="bg-white border border-dark-100 rounded-xl overflow-hidden">
              <div className="h-40 bg-dark-100 relative">
                {service.image ? (
                  <img
                    src={service.image}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FiImage className="w-12 h-12 text-dark-300" />
                  </div>
                )}
                <span className={`absolute top-3 right-3 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(service.isActive)}`}>
                  {getStatusText(service.isActive)}
                </span>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-dark-900 line-clamp-1">
                    {service.name}
                  </h3>
                </div>

                {service.category && (
                  <div className="flex items-center text-sm text-dark-500 mb-2">
                    <FiTag className="w-4 h-4 mr-1" />
                    {getCategoryLabel(service.category)}
                  </div>
                )}

                {service.description && (
                  <p className="text-sm text-dark-600 mb-3 line-clamp-2">
                    {service.description}
                  </p>
                )}

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-primary-600 font-semibold">
                    <FiDollarSign className="w-4 h-4 mr-1" />
                    {formatCurrency(service.price)}
                  </div>
                  <div className="flex items-center text-dark-500 text-sm">
                    <FiClock className="w-4 h-4 mr-1" />
                    {service.duration} phút
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-dark-100">
                  <button
                    onClick={() => openEditModal(service)}
                    className="p-2 text-dark-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Chỉnh sửa"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(service)}
                    disabled={actionLoading}
                    className={`p-2 rounded-lg transition-colors ${
                      service.isActive
                        ? 'text-green-600 hover:text-red-600 hover:bg-red-50'
                        : 'text-red-600 hover:text-green-600 hover:bg-green-50'
                    }`}
                    title={service.isActive ? 'Tạm ngưng' : 'Kích hoạt'}
                  >
                    {service.isActive ? (
                      <FiToggleRight className="w-4 h-4" />
                    ) : (
                      <FiToggleLeft className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => { setServiceToDelete(service); setShowDeleteModal(true); }}
                    className="p-2 text-dark-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Xóa"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredServices.length === 0 && (
            <div className="col-span-full bg-white border border-dark-100 rounded-xl p-12 text-center">
              <FiTag className="w-12 h-12 text-dark-300 mx-auto mb-4" />
              <p className="text-dark-500">
                {categoryFilter === 'all'
                  ? 'Chưa có dịch vụ nào. Hãy thêm dịch vụ đầu tiên!'
                  : 'Không có dịch vụ nào trong danh mục này.'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white border border-dark-200 rounded-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-dark-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-dark-900">
                {editingService ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-dark-400 hover:text-dark-600 rounded-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formErrors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {formErrors.submit}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">
                  Hình ảnh
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-24 rounded-lg bg-dark-100 overflow-hidden flex items-center justify-center">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FiImage className="w-8 h-8 text-dark-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center px-4 py-2 border border-dark-200 rounded-lg text-sm text-dark-700 hover:bg-dark-50 transition-colors"
                    >
                      <FiUpload className="w-4 h-4 mr-2" />
                      Chọn ảnh
                    </button>
                    <p className="mt-1 text-xs text-dark-500">PNG, JPG tối đa 5MB</p>
                    {formErrors.image && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.image}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">
                  Tên dịch vụ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 ${
                    formErrors.name ? 'border-red-500' : 'border-dark-200'
                  }`}
                  placeholder="Nhập tên dịch vụ"
                />
                {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                  placeholder="Mô tả chi tiết dịch vụ..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">
                  Danh mục <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 ${
                    formErrors.category ? 'border-red-500' : 'border-dark-200'
                  }`}
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((category) => (
                    <option key={category.value || category} value={category.value || category}>
                      {category.label || category}
                    </option>
                  ))}
                </select>
                {formErrors.category && <p className="mt-1 text-sm text-red-500">{formErrors.category}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">
                    Giá (VND) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" />
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 ${
                        formErrors.price ? 'border-red-500' : 'border-dark-200'
                      }`}
                      placeholder="0"
                    />
                  </div>
                  {formErrors.price && <p className="mt-1 text-sm text-red-500">{formErrors.price}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">
                    Thời gian (phút) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" />
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      min="0"
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 ${
                        formErrors.duration ? 'border-red-500' : 'border-dark-200'
                      }`}
                      placeholder="0"
                    />
                  </div>
                  {formErrors.duration && <p className="mt-1 text-sm text-red-500">{formErrors.duration}</p>}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-dark-100 text-dark-700 rounded-lg hover:bg-dark-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Đang lưu...' : (editingService ? 'Cập nhật' : 'Thêm mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && serviceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white border border-dark-200 rounded-xl max-w-sm w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <FiTrash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-dark-900 mb-2">Xác nhận xóa</h3>
              <p className="text-dark-600 mb-6">
                Bạn có chắc chắn muốn xóa dịch vụ <strong>{serviceToDelete.name}</strong>?
                Hành động này không thể hoàn tác.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-dark-100 text-dark-700 rounded-lg hover:bg-dark-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServices;
