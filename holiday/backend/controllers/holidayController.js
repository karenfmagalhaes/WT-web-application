/**
 * holidayController.js
 * Handles CRUD operations for holidays, including filtering and search.
 * Authors: Karen Ferreira Magalhaes, Nataly Fonseca Mendes, Percy Focazio-Moran, Rafiq Abudulai
 */

import Holiday from "../models/Holiday.js";

// Valid category values for holidays
const VALID_CATEGORIES = [
  "Public", "Religious", "Cultural", "National",
  "Other", "All", "None", "Unknown", "Seasonal", "International"
];

// Helper: Server-side validation for a holiday
const validateHolidayInput = (data) => {
  const errors = {};

  if (!data.name || data.name.trim().length === 0) {
    errors.name = "Holiday name is required.";
  }

  if (!data.country || data.country.trim().length === 0) {
    errors.country = "Country is required.";
  }

  if (!data.date) {
    errors.date = "Date is required.";
  } else if (isNaN(new Date(data.date).getTime())) {
    errors.date = "Date must be a valid date.";
  }

  if (!data.month) {
    errors.month = "Month is required.";
  } else {
    const monthNum = Number(data.month);
    if (!Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) {
      errors.month = "Month must be a number between 1 and 12.";
    }
  }

  if (!data.category) {
    errors.category = "Category is required.";
  } else if (!VALID_CATEGORIES.includes(data.category)) {
    errors.category = `Category must be one of: ${VALID_CATEGORIES.join(", ")}.`;
  }

  if (data.description && data.description.length > 500) {
    errors.description = "Description must be 500 characters or fewer.";
  }

  return errors;
};

// GET /holidays — Get all holidays with optional filters
export const getHolidays = async (req, res, next) => {
  try {
    const { country, month, category, search } = req.query;
    const filter = {};

    // Filter by country (case-insensitive exact match)
    if (country) {
      filter.country = new RegExp(`^${country.trim()}$`, "i");
    }

    // Filter by month
    if (month) {
      const monthNum = Number(month);
      if (!Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ message: "Month must be a number between 1 and 12." });
      }
      filter.month = monthNum;
    }

    // Filter by category
    if (category) {
      if (!VALID_CATEGORIES.includes(category.trim())) {
        return res.status(400).json({
          message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}.`,
        });
      }
      filter.category = category.trim();
    }

    // Search by holiday name (partial, case-insensitive)
    if (search) {
      filter.name = { $regex: search.trim(), $options: "i" };
    }

    const holidays = await Holiday.find(filter).sort({ month: 1, date: 1, name: 1 });

    return res.status(200).json({
      message: "Holidays retrieved successfully.",
      count: holidays.length,
      holidays,
    });
  } catch (error) {
    next(error);
  }
};

// GET /holiday/:holidayId — Get a single holiday by ID
export const getHolidayById = async (req, res, next) => {
  try {
    const holiday = await Holiday.findById(req.params.holidayId);

    if (!holiday) {
      return res.status(404).json({ message: "Holiday not found." });
    }

    return res.status(200).json({ message: "Holiday retrieved successfully.", holiday });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid holiday ID." });
    }
    next(error);
  }
};

// POST /holidays — Add a new holiday (admin only)
export const addHoliday = async (req, res, next) => {
  try {
    // Server-side validation
    const errors = validateHolidayInput(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Validation failed.", errors });
    }

    const { name, country, date, month, category, description } = req.body;

    const newHoliday = new Holiday({
      name: name.trim(),
      country: country.trim(),
      date: new Date(date),
      month: Number(month),
      category,
      description: description ? description.trim() : undefined,
    });

    const saved = await newHoliday.save();

    return res.status(201).json({
      message: "Holiday added successfully.",
      holiday: saved,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /holiday/:holidayId — Update an existing holiday (admin only)
export const updateHoliday = async (req, res, next) => {
  try {
    // Validate only the fields that are provided
    const errors = validateHolidayInput({ ...req.body, _partial: true });

    // For updates, only flag errors on fields actually sent
    const filteredErrors = Object.fromEntries(
      Object.entries(errors).filter(([key]) => req.body[key] !== undefined)
    );

    if (Object.keys(filteredErrors).length > 0) {
      return res.status(400).json({ message: "Validation failed.", errors: filteredErrors });
    }

    const updateData = {};
    if (req.body.name) updateData.name = req.body.name.trim();
    if (req.body.country) updateData.country = req.body.country.trim();
    if (req.body.date) updateData.date = new Date(req.body.date);
    if (req.body.month) updateData.month = Number(req.body.month);
    if (req.body.category) updateData.category = req.body.category;
    if (req.body.description !== undefined) updateData.description = req.body.description.trim();

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid fields provided for update." });
    }

    const updated = await Holiday.findByIdAndUpdate(
      req.params.holidayId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Holiday not found." });
    }

    return res.status(200).json({ message: "Holiday updated successfully.", holiday: updated });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid holiday ID." });
    }
    next(error);
  }
};

// DELETE /holiday/:holidayId — Remove a holiday (admin only)
export const deleteHoliday = async (req, res, next) => {
  try {
    const deleted = await Holiday.findByIdAndDelete(req.params.holidayId);

    if (!deleted) {
      return res.status(404).json({ message: "Holiday not found." });
    }

    return res.status(200).json({ message: "Holiday deleted successfully." });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid holiday ID." });
    }
    next(error);
  }
};