import api from './api';

export const notificationService = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export const userService = {
  getLeaders: () => api.get('/users/leaders'),
  getAll: (params) => api.get('/users', { params }),
  getOne: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  toggleActive: (id) => api.put(`/users/${id}/toggle-active`),
};

export const calendarService = {
  getMonthly: (year, month) => api.get('/calendar', { params: { year, month } }),
  getDay: (date) => api.get('/calendar/day', { params: { date } }),
};
