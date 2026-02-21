import { useState } from "react";
import { login } from "../api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await login(email, password);
      localStorage.setItem("token", res.data.access_token);
      navigate("/dashboard");
    } catch {
      alert("Invalid login");
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
        
        <button className="minimal-button" onClick={handleLogin}>Log in to dashboard</button>
      </div>
    </div>
  );
}