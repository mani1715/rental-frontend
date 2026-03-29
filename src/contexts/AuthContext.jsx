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
    // Validate inputs
    if (!data.email || !data.password || !data.name) {
      console.error("❌ Register error: All fields are required");
      return { success: false, message: "Please fill in all required fields" };
    }

    setLoading(true);

    try {
      console.log("=== REGISTER REQUEST ===");
      console.log("🚀 Register API CALL →", `${BASE_URL}/api/auth/register`);
      console.log("📧 Email:", data.email);
      console.log("👤 Name:", data.name);

      const res = await api.post("/api/auth/register", {
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
      });

      console.log("✅ Register response status:", res.status);
      console.log("✅ Register response data:", res.data);

      if (res.data.success) {
        const { token: newToken, user: userData, requiresRoleSelection } =
          res.data;

        console.log("🎉 Registration successful! User:", userData?.email);

        localStorage.setItem("token", newToken);
        setToken(newToken);
        setUser(userData);

        return {
          success: true,
          requiresRoleSelection,
          user: userData,
        };
      }

      console.error("❌ Registration failed - success:false in response");
      return { success: false, message: res.data.message || "Registration failed" };
    } catch (err) {
      console.error("=== REGISTER ERROR ===");
      console.error("❌ Error status:", err.response?.status);
      console.error("❌ Error data:", err.response?.data);
      console.error("❌ Error message:", err.message);

      let errorMessage = "Registration failed. Please try again.";
      
      if (err.response?.status === 400) {
        errorMessage = err.response?.data?.message || 
                      err.response?.data?.detail || 
                      "Invalid registration data";
      } else if (err.response?.status === 409) {
        errorMessage = "Email already exists. Please use a different email.";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
      console.log("=== REGISTER REQUEST COMPLETE ===");
    }
  };

  // ✅ LOGIN (FIXED)
  const login = async (email, password) => {
    // Validate inputs
    if (!email || !password) {
      console.error("❌ Login error: Email and password are required");
      return { success: false, message: "Please enter email and password" };
    }

    setLoading(true);

    try {
      console.log("=== LOGIN REQUEST ===");
      console.log("🚀 Login API CALL →", `${BASE_URL}/api/auth/login`);
      console.log("📧 Email:", email);
      console.log("🔑 Password length:", password.length);

      const res = await api.post("/api/auth/login", {
        email: email.trim(),
        password: password,
      });

      console.log("✅ Login response status:", res.status);
      console.log("✅ Login response data:", res.data);

      if (res.data.success) {
        const { token: newToken, user: userData, requiresRoleSelection } =
          res.data;

        console.log("🎉 Login successful! User:", userData?.email);
        
        localStorage.setItem("token", newToken);
        setToken(newToken);
        setUser(userData);

        return {
          success: true,
          requiresRoleSelection,
          user: userData,
        };
      }

      console.error("❌ Login failed - success:false in response");
      return { success: false, message: res.data.message || "Login failed" };
    } catch (err) {
      console.error("=== LOGIN ERROR ===");
      console.error("❌ Error status:", err.response?.status);
      console.error("❌ Error data:", err.response?.data);
      console.error("❌ Error message:", err.message);

      // Handle specific error codes
      let errorMessage = "Login failed. Please try again.";
      
      if (err.response?.status === 401) {
        errorMessage = err.response?.data?.message || 
                      err.response?.data?.detail || 
                      "Invalid email or password";
      } else if (err.response?.status === 404) {
        errorMessage = "User not found. Please check your email.";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (!navigator.onLine) {
        errorMessage = "No internet connection. Please check your network.";
      }

      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
      console.log("=== LOGIN REQUEST COMPLETE ===");
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
