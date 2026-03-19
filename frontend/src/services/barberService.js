import api from './api';

const barberService = {
  // Get all barbers (public)
  getBarbers: async (params = {}) => {
    const response = await api.get('/barbers', { params });
    return response.data;
  },

  // Get barber by ID
  getBarberById: async (id) => {
    const response = await api.get(`/barbers/${id}`);
    return response.data;
  },

  // Get available time slots for a barber on a specific date
  getAvailableSlots: async (barberId, date) => {
    const response = await api.get(`/barbers/${barberId}/available-slots`, {
      params: { date },
    });
    return response.data;
  },

  // Get barber reviews
  getBarberReviews: async (barberId, params = {}) => {
    const response = await api.get(`/reviews/barber/${barberId}`, { params });
    return response.data;
  },

  // ============ Barber-specific functions ============

  // Get logged-in barber's own profile
  getMyBarberProfile: async () => {
    const response = await api.get('/barbers/me');
    return response.data;
  },

  // Update barber profile (bio, skills, etc.)
  updateBarberProfile: async (id, data) => {
    const response = await api.put(`/barbers/${id}`, data);
    return response.data;
  },

  // Update barber schedule
  updateSchedule: async (id, scheduleData) => {
    const response = await api.patch(`/barbers/${id}/schedule`, scheduleData);
    return response.data;
  },

  // Get barber statistics
  getBarberStatistics: async (id, params = {}) => {
    const response = await api.get(`/statistics/barber/${id}`, { params });
    return response.data;
  },

  // Get barber appointments
  getBarberAppointments: async (params = {}) => {
    const response = await api.get('/appointments', { params });
    return response.data;
  },

  // Confirm appointment
  confirmAppointment: async (appointmentId) => {
    const response = await api.patch(`/appointments/${appointmentId}/confirm`);
    return response.data;
  },

  // Reject appointment
  rejectAppointment: async (appointmentId, reason = '') => {
    const response = await api.patch(`/appointments/${appointmentId}/reject`, { reason });
    return response.data;
  },

  // Start appointment
  startAppointment: async (appointmentId) => {
    const response = await api.patch(`/appointments/${appointmentId}/start`);
    return response.data;
  },

  // Complete appointment
  completeAppointment: async (appointmentId) => {
    const response = await api.patch(`/appointments/${appointmentId}/complete`);
    return response.data;
  },
};

export default barberService;
