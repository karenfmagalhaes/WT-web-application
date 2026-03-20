
# Holiday Calendar

An interactive international holiday calendar web application that allows users to explore public and cultural holidays from around the world.

---

## Project Structure

```
holiday-calendar/
├── backend/
│   ├── config/
│   │   ├── db.js                        # MongoDB connection setup
│   │   └── session.js                   # Express session configuration
│   ├── controllers/
│   │   ├── adminController.js           # Admin-only operations
│   │   ├── authController.js            # Register, login, logout, user CRUD
│   │   ├── favouriteController.js       # Save, remove, and list favourite holidays
│   │   ├── holidayController.js         # Browse, search, filter, manage holidays
│   │   └── suggestionController.js      # Submit and manage holiday suggestions
│   ├── models/
│   │   ├── Favourite.js                 # Favourite holiday schema and model
│   │   ├── Holiday.js                   # Holiday schema and model
│   │   ├── Suggestion.js                # Suggestion schema and model
│   │   └── User.js                      # User schema and model
│   ├── routes/
│   │   ├── adminRoutes.js               # Admin-only routes
│   │   ├── authRoutes.js                # Auth and user CRUD routes
│   │   ├── favouriteRoutes.js           # Favourite holiday routes
│   │   ├── holidayRoutes.js             # Holiday routes
│   │   └── suggestionRoutes.js          # Suggestion routes
│   ├── index.js                         # Main entry point
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── README.md
└── coversheet.pdf
```

---

## Implementations

### 1. User Registration, Login and Logout

**File:** `controllers/authController.js` | `routes/authRoutes.js`

- `POST /register` — Creates a new user account. Validates all input fields server-side (name length, email format, password length). Hashes the password using `bcryptjs` before storing. On success, creates a session and sets cookies.
- `POST /login` — Authenticates an existing user. Validates input, compares the submitted password against the stored hash using `bcrypt.compare`. On success, creates a session and sets cookies.
- `POST /logout` — Destroys the server-side session and clears all cookies.
- `GET /session` — Returns the current session status so the frontend can check if a user is logged in.

---

### 2. User CRUD

**File:** `controllers/authController.js` | `routes/authRoutes.js`

- `GET /users` — Retrieves all users. Password hashes are excluded from the response.
- `GET /user/:userId` — Retrieves a specific user by ID.
- `PUT /user/:userId` — Updates a user's profile (first name, last name, phone, preferred country, preferred month). Only permitted fields can be updated — password hash cannot be overwritten through this endpoint.
- `DELETE /user/:userId` — Deletes a user account. If the deleted user is the current session user, the session is also destroyed.

---

### 3. Session

**File:** `controllers/authController.js` | `config/session.js`

- Sessions are created using `express-session` and stored in MongoDB via `connect-mongo` so they persist across server restarts.
- `req.session.user` is set on successful registration or login, storing the user's ID, email, first name, and role.
- All protected endpoints (favourites, suggestions) check for `req.session.user` before proceeding.
- Sessions are destroyed on logout or account deletion.

---

### 4. Cookies

**File:** `controllers/authController.js`

- `preferredCountry` cookie — set on registration and login, stores the user's preferred country for the frontend calendar to use. Updated when the user changes their preferred country. Cleared on logout.
- `lastLogin` cookie — set on login, stores the timestamp of the user's last login. Cleared on logout.
- Both cookies are readable by the frontend (httpOnly: false) and expire after a set period.

---

### 5. Holiday Browsing, Search and Filtering

**File:** `controllers/holidayController.js` | `routes/holidayRoutes.js`

- `GET /holidays` — Retrieves all holidays. Supports the following optional query parameters:
  - `?country=` — filters by country (case-insensitive)
  - `?month=` — filters by month (1–12)
  - `?category=` — filters by category type
  - `?search=` — partial name search (case-insensitive)
- `GET /holiday/:holidayId` — Retrieves a single holiday by its ID for the holiday details page.

---

### 6. Holiday Management (Admin)

**File:** `controllers/holidayController.js` | `routes/holidayRoutes.js`

- `POST /holidays` — Adds a new holiday. Full server-side validation on all fields.
- `PUT /holiday/:holidayId` — Updates an existing holiday. Validates only the fields provided.
- `DELETE /holiday/:holidayId` — Removes a holiday.

---

### 7. Favourites

**File:** `controllers/favouriteController.js` | `routes/favouriteRoutes.js` | `models/Favourite.js`

- `GET /saved-holidays` — Retrieves all holidays saved by the logged-in user, with full holiday details populated. Requires an active session.
- `POST /saved-holidays` — Saves a holiday to the user's favourites. Validates the holiday ID, checks the holiday exists, and prevents duplicate saves using a unique compound index on `{ user, holiday }`. Requires an active session.
- `DELETE /saved-holiday/:savedId` — Removes a holiday from the user's favourites. Users can only delete their own saved holidays. Requires an active session.

---

### 8. Community Suggestions (User)

**File:** `controllers/suggestionController.js` | `routes/suggestionRoutes.js` | `models/Suggestion.js`

- `GET /suggestions` — Retrieves all suggestions submitted by the logged-in user, including their current status (pending, approved, rejected). Requires an active session.
- `POST /suggestions` — Submits a new holiday suggestion. Server-side validation on name, country, and date. Accepts an optional reference link. Status defaults to pending. Requires an active session.
- `DELETE /suggestion/:suggestionId` — Deletes a pending suggestion. Users can only delete their own suggestions, and only while the status is still pending. Requires an active session.

---

### 9. Admin Dashboard

**File:** `controllers/adminController.js` | `routes/adminRoutes.js`

All admin endpoints check that the logged-in session user has the role `'admin'`. Non-admin users receive a `403 Access Denied` response.

**Suggestion management:**
- `GET /admin/suggestions` — Lists all suggestions. Filterable by `?status=pending/approved/rejected`.
- `PUT /admin/suggestion/:suggestionId/approve` — Approves a suggestion and automatically writes it into the holidays collection.
- `PUT /admin/suggestion/:suggestionId/reject` — Rejects a suggestion.
- `DELETE /admin/suggestion/:suggestionId` — Deletes a suggestion entirely.

**User management:**
- `GET /admin/users` — Lists all users (password hashes excluded).
- `DELETE /admin/user/:userId` — Deletes a user. Admins cannot delete their own account.
- `PUT /admin/user/:userId/role` — Promotes or demotes a user's role between `'user'` and `'admin'`.

---

### 10. Server-side Validation

Validation is implemented in every controller before any database operation. Errors are returned as a structured JSON object so the frontend can display field-specific messages.

| Controller | Fields Validated |
|---|---|
| `authController` | firstName, lastName, email format, password length |
| `holidayController` | name, country, date, month range, category enum, description length |
| `favouriteController` | holidayId presence, holiday existence |
| `suggestionController` | name, country, date format, description length |
| `adminController` | role enum, status enum |

---

### 11. Database

- **MongoDB** via **Mongoose** is used as the database.
- All schemas include inline error messages for Mongoose-level validation.
- Indexes are defined on frequently queried fields to improve performance:
  - `Holiday`: indexed on `country`, `month`, `category`, and `name` (text index for search)
  - `Favourite`: unique compound index on `{ user, holiday }` to prevent duplicates
  - `Suggestion`: indexed on `status` and `submittedBy`

---

## Division of Labour

Work was evenly divided among all team members.

---

## References

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [bcryptjs npm package](https://www.npmjs.com/package/bcryptjs)
- [express-session npm package](https://www.npmjs.com/package/express-session)
- [connect-mongo npm package](https://www.npmjs.com/package/connect-mongo)
- [MongoDB Atlas](https://www.mongodb.com/atlas)

