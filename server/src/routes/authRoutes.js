const router = require('express').Router();
const c = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { registerValidator, loginValidator, changePasswordValidator } = require('../validators/authValidator');

router.post('/register', registerValidator, validate, c.register);
router.post('/login', loginValidator, validate, c.login);
router.post('/logout', authenticate, c.logout);
router.get('/me', authenticate, c.getMe);
router.put('/change-password', authenticate, changePasswordValidator, validate, c.changePassword);
router.put('/fcm-token', authenticate, c.updateFcmToken);

module.exports = router;
