/**
 * Holiday.js
 * Mongoose model for international holidays.
 * Authors: Karen Ferreira Magalhaes, Nataly Fonseca Mendes, Percy Focazio-Moran, Rafiq Abudulai
 */
import mongoose from 'mongoose';

const { Schema } = mongoose;

export const HolidaySchema = new Schema({
  name: {
    type: String,
    required: [true, "Holiday name is required."],
    trim: true,
  },
  country: {
    type: String,
    required: [true, "Country is required."],
    trim: true,
  },
  date: { 
    type: Date,
    required: [true, "Date is required."]
  },
  month: {
    type: Number,
    required: [true, "Month is required."],
    min: 1,
    max: 12
  },
  category: {
    type: String,
    required: [true, "Category is required."],
    enum: {
      values: ['Public', 'Religious', 'Cultural', 'National', 'Other', 'All', 'None', 'Unknown', 'Seasonal', 'International'],
      message: '{VALUE} is not a valid category.'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, "Description cannot exceed 500 characters."]
  }
}, { timestamps: true });

// Indexes.These speed up the most common filter queries on /holidays
 
// Single-field indexes for individual filters
HolidaySchema.index({ country: 1 });
HolidaySchema.index({ month: 1 });
HolidaySchema.index({ category: 1 });
 
// Compound index for the common combined query (country + month)
HolidaySchema.index({ country: 1, month: 1 });
 
// Text index to support the name search (?search=...)
HolidaySchema.index({ name: 'text' });
 
// Pre-save hook. Keep `month` in sync with `date`.
HolidaySchema.pre('save', function () {
  if (this.isModified('date') && this.date) {
    this.month = this.date.getMonth() + 1; // getMonth() is 0-indexed
  }
});
  
export default mongoose.model('Holiday', HolidaySchema);

