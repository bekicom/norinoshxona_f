// src/services/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "https://norin0shxona-b.vercel.app/api", // Backend URL
  // baseURL: "https://roxatb.richman.uz/api",
  // baseURL: "http://localhost:8043/api",

  headers: {
    "Content-Type": "application/json",
  },
  // ❌ timeout olib tashlandi
});

// Request interceptor - token qo‘shish
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - xatolarni boshqarish
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;
