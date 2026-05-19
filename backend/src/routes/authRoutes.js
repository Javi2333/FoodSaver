const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rutas públicas (no requieren autenticación)
router.post('/register', authController.registerValidation, authController.register);
router.post('/login', authController.loginValidation, authController.login);

// Rutas protegidas (requieren autenticación)
router.get('/me', authMiddleware, authController.getMe);
router.put('/profile', authMiddleware, authController.updateProfileValidation, authController.updateProfile);
router.put('/password', authMiddleware, authController.changePasswordValidation, authController.changePassword);

module.exports = router;
