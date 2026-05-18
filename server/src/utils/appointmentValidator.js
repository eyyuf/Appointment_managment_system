const { body, param } = require('express-validator');

const createAppointmentValidator = [
  body('targetDepartment')
    .trim()
    .notEmpty().withMessage('Target department/office is required')
    .isLength({ min: 2, max: 200 }).withMessage('Department name must be 2–200 characters'),

  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('reason')
    .trim()
    .notEmpty().withMessage('Reason for appointment is required')
    .isLength({ min: 10, max: 1000 }).withMessage('Reason must be 10–1000 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description too long'),

  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Date must be a valid ISO date (YYYY-MM-DD)')
    .custom((val) => {
      const d = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (d < today) throw new Error('Date cannot be in the past');
      return true;
    }),

  body('startTime')
    .notEmpty().withMessage('Start time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Start time must be HH:MM format'),

  body('endTime')
    .notEmpty().withMessage('End time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('End time must be HH:MM format')
    .custom((endTime, { req }) => {
      if (req.body.startTime && endTime <= req.body.startTime) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),

  body('location').optional().trim().isLength({ max: 200 }),
];

const updateAppointmentValidator = [
  param('id').isUUID().withMessage('Invalid appointment ID'),
  body('title').optional().trim().isLength({ min: 3, max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('location').optional().trim().isLength({ max: 200 }),
];

const cancelAppointmentValidator = [
  param('id').isUUID().withMessage('Invalid appointment ID'),
  body('cancellationReason')
    .trim()
    .notEmpty().withMessage('Cancellation reason is required')
    .isLength({ min: 5, max: 500 }).withMessage('Reason must be 5–500 characters'),
];

const rescheduleValidator = [
  param('id').isUUID().withMessage('Invalid appointment ID'),
  body('newDate')
    .notEmpty().withMessage('New date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('newStartTime')
    .notEmpty().withMessage('New start time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body('newEndTime')
    .notEmpty().withMessage('New end time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .custom((endTime, { req }) => {
      if (req.body.newStartTime && endTime <= req.body.newStartTime) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  body('reason')
    .trim()
    .notEmpty().withMessage('Reschedule reason is required')
    .isLength({ min: 5, max: 500 }),
];

module.exports = {
  createAppointmentValidator,
  updateAppointmentValidator,
  cancelAppointmentValidator,
  rescheduleValidator,
};