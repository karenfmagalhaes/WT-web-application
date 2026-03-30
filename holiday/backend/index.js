/**
 * index.js
 * Main entry point for the Holiday Calendar backend server.
 * Authors: Karen Ferreira Magalhaes, Nataly Fonseca Mendes, Percy Focazio-Moran, Rafiq Abudulai
 */
import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import routes from "./routes/authRoutes.js";
const MONGO_URI = process.api.env.MONGO_URI;

const app = express();
const PORT = 4000;
app.use(cors());

// mongo connection
app.use(express.json()); //Allows Express to parse incoming JSON data automatically.

mongoose
  .connect(MONGO_URI) //Establishes a connection to the database (should use a .env).

  .then(() => console.log("MongoDB connected")) //Handle success and error scenarios for connection
  .catch((err) => console.log(err));

// body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

routes(app);

app.get("/", (req, res) => {
  res.send(`Application is running on port ${PORT}`);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
