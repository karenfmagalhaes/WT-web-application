import { addNewUser } from "../controllers/authController.js";

const routes = (app) => {
  app.route("/register").post(addNewUser);
};

export default routes;
