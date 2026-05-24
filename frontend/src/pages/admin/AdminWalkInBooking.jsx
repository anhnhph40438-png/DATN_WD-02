import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import adminService from '../../services/adminService';
import api from '../../services/api';

const AdminWalkInBooking = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Customer
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });

  // Step 2: Barber
  const [barbers, setBarbers] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);

  // Step 3: Services
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  // Step 4: Date/Time
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);

  // Step 5: Promo & Notes
  const [promoCode, setPromoCode] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchBarbers();
    fetchServices();
  }, []);

  const fetchBarbers = async () => {
    try {
      const res = await api.get('/barbers');
      setBarbers(res.data.data?.barbers || []);
    } catch (err) {
      toast.error('Khong the tai danh sach tho cat toc');
    }
  };

  const fetchServices = async () => {
    try {
      const res = await api.get('/services');
      setServices(res.data.data?.services || []);
    } catch (err) {
      toast.error('Khong the tai danh sach dich vu');
    }
  };

  const handleSearchCustomer = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    try {
      const res = await adminService.searchUsers(query);
      setSearchResults(res.data?.users || []);
    } catch (err) { setSearchResults([]); }
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setSearchQuery(customer.name);
    setSearchResults([]);
  };

  const toggleService = (serviceId) => {
    setSelectedServices(prev => (prev[0] === serviceId ? [] : [serviceId]));
  };

  const fetchAvailableSlots = async () => {
    if (!selectedBarber || !date) return;
    const totalDuration = services.filter(s => selectedServices.includes(s._id)).reduce((sum, s) => sum + s.duration, 0);
    try {
      const res = await api.get(`/barbers/${selectedBarber._id}/available-slots`, { params: { date, duration: totalDuration } });
      setAvailableSlots(res.data.data?.availableSlots || []);
    } catch (err) { setAvailableSlots([]); }
  };

  useEffect(() => {
    if (step === 4 && selectedBarber && date) { fetchAvailableSlots(); }
  }, [step, date]);

  const totalPrice = services.filter(s => selectedServices.includes(s._id)).reduce((sum, s) => sum + s.price, 0);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = { barberId: selectedBarber._id, serviceIds: selectedServices, date, startTime, notes, promoCode: promoCode || undefined };
      if (isNewCustomer) {
        data.customerName = newCustomer.name;
        data.customerPhone = newCustomer.phone;
        data.customerEmail = newCustomer.email || undefined;
      } else if (selectedCustomer) {
        data.customerId = selectedCustomer._id;
      }
      await adminService.createWalkInBooking(data);
      toast.success('Dat lich tai quay thanh cong!');
      navigate('/admin/appointments');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Khong the dat lich');
    } finally { setLoading(false); }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return isNewCustomer ? (newCustomer.name && newCustomer.phone) : selectedCustomer;
      case 2: return selectedBarber;
      case 3: return selectedServices.length > 0;
      case 4: return date && startTime;
      case 5: return true;
      default: return false;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Đặt lịch tại quầy</h1>
        <p className="text-sm text-gray-500 mt-1">Bước {step} / 5</p>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 mb-8">
        {[1,2,3,4,5].map(s => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-green-600' : 'bg-gray-200'}`} />
        ))}
      </div>

      {/* Step 1: Customer */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Chọn khách hàng</h2>
          <div className="flex gap-4">
            <button onClick={() => { setIsNewCustomer(false); setSelectedCustomer(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${!isNewCustomer ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
              Khách có sẵn
            </button>
            <button onClick={() => { setIsNewCustomer(true); setSelectedCustomer(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${isNewCustomer ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
              Khách mới
            </button>
          </div>
          {!isNewCustomer ? (
            <div className="relative">
              <input type="text" placeholder="Tìm theo tên hoặc số điện thoại..."
                value={searchQuery} onChange={(e) => handleSearchCustomer(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {searchResults.map(user => (
                    <button key={user._id} onClick={() => handleSelectCustomer(user)}
                      className="w-full px-4 py-2.5 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.phone} | {user.email}</p>
                    </button>
                  ))}
                </div>
              )}
              {selectedCustomer && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Đã chọn: {selectedCustomer.name}</p>
                  <p className="text-xs text-green-600">{selectedCustomer.phone} | {selectedCustomer.email}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <input type="text" placeholder="Tên khách hàng *" value={newCustomer.name}
                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
              <input type="tel" placeholder="Số điện thoại *" value={newCustomer.phone}
                onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
              <input type="email" placeholder="Email (không bắt buộc)" value={newCustomer.email}
                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
            </div>
          )}
        </div>
      )}

      {/* Step 2: Barber */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Chọn thợ cắt tóc</h2>
          <div className="grid grid-cols-2 gap-3">
            {barbers.map(barber => (
              <button key={barber._id} onClick={() => setSelectedBarber(barber)}
                className={`p-4 rounded-lg border text-left ${selectedBarber?._id === barber._id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <p className="font-medium text-gray-900">{barber.user?.name}</p>
                <p className="text-xs text-gray-500 mt-1">Rating: {barber.rating}/5</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Services */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Chọn dịch vụ</h2>
          <div className="space-y-2">
            {services.map(service => (
              <button key={service._id} onClick={() => toggleService(service._id)}
                className={`w-full p-4 rounded-lg border text-left flex justify-between items-center ${selectedServices.includes(service._id) ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div>
                  <p className="font-medium text-gray-900">{service.name}</p>
                  <p className="text-xs text-gray-500">{service.duration} phút</p>
                </div>
                <p className="font-semibold text-gray-900">{service.price?.toLocaleString('vi-VN')}đ</p>
              </button>
            ))}
          </div>
          {selectedServices.length > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">Tổng: {totalPrice.toLocaleString('vi-VN')}đ</p>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Date/Time */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Chọn ngày và giờ</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
            <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setStartTime(''); }}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
          </div>
          {availableSlots.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Giờ trống</label>
              <div className="grid grid-cols-4 gap-2">
                {availableSlots.map(slot => (
                  <button key={slot} onClick={() => setStartTime(slot)}
                    className={`py-2 text-sm rounded-lg border ${startTime === slot ? 'border-green-500 bg-green-600 text-white' : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}>
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          )}
          {date && availableSlots.length === 0 && (
            <p className="text-sm text-gray-500">Không có khung giờ trống cho ngày này</p>
          )}
        </div>
      )}

      {/* Step 5: Confirm */}
      {step === 5 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Xác nhận đặt lịch</h2>
          <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
            <p><span className="text-gray-500">Khách hàng:</span> <span className="font-medium">{isNewCustomer ? newCustomer.name : selectedCustomer?.name}</span></p>
            <p><span className="text-gray-500">Thợ:</span> <span className="font-medium">{selectedBarber?.user?.name}</span></p>
            <p><span className="text-gray-500">Dịch vụ:</span> <span className="font-medium">{services.filter(s => selectedServices.includes(s._id)).map(s => s.name).join(', ')}</span></p>
            <p><span className="text-gray-500">Ngày:</span> <span className="font-medium">{date}</span></p>
            <p><span className="text-gray-500">Giờ:</span> <span className="font-medium">{startTime}</span></p>
            <p><span className="text-gray-500">Tổng tiền:</span> <span className="font-semibold text-green-600">{totalPrice.toLocaleString('vi-VN')}đ</span></p>
          </div>
          <input type="text" placeholder="Mã khuyến mãi (không bắt buộc)" value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
          <textarea placeholder="Ghi chú (không bắt buộc)" value={notes}
            onChange={(e) => setNotes(e.target.value)} rows={3}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
        </div>
      )}

      {/* Nav buttons */}
      <div className="flex justify-between mt-8">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/admin/appointments')}
          className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
          {step > 1 ? 'Quay lại' : 'Hủy'}
        </button>
        {step < 5 ? (
          <button onClick={() => setStep(step + 1)} disabled={!canProceed()}
            className="px-6 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
            Tiếp theo
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading}
            className="px-6 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
            {loading ? 'Đang xử lý...' : 'Đặt lịch'}
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminWalkInBooking;
