import mongoose from 'mongoose';

const { Schema } = mongoose;

export const UserSchema = new Schema({
    firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: Number,
    trim: true,
    unique: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  preferredCountry: {
    type: String,
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