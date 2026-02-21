import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token || token === "undefined") return <Navigate to="/" />;

  return children;
}