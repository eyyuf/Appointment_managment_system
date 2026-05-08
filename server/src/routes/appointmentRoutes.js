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

// ─── Student Routes ────────────────────────────────────────
// Students submit requests — NO direct leader selection
router.get('/departments', c.getDepartments);
router.post('/',
  authorize('STUDENT'),   // ONLY students can submit
  createAppointmentValidator, validate, c.create);

// ─── Read ─────────────────────────────────────────────────
router.get('/', c.getAll);
router.get('/slots/:leaderId', c.availableSlots);
router.get('/:id', c.getOne);

// ─── Secretary Workflow (MANDATORY GATEWAY) ──────────────
// Step 2A: Secretary picks up and marks under review
router.post('/:id/review',
  authorize('SECRETARY'), c.markUnderReview);

// Step 2B: Secretary forwards to a specific leader
router.post('/:id/forward',
  authorize('SECRETARY'), c.secretaryForward);

// Secretary can also reject at review stage
router.post('/:id/reject',
  authorize('SECRETARY', 'DEPARTMENT_HEAD', 'DEAN', 'VICE_PRESIDENT', 'PRESIDENT', 'ADMIN'),
  c.reject);

// ─── Leadership Actions (only on FORWARDED appointments) ──
router.post('/:id/approve',
  authorize('DEPARTMENT_HEAD', 'DEAN', 'VICE_PRESIDENT', 'PRESIDENT', 'ADMIN'),
  c.leaderApprove);

// ─── Common Actions ────────────────────────────────────────
router.post('/:id/cancel',
  cancelAppointmentValidator, validate, c.cancel);

router.post('/:id/reschedule',
  rescheduleValidator, validate, c.reschedule);

module.exports = router;
