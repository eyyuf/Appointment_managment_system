const router = require('express').Router();
const c = require('../controllers/notificationController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', c.getAll);
router.put('/read-all', c.markAllRead);
router.put('/:id/read', c.markRead);
router.delete('/:id', c.remove);

module.exports = router;
