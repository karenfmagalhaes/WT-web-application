import { addNewUser, getUsers, getUserById, updateUser, deleteUser } from "../controllers/authController.js";

const routes = (app) => {
  app.route("/users")
  .get(getUsers) //GET endpoint for all users
  .post(addNewUser) //POST endpoint
  
  app.route("/user/:userId")
  .get(getUserById) //GET endpoint for get specific user
  .put(updateUser) //PUT endpoint for update specific user
  .delete(deleteUser) //DELETE endpoint for delete specific user
};

export default routes;
