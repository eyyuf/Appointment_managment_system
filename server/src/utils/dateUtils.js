const { format, parseISO, isValid, isBefore, addMinutes } = require('date-fns');

/**
 * Format a Date object to "YYYY-MM-DD"
 */
const formatDate = (date) => format(new Date(date), 'yyyy-MM-dd');

/**
 * Format a time string "HH:MM" for display
 */
const formatTime = (timeStr) => {
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
};

/**
 * Check if two time ranges overlap
 */
const timesOverlap = (start1, end1, start2, end2) => {
  const toMinutes = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);
  return s1 < e2 && s2 < e1;
};

/**
 * Parse "HH:MM" time string into minutes from midnight
 */
const timeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Add minutes to a "HH:MM" time string
 */
const addMinutesToTime = (timeStr, minutesToAdd) => {
  const total = timeToMinutes(timeStr) + minutesToAdd;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Get available 30-minute slots in working hours (08:00 - 17:00)
 */
const generateAvailableSlots = (existingAppointments, date) => {
  const slots = [];
  const workStart = 8 * 60;   // 08:00
  const workEnd = 17 * 60;    // 17:00
  const slotDuration = 30;

  for (let start = workStart; start + slotDuration <= workEnd; start += slotDuration) {
    const end = start + slotDuration;
    const startStr = `${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`;
    const endStr = `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`;

    const hasConflict = existingAppointments.some((appt) =>
      timesOverlap(startStr, endStr, appt.startTime, appt.endTime)
    );

    if (!hasConflict) {
      slots.push({ startTime: startStr, endTime: endStr });
    }
  }
  return slots;
};

module.exports = { formatDate, formatTime, timesOverlap, timeToMinutes, addMinutesToTime, generateAvailableSlots };
