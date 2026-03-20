import mongoose from "mongoose";
import { HolidaySchema } from "../models/Holiday.js";

const Holiday = mongoose.model("Holiday", HolidaySchema);

export const getHolidays = async (req, res, next) => {
  try {
    const { country, month, category, search } = req.query;
    const filter = {};

    // Filter by country
    if (country) {
      filter.country = new RegExp(`^${country.trim()}$`, "i");
    }

    // Filter by month
    if (month) {
      filter.month = Number(month);
    }

    // Filter by category
    if (category) {
      filter.category = category.trim();
    }

    // Search by holiday name
    if (search) {
      filter.name = { $regex: search.trim(), $options: "i" };
    }

    const holidays = await Holiday.find(filter).sort({
      month: 1,
      date: 1,
      name: 1,
    });

    return res.status(200).json({
      message: "Holidays retrieved successfully.",
      count: holidays.length,
      holidays,
    });
  } catch (error) {
    next(error);
  }
};

//Get a single holiday by its ID

export const getHolidayById = async (req, res, next) => {
  try {
    const { holidayId } = req.params;

    const holiday = await Holiday.findById(holidayId);

    if (!holiday) {
      return res.status(404).json({
        message: "Holiday not found.",
      });
    }

    return res.status(200).json({
      message: "Holiday retrieved successfully.",
      holiday,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid holiday ID.",
      });
    }

    next(error);
  }
};
