import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import "../assets/styles/MainPage.css";
import salesImage from "../assets/img/sale.png";
import arrangementImage from "../assets/img/arrangement.png";
import productsImage from "../assets/img/productsImage.png";
import messegeImage from "../assets/img/messege.png";
import reportsImage from "../assets/img/reports.png";
import employeesImage from "../assets/img/employeesImage.png";
import messagesRequestsImage from "../assets/img/messagesRequestsImage.png";
import { AuthContext } from "./AuthContext";

function getCurrentWeekStart() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 - ראשון
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);
  return sunday.toISOString().split("T")[0]; // yyyy-mm-dd
}

function MainPage() {
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);
  const [showArrangementReminder, setShowArrangementReminder] = useState(false);
  const [hasPendingMessages, setHasPendingMessages] = useState(false);
  const [lowStock, setLowStock] = useState(false);
 const weekStart = localStorage.getItem("weekStart") || getCurrentWeekStart();



  useEffect(() => {
    // שליפת מאמרים
    fetch("/articles", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setArticles(data);
        else throw new Error("Data is not an array");
      })
      .catch((err) => setError(err.message));

    // שליפת מוצרים עם חוסרים במלאי
    fetch("http://localhost:8801/prods/low-stock", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLowStock(true);
        } else {
          setLowStock(false);
        }
      })
      .catch((err) => {
        console.error("שגיאה בבדיקת חוסרים:", err);
        setLowStock(false);
      });

    // בדיקה אם צריך להציג התראת סידור עבודה
    const reminderDay = localStorage.getItem("reminderDay");
    const todayName = [
      "ראשון",
      "שני",
      "שלישי",
      "רביעי",
      "חמישי",
      "שישי",
      "שבת",
    ][new Date().getDay()];

    if (user?.role === "admin" && reminderDay === todayName) {
      fetch(`http://localhost:8801/schedule?week_start=${weekStart}`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (!Array.isArray(data) || data.length === 0) {
            setShowArrangementReminder(true);
          }
        })
        .catch((err) => {
          console.error("שגיאה בבדיקת סידור עבודה:", err);
        });
    }

    fetch("http://localhost:8801/employee-manager/requests/employees", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        const hasPending =
          Array.isArray(data) && data.some((emp) => emp.pending_count > 0);
        setHasPendingMessages(hasPending);
      })
      .catch((err) => {
        console.error("שגיאה בבדיקת פניות עובדים:", err);
        setHasPendingMessages(false);
      });
  }, [user, weekStart]);










  const getImage = (imageName) => {
    switch (imageName) {
      case "productsImage":
        return productsImage;
      case "arrangementImage":
        return arrangementImage;
      case "reportsImage":
        return reportsImage;
      case "messegeImage":
        return messegeImage;
      case "salesImage":
        return salesImage;
      case "employeesImage":
        return employeesImage;
      case "messagesRequestsImage":
        return messagesRequestsImage;
      default:
        return null;
    }
  };

  if (error) {
    return <div className="error">שגיאה בטעינת המאמרים: {error}</div>;
  }

  return (
    <div className="main-page-wrapper">
      <div className="main-content-layout">
        {user?.role === "admin" && (
          <div className="alerts-panel">
            <h3 className="alerts-title">🔔 התראות חשובות</h3>
            {lowStock && (
              <Link to="/manager-products-low" className="alert-box">
                ⚠️ חוסרים במלאי
              </Link>
            )}
            {hasPendingMessages && (
              <Link
                to="/employee-manager/requests?autoOpen=latest"
                className="alert-box"
              >
                📩 פניות חדשות מעובדים
              </Link>
            )}
            {showArrangementReminder && (
              <Link to="/arrangement" className="alert-box">
                🗓️ סידור עבודה לא הוגדר
              </Link>
            )}
          </div>
        )}

        {/* תוכן מרכזי - כפתורים / כרטיסים */}
        <div className="main-articles">
          <section className="articles-grid">
            {articles
              .filter(
                (article) =>
                  !article.role ||
                  article.role === "all" ||
                  article.role === user?.role
              )
              .map((article) => (
                <div key={article.id} className="article-card">
                  <Link to={article.path} className="article-image-container">
                    <img
                      src={getImage(article.image)}
                      alt={article.title}
                      className="article-image"
                    />
                  </Link>
                  <h2 className="article-title">{article.title}</h2>
                </div>
              ))}
          </section>
        </div>
      </div>
    </div>
  );
}

export default MainPage;
