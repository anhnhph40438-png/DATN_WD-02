import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiScissors,
  FiUser,
  FiCalendar,
  FiClock,
  FiFileText,
  FiTag,
  FiStar
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { serviceService, barberService, appointmentService, promotionService } from '../../services';
import { formatCurrency } from '../../utils/formatters';

const BookingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Data
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Selection
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [applyingPromo, setApplyingPromo] = useState(false);

  // Get initial values from URL
  const initialServiceId = searchParams.get('service');
  const initialBarberId = searchParams.get('barber');

  useEffect(() => {
    fetchServices();
    fetchBarbers();
  }, []);

  useEffect(() => {
    // Set initial selections from URL params
    if (initialServiceId && services.length > 0) {
      const service = services.find(s => s._id === initialServiceId);
      if (service && !selectedServices.find(s => s._id === initialServiceId)) {
        setSelectedServices([service]);
      }
    }
    if (initialBarberId && barbers.length > 0) {
      const barber = barbers.find(b => b._id === initialBarberId);
      if (barber) {
        setSelectedBarber(barber);
      }
    }
  }, [initialServiceId, initialBarberId, services, barbers]);

  useEffect(() => {
    // Fetch available slots when barber, date or services change
    if (selectedBarber && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedBarber, selectedDate, selectedServices]);

  const fetchServices = async () => {
    try {
      const response = await serviceService.getServices({ isActive: true });
      setServices(response.data?.services || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Không thể tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const fetchBarbers = async () => {
    try {
      const response = await barberService.getBarbers({ isActive: true });
      setBarbers(response.data?.barbers || []);
    } catch (error) {
      console.error('Error fetching barbers:', error);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      setLoadingSlots(true);
      const response = await barberService.getAvailableSlots(selectedBarber._id, selectedDate, totalDuration || 30);
      setAvailableSlots(response.data?.availableSlots || []);
      setSelectedTime(''); // Reset selected time when date changes
    } catch (error) {
      console.error('Error fetching slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleServiceToggle = (service) => {
    const isSelected = selectedServices[0]?._id === service._id;
    setSelectedServices(isSelected ? [] : [service]);
    setPromoApplied(false);
    setPromoDiscount(0);
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast.error('Vui lòng nhập mã khuyến mãi');
      return;
    }

    try {
      setApplyingPromo(true);
      const serviceIds = selectedServices.map(s => s._id);
      const response = await promotionService.applyPromotion(promoCode, totalPrice, serviceIds);
      setPromoDiscount(response.data?.discount || 0);
      setPromoApplied(true);
      toast.success('Áp dụng mã khuyến mãi thành công!');
    } catch (error) {
      console.error('Error applying promo:', error);
      toast.error(error.response?.data?.message || 'Mã khuyến mãi không hợp lệ');
      setPromoDiscount(0);
      setPromoApplied(false);
    } finally {
      setApplyingPromo(false);
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để đặt lịch');
      navigate('/login', { state: { from: '/booking' } });
      return;
    }

    if (!selectedServices.length || !selectedBarber || !selectedDate || !selectedTime) {
      toast.error('Vui lòng chọn đầy đủ dịch vụ, barber, ngày và giờ');
      return;
    }

    try {
      setSubmitting(true);
      const data = {
        serviceIds: selectedServices.map(s => s._id),
        barberId: selectedBarber._id,
        date: selectedDate,
        startTime: selectedTime,
        notes: notes.trim(),
        promoCode: promoApplied ? promoCode : undefined,
      };
      console.log('Booking data:', data);

      const response = await appointmentService.createAppointment(data);
      toast.success('Đặt lịch thành công!');

      // Navigate to payment page if available, otherwise my appointments
      if (response.data?.appointment?._id) {
        navigate(`/payment/${response.data.appointment._id}`);
      } else {
        navigate('/my-appointments');
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error(error.response?.data?.message || 'Không thể đặt lịch. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate totals
  const totalPrice = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + (s.duration || 0), 0);
  const finalPrice = totalPrice - promoDiscount;

  // Generate dates for next 14 days
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const formatDateDisplay = (dateString) => {
    const date = new Date(dateString);
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const day = days[date.getDay()];
    return {
      day,
      date: date.getDate(),
      month: date.getMonth() + 1,
    };
  };

  const canProceed = () => {
    switch (step) {
      case 1: return selectedServices.length > 0;
      case 2: return selectedBarber !== null;
      case 3: return selectedDate && selectedTime;
      case 4: return true;
      default: return false;
    }
  };

  const steps = [
    { number: 1, title: 'Dịch vụ', icon: FiScissors },
    { number: 2, title: 'Barber', icon: FiUser },
    { number: 3, title: 'Ngày & giờ', icon: FiCalendar },
    { number: 4, title: 'Xác nhận', icon: FiFileText },
  ];

  if (loading) {
    return (
      <div className="bg-dark-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-16 bg-white border border-dark-100 rounded-xl"></div>
            <div className="h-96 bg-white border border-dark-100 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-dark-900 mb-2">Đặt lịch hẹn</h1>
          <p className="text-dark-600">Chọn dịch vụ, barber và thời gian phù hợp</p>
        </div>

        {/* Steps Progress */}
        <div className="bg-white rounded-xl border border-dark-200 p-4 mb-8">
          <div className="flex items-center justify-between">
            {steps.map((s, index) => (
              <div key={s.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${step > s.number
                        ? 'bg-primary-500 text-white'
                        : step === s.number
                          ? 'bg-dark-900 text-white'
                          : 'bg-dark-100 text-dark-400'
                      }`}
                  >
                    {step > s.number ? (
                      <FiCheck className="w-5 h-5" />
                    ) : (
                      <s.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`text-xs mt-1 ${step >= s.number ? 'text-dark-900 font-medium' : 'text-dark-400'}`}>
                    {s.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 sm:w-24 h-1 mx-2 ${step > s.number ? 'bg-primary-500' : 'bg-dark-200'
                      }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl border border-dark-200 p-6 mb-6">
          {/* Step 1: Select Services */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-display font-semibold text-dark-900 mb-4">Chọn dịch vụ</h2>
              <p className="text-dark-600 mb-6">Chọn dịch vụ bạn muốn sử dụng</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => {
                  const isSelected = selectedServices.find(s => s._id === service._id);
                  return (
                    <div
                      key={service._id}
                      onClick={() => handleServiceToggle(service)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-dark-200 hover:border-dark-300'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelected
                              ? 'border-primary-500 bg-primary-500'
                              : 'border-dark-300'
                            }`}
                        >
                          {isSelected && <FiCheck className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-dark-900">{service.name}</h3>
                          <p className="text-sm text-dark-600 mt-1 line-clamp-2">{service.description}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-primary-600 font-bold">{formatCurrency(service.price)}</span>
                            <span className="text-sm text-dark-600 flex items-center">
                              <FiClock className="w-4 h-4 mr-1" />
                              {service.duration} phút
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedServices.length > 0 && (
                <div className="mt-6 p-4 border border-dark-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-dark-600">Đã chọn: {selectedServices[0]?.name}</p>
                      <p className="text-sm text-dark-600">Thời gian: ~{totalDuration} phút</p>
                    </div>
                    <p className="text-xl font-bold text-primary-600">{formatCurrency(totalPrice)}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Barber */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-display font-semibold text-dark-900 mb-4">Chọn Barber</h2>
              <p className="text-dark-600 mb-6">Chọn barber bạn yêu thích</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {barbers.map((barber) => {
                  const isSelected = selectedBarber?._id === barber._id;
                  return (
                    <div
                      key={barber._id}
                      onClick={() => setSelectedBarber(barber)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-dark-200 hover:border-dark-300'
                        }`}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden bg-dark-100">
                          {barber.user?.avatar ? (
                            <img
                              src={barber.user.avatar}
                              alt={barber.user?.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary-50">
                              <FiUser className="w-8 h-8 text-primary-300" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold text-dark-900">{barber.user?.name}</h3>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <FiStar className="w-4 h-4 text-primary-500 fill-current" />
                          <span className="text-sm text-dark-600">
                            {(barber.rating || 0).toFixed(1)} ({barber.totalReviews || 0})
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Select Date & Time */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-display font-semibold text-dark-900 mb-4">Chọn ngày & giờ</h2>
              <p className="text-dark-600 mb-6">Chọn thời gian phù hợp với bạn</p>

              {/* Date Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-dark-700 mb-3">Chọn ngày</h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {getAvailableDates().map((date) => {
                    const { day, date: dayNum, month } = formatDateDisplay(date);
                    const isSelected = selectedDate === date;
                    return (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`flex-shrink-0 w-16 py-3 rounded-lg border-2 transition-all ${isSelected
                            ? 'border-primary-500 bg-primary-500 text-white'
                            : 'border-dark-200 hover:border-dark-300'
                          }`}
                      >
                        <p className={`text-xs ${isSelected ? 'text-primary-100' : 'text-dark-600'}`}>{day}</p>
                        <p className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-dark-900'}`}>{dayNum}</p>
                        <p className={`text-xs ${isSelected ? 'text-primary-100' : 'text-dark-600'}`}>Th{month}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div>
                  <h3 className="text-sm font-semibold text-dark-700 mb-3">Chọn giờ</h3>
                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {availableSlots.map((slot) => {
                        const isSelected = selectedTime === slot;
                        return (
                          <button
                            key={slot}
                            onClick={() => setSelectedTime(slot)}
                            className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${isSelected
                                ? 'border-primary-500 bg-primary-500 text-white'
                                : 'border-dark-200 hover:border-dark-300 text-dark-700'
                              }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 border border-dark-200 rounded-lg">
                      <FiClock className="w-8 h-8 text-dark-300 mx-auto mb-2" />
                      <p className="text-dark-600">Không có lịch trống cho ngày này</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-display font-semibold text-dark-900 mb-4">Xác nhận đặt lịch</h2>
              <p className="text-dark-600 mb-6">Kiểm tra thông tin và xác nhận đặt lịch</p>

              {/* Summary */}
              <div className="border border-dark-200 rounded-lg p-4 mb-6">
                {/* Services */}
                <div className="mb-4 pb-4 border-b border-dark-100">
                  <h3 className="text-sm font-semibold text-dark-600 uppercase mb-2">Dịch vụ</h3>
                  {selectedServices.map((service) => (
                    <div key={service._id} className="flex justify-between items-center py-1">
                      <span className="text-dark-700">{service.name}</span>
                      <span className="text-dark-900 font-medium">{formatCurrency(service.price)}</span>
                    </div>
                  ))}
                </div>

                {/* Barber */}
                <div className="mb-4 pb-4 border-b border-dark-100">
                  <h3 className="text-sm font-semibold text-dark-600 uppercase mb-2">Barber</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-dark-100">
                      {selectedBarber?.user?.avatar ? (
                        <img src={selectedBarber.user.avatar} alt={selectedBarber.user?.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary-50">
                          <FiUser className="w-5 h-5 text-primary-300" />
                        </div>
                      )}
                    </div>
                    <span className="text-dark-900 font-medium">{selectedBarber?.user?.name}</span>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="mb-4 pb-4 border-b border-dark-100">
                  <h3 className="text-sm font-semibold text-dark-600 uppercase mb-2">Thời gian</h3>
                  <div className="flex items-center gap-2 text-dark-900">
                    <FiCalendar className="w-4 h-4" />
                    <span>{new Date(selectedDate).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-dark-900 mt-1">
                    <FiClock className="w-4 h-4" />
                    <span>{selectedTime} (~{totalDuration} phút)</span>
                  </div>
                </div>

                {/* Total */}
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-dark-600">Tạm tính</span>
                    <span className="text-dark-900">{formatCurrency(totalPrice)}</span>
                  </div>
                  {promoApplied && (
                    <div className="flex justify-between items-center text-green-600">
                      <span>Giảm giá</span>
                      <span>-{formatCurrency(promoDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-dark-200">
                    <span className="text-lg font-semibold text-dark-900">Tổng cộng</span>
                    <span className="text-xl font-bold text-primary-600">{formatCurrency(finalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Promo Code */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-dark-700 mb-2">Mã khuyến mãi</h3>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 w-4 h-4" />
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase());
                        setPromoApplied(false);
                        setPromoDiscount(0);
                      }}
                      placeholder="Nhập mã khuyến mãi"
                      className="w-full pl-10 pr-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                      disabled={promoApplied}
                    />
                  </div>
                  <button
                    onClick={handleApplyPromo}
                    disabled={applyingPromo || promoApplied}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${promoApplied
                        ? 'bg-green-100 text-green-700'
                        : 'bg-primary-500 text-white hover:bg-primary-600'
                      }`}
                  >
                    {applyingPromo ? 'Đang áp dụng...' : promoApplied ? 'Đã áp dụng' : 'Áp dụng'}
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-sm font-semibold text-dark-700 mb-2">Ghi chú (tùy chọn)</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Thêm ghi chú cho barber..."
                  rows={3}
                  className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${step === 1
                ? 'bg-dark-50 text-dark-300 cursor-not-allowed'
                : 'border border-dark-200 text-dark-700 hover:bg-dark-50'
              }`}
          >
            <FiChevronLeft className="w-5 h-5 mr-1" />
            Quay lại
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${canProceed()
                  ? 'bg-dark-900 text-white hover:bg-dark-950'
                  : 'bg-dark-100 text-dark-400 cursor-not-allowed'
                }`}
            >
              Tiếp theo
              <FiChevronRight className="w-5 h-5 ml-1" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center px-8 py-3 bg-dark-900 text-white rounded-lg font-semibold hover:bg-dark-950 transition-colors disabled:bg-dark-300"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <FiCheck className="w-5 h-5 mr-2" />
                  Xác nhận đặt lịch
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
