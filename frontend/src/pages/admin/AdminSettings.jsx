import { useState, useEffect, useRef } from 'react';
import {
  FiSave,
  FiUpload,
  FiTrash2,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiMapPin,
  FiPhone,
  FiMail,
  FiClock,
  FiCreditCard
} from 'react-icons/fi';
import { adminService } from '../../services';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('shop');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [shopInfo, setShopInfo] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    description: '',
    images: [],
  });
  const [openingHours, setOpeningHours] = useState([
    { day: 'monday', label: 'Thứ hai', open: '08:00', close: '20:00', isClosed: false },
    { day: 'tuesday', label: 'Thứ ba', open: '08:00', close: '20:00', isClosed: false },
    { day: 'wednesday', label: 'Thứ tư', open: '08:00', close: '20:00', isClosed: false },
    { day: 'thursday', label: 'Thứ năm', open: '08:00', close: '20:00', isClosed: false },
    { day: 'friday', label: 'Thứ sáu', open: '08:00', close: '20:00', isClosed: false },
    { day: 'saturday', label: 'Thứ bảy', open: '08:00', close: '21:00', isClosed: false },
    { day: 'sunday', label: 'Chủ nhật', open: '09:00', close: '18:00', isClosed: false },
  ]);
  const [vnpaySettings, setVnpaySettings] = useState({
    tmnCode: '',
    hashSecret: '',
  });
  const [emailSettings, setEmailSettings] = useState({
    fromEmail: '',
    smtpHost: '',
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const shopResponse = await adminService.getShopInfo().catch(() => null);
      const shopData = shopResponse?.data?.shop || shopResponse?.data || null;
      if (shopData) {
        setShopInfo({
          name: shopData.name || '',
          address: shopData.address || '',
          phone: shopData.phone || '',
          email: shopData.email || '',
          description: shopData.description || '',
          images: shopData.images || [],
        });
        if (shopData.openingHours) {
          const hours = shopData.openingHours;
          if (Array.isArray(hours)) {
            setOpeningHours(prev => prev.map(hour => {
              const dayData = hours.find(h => h.day === hour.day);
              return dayData ? { ...hour, ...dayData } : hour;
            }));
          } else {
            // openingHours is an object like { monday: { open, close, isClosed }, ... }
            setOpeningHours(prev => prev.map(hour => {
              const dayData = hours[hour.day];
              return dayData ? { ...hour, ...dayData } : hour;
            }));
          }
        }
      }

      if (!shopData) {
        setMockData();
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Không thể tải cài đặt');
      setMockData();
    } finally {
      setLoading(false);
    }
  };

  const setMockData = () => {
    setShopInfo({
      name: 'Haircut',
      address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
      phone: '0901234567',
      email: 'contact@haircut.vn',
      description: 'Tiệm cắt tóc nam cao cấp với đội ngũ barber chuyên nghiệp.',
      images: [
        '/uploads/shop/shop1.jpg',
        '/uploads/shop/shop2.jpg',
      ],
    });
    setVnpaySettings({
      tmnCode: 'VNPAY***',
      hashSecret: '********',
    });
    setEmailSettings({
      fromEmail: 'noreply@haircut.vn',
      smtpHost: 'smtp.gmail.com',
    });
  };

  const handleSaveShopInfo = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await adminService.updateShopInfo({
        name: shopInfo.name,
        address: shopInfo.address,
        phone: shopInfo.phone.replace(/\s/g, ''),
        email: shopInfo.email,
        description: shopInfo.description,
      });

      setSuccess('Đã lưu thông tin tiệm thành công');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving shop info:', err);
      setError('Không thể lưu thông tin tiệm');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOpeningHours = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Convert array format to object format expected by backend
      const hoursObject = {};
      openingHours.forEach((hour) => {
        hoursObject[hour.day] = {
          open: hour.open,
          close: hour.close,
          isClosed: hour.isClosed,
        };
      });
      await adminService.updateShopHours(hoursObject);

      setSuccess('Đã lưu giờ mở cửa thành công');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving opening hours:', err);
      setError('Không thể lưu giờ mở cửa');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      setSaving(true);
      setError(null);

      const response = await adminService.uploadShopImages(files);

      setShopInfo(prev => ({
        ...prev,
        images: [...prev.images, ...(response.data?.images || response.images || [])],
      }));
      setSuccess('Đã upload hình ảnh thành công');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error uploading images:', err);
      setError('Không thể upload hình ảnh');
    } finally {
      setSaving(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async (index) => {
    try {
      setSaving(true);
      setError(null);

      await adminService.deleteShopImage(index);

      setShopInfo(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));
      setSuccess('Đã xóa hình ảnh');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting image:', err);
      setError('Không thể xóa hình ảnh');
    } finally {
      setSaving(false);
    }
  };

  const handleHourChange = (index, field, value) => {
    setOpeningHours(prev => prev.map((hour, i) =>
      i === index ? { ...hour, [field]: value } : hour
    ));
  };

  const tabs = [
    { id: 'shop', label: 'Thông tin tiệm', icon: FiInfo },
    { id: 'hours', label: 'Giờ mở cửa', icon: FiClock },
    { id: 'payment', label: 'VNPay', icon: FiCreditCard },
    { id: 'email', label: 'Email', icon: FiMail },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-dark-900">Cài đặt</h1>
        <p className="text-dark-600 mt-1">Cấu hình hệ thống và thông tin tiệm</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
          <FiAlertCircle className="mr-2" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
          <FiCheckCircle className="mr-2" />
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
          <div className="border-b border-dark-100">
            <nav className="flex -mb-px">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-dark-900 text-white'
                      : 'text-dark-500 hover:bg-dark-50'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'shop' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">
                      Tên tiệm
                    </label>
                    <input
                      type="text"
                      value={shopInfo.name}
                      onChange={(e) => setShopInfo({ ...shopInfo, name: e.target.value })}
                      placeholder="Tên tiệm"
                      className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">
                      Số điện thoại
                    </label>
                    <div className="relative">
                      <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" />
                      <input
                        type="text"
                        value={shopInfo.phone}
                        onChange={(e) => setShopInfo({ ...shopInfo, phone: e.target.value })}
                        placeholder="0901234567"
                        className="w-full pl-10 pr-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" />
                      <input
                        type="email"
                        value={shopInfo.email}
                        onChange={(e) => setShopInfo({ ...shopInfo, email: e.target.value })}
                        placeholder="contact@example.com"
                        className="w-full pl-10 pr-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">
                      Địa chỉ
                    </label>
                    <div className="relative">
                      <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" />
                      <input
                        type="text"
                        value={shopInfo.address}
                        onChange={(e) => setShopInfo({ ...shopInfo, address: e.target.value })}
                        placeholder="123 Nguyễn Huệ, Quận 1, TP.HCM"
                        className="w-full pl-10 pr-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={shopInfo.description}
                    onChange={(e) => setShopInfo({ ...shopInfo, description: e.target.value })}
                    placeholder="Mô tả về tiệm..."
                    rows={4}
                    className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Hình ảnh tiệm
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {shopInfo.images.map((img, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={img}
                          alt={`Shop ${i + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-dark-200"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/150?text=Image';
                          }}
                        />
                        <button
                          onClick={() => handleDeleteImage(i)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={saving}
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-24 border-2 border-dashed border-dark-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors"
                    >
                      <FiUpload className="w-6 h-6 text-dark-400 mb-1" />
                      <span className="text-xs text-dark-500">Thêm ảnh</span>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveShopInfo}
                    disabled={saving}
                    className="flex items-center px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                  >
                    <FiSave className="mr-2" />
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'hours' && (
              <div className="space-y-6">
                <p className="text-sm text-dark-600 mb-4">
                  Cấu hình giờ mở cửa và đóng cửa cho từng ngày trong tuần.
                </p>

                <div className="space-y-4">
                  {openingHours.map((hour, index) => (
                    <div key={hour.day} className="flex items-center space-x-4 p-4 bg-dark-50 rounded-lg">
                      <div className="w-24">
                        <span className="font-medium text-dark-900">{hour.label}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={!hour.isClosed}
                          onChange={(e) => handleHourChange(index, 'isClosed', !e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-dark-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-dark-600">Mở cửa</span>
                      </div>

                      {!hour.isClosed ? (
                        <>
                          <div className="flex items-center space-x-2">
                            <FiClock className="text-dark-400" />
                            <input
                              type="time"
                              value={hour.open}
                              onChange={(e) => handleHourChange(index, 'open', e.target.value)}
                              className="px-3 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500"
                            />
                          </div>
                          <span className="text-dark-400">-</span>
                          <div className="flex items-center space-x-2">
                            <input
                              type="time"
                              value={hour.close}
                              onChange={(e) => handleHourChange(index, 'close', e.target.value)}
                              className="px-3 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500"
                            />
                          </div>
                        </>
                      ) : (
                        <span className="text-red-500 font-medium">Nghỉ</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveOpeningHours}
                    disabled={saving}
                    className="flex items-center px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                  >
                    <FiSave className="mr-2" />
                    {saving ? 'Đang lưu...' : 'Lưu giờ mở cửa'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="space-y-6">
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <FiInfo className="w-5 h-5 text-primary-600 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-primary-800 font-medium">Thông tin cấu hình</p>
                      <p className="text-sm text-primary-700 mt-1">
                        Các thông số VNPay được cấu hình qua file .env trên server.
                        Vui lòng liên hệ quản trị viên hệ thống để thay đổi.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">
                      TMN Code
                    </label>
                    <input
                      type="text"
                      value={vnpaySettings.tmnCode}
                      disabled
                      className="w-full px-4 py-2 border border-dark-200 rounded-lg bg-dark-100 text-dark-600 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">
                      Hash Secret
                    </label>
                    <input
                      type="text"
                      value={vnpaySettings.hashSecret}
                      disabled
                      className="w-full px-4 py-2 border border-dark-200 rounded-lg bg-dark-100 text-dark-600 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <FiAlertCircle className="w-5 h-5 text-primary-600 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-primary-800 font-medium">Lưu ý bảo mật</p>
                      <p className="text-sm text-primary-700 mt-1">
                        Hash Secret là thông tin bảo mật quan trọng. Không chia sẻ thông tin này với bất kỳ ai.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="space-y-6">
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <FiInfo className="w-5 h-5 text-primary-600 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-primary-800 font-medium">Thông tin cấu hình</p>
                      <p className="text-sm text-primary-700 mt-1">
                        Cấu hình email SMTP được thiết lập qua file .env trên server.
                        Vui lòng liên hệ quản trị viên hệ thống để thay đổi.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">
                      Email gửi đi
                    </label>
                    <input
                      type="text"
                      value={emailSettings.fromEmail}
                      disabled
                      className="w-full px-4 py-2 border border-dark-200 rounded-lg bg-dark-100 text-dark-600 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      value={emailSettings.smtpHost}
                      disabled
                      className="w-full px-4 py-2 border border-dark-200 rounded-lg bg-dark-100 text-dark-600 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="bg-dark-50 border border-dark-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-dark-900 mb-2">Các loại email được gửi:</h4>
                  <ul className="text-sm text-dark-600 space-y-1 list-disc list-inside">
                    <li>Xác nhận đặt lịch thành công</li>
                    <li>Nhắc nhở lịch hẹn</li>
                    <li>Xác nhận thanh toán</li>
                    <li>Thông báo hủy lịch</li>
                    <li>Gửi mã xác nhận (OTP)</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
