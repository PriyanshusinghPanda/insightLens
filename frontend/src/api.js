import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000",
});

export const login = (email, password) =>
  API.post("/auth/login", null, {
    params: { email, password },
  });

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