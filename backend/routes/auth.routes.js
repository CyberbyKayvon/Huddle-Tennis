// Authentication Routes
const router = require('express').Router();
const authController = require('../controllers/AuthController');

// Public routes
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));

// Protected routes (require authentication)
router.get('/me', authController.verifyToken.bind(authController), authController.getCurrentUser.bind(authController));

module.exports = router;
