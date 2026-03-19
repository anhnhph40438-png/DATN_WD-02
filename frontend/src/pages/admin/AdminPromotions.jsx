import { useState, useEffect } from 'react';
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiToggleLeft,
  FiToggleRight,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiPercent,
  FiDollarSign,
  FiCalendar,
  FiTag,
  FiAlertCircle
} from 'react-icons/fi';
import { adminService } from '../../services';
import { formatDate, formatCurrency } from '../../utils/formatters';

const AdminPromotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPromotions, setTotalPromotions] = useState(0);
  const itemsPerPage = 10;
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [promotionToDelete, setPromotionToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    maxDiscount: '',
    minOrderAmount: '',
    startDate: '',
    endDate: '',
    usageLimit: '',
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchPromotions();
  }, [currentPage, search, statusFilter]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      };
      const response = await adminService.getAllPromotions(params);
      const data = response.data || response;
      setPromotions(data.promotions || []);
      setTotalPages(data.pagination?.totalPages || Math.ceil((data.pagination?.total || 0) / itemsPerPage));
      setTotalPromotions(data.pagination?.total || data.promotions?.length || 0);
    } catch (err) {
      console.error('Error fetching promotions:', err);
      setError('Không thể tải danh sách khuyến mãi');
      setPromotions(getMockPromotions());
      setTotalPromotions(5);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const getMockPromotions = () => [
    {
      _id: '1',
      code: 'SUMMER2024',
      description: 'Giảm giá mùa hè',
      discountType: 'percentage',
      discountValue: 20,
      maxDiscount: 100000,
      minOrderAmount: 200000,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-08-31'),
      usageLimit: 100,
      usedCount: 45,
      isActive: true,
    },
    {
      _id: '2',
      code: 'NEWUSER50',
      description: 'Khuyến mãi cho khách hàng mới',
      discountType: 'fixed',
      discountValue: 50000,
      maxDiscount: null,
      minOrderAmount: 100000,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      usageLimit: 500,
      usedCount: 230,
      isActive: true,
    },
    {
      _id: '3',
      code: 'SPRING2024',
      description: 'Khuyến mãi mùa xuân',
      discountType: 'percentage',
      discountValue: 15,
      maxDiscount: 80000,
      minOrderAmount: 150000,
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-05-31'),
      usageLimit: 200,
      usedCount: 200,
      isActive: false,
    },
    {
      _id: '4',
      code: 'AUTUMN2024',
      description: 'Khuyến mãi mùa thu',
      discountType: 'percentage',
      discountValue: 25,
      maxDiscount: 150000,
      minOrderAmount: 300000,
      startDate: new Date('2024-09-01'),
      endDate: new Date('2024-11-30'),
      usageLimit: 150,
      usedCount: 0,
      isActive: true,
    },
  ];

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      maxDiscount: '',
      minOrderAmount: '',
      startDate: '',
      endDate: '',
      usageLimit: '',
      isActive: true,
    });
    setFormErrors({});
    setEditingPromotion(null);
  };

  const handleOpenForm = (promotion = null) => {
    if (promotion) {
      setEditingPromotion(promotion);
      setFormData({
        code: promotion.code,
        description: promotion.description,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue.toString(),
        maxDiscount: promotion.maxDiscount?.toString() || '',
        minOrderAmount: promotion.minOrderAmount?.toString() || '',
        startDate: promotion.startDate ? new Date(promotion.startDate).toISOString().split('T')[0] : '',
        endDate: promotion.endDate ? new Date(promotion.endDate).toISOString().split('T')[0] : '',
        usageLimit: promotion.usageLimit?.toString() || '',
        isActive: promotion.isActive,
      });
    } else {
      resetForm();
    }
    setShowFormModal(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.code.trim()) errors.code = 'Mã khuyến mãi là bắt buộc';
    if (!formData.description.trim()) errors.description = 'Mô tả là bắt buộc';
    if (!formData.discountValue || parseFloat(formData.discountValue) <= 0) {
      errors.discountValue = 'Giá trị giảm giá phải lớn hơn 0';
    }
    if (formData.discountType === 'percentage' && parseFloat(formData.discountValue) > 100) {
      errors.discountValue = 'Phần trăm giảm giá không quá 100%';
    }
    if (!formData.startDate) errors.startDate = 'Ngày bắt đầu là bắt buộc';
    if (!formData.endDate) errors.endDate = 'Ngày kết thúc là bắt buộc';
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setActionLoading(true);
      const payload = {
        code: formData.code.toUpperCase(),
        description: formData.description,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        startDate: formData.startDate,
        endDate: formData.endDate,
        isActive: formData.isActive,
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : 0,
      };
      if (formData.maxDiscount) {
        payload.maxDiscount = parseFloat(formData.maxDiscount);
      }
      if (formData.usageLimit) {
        payload.usageLimit = parseInt(formData.usageLimit);
      }

      if (editingPromotion) {
        const updateResponse = await adminService.updatePromotion(editingPromotion._id, payload);
        const updated = updateResponse.data?.promotion || { ...editingPromotion, ...payload };
        setPromotions(promotions.map(p =>
          p._id === editingPromotion._id ? updated : p
        ));
      } else {
        const createResponse = await adminService.createPromotion(payload);
        const newPromotion = createResponse.data?.promotion || createResponse;
        setPromotions([newPromotion, ...promotions]);
      }

      setShowFormModal(false);
      resetForm();
      fetchPromotions();
    } catch (err) {
      console.error('Error saving promotion:', err);
      if (err.response?.data?.message) {
        alert(err.response.data.message);
      } else {
        alert('Không thể lưu khuyến mãi');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (promotion) => {
    try {
      setActionLoading(true);
      await adminService.togglePromotionStatus(promotion._id);
      setPromotions(promotions.map(p =>
        p._id === promotion._id ? { ...p, isActive: !p.isActive } : p
      ));
    } catch (err) {
      console.error('Error toggling promotion status:', err);
      alert('Không thể thay đổi trạng thái');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePromotion = async () => {
    if (!promotionToDelete) return;
    try {
      setActionLoading(true);
      await adminService.deletePromotion(promotionToDelete._id);
      setPromotions(promotions.filter(p => p._id !== promotionToDelete._id));
      setShowDeleteModal(false);
      setPromotionToDelete(null);
    } catch (err) {
      console.error('Error deleting promotion:', err);
      alert('Không thể xóa khuyến mãi');
    } finally {
      setActionLoading(false);
    }
  };

  const getPromotionStatus = (promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);

    if (!promotion.isActive) return { label: 'Vô hiệu hóa', color: 'bg-dark-100 text-dark-700' };
    if (now < startDate) return { label: 'Sắp diễn ra', color: 'bg-primary-100 text-primary-700' };
    if (now > endDate) return { label: 'Hết hạn', color: 'bg-red-100 text-red-700' };
    if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
      return { label: 'Hết lượt', color: 'bg-red-100 text-red-700' };
    }
    return { label: 'Đang hoạt động', color: 'bg-green-100 text-green-700' };
  };

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalPromotions);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-dark-900">Quản lý khuyến mãi</h1>
          <p className="text-dark-600 mt-1">Tạo và quản lý các chương trình khuyến mãi</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center px-4 py-2 bg-dark-900 text-white rounded-lg hover:bg-dark-950 transition-colors"
        >
          <FiPlus className="mr-2" />
          Thêm khuyến mãi
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-primary-50 border border-primary-200 text-primary-800 px-4 py-3 rounded-lg flex items-center">
          <FiAlertCircle className="mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white border border-dark-100 rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã hoặc mô tả..."
              value={search}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Vô hiệu hóa</option>
              <option value="expired">Hết hạn</option>
              <option value="upcoming">Sắp diễn ra</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-dark-100">
                <thead className="bg-dark-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                      Mã khuyến mãi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                      Mô tả
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                      Giảm giá
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                      Đơn tối thiểu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                      Thời hạn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                      Sử dụng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-dark-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-dark-100">
                  {promotions.map((promotion) => {
                    const status = getPromotionStatus(promotion);
                    return (
                      <tr key={promotion._id} className="hover:bg-dark-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <FiTag className="h-5 w-5 text-primary-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-dark-900 font-mono">
                                {promotion.code}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-dark-900 max-w-xs truncate">
                            {promotion.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-dark-900">
                            {promotion.discountType === 'percentage' ? (
                              <span className="flex items-center">
                                <FiPercent className="mr-1 text-primary-600" />
                                {promotion.discountValue}%
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <FiDollarSign className="mr-1 text-primary-600" />
                                {formatCurrency(promotion.discountValue)}
                              </span>
                            )}
                          </div>
                          {promotion.maxDiscount && (
                            <div className="text-xs text-dark-500">
                              Tối đa: {formatCurrency(promotion.maxDiscount)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-dark-900">
                            {promotion.minOrderAmount ? formatCurrency(promotion.minOrderAmount) : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-dark-900">
                            {formatDate(promotion.startDate, { year: 'numeric', month: '2-digit', day: '2-digit' })}
                          </div>
                          <div className="text-sm text-dark-500">
                            đến {formatDate(promotion.endDate, { year: 'numeric', month: '2-digit', day: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-dark-900">
                            {promotion.usedCount || 0} / {promotion.usageLimit || 'Không giới hạn'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenForm(promotion)}
                              className="p-2 text-dark-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="Chỉnh sửa"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(promotion)}
                              disabled={actionLoading}
                              className={`p-2 rounded-lg transition-colors ${
                                promotion.isActive
                                  ? 'text-green-600 hover:text-red-600 hover:bg-red-50'
                                  : 'text-red-600 hover:text-green-600 hover:bg-green-50'
                              }`}
                              title={promotion.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                            >
                              {promotion.isActive ? (
                                <FiToggleRight className="w-4 h-4" />
                              ) : (
                                <FiToggleLeft className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => { setPromotionToDelete(promotion); setShowDeleteModal(true); }}
                              className="p-2 text-dark-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {promotions.length === 0 && (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-dark-500">
                        Không tìm thấy khuyến mãi nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-dark-100 flex items-center justify-between">
                <div className="text-sm text-dark-700">
                  Hiển thị <span className="font-medium">{startIndex}</span> đến{' '}
                  <span className="font-medium">{endIndex}</span> trong{' '}
                  <span className="font-medium">{totalPromotions}</span> khuyến mãi
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-dark-200 rounded-lg text-sm font-medium text-dark-700 hover:bg-dark-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                    Math.max(0, currentPage - 3),
                    Math.min(totalPages, currentPage + 2)
                  ).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 border rounded-lg text-sm font-medium ${
                        currentPage === page
                          ? 'bg-dark-900 text-white border-dark-900'
                          : 'border-dark-200 text-dark-700 hover:bg-dark-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-dark-200 rounded-lg text-sm font-medium text-dark-700 hover:bg-dark-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => { setShowFormModal(false); resetForm(); }} />
          <div className="relative bg-white border border-dark-200 rounded-xl max-w-xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-display font-semibold text-dark-900">
                {editingPromotion ? 'Chỉnh sửa khuyến mãi' : 'Thêm khuyến mãi mới'}
              </h3>
              <button
                onClick={() => { setShowFormModal(false); resetForm(); }}
                className="p-2 text-dark-400 hover:text-dark-600 rounded-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">
                  Mã khuyến mãi *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="VD: SUMMER2024"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500 uppercase ${
                    formErrors.code ? 'border-red-300' : 'border-dark-200'
                  }`}
                />
                {formErrors.code && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.code}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">
                  Mô tả *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="VD: Giảm giá mùa hè"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500 ${
                    formErrors.description ? 'border-red-300' : 'border-dark-200'
                  }`}
                />
                {formErrors.description && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">
                    Loại giảm giá
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500"
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">
                    Giá trị giảm *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                      placeholder={formData.discountType === 'percentage' ? '0-100' : '0'}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500 ${
                        formErrors.discountValue ? 'border-red-300' : 'border-dark-200'
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400">
                      {formData.discountType === 'percentage' ? '%' : 'VND'}
                    </span>
                  </div>
                  {formErrors.discountValue && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.discountValue}</p>
                  )}
                </div>
              </div>

              {formData.discountType === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">
                    Giảm tối đa (VND)
                  </label>
                  <input
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    placeholder="VD: 100000"
                    className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">
                  Đơn hàng tối thiểu (VND)
                </label>
                <input
                  type="number"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                  placeholder="VD: 200000"
                  className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">
                    Ngày bắt đầu *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500 ${
                      formErrors.startDate ? 'border-red-300' : 'border-dark-200'
                    }`}
                  />
                  {formErrors.startDate && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.startDate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">
                    Ngày kết thúc *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500 ${
                      formErrors.endDate ? 'border-red-300' : 'border-dark-200'
                    }`}
                  />
                  {formErrors.endDate && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.endDate}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">
                  Giới hạn sử dụng
                </label>
                <input
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  placeholder="Để trống nếu không giới hạn"
                  className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <label className="text-sm font-medium text-dark-700">
                  Kích hoạt ngay
                </label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.isActive ? 'bg-primary-500' : 'bg-dark-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowFormModal(false); resetForm(); }}
                  className="px-4 py-2 bg-dark-100 text-dark-700 rounded-lg hover:bg-dark-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Đang lưu...' : (editingPromotion ? 'Cập nhật' : 'Tạo mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && promotionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white border border-dark-200 rounded-xl max-w-sm w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <FiTrash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-display font-semibold text-dark-900 mb-2">Xác nhận xóa</h3>
              <p className="text-dark-600 mb-6">
                Bạn có chắc chắn muốn xóa khuyến mãi <strong>{promotionToDelete.code}</strong>?
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
                  onClick={handleDeletePromotion}
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

export default AdminPromotions;
