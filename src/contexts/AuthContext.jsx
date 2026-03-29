import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import BASE_URL from "../config/api.js";

const AuthContext = createContext(null);

// ✅ Create Axios Instance (VERY IMPORTANT)
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  console.log("🔥 API BASE URL:", BASE_URL);

  // ✅ Attach token automatically
  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // ✅ Check auth on reload
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("token");

      if (storedToken) {
        try {
          const res = await api.get("/api/user/me", {
            headers: { Authorization: `Bearer ${storedToken}` },
          });

          if (res.data.success) {
            setUser(res.data.user);
            setToken(storedToken);
          } else {
            localStorage.removeItem("token");
            setUser(null);
            setToken(null);
          }
        } catch (err) {
          console.error("Auth check failed:", err);
          localStorage.removeItem("token");
          setUser(null);
          setToken(null);
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  // ✅ REGISTER (FIXED)
  const register = async (data) => {
    setLoading(true);

    try {
      console.log("🚀 Register API CALL →", `${BASE_URL}/api/auth/register`);

      const res = await api.post("/api/auth/register", data);

      console.log("✅ Register response:", res.data);

      if (res.data.success) {
        const { token: newToken, user: userData, requiresRoleSelection } =
          res.data;

        localStorage.setItem("token", newToken);
        setToken(newToken);
        setUser(userData);

        return {
          success: true,
          requiresRoleSelection,
          user: userData,
        };
      }

      return { success: false, message: "Registration failed" };
    } catch (err) {
      console.error("❌ Register error:", err);

      return {
        success: false,
        message:
          err.response?.data?.detail ||
          err.response?.data?.message ||
          "Registration failed",
      };
    } finally {
      setLoading(false);
    }
  };

  // ✅ LOGIN (FIXED)
  const login = async (email, password) => {
    setLoading(true);

    try {
      console.log("🚀 Login API CALL →", `${BASE_URL}/api/auth/login`);

      const res = await api.post("/api/auth/login", {
        email,
        password,
      });

      console.log("✅ Login response:", res.data);

      if (res.data.success) {
        const { token: newToken, user: userData, requiresRoleSelection } =
          res.data;

        localStorage.setItem("token", newToken);
        setToken(newToken);
        setUser(userData);

        return {
          success: true,
          requiresRoleSelection,
          user: userData,
        };
      }

      return { success: false, message: "Login failed" };
    } catch (err) {
      console.error("❌ Login error:", err);

      return {
        success: false,
        message:
          err.response?.data?.detail ||
          err.response?.data?.message ||
          "Login failed",
      };
    } finally {
      setLoading(false);
    }
  };

  // ✅ SELECT ROLE
  const selectRole = async (role) => {
    try {
      const res = await api.post(
        "/api/user/select-role",
        { role },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        setUser(res.data.user);
        return { success: true };
      }

      return { success: false, message: "Role selection failed" };
    } catch (err) {
      console.error("❌ Role error:", err);

      return {
        success: false,
        message:
          err.response?.data?.detail ||
          err.response?.data?.message ||
          "Role selection failed",
      };
    }
  };

  // ✅ LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    selectRole,
    isAuthenticated: !!user,
    isOwner: user?.role === "OWNER",
    isCustomer: user?.role === "CUSTOMER",
    requiresRoleSelection: user && !user.role,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ✅ Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
