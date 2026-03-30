/**
 * adminController.js
 * Handles admin-only operations: managing suggestions and users.
 * All endpoints check that the logged-in user has the 'admin' role.
 * Authors: Karen Ferreira Magalhaes, Nataly Fonseca Mendes, Percy Focazio-Moran, Rafiq Abudulai
 */

import User from '../models/User.js';
import Holiday from '../models/Holiday.js';
import Suggestion from '../models/Suggestion.js';

// Helper: Check the session user is an admin
export const isAdmin = (req, res) => {
  if (!req.session.user) {
    res.status(401).json({ message: 'You must be logged in.' });
    return false;
  }
  if (req.session.user.role !== 'admin') {
    res.status(403).json({ message: 'Access denied. Admins only.' });
    return false;
  }
  return true;
};


// GET /admin/suggestions — Get all suggestions 
export const getSuggestions = async (req, res) => {
  if (!isAdmin(req, res)) return;

  try {
    const { status } = req.query;
    const filter = {};

    // Filter by status: pending, approved, rejected
    if (status) {
      const validStatuses = ['pending', 'approved', 'rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}.`
        });
      }
      filter.status = status;
    }

    const suggestions = await Suggestion.find(filter)
      .populate('submittedBy', 'firstName lastName email') // Show who submitted
      .sort({ createdAt: -1 }); // Newest first

    return res.status(200).json({
      message: 'Suggestions retrieved successfully.',
      count: suggestions.length,
      suggestions
    });
  } catch (error) {
    console.error('getSuggestions error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /admin/suggestion/:suggestionId/approve — Approve a suggestion
// Approved suggestions are written into the holidays collection
export const approveSuggestion = async (req, res) => {
  if (!isAdmin(req, res)) return;

  try {
    const suggestion = await Suggestion.findById(req.params.suggestionId);

    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found.' });
    }

    if (suggestion.status !== 'pending') {
      return res.status(400).json({
        message: `Suggestion has already been ${suggestion.status}.`
      });
    }

    // Mark suggestion as approved
    suggestion.status = 'approved';
    await suggestion.save();

    // Write the approved suggestion into the holidays collection
    const newHoliday = new Holiday({
      name: suggestion.name,
      country: suggestion.country,
      date: suggestion.date,
      month: new Date(suggestion.date).getMonth() + 1,
      category: suggestion.category || 'Other',
      description: suggestion.description || ''
    });

    await newHoliday.save();

    return res.status(200).json({
      message: 'Suggestion approved and added to holidays.',
      suggestion,
      holiday: newHoliday
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid suggestion ID.' });
    }
    console.error('approveSuggestion error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /admin/suggestion/:suggestionId/reject — Reject a suggestion
export const rejectSuggestion = async (req, res) => {
  if (!isAdmin(req, res)) return;

  try {
    const suggestion = await Suggestion.findById(req.params.suggestionId);

    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found.' });
    }

    if (suggestion.status !== 'pending') {
      return res.status(400).json({
        message: `Suggestion has already been ${suggestion.status}.`
      });
    }

    suggestion.status = 'rejected';
    await suggestion.save();

    return res.status(200).json({
      message: 'Suggestion rejected.',
      suggestion
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid suggestion ID.' });
    }
    console.error('rejectSuggestion error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /admin/suggestion/:suggestionId — Delete a suggestion
export const deleteSuggestion = async (req, res) => {
  if (!isAdmin(req, res)) return;

  try {
    const deleted = await Suggestion.findByIdAndDelete(req.params.suggestionId);

    if (!deleted) {
      return res.status(404).json({ message: 'Suggestion not found.' });
    }

    return res.status(200).json({ message: 'Suggestion deleted successfully.' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid suggestion ID.' });
    }
    console.error('deleteSuggestion error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// GET /admin/users — Get all users
export const getAllUsers = async (req, res) => {
  if (!isAdmin(req, res)) return;

  try {
    const users = await User.find({}).select('-passwordHash').sort({ createdAt: -1 });

    return res.status(200).json({
      message: 'Users retrieved successfully.',
      count: users.length,
      users
    });
  } catch (error) {
    console.error('getAllUsers error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /admin/user/:userId — Delete a user
export const deleteUser = async (req, res) => {
  if (!isAdmin(req, res)) return;

  try {
    // Prevent admin from deleting their own account
    if (req.session.user.id.toString() === req.params.userId) {
      return res.status(400).json({ message: 'You cannot delete your own admin account.' });
    }

    const deleted = await User.findByIdAndDelete(req.params.userId);

    if (!deleted) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }
    console.error('deleteUser error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /admin/user/:userId/role — Promote or demote a user's role
export const updateUserRole = async (req, res) => {
  if (!isAdmin(req, res)) return;

  const { role } = req.body;
  const validRoles = ['user', 'admin'];

  // Server-side validation
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({
      message: `Invalid role. Must be one of: ${validRoles.join(', ')}.`
    });
  }

  try {
    const updated = await User.findByIdAndUpdate(
      req.params.userId,
      { role },
      { new: true }
    ).select('-passwordHash');

    if (!updated) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({
      message: `User role updated to '${role}'.`,
      user: updated
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }
    console.error('updateUserRole error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};