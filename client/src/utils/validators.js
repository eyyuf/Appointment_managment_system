export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email) ? null : 'Invalid email address';
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'At least 8 characters required';
  if (!/[A-Z]/.test(password)) return 'Must include an uppercase letter';
  if (!/[a-z]/.test(password)) return 'Must include a lowercase letter';
  if (!/\d/.test(password)) return 'Must include a number';
  if (!/[@$!%*?&]/.test(password)) return 'Must include a special character (@$!%*?&)';
  return null;
};

export const validateRequired = (value, fieldName = 'This field') => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) return 'Both times required';
  if (endTime <= startTime) return 'End time must be after start time';
  return null;
};

export const validateFutureDate = (dateStr) => {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d < today) return 'Date cannot be in the past';
  return null;
};
