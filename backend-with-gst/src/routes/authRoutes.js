const express = require('express');
const { register, login, logout, isAuthenticated } = require('../controllers/authController');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new teacher
// @access  Public
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Login teacher
// @access  Public
router.post('/login', login);

// @route   POST /api/auth/logout
// @desc    Logout teacher
// @access  Private
router.post('/logout', logout);


// @route   GET /api/auth/authenticate
// @desc    Authenticate token and return client info (alias of isAuthenticated)
// @access  Public
router.get('/authenticate', isAuthenticated);

module.exports = router;