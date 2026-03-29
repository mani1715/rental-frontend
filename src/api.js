import axios from "axios";

// ✅ IMPORTANT: use FULL backend URL
const API = axios.create({
  baseURL: "https://rental-backend-production-3c03.up.railway.app/api",
});

// ✅ Attach token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ================= AUTH =================

// Register
export const registerUser = async (data) => {
  const res = await API.post("/auth/register", data);
  return res.data;
};

// Login
export const loginUser = async (data) => {
  const res = await API.post("/auth/login", data);
  return res.data;
};

// Get current user
export const getCurrentUser = async () => {
  const res = await API.get("/user/me");
  return res.data;
};

// Select role
export const selectRole = async (data) => {
  const res = await API.post("/user/select-role", data);
  return res.data;
};

export default API;
