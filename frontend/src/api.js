import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export const login = (email, password) =>
  API.post("/auth/login", { email, password });

export const register = (email, password, role) =>
  API.post("/auth/register", { email, password, role });

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

export const getAnalyticsData = (token, category = null, productId = null) => {
  let url = "/analytics/analytics-data";
  const params = new URLSearchParams();
  if (category) params.append("category", category);
  if (productId) params.append("product_id", productId);
  if (params.toString()) url += `?${params.toString()}`;
  return API.get(url, { headers: { Authorization: `Bearer ${token}` } });
};

export const getInsights = (token, category = null, productId = null) =>
  API.post(
    "/analytics/insights",
    { category, product_id: productId },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const saveReport = (token, product_id, question, response) =>
  API.post(
    "/chat/save",
    { product_id, question, response },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const getUsers = (token) =>
  API.get("/admin/users", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const assignCategory = (token, user_id, category) =>
  API.post(
    "/admin/assign-category",
    { user_id, category },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const getProducts = (token) =>
  API.get("/analytics/products", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getReports = (token) =>
  API.get("/reports/my-reports", {
    headers: { Authorization: `Bearer ${token}` },
  });