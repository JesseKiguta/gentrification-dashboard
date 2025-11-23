import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { NotificationProvider } from "./components/NotificationContext";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Compare from "./pages/Compare";
import Map from "./pages/Map";
import Predict from "./pages/Predict";
import GenerateReport from "./components/GenerateReport";
import Help from "./pages/Help";

// Route guard for private routes
function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
}

// Layout wrapper
function AppLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const token = localStorage.getItem("token");

  // If user is not logged in or is on the login page → hide sidebar & navbar
  if (isLoginPage || !token) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  // Otherwise show the full dashboard layout
  return (
    <NotificationProvider>
      <div className="flex bg-gray-100 min-h-screen h-full">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          {/* Navbar visible on all authenticated pages */}
          <Navbar />
          <motion.div
            className="flex-1 bg-white shadow-inner overflow-auto p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Routes>
              <Route
                path="/compare"
                element={
                  <PrivateRoute>
                    <Compare />
                  </PrivateRoute>
                }
              />
              <Route
                path="/map"
                element={
                  <PrivateRoute>
                    <Map />
                  </PrivateRoute>
                }
              />
              <Route
                path="/predict"
                element={
                  <PrivateRoute>
                    <Predict />
                  </PrivateRoute>
                }
              />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/report"
                element={
                  <PrivateRoute>
                    <GenerateReport />
                  </PrivateRoute>
                }
              />
              <Route
                path="/help"
                element={
                  <PrivateRoute>
                    <Help />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </motion.div>
        </div>
      </div>
    </NotificationProvider>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

