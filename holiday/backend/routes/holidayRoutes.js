/**
 * holidayRoutes.js
 * Routes for browsing, searching, and managing holidays.
 * Authors: Karen Ferreira Magalhaes, Nataly Fonseca Mendes, Percy Focazio-Moran, Rafiq Abudulai
 */

import {
  getHolidays,
  getHolidayById,
  addHoliday,
  updateHoliday,
  deleteHoliday,
} from "../controllers/holidayController.js";

//TODO: holiday create/update/delete routes have no middleware checking if the user is actually an admin. Any logged-in user can access them

const routes = (app) => {
  app
    .route("/holidays")
    .get(getHolidays) //GET endpoint for all holidays
    .post(addHoliday); //POST endpoint for adding a new holiday (admin only)

  app
    .route("/holiday/:holidayId")
    .get(getHolidayById) //GET endpoint for get specific holiday
    .put(updateHoliday) //PUT endpoint for updating a holiday (admin only)
    .delete(deleteHoliday); //DELETE endpoint for deleting a holiday (admin only)
};

export default routes;
