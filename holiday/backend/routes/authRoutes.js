/**
 * authRoutes.js
 * Routes for user authentication and account management.
 * Authors: Karen Ferreira Magalhaes, Nataly Fonseca Mendes, Percy Focazio-Moran, Rafiq Abudulai
 */
import { registerUser, loginUser, logoutUser, getSession, getUsers, getUserById, updateUser, deleteUser } from "../controllers/authController.js";

const routes = (app) => {
  app.route("/register")
  .post(registerUser); //POST endpoint for user registration
  app.route("/login")
  .post(loginUser); //POST endpoint for user login
  app.route("/logout")
  .post(logoutUser); //POST endpoint for user logout
  app.route("/session")
  .get(getSession); //GET endpoint for checking user session
  
  app.route("/users")
  .get(getUsers) //GET endpoint for all users
  
  app.route("/user/:userId")
  .get(getUserById) //GET endpoint for get specific user
  .put(updateUser) //PUT endpoint for update specific user
  .delete(deleteUser) //DELETE endpoint for delete specific user
};

export default routes;
