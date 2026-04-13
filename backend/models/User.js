// ============================================================
// models/User.js - Mongoose schema for registered users
// ============================================================
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // Display name shown in the app
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters']
    },

    // Must be unique across all users
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },

    // Stored as a bcrypt hash — never store plain-text passwords
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    }
  },
  {
    // Automatically adds createdAt and updatedAt timestamps
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);
