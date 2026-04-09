/**
 * adminRoutes.js
 * Routes for admin-only operations.
 * Authors: Karen Ferreira Magalhaes, Nataly Fonseca Mendes, Percy Focazio-Moran, Rafiq Abudulai
 */

import {
  getSuggestions,
  approveSuggestion,
  rejectSuggestion,
  deleteSuggestion,
  getAllUsers,
  deleteUser,
  updateUserRole,
} from "../controllers/adminController.js";

const routes = (app) => {
  app.route("/admin/suggestions").get(getSuggestions); // GET all suggestions (filter by ?status=pending)
  app.route("/admin/suggestion/:suggestionId/approve").put(approveSuggestion); // PUT approve a suggestion → adds to holidays
  app.route("/admin/suggestion/:suggestionId/reject").put(rejectSuggestion); // PUT reject a suggestion
  app.route("/admin/suggestion/:suggestionId").delete(deleteSuggestion); // DELETE remove a suggestion

  app.route("/admin/users").get(getAllUsers); // GET all users
  app.route("/admin/user/:userId").delete(deleteUser); // DELETE a user

  app.route("/admin/user/:userId/role").put(updateUserRole); // PUT promote/demote a user's role
};

export default routes;
