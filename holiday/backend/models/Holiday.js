import mongoose from 'mongoose';

const { Schema } = mongoose;

export const HolidaySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  country: {
    type: String,
    required: true,
    trim: true,
  },
  date: { 
    type: Date,
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  category: {
    type: String,
    required: true,
    enum: ["Public", "Religious", "Cultural", "National", "Other", "All", "None", "Unknown", "Seasonal", "International"]
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, { timestamps: true });

export default mongoose.model('Holiday', HolidaySchema);

