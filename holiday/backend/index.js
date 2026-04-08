/**
 * index.js
 * Main entry point for the Holiday Calendar backend server.
 * Sets up Express, MongoDB, session middleware, and all routes.
 * Authors: Karen Ferreira Magalhaes, Nataly Fonseca Mendes, Percy Focazio-Moran, Rafiq Abudulai
 */
import 'dotenv/config';
import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";

// Route imports
import authRoutes from "./routes/authRoutes.js";
import holidayRoutes from "./routes/holidayRoutes.js";
import favouriteRoutes from "./routes/favouriteRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import suggestionRoutes from "./routes/suggestionRoutes.js";

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/holidaysDB";

// MongoDB connection using URI from environment variable
mongoose.Promise = global.Promise;
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Body parser middleware — parse JSON and URL-encoded form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// CORS — allow the frontend dev server to send credentials (session cookies)
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true, // required so session cookies are sent cross-origin
}));

// Session middleware — sessions are stored in MongoDB via connect-mongo
app.use(session({
    secret: process.env.SESSION_SECRET || "holidayapp_dev_secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URI }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day in milliseconds
        httpOnly: true,
    }
}));

// Mount all route modules
authRoutes(app);
holidayRoutes(app);
favouriteRoutes(app);
adminRoutes(app);
suggestionRoutes(app);

app.get("/", (_req, res) => res.send(`Application is running on port ${PORT}`));

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
