// ============================================================
// routes/noteRoutes.js
// All note routes are protected by the JWT middleware.
// ============================================================
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getNotes,
  createNote,
  deleteNote,
  getNoteById
} = require('../controllers/noteController');

// Apply 'protect' middleware to every route in this file
router.use(protect);

// GET  /api/notes        →  Fetch all notes for the logged-in user
router.get('/', getNotes);

// POST /api/notes        →  Create a new note
router.post('/', createNote);

// GET  /api/notes/:id    →  Open a single note by ID
router.get('/:id', getNoteById);

// DELETE /api/notes/:id  →  Delete a specific note
router.delete('/:id', deleteNote);

module.exports = router;
