/**
 * authController.js
 * Handles user registration, login, logout, and CRUD operations.
 * Authors: Karen Ferreira Magalhaes, Nataly Fonseca Mendes, Percy Focazio-Moran, Rafiq Abudulai
 */
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";


// Helper: Server-side validation for registration
const validateRegisterInput = (data) => {
  const errors = {};

  // First name validation
  if (!data.firstName || data.firstName.trim().length < 2) {
    errors.firstName = "First name must be at least 2 characters.";
  }

  // Last name validation
  if (!data.lastName || data.lastName.trim().length < 2) {
    errors.lastName = "Last name must be at least 2 characters.";
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    errors.email = "A valid email address is required.";
  }

  // Password validation
  if (!data.password || data.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  return errors;
};

// Helper: Server-side validation for login
const validateLoginInput = (data) => {
  const errors = {};

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    errors.email = "A valid email address is required.";
  }

  if (!data.password) {
    errors.password = "Password is required.";
  }

  return errors;
};

// POST /register — Create a new user account
export const registerUser = async (req, res) => {
  try {
    // Server-side validation
    const errors = validateRegisterInput(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Validation failed.", errors });
    }

    const { firstName, lastName, email, password, phone, preferredCountry, preferredMonth } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    // Hash password before saving
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create and save the new user
    const newUser = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      phone: phone || undefined,
      preferredCountry: preferredCountry || "Ireland",
      preferredMonth: preferredMonth || 1,
    });

    const savedUser = await newUser.save();

    // Store user info in session after registration (auto-login)
    req.session.user = {
      id: savedUser._id,
      email: savedUser.email,
      firstName: savedUser.firstName,
    };

    // Set a cookie to track the user's preferred country (client-side state)
    res.cookie("preferredCountry", savedUser.preferredCountry, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: false, // readable by frontend JS
    });

    // Return user without the password hash
    const { passwordHash: _, ...userToReturn } = savedUser.toObject();
    return res.status(201).json({
      message: "Account created successfully.",
      user: userToReturn,
    });
  } catch (error) {
    console.error("registerUser error:", error);
    return res.status(500).json({ message: "Server error during registration." });
  }
};

// POST /login — Authenticate an existing user
export const loginUser = async (req, res) => {
  try {
    // Server-side validation
    const errors = validateLoginInput(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Validation failed.", errors });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Compare provided password with stored hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Create session for the authenticated user
    req.session.user = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
    };

    // Set a cookie with the user's preferred country preference
    res.cookie("preferredCountry", user.preferredCountry, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: false,
    });

    // Set a cookie recording last login timestamp
    res.cookie("lastLogin", new Date().toISOString(), {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: false,
    });

    return res.status(200).json({
      message: "Login successful.",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        preferredCountry: user.preferredCountry,
        preferredMonth: user.preferredMonth,
      },
    });
  } catch (error) {
    console.error("loginUser error:", error);
    return res.status(500).json({ message: "Server error during login." });
  }
};

// POST /logout — Destroy session and clear cookies
export const logoutUser = (req, res) => {
  // Destroy the server-side session
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Could not log out. Please try again." });
    }

    // Clear the preference cookies on logout
    res.clearCookie("preferredCountry");
    res.clearCookie("lastLogin");

    return res.status(200).json({ message: "Logged out successfully." });
  });
};


// GET /session — Check if user is logged in
export const getSession = (req, res) => {
  if (req.session && req.session.user) {
    return res.status(200).json({ loggedIn: true, user: req.session.user });
  }
  return res.status(200).json({ loggedIn: false });
};

// GET /users — Get all users (admin use)
export const getUsers = async (req, res) => {
  try {
    // Exclude password hashes from the response
    const users = await User.find({}).select("-passwordHash");
    return res.status(200).json({ message: "Users retrieved.", count: users.length, users });
  } catch (error) {
    console.error("getUsers error:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

// GET /user/:userId — Get a specific user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ user });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user ID." });
    }
    return res.status(500).json({ message: "Server error." });
  }
};

// PUT /user/:userId — Update a user's profile
export const updateUser = async (req, res) => {
  try {
    const { firstName, lastName, phone, preferredCountry, preferredMonth } = req.body;

    // Build update object with only allowed fields (prevent overwriting passwordHash etc.)
    const updateData = {};
    if (firstName && firstName.trim().length >= 2) updateData.firstName = firstName.trim();
    if (lastName && lastName.trim().length >= 2) updateData.lastName = lastName.trim();
    if (phone) updateData.phone = phone;
    if (preferredCountry) updateData.preferredCountry = preferredCountry;
    if (preferredMonth && preferredMonth >= 1 && preferredMonth <= 12) {
      updateData.preferredMonth = preferredMonth;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid fields provided for update." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // Update the preference cookie if country changed
    if (preferredCountry) {
      res.cookie("preferredCountry", preferredCountry, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: false,
      });
    }

    return res.status(200).json({ message: "User updated successfully.", user: updatedUser });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user ID." });
    }
    return res.status(500).json({ message: "Server error." });
  }
};

// DELETE /user/:userId — Delete a user account
export const deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.userId);

    if (!deleted) {
      return res.status(404).json({ message: "User not found." });
    }

    // If the deleted user is the current session user, destroy the session
    if (req.session.user && req.session.user.id.toString() === req.params.userId) {
      req.session.destroy();
      res.clearCookie("preferredCountry");
      res.clearCookie("lastLogin");
    }

    return res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user ID." });
    }
    return res.status(500).json({ message: "Server error." });
  }
};