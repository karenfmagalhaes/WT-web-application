/**
 * index.js
 * Main entry point for the Holiday Calendar backend server.
 * Authors: Karen Ferreira Magalhaes, Nataly Fonseca Mendes, Percy Focazio-Moran, Rafiq Abudulai
 */
import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";
import routes from "./routes/authRoutes.js";
import holidayRoutes from "./routes/holidayRoutes.js";
import favouriteRoutes from "./routes/favouriteRoutes.js";
import suggestionRoutes from "./routes/suggestionRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();
const PORT = 4000;

// mongo connection
mongoose.Promise = global.Promise;
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/holidaysDB") //to make it not hardcoded
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// cors
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
); //this just closes it so not all origins are allwoed
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "change-this-to-a-real-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

routes(app);
holidayRoutes(app);
favouriteRoutes(app);
suggestionRoutes(app);
adminRoutes(app);

app.get("/", (req, res) => res.send(`Application is running on port ${PORT}`));

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong" });
});
//this is just to catch and announce errors
