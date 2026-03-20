/**
 * favouriteRoutes.js
 * Routes for managing a user's saved (favourite) holidays.
 * Authors: Karen Ferreira Magalhaes, Nataly Fonseca Mendes, Percy Focazio-Moran, Rafiq Abudulai
 */

import { getSavedHolidays, addSavedHoliday, deleteSavedHoliday
} from '../controllers/favouriteController.js';

const routes = (app) => {
  app.route('/saved-holidays')
    .get(getSavedHolidays)     // GET all saved holidays for the logged-in user
    .post(addSavedHoliday);    // POST save a holiday to favourites

  app.route('/saved-holiday/:savedId')
    .delete(deleteSavedHoliday); // DELETE remove a holiday from favourites
};

export default routes;