/**
 * favouriteController.js
 * Handles saving, retrieving, and removing a user's favourite holidays.
 * Authors: Karen Ferreira Magalhaes, Nataly Fonseca Mendes, Percy Focazio-Moran, Rafiq Abudulai
 */

import Favourite from '../models/Favourite.js';
import Holiday from '../models/Holiday.js';

// GET /saved-holidays — Get all saved holidays for the logged-in user
export const getSavedHolidays = async (req, res) => {
  // Check session — user must be logged in
  if (!req.session.user) {
    return res.status(401).json({ message: 'You must be logged in to view your saved holidays.' });
  }

  try {
    const favourites = await Favourite.find({ user: req.session.user.id })
      .populate('holiday') // Fetch full holiday details
      .sort({ createdAt: -1 }); // Most recently saved first

    return res.status(200).json({
      message: 'Saved holidays retrieved successfully.',
      count: favourites.length,
      savedHolidays: favourites
    });
  } catch (error) {
    console.error('getSavedHolidays error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// POST /saved-holidays — Save a holiday to favourites
export const addSavedHoliday = async (req, res) => {
  // Check session — user must be logged in
  if (!req.session.user) {
    return res.status(401).json({ message: 'You must be logged in to save a holiday.' });
  }

  // Server-side validation
  const { holidayId } = req.body;

  if (!holidayId) {
    return res.status(400).json({ message: 'Validation failed.', errors: { holidayId: 'Holiday ID is required.' } });
  }

  try {
    // Check the holiday actually exists
    const holidayExists = await Holiday.findById(holidayId);
    if (!holidayExists) {
      return res.status(404).json({ message: 'Holiday not found.' });
    }

    // Save the holiday for the current user
    const saved = await Favourite.create({
      user: req.session.user.id,
      holiday: holidayId
    });

    // Populate holiday details before returning
    await saved.populate('holiday');

    return res.status(201).json({
      message: 'Holiday saved to favourites.',
      savedHoliday: saved
    });
  } catch (error) {
    // Duplicate key error — holiday already saved
    if (error.code === 11000) {
      return res.status(409).json({ message: 'This holiday is already in your favourites.' });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid holiday ID.' });
    }
    console.error('addSavedHoliday error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /saved-holiday/:savedId — Remove a holiday from favourites
export const deleteSavedHoliday = async (req, res) => {
  // Check session — user must be logged in
  if (!req.session.user) {
    return res.status(401).json({ message: 'You must be logged in to remove a saved holiday.' });
  }

  try {
    // Only delete if it belongs to the current user
    const deleted = await Favourite.findOneAndDelete({
      _id: req.params.savedId,
      user: req.session.user.id
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Saved holiday not found.' });
    }

    return res.status(200).json({ message: 'Holiday removed from favourites.' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid saved holiday ID.' });
    }
    console.error('deleteSavedHoliday error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};