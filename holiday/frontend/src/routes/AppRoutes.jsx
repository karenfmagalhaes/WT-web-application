import { Navigate, Route, Routes } from "react-router-dom";
import Spinner from "../components/ui/Spinner";
import { useAuth } from "../hooks/useAuth";
import AccountSettingsPage from "../pages/AccountSettingsPage";
import AdminPage from "../pages/AdminPage";
import CalendarPage from "../pages/CalendarPage";
import LoginPage from "../pages/LoginPage";
import ProfilePage from "../pages/ProfilePage";
import SignupPage from "../pages/SignupPage";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner />;
  }

  return user ? children : <Navigate replace to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner />;
  }

  if (!user) return <Navigate replace to="/login" />;
  if (user.role !== "admin") return <Navigate replace to="/" />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route element={<LoginPage />} path="/login" />
    <Route element={<SignupPage />} path="/signup" />
    <Route element={<CalendarPage />} path="/" />
    <Route
      element={
        <PrivateRoute>
          <ProfilePage />
        </PrivateRoute>
      }
      path="/profile"
    />
    <Route
      element={
        <PrivateRoute>
          <AccountSettingsPage />
        </PrivateRoute>
      }
      path="/account"
    />
    <Route
      element={
        <AdminRoute>
          <AdminPage />
        </AdminRoute>
      }
      path="/admin"
    />
    <Route element={<Navigate replace to="/" />} path="*" />
  </Routes>
);

export default AppRoutes;
