const router = require('express').Router();
const c = require('../controllers/calendarController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', c.getMonthly);
router.get('/day', c.getDay);

module.exports = router;
