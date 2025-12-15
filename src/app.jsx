import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  // Token localStorage orqali o'zgarganda state yangilash
  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("token"));
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <Routes>
      {/* Root yo'l / -> login ga yo'naltirish */}
      <Route
        path="/"
        element={<Navigate to={token ? "/dashboard" : "/login"} />}
      />

      {/* Login sahifasi */}
      <Route
        path="/login"
        element={token ? <Navigate to="/dashboard" /> : <Login />}
      />

      {/* Dashboard sahifasi */}
      <Route
        path="/dashboard"
        element={token ? <Dashboard /> : <Navigate to="/login" />}
      />

      {/* 404 sahifa */}
      <Route
        path="*"
        element={
          <h1 style={{ textAlign: "center", marginTop: "50px" }}>
            404 Not Found
          </h1>
        }
      />
    </Routes>
  );
}

export default App;
