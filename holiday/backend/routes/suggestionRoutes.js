/**
 * suggestionRoutes.js
 * Routes for logged-in users to submit and manage their own suggestions.
 * Authors: Karen Ferreira Magalhaes, Nataly Fonseca Mendes, Percy Focazio-Moran, Rafiq Abudulai
 */

import {
  getMySuggestions,
  addSuggestion,
  deleteSuggestion,
} from "../controllers/suggestionController.js";

const routes = (app) => {
  app
    .route("/suggestions")
    .get(getMySuggestions) // GET all suggestions submitted by the logged-in user
    .post(addSuggestion); // POST submit a new holiday suggestion

  app.route("/suggestion/:suggestionId").delete(deleteSuggestion); // DELETE remove own pending suggestion
};

export default routes;
