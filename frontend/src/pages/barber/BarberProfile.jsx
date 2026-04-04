import { useState, useEffect, useRef } from 'react';
import {
  FiUser,
  FiLock,
  FiCamera,
  FiSave,
  FiMail,
  FiPhone,
  FiFileText,
  FiX,
  FiPlus,
  FiScissors
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { authService, barberService } from '../../services';

const BarberProfile = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [barberId, setBarberId] = useState(null);

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  // Barber profile state
  const [barberData, setBarberData] = useState({
    bio: '',
    skills: [],
  });


  // Skills input state
  const [skillInput, setSkillInput] = useState('');

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchBarberProfile();
  }, []);

  const fetchBarberProfile = async () => {
    try {
      setLoading(true);
      const response = await barberService.getMyBarberProfile();
      const barber = response.data?.barber;
      setBarberId(barber?._id);

      setBarberData({
        bio: barber?.bio || '',
        skills: barber?.skills || [],
      });

      // Update profile data from barber's user info or auth context
      const barberUser = barber?.user || user;
      setProfileData({
        name: barberUser?.name || '',
        email: barberUser?.email || '',
        phone: barberUser?.phone || '',
      });
    } catch (error) {
      console.error('Error fetching barber profile:', error);
      toast.error('Không thể tải thông tin hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBarberDataChange = (e) => {
    const { name, value } = e.target;
    setBarberData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh không được vượt quá 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setAvatarFile(file);
    }
  };

  const handleAddSkill = () => {
    const skill = skillInput.trim();
    if (!skill) return;

    if (barberData.skills.includes(skill)) {
      toast.error('Kỹ năng này đã tồn tại');
      return;
    }

    setBarberData((prev) => ({
      ...prev,
      skills: [...prev.skills, skill],
    }));
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setBarberData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };



  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!profileData.name.trim()) {
      toast.error('Vui lòng nhập tên');
      return;
    }

    try {
      setSaving(true);

      // Create form data for multipart upload
      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('phone', profileData.phone);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await authService.updateProfile(formData);

      // Update user in context
      if (response.user) {
        updateUser(response.user);
      }

      toast.success('Cập nhật thông tin thành công!');
      setAvatarFile(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handleBarberProfileSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      // Update barber profile (bio, skills)
      await barberService.updateBarberProfile(barberId, {
        bio: barberData.bio,
        skills: barberData.skills,
      });

      toast.success('Cập nhật hồ sơ barber thành công!');
    } catch (error) {
      console.error('Error updating barber profile:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật hồ sơ');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      setSaving(true);
      await authService.changePassword(currentPassword, newPassword);
      toast.success('Đổi mật khẩu thành công!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Không thể đổi mật khẩu');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Thông tin cá nhân', icon: FiUser },
    { id: 'barber', label: 'Hồ sơ barber', icon: FiScissors },
    { id: 'password', label: 'Đổi mật khẩu', icon: FiLock },
  ];

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="mb-8">
          <div className="h-8 w-48 bg-dark-100 rounded mb-2"></div>
          <div className="h-5 w-64 bg-dark-100 rounded"></div>
        </div>
        <div className="bg-white rounded-xl h-96"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-dark-900">Hồ sơ cá nhân</h1>
        <p className="text-dark-600">Quản lý thông tin cá nhân của bạn</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-dark-100 mb-6 overflow-hidden">
        <div className="flex border-b border-dark-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${activeTab === tab.id
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                  : 'text-dark-500 hover:text-dark-700'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-dark-100 p-6">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit}>
            {/* Avatar */}
            <div className="flex flex-col items-center mb-8">
              <div
                onClick={handleAvatarClick}
                className="relative w-32 h-32 rounded-full overflow-hidden bg-dark-100 cursor-pointer group"
              >
                {avatarPreview || user?.avatar ? (
                  <img
                    src={avatarPreview || user?.avatar}
                    alt={user?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary-100">
                    <FiUser className="w-16 h-16 text-primary-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <FiCamera className="w-8 h-8 text-white" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <p className="text-sm text-dark-500 mt-2">Nhấn để đổi ảnh đại diện</p>
            </div>

            <div className="max-w-md mx-auto">
              {/* Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-dark-700 mb-2">
                  Họ và tên
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 w-5 h-5" />
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    placeholder="Nhập họ và tên"
                    className="w-full pl-10 pr-4 py-3 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Email (read-only) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-dark-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    disabled
                    className="w-full pl-10 pr-4 py-3 border border-dark-100 rounded-lg bg-dark-50 text-dark-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-dark-500 mt-1">Email không thể thay đổi</p>
              </div>

              {/* Phone */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-dark-700 mb-2">
                  Số điện thoại
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 w-5 h-5" />
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    placeholder="Nhập số điện thoại"
                    className="w-full pl-10 pr-4 py-3 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={saving}
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-dark-900 text-white rounded-lg font-semibold hover:bg-dark-950 transition-colors disabled:bg-dark-400"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <FiSave className="w-5 h-5 mr-2" />
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Barber Profile Tab */}
        {activeTab === 'barber' && (
          <form onSubmit={handleBarberProfileSubmit}>
            {/* Bio */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Giới thiệu bản thân
              </label>
              <div className="relative">
                <FiFileText className="absolute left-3 top-3 text-dark-400 w-5 h-5" />
                <textarea
                  name="bio"
                  value={barberData.bio}
                  onChange={handleBarberDataChange}
                  placeholder="Viết vài dòng giới thiệu về bản thân, kinh nghiệm làm việc..."
                  rows={4}
                  className="w-full pl-10 pr-4 py-3 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Skills */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Kỹ năng
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  placeholder="Nhập kỹ năng và nhấn Enter"
                  className="flex-1 px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <FiPlus className="w-5 h-5" />
                </button>
              </div>
              {barberData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {barberData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="p-0.5 hover:bg-primary-200 rounded-full"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-dark-900 text-white rounded-lg font-semibold hover:bg-dark-950 transition-colors disabled:bg-dark-400"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Dang luu...
                </>
              ) : (
                <>
                  <FiSave className="w-5 h-5 mr-2" />
                  Lưu hồ sơ barber
                </>
              )}
            </button>
          </form>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordSubmit}>
            <div className="max-w-md mx-auto">
              {/* Current Password */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-dark-700 mb-2">
                  Mật khẩu hiện tại
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 w-5 h-5" />
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Nhập mật khẩu hiện tại"
                    className="w-full pl-10 pr-4 py-3 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-dark-700 mb-2">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 w-5 h-5" />
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                    className="w-full pl-10 pr-4 py-3 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-dark-700 mb-2">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 w-5 h-5" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full pl-10 pr-4 py-3 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={saving}
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-dark-900 text-white rounded-lg font-semibold hover:bg-dark-950 transition-colors disabled:bg-dark-400"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <FiLock className="w-5 h-5 mr-2" />
                    Đổi mật khẩu
                  </>
                )}
              </button>

              {/* Password Requirements */}
              <div className="mt-6 p-4 bg-dark-50 rounded-lg">
                <h4 className="text-sm font-medium text-dark-700 mb-2">Yêu cầu mật khẩu:</h4>
                <ul className="text-sm text-dark-600 space-y-1">
                  <li className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${passwordData.newPassword.length >= 6 ? 'bg-green-500' : 'bg-dark-200'
                        }`}
                    ></span>
                    Ít nhất 6 ký tự
                  </li>
                  <li className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${passwordData.newPassword === passwordData.confirmPassword &&
                          passwordData.newPassword
                          ? 'bg-green-500'
                          : 'bg-dark-200'
                        }`}
                    ></span>
                    Mật khẩu xác nhận phải khớp
                  </li>
                </ul>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BarberProfile;
