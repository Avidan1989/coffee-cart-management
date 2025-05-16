import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/styles/Login.css";
import { AuthContext } from "./AuthContext";

function Login() {
  const { setUser } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("אנא מלא את כל השדות");
      return;
    }
    try {
      const response = await fetch("/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        navigate("/main-page");
      } else {
        setError(data.message || "שגיאה בהתחברות");
      }
    } catch (err) {
      console.error(err);
      setError("שגיאה בהתחברות לשרת");
    }
  };

  const handleRegister = () => {
    navigate("/register");
  };

  return (
    <div className="login-container">
      <h2>התחברות</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="login-label">שם משתמש</label>
          <div className="input-with-icons">
            <input
              type="text"
              className="login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength="3"
            />
            <span className="icon user-icon">👤</span>
          </div>
        </div>

        <div className="form-group">
          <label className="login-label">סיסמה</label>
          <div className="input-with-icons">
            <input
              type={showPassword ? "text" : "password"}
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
            />
            <span className="icon lock-icon">🔒</span>
            <span
              className="icon toggle-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              👁️
            </span>
          </div>
        </div>

        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="login-button">
          התחבר
        </button>
      </form>
      <button onClick={handleRegister} className="register-button">
        הרשמה
      </button>
    </div>
  );
}
          
export default Login;
