import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
});

export const login = (email, password) =>
  API.post("/auth/login", { email, password });

export const askQuestion = (product_id, question, token) =>
  API.post(
    "/chat/ask",
    { product_id, question },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

export const getNPS = (id, token) =>
  API.get(`/analytics/nps/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getSentiment = (id, token) =>
  API.get(`/analytics/sentiment/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getDashboardStats = (token) =>
  API.get("/analytics/dashboard-stats", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getAnalyticsData = (token) =>
  API.get("/analytics/analytics-data", {
    headers: { Authorization: `Bearer ${token}` },
  });