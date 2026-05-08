export const API_BASE_URL = 'http://10.38.74.152:5000/api'; // Change to your server IP

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user_data',
};

export const ROLES = {
  STUDENT: 'STUDENT',
  SECRETARY: 'SECRETARY',
  DEPARTMENT_HEAD: 'DEPARTMENT_HEAD',
  DEAN: 'DEAN',
  VICE_PRESIDENT: 'VICE_PRESIDENT',
  PRESIDENT: 'PRESIDENT',
  ADMIN: 'ADMIN',
};

export const ROLE_LABELS = {
  STUDENT: 'Student',
  SECRETARY: 'Secretary',
  DEPARTMENT_HEAD: 'Department Head',
  DEAN: 'Dean',
  VICE_PRESIDENT: 'Vice President',
  PRESIDENT: 'President',
  ADMIN: 'Administrator',
};

export const STATUS_LABELS = {
  PENDING: 'Pending',
  SECRETARY_APPROVED: 'Forwarded',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
  RESCHEDULED: 'Rescheduled',
};

export const APPOINTMENT_STATUSES = Object.keys(STATUS_LABELS);

export const LEADER_ROLES = [
  ROLES.DEPARTMENT_HEAD, ROLES.DEAN, ROLES.VICE_PRESIDENT, ROLES.PRESIDENT,
];

export const PAGINATION = { DEFAULT_LIMIT: 20 };
