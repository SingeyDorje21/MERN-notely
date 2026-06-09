import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "../../lib/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get("/auth/me");
        setUser(res.data);
      } catch (error) {
        // 401 means not authenticated — that's expected, not an error
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Redirect to Google OAuth — full page redirect, not fetch
  const login = () => {
    const baseUrl =
      import.meta.env.MODE === "development"
        ? "http://localhost:5001"
        : "";
    window.location.href = `${baseUrl}/api/auth/google`;
  };

  // Clear session and redirect to login page
  const logout = async () => {
    try {
      await axios.post("/auth/logout");
      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Convenience hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
