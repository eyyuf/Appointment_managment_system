import api from './api';

export const appointmentService = {
  getAll: (params) => api.get('/appointments', { params }),
  getOne: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments', data),
  cancel: (id, cancellationReason) => api.post(`/appointments/${id}/cancel`, { cancellationReason }),
  secretaryApprove: (id, note) => api.post(`/appointments/${id}/secretary-approve`, { note }),
  leaderApprove: (id, note) => api.post(`/appointments/${id}/approve`, { note }),
  reject: (id, reason) => api.post(`/appointments/${id}/reject`, { reason }),
  reschedule: (id, data) => api.post(`/appointments/${id}/reschedule`, data),
  getAvailableSlots: (leaderId, date) => api.get(`/appointments/slots/${leaderId}`, { params: { date } }),
};
