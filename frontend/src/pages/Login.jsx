import { useState } from "react";
import { login, register } from "../api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("analyst");
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const handleAuthSuccess = (token) => {
    localStorage.setItem("token", token);
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      localStorage.setItem("role", payload.role || "analyst");
    } catch {
      localStorage.setItem("role", "analyst");
    }
    navigate("/dashboard");
  };

  const handleSubmit = async () => {
    try {
      if (isRegistering) {
        await register(email, password, role);
        const res = await login(email, password);
        if (!res.data.access_token || res.data.access_token === "undefined") throw new Error("Missing token");
        handleAuthSuccess(res.data.access_token);
      } else {
        const res = await login(email, password);
        if (!res.data.access_token || res.data.access_token === "undefined") throw new Error("Missing token");
        handleAuthSuccess(res.data.access_token);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || (isRegistering ? "Registration failed. Try again." : "Invalid login credentials.");
      alert(msg);
    }
  };

  return (
    <div className="app-container">
      <div className="login-box">
        <h2 className="page-title" style={{ textAlign: "center", marginBottom: "24px" }}>InsightLens</h2>

        <input
          className="minimal-input"
          placeholder="Email address"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="minimal-input"
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginBottom: isRegistering ? "16px" : "24px" }}
        />

        {isRegistering && (
          <select
            className="minimal-input"
            style={{ marginBottom: "24px" }}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="analyst">Analyst</option>
            <option value="admin">Admin</option>
          </select>
        )}

        <button className="minimal-button" onClick={handleSubmit}>
          {isRegistering ? "Create Account" : "Log in to dashboard"}
        </button>

        <div style={{ textAlign: "center", marginTop: "16px", fontSize: "14px", color: "#6b7280" }}>
          {isRegistering ? "Already have an account?" : "Don't have an account?"}{" "}
          <span
            style={{ color: "#3b82f6", cursor: "pointer", fontWeight: "500" }}
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering ? "Log in" : "Sign up"}
          </span>
        </div>
      </div>
    </div>
  );
}