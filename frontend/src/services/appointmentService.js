import api from './api';

const appointmentService = {
  // Create a new appointment
  createAppointment: async (data) => {
    const response = await api.post('/appointments', data);
    return response.data;
  },

  // Get current user's appointments
  getMyAppointments: async (params = {}) => {
    const response = await api.get('/appointments', { params });
    return response.data;
  },

  // Get appointment by ID
  getAppointmentById: async (id) => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },

  // Cancel an appointment
  cancelAppointment: async (id, reason = '') => {
    const response = await api.patch(`/appointments/${id}/cancel`, { reason });
    return response.data;
  },

  // Add review for a completed appointment
  addReview: async (appointmentId, reviewData) => {
    const response = await api.post('/reviews', {
      appointmentId,
      ...reviewData,
    });
    return response.data;
  },

  // Reschedule an appointment (customer)
  rescheduleAppointment: async (id, data) => {
    const response = await api.put(`/appointments/${id}/reschedule`, data);
    return response.data;
  },

  // Respond to a reschedule request (customer)
  respondToReschedule: async (id, action) => {
    const response = await api.patch(`/appointments/${id}/reschedule-respond`, { action });
    return response.data;
  },

  // Get reschedule confirm by token (public)
  getRescheduleByToken: async (token, action) => {
    const response = await api.get(`/appointments/reschedule-confirm/${token}?action=${action}`);
    return response.data;
  },
};

export default appointmentService;
