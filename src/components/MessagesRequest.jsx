import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "../assets/styles/MessagesRequest.css";

function MessagesRequest() {
  const [reason, setReason] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [file, setFile] = useState(null);
  const [view, setView] = useState("form");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (view === "previous") {
      fetch("/messages-requests/my-requests", {
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) throw new Error("שגיאה מהשרת");
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setMessages(data);
          } else {
            console.error("Expected array but got:", data);
            setMessages([]); // כדי לא להיתקע
          }
        })
        .catch((err) => {
          toast.error("שגיאה בשליפת ההודעות");
          setMessages([]); // fallback במקרה חריג
        });
    }
  }, [view]);
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    // ולידציה: תאריך התחלה חייב להיות קטן או שווה לתאריך סיום
    if (new Date(fromDate) > new Date(toDate)) {
      toast.error("תאריך התחלה לא יכול להיות אחרי תאריך סיום");
      return;
    }

    // בדיקה אם כבר יש אילוץ חופף בטווח התאריכים
    const hasOverlap = messages.some((msg) => {
      const from1 = new Date(fromDate);
      const to1 = new Date(toDate);
      const from2 = new Date(msg.from_date);
      const to2 = new Date(msg.to_date);
      return (
        msg.status !== "rejected" &&
        ((from1 >= from2 && from1 <= to2) ||
          (to1 >= from2 && to1 <= to2) ||
          (from2 >= from1 && from2 <= to1))
      );
    });

    if (hasOverlap) {
      toast.error("כבר שלחת אילוץ בטווח הזה");
      return;
    }

    const formData = new FormData();
    formData.append("reason", reason);
    formData.append("fromDate", fromDate);
    formData.append("toDate", toDate);
    if (file) formData.append("file", file);

    try {
      const res = await fetch("/messages-requests/send", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("הפנייה נשלחה בהצלחה");
        setReason("");
        setFromDate("");
        setToDate("");
        setFile(null);
      } else {
        toast.error(data.error || "שגיאה בשליחת פנייה");
      }
    } catch (err) {
      toast.error("שגיאה בשרת");
    }
  };

  return (
    <div className="messages-request-container">
      <h2> פניות</h2>
      <div className="messages-buttons">
        <button onClick={() => setView("form")}>+ פנייה חדשה</button>
        <button onClick={() => setView("previous")}>📜הודעות </button>
      </div>

      {view === "form" && (
        <form
          onSubmit={handleSubmit}
          className="request-form"
          encType="multipart/form-data"
        >
          <label>מתאריך:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            required
          />

          <label>עד תאריך:</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            required
          />

          <label>סיבה:</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
          <label>צירוף קובץ (לא חובה):</label>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <button type="submit">שלח פנייה</button>
        </form>
      )}

      {view === "previous" && (
        <div className="messages-list">
          {messages.length === 0 ? (
            <p>אין הודעות קודמות להצגה.</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="message-card">
                <p>
                  <strong>טווח תאריכים:</strong>{" "}
                  {new Date(msg.from_date).toLocaleDateString("he-IL")} -{" "}
                  {new Date(msg.to_date).toLocaleDateString("he-IL")}
                </p>
                <p>
                  <strong>סיבה:</strong> {msg.reason}
                </p>
                {msg.file_path && (
                  <p>
                    <strong>קובץ:</strong>{" "}
                    <a
                      href={`/uploads/${msg.file_path}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      📎 לצפייה
                    </a>
                  </p>
                )}
                <p>
                  <strong>תגובה מהמנהל:</strong>{" "}
                  {!msg.response && msg.status === "pending"
                    ? "טרם התקבלה תגובה"
                    : msg.response}
                </p>

                <p>
                  <strong>סטטוס הפנייה:</strong>{" "}
                  {msg.status === "approved"
                    ? "✅ מנהל קיבל את האילוץ"
                    : msg.status === "rejected"
                    ? "❌ הפנייה נדחתה"
                    : "⏳ ממתינה לטיפול"}
                </p>

                {msg.manager_comment && (
                  <p>
                    <strong>הערת מנהל:</strong> {msg.manager_comment}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default MessagesRequest;
