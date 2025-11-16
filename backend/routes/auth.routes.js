// Authentication Routes
const router = require('express').Router();

module.exports = (authController) => {
    router.post('/register', authController.register.bind(authController));
    router.post('/login', authController.login.bind(authController));
    
    return router;
};
