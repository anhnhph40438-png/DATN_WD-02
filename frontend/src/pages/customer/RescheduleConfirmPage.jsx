import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import api from '../../services/api';

const RescheduleConfirmPage = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const action = searchParams.get('action');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [appointment, setAppointment] = useState(null);

  useEffect(() => {
    if (token && action) { handleConfirm(); }
  }, [token, action]);

  const handleConfirm = async () => {
    try {
      const res = await api.get(`/appointments/reschedule-confirm/${token}?action=${action}`);
      setAppointment(res.data.data?.appointment);
      setStatus('success');
      setMessage(action === 'accept' ? 'Bạn đã chấp nhận đổi lịch thành công!' : 'Bạn đã từ chối yêu cầu đổi lịch.');
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Liên kết đã hết hạn hoặc không hợp lệ.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        {status === 'loading' && (
          <div>
            <div className="animate-spin h-10 w-10 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Đang xử lý...</p>
          </div>
        )}
        {status === 'success' && (
          <div>
            <div className={`h-16 w-16 mx-auto mb-4 rounded-full flex items-center justify-center ${action === 'accept' ? 'bg-green-100' : 'bg-red-100'}`}>
              {action === 'accept' ? (
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{message}</h2>
            {appointment && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-left">
                <p className="text-gray-600">Ngày: <span className="font-medium text-gray-900">{new Date(appointment.date).toLocaleDateString('vi-VN')}</span></p>
                <p className="text-gray-600 mt-1">Giờ: <span className="font-medium text-gray-900">{appointment.startTime} - {appointment.endTime}</span></p>
              </div>
            )}
          </div>
        )}
        {status === 'error' && (
          <div>
            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Lỗi</h2>
            <p className="text-gray-600">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RescheduleConfirmPage;
