import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "../assets/styles/MessagesRequest.css";

function MessagesRequest() {
  const [reason, setReason] = useState("");
  const [date, setDate] = useState("");
  const [file, setFile] = useState(null);
  const [view, setView] = useState("form");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (view === "previous") {
      fetch("/messages-requests/my-requests", {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => setMessages(data))
        .catch((err) => {
          toast.error("שגיאה בשליפת ההודעות");
        });
    }
  }, [view]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("reason", reason);
    formData.append("date", date);
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
        setDate("");
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
          <label>תאריך:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
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
                  <strong>תאריך:</strong>{" "}
                  {new Date(msg.date).toLocaleDateString("he-IL")}
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
                    ? "✅ הפנייה אושרה"
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
