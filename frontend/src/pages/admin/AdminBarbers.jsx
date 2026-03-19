import { useState, useEffect } from 'react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiToggleLeft,
  FiToggleRight,
  FiX,
  FiUser,
  FiMail,
  FiPhone,
  FiStar,
  FiAlertCircle,
  FiScissors,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import { adminService } from '../../services';
import { formatPhoneNumber } from '../../utils/formatters';

const AdminBarbers = () => {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingBarber, setEditingBarber] = useState(null);
  const [barberToDelete, setBarberToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    bio: '',
    skills: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchBarbers();
  }, []);

  const fetchBarbers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getAllBarbers();
      setBarbers(response.data?.barbers || []);
    } catch (err) {
      console.error('Error fetching barbers:', err);
      setError('Không thể tải danh sách barbers');
      setBarbers(getMockBarbers());
    } finally {
      setLoading(false);
    }
  };

  const getMockBarbers = () => [
    { _id: '1', user: { _id: 'u1', name: 'Trần Minh Hùng', email: 'hung@barber.com', phone: '0901234567', avatar: null }, bio: 'Chuyên gia cắt tóc nam với 5 năm kinh nghiệm', skills: ['Fade', 'Undercut', 'Classic'], rating: 4.8, status: 'active' },
    { _id: '2', user: { _id: 'u2', name: 'Nguyễn Văn Thành', email: 'thanh@barber.com', phone: '0912345678', avatar: null }, bio: 'Master barber với phong cách hiện đại', skills: ['Pompadour', 'Quiff', 'Textured'], rating: 4.6, status: 'active' },
    { _id: '3', user: { _id: 'u3', name: 'Lê Hoàng Nam', email: 'nam@barber.com', phone: '0923456789', avatar: null }, bio: 'Barber trẻ với đam mê sáng tạo', skills: ['Modern', 'Skin Fade', 'Design'], rating: 4.5, status: 'inactive' },
    { _id: '4', user: { _id: 'u4', name: 'Phạm Văn Đức', email: 'duc@barber.com', phone: '0934567890', avatar: null }, bio: 'Kinh nghiệm 8 năm trong nghề', skills: ['Classic', 'Beard Trim', 'Razor'], rating: 4.9, status: 'active' },
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      bio: '',
      skills: ''
    });
    setFormErrors({});
    setShowPassword(false);
  };

  const openAddModal = () => {
    setEditingBarber(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (barber) => {
    setEditingBarber(barber);
    setFormData({
      name: barber.user?.name || '',
      email: barber.user?.email || '',
      phone: barber.user?.phone || '',
      password: '',
      bio: barber.bio || '',
      skills: Array.isArray(barber.skills) ? barber.skills.join(', ') : barber.skills || ''
    });
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

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Vui lòng nhập tên';
    if (!formData.email.trim()) {
      errors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email không hợp lệ';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^0\d{9}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Số điện thoại không hợp lệ';
    }
    if (!editingBarber && !formData.password.trim()) {
      errors.password = 'Vui lòng nhập mật khẩu';
    } else if (!editingBarber && formData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setActionLoading(true);
      const skillsArray = formData.skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s);

      const data = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        bio: formData.bio,
        skills: skillsArray
      };

      if (!editingBarber) {
        data.password = formData.password;
        const response = await adminService.createBarber(data);
        setBarbers([...barbers, response.data?.barber || response]);
      } else {
        if (formData.password) {
          data.password = formData.password;
        }
        const updateResponse = await adminService.updateBarber(editingBarber._id, data);
        setBarbers(barbers.map(b =>
          b._id === editingBarber._id ? (updateResponse.data?.barber || updateResponse) : b
        ));
      }

      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error('Error saving barber:', err);
      const errorMsg = err.response?.data?.message || 'Không thể lưu thông tin barber';
      setFormErrors({ submit: errorMsg });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (barber) => {
    try {
      setActionLoading(true);
      await adminService.toggleBarberStatus(barber._id);
      setBarbers(barbers.map(b =>
        b._id === barber._id
          ? { ...b, isAvailable: !b.isAvailable }
          : b
      ));
    } catch (err) {
      console.error('Error toggling barber status:', err);
      alert('Không thể thay đổi trạng thái barber');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!barberToDelete) return;
    try {
      setActionLoading(true);
      await adminService.deleteBarber(barberToDelete._id);
      setBarbers(barbers.filter(b => b._id !== barberToDelete._id));
      setShowDeleteModal(false);
      setBarberToDelete(null);
    } catch (err) {
      console.error('Error deleting barber:', err);
      alert('Không thể xóa barber');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (isAvailable) => {
    return isAvailable
      ? 'bg-green-100 text-green-700'
      : 'bg-dark-100 text-dark-600';
  };

  const getStatusText = (isAvailable) => {
    return isAvailable ? 'Hoạt động' : 'Nghỉ việc';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-dark-900">Quản lý Barbers</h1>
          <p className="text-dark-600">Xem và quản lý tất cả barbers</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center px-4 py-2 bg-dark-900 text-white rounded-lg hover:bg-dark-950 transition-colors"
        >
          <FiPlus className="w-5 h-5 mr-2" />
          Thêm Barber
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-primary-50 border border-primary-200 text-primary-700 px-4 py-3 rounded-xl flex items-center">
          <FiAlertCircle className="mr-2" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {barbers.map((barber) => (
            <div key={barber._id} className="bg-white border border-dark-100 rounded-xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    {barber.user?.avatar ? (
                      <img
                        src={barber.user.avatar}
                        alt={barber.user.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                        <FiScissors className="w-8 h-8 text-primary-600" />
                      </div>
                    )}
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-dark-900">
                        {barber.user?.name || 'N/A'}
                      </h3>
                      <div className="flex items-center mt-1">
                        <FiStar className="w-4 h-4 text-primary-500 fill-current" />
                        <span className="ml-1 text-sm text-dark-600">
                          {barber.rating?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(barber.isAvailable)}`}>
                    {getStatusText(barber.isAvailable)}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-dark-600">
                    <FiMail className="w-4 h-4 mr-2" />
                    {barber.user?.email || 'N/A'}
                  </div>
                  <div className="flex items-center text-sm text-dark-600">
                    <FiPhone className="w-4 h-4 mr-2" />
                    {formatPhoneNumber(barber.user?.phone) || 'N/A'}
                  </div>
                </div>

                {barber.bio && (
                  <p className="text-sm text-dark-600 mb-4 line-clamp-2">
                    {barber.bio}
                  </p>
                )}

                {barber.skills && barber.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(Array.isArray(barber.skills) ? barber.skills : [barber.skills]).slice(0, 4).map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-dark-100 text-dark-600 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                    {Array.isArray(barber.skills) && barber.skills.length > 4 && (
                      <span className="px-2 py-1 bg-dark-100 text-dark-600 text-xs rounded-full">
                        +{barber.skills.length - 4}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end space-x-2 pt-4 border-t border-dark-100">
                  <button
                    onClick={() => openEditModal(barber)}
                    className="p-2 text-dark-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Chỉnh sửa"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(barber)}
                    disabled={actionLoading}
                    className={`p-2 rounded-lg transition-colors ${
                      barber.isAvailable
                        ? 'text-green-600 hover:text-red-600 hover:bg-red-50'
                        : 'text-red-600 hover:text-green-600 hover:bg-green-50'
                    }`}
                    title={barber.isAvailable ? 'Vô hiệu hóa' : 'Kích hoạt'}
                  >
                    {barber.isAvailable ? (
                      <FiToggleRight className="w-4 h-4" />
                    ) : (
                      <FiToggleLeft className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => { setBarberToDelete(barber); setShowDeleteModal(true); }}
                    className="p-2 text-dark-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Xóa"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {barbers.length === 0 && (
            <div className="col-span-full bg-white border border-dark-100 rounded-xl p-12 text-center">
              <FiScissors className="w-12 h-12 text-dark-300 mx-auto mb-4" />
              <p className="text-dark-500">Chưa có barber nào. Hãy thêm barber đầu tiên!</p>
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
                {editingBarber ? 'Chỉnh sửa Barber' : 'Thêm Barber mới'}
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
                <label className="block text-sm font-medium text-dark-700 mb-1">
                  Họ tên <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 ${
                      formErrors.name ? 'border-red-500' : 'border-dark-200'
                    }`}
                    placeholder="Nhập họ tên"
                  />
                </div>
                {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 ${
                      formErrors.email ? 'border-red-500' : 'border-dark-200'
                    }`}
                    placeholder="email@example.com"
                  />
                </div>
                {formErrors.email && <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 ${
                      formErrors.phone ? 'border-red-500' : 'border-dark-200'
                    }`}
                    placeholder="0912345678"
                  />
                </div>
                {formErrors.phone && <p className="mt-1 text-sm text-red-500">{formErrors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">
                  Mật khẩu {!editingBarber && <span className="text-red-500">*</span>}
                  {editingBarber && <span className="text-dark-400 text-xs ml-1">(để trống nếu không thay đổi)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 ${
                      formErrors.password ? 'border-red-500' : 'border-dark-200'
                    }`}
                    placeholder={editingBarber ? '******' : 'Nhập mật khẩu'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-dark-600"
                  >
                    {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
                {formErrors.password && <p className="mt-1 text-sm text-red-500">{formErrors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">
                  Giới thiệu
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                  placeholder="Giới thiệu về barber..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">
                  Kỹ năng
                </label>
                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                  placeholder="Fade, Undercut, Classic... (phân cách bằng dấu phẩy)"
                />
                <p className="mt-1 text-xs text-dark-500">Các kỹ năng phân cách bằng dấu phẩy</p>
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
                  {actionLoading ? 'Đang lưu...' : (editingBarber ? 'Cập nhật' : 'Thêm mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && barberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white border border-dark-200 rounded-xl max-w-sm w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <FiTrash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-dark-900 mb-2">Xác nhận xóa</h3>
              <p className="text-dark-600 mb-6">
                Bạn có chắc chắn muốn xóa barber <strong>{barberToDelete.user?.name}</strong>?
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

export default AdminBarbers;
