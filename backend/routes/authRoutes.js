// ============================================================
// routes/authRoutes.js
// Maps HTTP methods + paths to auth controller functions.
// ============================================================
const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// POST /api/auth/register  →  Create a new user account
router.post('/register', register);

// POST /api/auth/login     →  Authenticate and return a JWT
router.post('/login', login);

module.exports = router;
