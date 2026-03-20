/**
 * Favourite.js
 * Mongoose model for a user's saved (favourite) holidays.
 * Authors: Karen Ferreira Magalhaes, Nataly Fonseca Mendes, Percy Focazio-Moran, Rafiq Abudulai
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

const FavouriteSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required.']
  },
  holiday: {
    type: Schema.Types.ObjectId,
    ref: 'Holiday',
    required: [true, 'Holiday is required.']
  }
}, { timestamps: true });

// Prevent a user from saving the same holiday more than once
FavouriteSchema.index({ user: 1, holiday: 1 }, { unique: true });

export default mongoose.model('Favourite', FavouriteSchema);