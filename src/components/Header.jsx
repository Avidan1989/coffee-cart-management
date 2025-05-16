import React, { useContext } from "react";
import {  NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import logo from "../assets/img/logoRashi.png";
import "../assets/styles/Header.css";

function Header() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/users/logout", {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        localStorage.removeItem("user");
        setUser(null);
        navigate("/login");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const homeLink = user ? "/main-page" : "/login";

  return (
    <header className="main-header">
      <div className="header__wrap">
        {/* 🔵 ימין – לוגו + טקסט */}
        <div className="logo-area">
          <NavLink to={homeLink}>
            <img src={logo} alt="CartFlow" className="logo-img" />
          </NavLink>
          <div className="logo-text">
            <strong>CartFlow</strong>
            <br />
            <small>(CoffeeCart Management )</small>
          </div>
        </div>

        {/* 🟣 אמצע – כפתורים */}
        <div className="center-buttons">
          {user && (
            <NavLink
              to="/main-page"
              className={({ isActive }) =>
                isActive ? "nav-button active" : "nav-button"
              }
              end
            >
              דף הבית
            </NavLink>
          )}
          <NavLink
            to="/about"
            className={({ isActive }) =>
              isActive ? "nav-button active" : "nav-button"
            }
          >
            אודות
          </NavLink>
        </div>

        {/* 🟡 שמאל – ברוך הבא + לוגאאוט */}
        <div className="user-section">
          {user && (
            <>
              <h1 className="welcome-text">ברוך הבא {user.username}</h1>
              <button onClick={handleLogout} className="logout-btn">
                התנתק
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
