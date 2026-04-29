import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CalendarProvider } from "./context/CalendarContext";
import Navbar from "./components/ui/Navbar";
import AppRoutes from "./routes/AppRoutes";

// The shell for the website. Renders navbar.
// Also router, calendar provider, and authentication provider.
const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <CalendarProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 pb-10">
            <AppRoutes />
          </main>
        </div>
      </CalendarProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
