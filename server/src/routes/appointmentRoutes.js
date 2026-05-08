const router = require('express').Router();
const c = require('../controllers/appointmentController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const {
  createAppointmentValidator,
  cancelAppointmentValidator,
  rescheduleValidator,
} = require('../validators/appointmentValidator');

// All routes require authentication
router.use(authenticate);

// Available time slots (public to authenticated users)
router.get('/slots/:leaderId', c.availableSlots);

// CRUD
router.get('/', c.getAll);
router.post('/', createAppointmentValidator, validate, c.create);
router.get('/:id', c.getOne);

// Workflow actions
router.post('/:id/secretary-approve',
  authorize('SECRETARY', 'ADMIN'), c.secretaryApprove);

router.post('/:id/approve',
  authorize('DEPARTMENT_HEAD', 'DEAN', 'VICE_PRESIDENT', 'PRESIDENT', 'ADMIN'), c.leaderApprove);

router.post('/:id/reject',
  authorize('SECRETARY', 'DEPARTMENT_HEAD', 'DEAN', 'VICE_PRESIDENT', 'PRESIDENT', 'ADMIN'), c.reject);

router.post('/:id/cancel',
  cancelAppointmentValidator, validate, c.cancel);

router.post('/:id/reschedule',
  rescheduleValidator, validate, c.reschedule);

module.exports = router;
