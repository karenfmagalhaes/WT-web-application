import { getHolidays, getHolidayById } from "../controllers/holidayController.js";

const routes = (app) => {
  app.route("/holidays")
  .get(getHolidays) //GET endpoint for all holidays
  
  app.route("/holiday/:holidayId")
  .get(getHolidayById) //GET endpoint for get specific holiday
  
};

export default routes;