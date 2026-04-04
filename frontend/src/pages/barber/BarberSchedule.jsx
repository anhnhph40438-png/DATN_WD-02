import { useState, useEffect } from 'react';
import {
  FiClock,
  FiSave,
  FiX,
  FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { barberService } from '../../services';

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Thu 2' },
  { key: 'tuesday', label: 'Thu 3' },
  { key: 'wednesday', label: 'Thu 4' },
  { key: 'thursday', label: 'Thu 5' },
  { key: 'friday', label: 'Thu 6' },
  { key: 'saturday', label: 'Thu 7' },
  { key: 'sunday', label: 'Chủ nhật' },
];

const DEFAULT_SCHEDULE = DAYS_OF_WEEK.reduce((acc, day) => {
  acc[day.key] = {
    isWorking: day.key !== 'sunday',
    startTime: '08:00',
    endTime: '18:00',
  };
  return acc;
}, {});

const BarberSchedule = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [barberId, setBarberId] = useState(null);
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);

  useEffect(() => {
    fetchScheduleData();
  }, []);

  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      const barberProfile = await barberService.getMyBarberProfile();
      const barber = barberProfile.data?.barber;
      setBarberId(barber?._id);

      // Set schedule from barber profile (convert backend workingHours format)
      if (barber?.workingHours) {
        const converted = {};
        for (const dayKey of Object.keys(barber.workingHours)) {
          const dayData = barber.workingHours[dayKey];
          converted[dayKey] = {
            isWorking: !dayData.isOff,
            startTime: dayData.start || '08:00',
            endTime: dayData.end || '18:00',
          };
        }
        setSchedule((prev) => ({
          ...prev,
          ...converted,
        }));
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast.error('Không thể tải lịch làm việc');
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (dayKey) => {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        isWorking: !prev[dayKey].isWorking,
      },
    }));
  };

  const handleTimeChange = (dayKey, field, value) => {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value,
      },
    }));
  };

  const handleSaveSchedule = async () => {
    // Validate schedule
    for (const day of DAYS_OF_WEEK) {
      const daySchedule = schedule[day.key];
      if (daySchedule.isWorking) {
        if (!daySchedule.startTime || !daySchedule.endTime) {
          toast.error(`Vui lòng nhập giờ làm việc cho ${day.label}`);
          return;
        }
        if (daySchedule.startTime >= daySchedule.endTime) {
          toast.error(`Giờ kết thúc phải lớn hơn giờ bắt đầu (${day.label})`);
          return;
        }
      }
    }

    try {
      setSaving(true);
      // Convert frontend schedule format to backend workingHours format
      const workingHours = {};
      for (const day of DAYS_OF_WEEK) {
        const daySchedule = schedule[day.key];
        workingHours[day.key] = {
          start: daySchedule.startTime,
          end: daySchedule.endTime,
          isOff: !daySchedule.isWorking,
        };
      }
      await barberService.updateSchedule(barberId, { workingHours });
      toast.success('Lưu lịch làm việc thành công!');
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error(error.response?.data?.message || 'Không thể lưu lịch làm việc');
    } finally {
      setSaving(false);
    }
  };


  // Generate time slots for preview
  const generateTimeSlots = (startTime, endTime) => {
    const slots = [];
    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);

    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }

    return slots;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="mb-8">
          <div className="h-8 w-48 bg-dark-100 rounded mb-2"></div>
          <div className="h-5 w-64 bg-dark-100 rounded"></div>
        </div>
        <div className="space-y-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-20 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-dark-900">Lịch làm việc</h1>
        <p className="text-dark-600">Thiết lập lịch làm việc hàng tuần của bạn</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Schedule */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-dark-100">
            <div className="p-6 border-b border-dark-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display font-semibold text-dark-900">Lịch làm việc hàng tuần</h2>
                <button
                  onClick={handleSaveSchedule}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 bg-dark-900 text-white rounded-lg hover:bg-dark-950 transition-colors disabled:bg-dark-400"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <FiSave className="w-4 h-4 mr-2" />
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="divide-y divide-dark-100">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.key} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Day Toggle */}
                      <button
                        onClick={() => handleDayToggle(day.key)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          schedule[day.key].isWorking ? 'bg-primary-500' : 'bg-dark-200'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            schedule[day.key].isWorking ? 'left-7' : 'left-1'
                          }`}
                        />
                      </button>

                      {/* Day Name */}
                      <span
                        className={`font-medium w-24 ${
                          schedule[day.key].isWorking ? 'text-dark-900' : 'text-dark-400'
                        }`}
                      >
                        {day.label}
                      </span>
                    </div>

                    {schedule[day.key].isWorking ? (
                      <div className="flex items-center gap-2">
                        <FiClock className="w-4 h-4 text-dark-400" />
                        <input
                          type="time"
                          value={schedule[day.key].startTime}
                          onChange={(e) => handleTimeChange(day.key, 'startTime', e.target.value)}
                          className="px-3 py-1.5 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent text-sm"
                        />
                        <span className="text-dark-400">-</span>
                        <input
                          type="time"
                          value={schedule[day.key].endTime}
                          onChange={(e) => handleTimeChange(day.key, 'endTime', e.target.value)}
                          className="px-3 py-1.5 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-transparent text-sm"
                        />
                      </div>
                    ) : (
                      <span className="text-dark-400 text-sm">Ngày nghỉ</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule Preview */}
          <div className="bg-white rounded-xl border border-dark-100 mt-6">
            <div className="p-6 border-b border-dark-100">
              <h2 className="text-lg font-display font-semibold text-dark-900">Xem trước khung giờ</h2>
              <p className="text-sm text-dark-500 mt-1">
                Các khung giờ có thể đặt lịch dựa trên lịch làm việc của bạn
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.key}>
                    <h4
                      className={`text-sm font-medium mb-2 ${
                        schedule[day.key].isWorking ? 'text-dark-900' : 'text-dark-400'
                      }`}
                    >
                      {day.label}
                    </h4>
                    {schedule[day.key].isWorking ? (
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {generateTimeSlots(
                          schedule[day.key].startTime,
                          schedule[day.key].endTime
                        ).slice(0, 8).map((slot) => (
                          <div
                            key={slot}
                            className="px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded text-center"
                          >
                            {slot}
                          </div>
                        ))}
                        {generateTimeSlots(
                          schedule[day.key].startTime,
                          schedule[day.key].endTime
                        ).length > 8 && (
                          <div className="text-xs text-dark-400 text-center">
                            +{generateTimeSlots(
                              schedule[day.key].startTime,
                              schedule[day.key].endTime
                            ).length - 8} khung giờ
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-4 text-center">
                        <FiX className="w-6 h-6 text-dark-200 mx-auto" />
                        <p className="text-xs text-dark-400 mt-1">Nghỉ</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Help Box */}
        <div className="lg:col-span-1">
          <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-primary-900 mb-1">Lưu ý</h4>
                <ul className="text-sm text-primary-800 space-y-1">
                  <li>* Lịch làm việc áp dụng cho mỗi tuần</li>
                  <li>* Khách hàng không thể đặt lịch vào ngày bạn nghỉ</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarberSchedule;
