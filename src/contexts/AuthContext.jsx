import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../config/api.js';

const AuthContext = createContext(null);

const API_URL = BASE_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (storedToken) {
        try {
          const response = await axios.get(`${API_URL}/api/user/me`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          if (response.data.success) {
            setUser(response.data.user);
            setToken(storedToken);
          } else {
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const register = async (data) => {
    setLoading(true);

    try {
      console.log("Sending register request:", data);

      const response = await axios.post(
        `${API_URL}/api/auth/register`,
        data
      );

      console.log("Register response:", response.data);

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error("Register error:", error.response?.data);

      return {
        success: false,
        message: error.response?.data?.message || "Registration failed"
      };

    } finally {
      console.log("Register complete");
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });

      if (response.data.success) {
        const { token: newToken, user: userData } = response.data;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
        return { 
          success: true, 
          requiresRoleSelection: response.data.requiresRoleSelection,
          user: userData 
        };
      }
      return { success: false, message: 'Login failed' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || error.response?.data?.message || 'Login failed'
      };
    }
  };

  const selectRole = async (role) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/user/select-role`,
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, message: 'Role selection failed' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || error.response?.data?.message || 'Role selection failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
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
    isOwner: user?.role === 'OWNER',
    isCustomer: user?.role === 'CUSTOMER',
    requiresRoleSelection: user && !user.role
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
