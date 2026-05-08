import api from './api';

export const appointmentService = {
  // Student: submit request (department-based, no direct leader selection)
  create: (data) => api.post('/appointments', data),

  // Read
  getAll: (params) => api.get('/appointments', { params }),
  getOne: (id) => api.get(`/appointments/${id}`),
  getDepartments: () => api.get('/appointments/departments'),
  getAvailableSlots: (leaderId, date) => api.get(`/appointments/slots/${leaderId}`, { params: { date } }),

  // Secretary workflow (MANDATORY GATEWAY)
  markUnderReview: (id) => api.post(`/appointments/${id}/review`),
  forwardToLeader: (id, data) => api.post(`/appointments/${id}/forward`, data),  // { leaderId, note, newDate?, newStartTime?, newEndTime? }

  // Leadership actions (only on FORWARDED)
  leaderApprove: (id, note) => api.post(`/appointments/${id}/approve`, { note }),

  // Shared actions
  reject: (id, reason) => api.post(`/appointments/${id}/reject`, { reason }),
  cancel: (id, cancellationReason) => api.post(`/appointments/${id}/cancel`, { cancellationReason }),
  reschedule: (id, data) => api.post(`/appointments/${id}/reschedule`, data),
};
