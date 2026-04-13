// ============================================================
// controllers/noteController.js
// Handles Create, Read, and Delete operations for notes.
// All routes here are protected — req.user is set by middleware.
// ============================================================
const Note = require('../models/Note');

// ── GET /api/notes ───────────────────────────────────────────
// Returns all notes belonging to the logged-in user,
// sorted newest first.
const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id })
      .sort({ createdAt: -1 }); // Newest notes at top

    res.status(200).json(notes);
  } catch (err) {
    console.error('Get notes error:', err);
    res.status(500).json({ message: 'Failed to retrieve notes.' });
  }
};

// ── POST /api/notes ──────────────────────────────────────────
// Creates a new note and saves it to MongoDB.
const createNote = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }

    const note = await Note.create({
      title: title.trim(),
      content: content.trim(),
      userId: req.user.id  // Link note to the authenticated user
    });

    res.status(201).json({
      message: 'Note saved successfully!',
      note
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(' ') });
    }
    console.error('Create note error:', err);
    res.status(500).json({ message: 'Failed to save note.' });
  }
};

// ── DELETE /api/notes/:id ────────────────────────────────────
// Deletes a specific note. Only the owner can delete it.
const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    // Security check: ensure the note belongs to the requesting user
    if (note.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to delete this note.' });
    }

    await note.deleteOne();

    res.status(200).json({ message: 'Note deleted successfully.' });
  } catch (err) {
    console.error('Delete note error:', err);
    res.status(500).json({ message: 'Failed to delete note.' });
  }
};

// ── GET /api/notes/:id ───────────────────────────────────────
// Fetch a single note by ID (used by "Files" / open note feature)
const getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    if (note.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.status(200).json(note);
  } catch (err) {
    console.error('Get note by ID error:', err);
    res.status(500).json({ message: 'Failed to retrieve note.' });
  }
};

module.exports = { getNotes, createNote, deleteNote, getNoteById };
