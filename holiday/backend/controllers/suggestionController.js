 /**
 * suggestionController.js
 * Allows logged-in users to submit holiday suggestions and view their own.
 * Authors: Karen Ferreira Magalhaes, Nataly Fonseca Mendes, Percy Focazio-Moran, Rafiq Abudulai
 */

import Suggestion from '../models/Suggestion.js';

// Helper: Server-side validation for a suggestion
const validateSuggestionInput = (data) => {
  const errors = {};

  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Holiday name is required.';
  }

  if (!data.country || data.country.trim().length === 0) {
    errors.country = 'Country is required.';
  }

  if (!data.date) {
    errors.date = 'Date is required.';
  } else if (isNaN(new Date(data.date).getTime())) {
    errors.date = 'Date must be a valid date.';
  }

  if (data.description && data.description.length > 500) {
    errors.description = 'Description must be 500 characters or fewer.';
  }

  return errors;
};

// GET /suggestions — Get all suggestions submitted by the logged-in user
export const getMySuggestions = async (req, res) => {
  // Check session — user must be logged in
  if (!req.session.user) {
    return res.status(401).json({ message: 'You must be logged in to view your suggestions.' });
  }

  try {
    const suggestions = await Suggestion.find({ submittedBy: req.session.user.id })
      .sort({ createdAt: -1 }); // Most recently submitted first

    return res.status(200).json({
      message: 'Suggestions retrieved successfully.',
      count: suggestions.length,
      suggestions
    });
  } catch (error) {
    console.error('getMySuggestions error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// POST /suggestions — Submit a new holiday suggestion
export const addSuggestion = async (req, res) => {
  // Check session — user must be logged in
  if (!req.session.user) {
    return res.status(401).json({ message: 'You must be logged in to submit a suggestion.' });
  }

  // Server-side validation
  const errors = validateSuggestionInput(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  try {
    const { name, country, date, category, description, referenceLink } = req.body;

    const newSuggestion = new Suggestion({
      submittedBy: req.session.user.id,
      name: name.trim(),
      country: country.trim(),
      date: new Date(date),
      category: category || 'Other',
      description: description ? description.trim() : undefined,
      referenceLink: referenceLink ? referenceLink.trim() : undefined,
      status: 'pending' // Always starts as pending
    });

    const saved = await newSuggestion.save();

    return res.status(201).json({
      message: 'Suggestion submitted successfully. It will be reviewed by an admin.',
      suggestion: saved
    });
  } catch (error) {
    console.error('addSuggestion error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /suggestion/:suggestionId — Delete own pending suggestion
export const deleteSuggestion = async (req, res) => {
  // Check session — user must be logged in
  if (!req.session.user) {
    return res.status(401).json({ message: 'You must be logged in to delete a suggestion.' });
  }

  try {
    const suggestion = await Suggestion.findOne({
      _id: req.params.suggestionId,
      submittedBy: req.session.user.id // Users can only delete their own
    });

    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found.' });
    }

    // Only allow deletion if still pending
    if (suggestion.status !== 'pending') {
      return res.status(400).json({
        message: `Cannot delete a suggestion that has already been ${suggestion.status}.`
      });
    }

    await suggestion.deleteOne();

    return res.status(200).json({ message: 'Suggestion deleted successfully.' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid suggestion ID.' });
    }
    console.error('deleteSuggestion error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};