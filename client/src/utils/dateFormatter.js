import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);
  return format(d, 'MMM dd, yyyy');
};

export const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
};

export const formatDatetime = (date, time) => `${formatDate(date)} at ${formatTime(time)}`;

export const getDateLabel = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return formatDate(d);
};

export const isDatePast = (date) => isPast(new Date(date));

export const toISODate = (date) => format(new Date(date), 'yyyy-MM-dd');
