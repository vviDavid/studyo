const router = require('express').Router();

const AuthController = require('../controllers/authController');

const { isNotAuthenticated } = require('../middlewares/authMiddleware');

router.get('/login', isNotAuthenticated, AuthController.showLoginPage);

router.get('/forget-pass', isNotAuthenticated, AuthController.showForgetPassPage);

router.get('/reset-pass', isNotAuthenticated, AuthController.showResetPassPage);

router.get('/logout', AuthController.handleLogout);

router.post('/login', isNotAuthenticated, AuthController.handleLogin);

router.post('/forget-pass', isNotAuthenticated, AuthController.handleForgetPass);

router.post('/reset-pass', isNotAuthenticated, AuthController.handleResetPass);

module.exports = router;