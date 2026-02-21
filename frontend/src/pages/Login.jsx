import { useState } from "react";
import { login, register } from "../api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      if (isRegistering) {
        await register(email, password);
        // Automatically log in after successful registration
        const res = await login(email, password);
        localStorage.setItem("token", res.data.access_token);
        navigate("/dashboard");
      } else {
        const res = await login(email, password);
        localStorage.setItem("token", res.data.access_token);
        navigate("/dashboard");
      }
    } catch {
      alert(isRegistering ? "Registration failed. Try again." : "Invalid login credentials.");
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
          style={{ marginBottom: "24px" }}
        />

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