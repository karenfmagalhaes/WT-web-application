/**
 * User.js
 * Mongoose model for registered users.
 * Authors: Karen Ferreira Magalhaes, Nataly Fonseca Mendes, Percy Focazio-Moran, Rafiq Abudulai
 */
import mongoose from 'mongoose';

const { Schema } = mongoose;

export const UserSchema = new Schema({
  firstName: {
    type: String,
    required: [true, "First name is required." ],
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: [true, "Last name is required." ],
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: [true, "Email is required." ],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address.']
  },
  phone: {
    type: String,
    trim: true,
    unique: true,
    match: [/^\+?[\d\s\-().]{7,20}$/, 'Please provide a valid phone number.']
  },
  role: {
  type: String,
  enum: ['user', 'admin'],
  default: 'user'
  },
  passwordHash: {
    type: String,
    required: true
  },
  preferredCountry: {
    type: String,
    trim: true,
    default: "Ireland"
  },
  preferredMonth: {
    type: Number,
    min: 1,
    max: 12,
    default: 1
  }
}, { timestamps: true });

export default mongoose.model('User', UserSchema);