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


const app = express();
const PORT = 4000;

// mongo connection
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://127.0.0.1:27017/holidaysDB")
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

// body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// cors
app.use(cors());

routes(app);

app.get("/", (req, res) => res.send(`Application is running on port ${PORT}`));

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
