// ============================================================
// models/Note.js - Mongoose schema for user notes
// ============================================================
const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    // Short descriptive title for the note
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },

    // Main body text of the note
    content: {
      type: String,
      required: [true, 'Note content is required'],
      trim: true
    },

    // Reference to the User who owns this note
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    // createdAt is used to display when the note was made
    timestamps: true
  }
);

module.exports = mongoose.model('Note', noteSchema);
