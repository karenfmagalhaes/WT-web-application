 /**
 * Suggestion.js
 * Mongoose model for community-submitted holiday suggestions.
 * Authors: Karen Ferreira Magalhaes, Nataly Fonseca Mendes, Percy Focazio-Moran, Rafiq Abudulai
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

const SuggestionSchema = new Schema({
  submittedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Submitter is required.']
  },
  name: {
    type: String,
    required: [true, 'Holiday name is required.'],
    trim: true
  },
  country: {
    type: String,
    required: [true, 'Country is required.'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required.']
  },
  category: {
    type: String,
    enum: {
      values: ['Public', 'Religious', 'Cultural', 'National', 'Other', 'Seasonal', 'International', 'Unknown'],
      message: '{VALUE} is not a valid category.'
    },
    default: 'Other'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description must be 500 characters or fewer.']
  },
  // Optional reference link provided by the user as evidence
  referenceLink: {
    type: String,
    trim: true
  },
  // Admin reviews the suggestion and sets the status
  status: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'rejected'],
      message: '{VALUE} is not a valid status.'
    },
    default: 'pending'
  }
}, { timestamps: true });

// Index for fast admin filtering by status
SuggestionSchema.index({ status: 1 });

// Index for looking up suggestions by user
SuggestionSchema.index({ submittedBy: 1 });

export default mongoose.model('Suggestion', SuggestionSchema);