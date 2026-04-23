import { Navigate, Route, Routes } from "react-router-dom";
import Spinner from "../components/ui/Spinner";
import { useAuth } from "../hooks/useAuth";
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

const AppRoutes = () => (
  <Routes>
    <Route element={<LoginPage />} path="/login" />
    <Route element={<SignupPage />} path="/signup" />
    <Route
      element={
        <PrivateRoute>
          <CalendarPage />
        </PrivateRoute>
      }
      path="/"
    />
    <Route
      element={
        <PrivateRoute>
          <ProfilePage />
        </PrivateRoute>
      }
      path="/profile"
    />
    <Route element={<Navigate replace to="/" />} path="*" />
  </Routes>
);

export default AppRoutes;
