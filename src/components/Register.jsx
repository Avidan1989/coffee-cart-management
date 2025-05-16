import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/styles/Register.css";

const Register = () => {
  const [idNumber, setIdNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const validateForm = () => {
    if (!idNumber.match(/^\d{9}$/)) {
      setErrorMessage("מספר תעודת זהות חייב להכיל 9 ספרות");
      return false;
    }
    if (!phone.match(/^\d{10}$/)) {
      setErrorMessage("טלפון חייב להכיל 10 ספרות");
      return false;
    }
    if (!password.match(/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/)) {
      setErrorMessage("הסיסמה חייבת להכיל לפחות 8 תווים, כולל אותיות וספרות");
      return false;
    }
    if (!email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
      setErrorMessage('כתובת הדוא"ל אינה תקינה');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    if (!validateForm()) return;

    const userCredentials = {
      id_number: idNumber,
      email: email,
      phone: phone,
      first_name: firstName,
      last_name: lastName,
      user_name: username, // תיקון שם שדה שיתאים ל-backend
      password: password,
    };

    console.log("user cradentials", JSON.stringify(userCredentials));

    try {
      const response = await fetch("/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userCredentials), //
        credentials: "include",
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMessage("ההרשמה בוצעה בהצלחה. מנותבים להתחברות...");
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setErrorMessage(data.message || "שגיאה בהרשמה");
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("משהו השתבש. אנא נסה שוב מאוחר יותר.");
    }
  };

  return (
    <div className="register-container">
      <h2>הרשמה</h2>
      <form onSubmit={handleSubmit} className="register-form">
        <label>
          מספר תעודת זהות (9 ספרות)
          <div className="input-with-icon">
            <span className="icon">🆔</span>
            <input
              type="text"
              className="register-input full-width"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              required
            />
          </div>
        </label>
        <label>
          דוא"ל
          <div className="input-with-icon">
            <span className="icon">✉️</span>
            <input
              type="email"
              className="register-input full-width"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </label>
        <label>
          טלפון (10 ספרות)
          <div className="input-with-icon">
            <span className="icon">📞</span>
            <input
              type="text"
              className="register-input full-width"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
        </label>
        <label>
          שם פרטי
          <div className="input-with-icon">
            <span className="icon">👤</span>
            <input
              type="text"
              className="register-input full-width"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
        </label>
        <label>
          שם משפחה
          <div className="input-with-icon">
            <span className="icon">👥</span>
            <input
              type="text"
              className="register-input full-width"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
        </label>
        <label>
          שם משתמש
          <div className="input-with-icon">
            <span className="icon">📝</span>
            <input
              type="text"
              className="register-input full-width"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength="3"
            />
          </div>
        </label>
        <label>
          סיסמה
          <div className="input-with-icon">
            <span className="icon">🔒</span>
            <input
              type="password"
              className="register-input full-width"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="8"
            />
          </div>
        </label>

        <button type="submit" className="register-button">
          הרשם
        </button>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
      </form>
    </div>
  );
};

export default Register;
