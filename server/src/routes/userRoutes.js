const router = require('express').Router();
const c = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(authenticate);

// Public to authenticated users
router.get('/leaders', c.getLeaders);
router.put('/profile', c.updateProfile);

// Admin only
router.get('/', authorize('ADMIN'), c.getAll);
router.get('/:id', authorize('ADMIN', 'SECRETARY'), c.getOne);
router.put('/:id/toggle-active', authorize('ADMIN'), c.toggleActive);

module.exports = router;
