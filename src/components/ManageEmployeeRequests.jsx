import React, { useEffect, useState } from "react";
import "../assets/styles/ManageEmployeeRequests.css";

function ManageEmployeeRequests() {
  const [employees, setEmployees] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [requests, setRequests] = useState([]);
  const [managerComments, setManagerComments] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showOldMessages, setShowOldMessages] = useState(false);

  useEffect(() => {
    fetch("/employee-manager/requests/employees", { credentials: "include" })
      .then((res) => res.json())
      .then(setEmployees)
      .catch(console.error);
  }, []);

  const fetchRequestsForUser = (id) => {
    setSelectedUserId(id);
    fetch(`/employee-manager/requests/${id}`, { credentials: "include" })
      .then((res) => res.json())
      .then(setRequests)
      .catch(console.error);
  };

  const handleDecision = (requestId, status) => {
    const comment = managerComments[requestId] || "";
    const selectedId = Number(selectedUserId);

    fetch(`/employee-manager/requests/decision/${requestId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status, manager_comment: comment }),
    })
      .then((res) => res.json())
      .then(() => {
        let wasPending = false;

        const updatedRequests = requests.map((req) => {
          if (req.id === requestId) {
            if (req.status === "pending") wasPending = true;
            return { ...req, status, manager_comment: comment };
          }
          return req;
        });

        setRequests(updatedRequests);

        if (wasPending) {
          setEmployees((prev) =>
            prev.map((emp) =>
              emp.id === selectedId && emp.pending_count > 0
                ? { ...emp, pending_count: emp.pending_count - 1 }
                : emp
            )
          );
        }

        setManagerComments((prev) => ({ ...prev, [requestId]: "" }));
      });
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const oldRequests = requests.filter((r) => r.status !== "pending");

  return (
    <div className="manage-requests-container">
      <h1 className="manage-requests-title">ניהול פניות עובדים</h1>

      <div className="manage-requests-topbar">
        <input
          type="text"
          className="search-input"
          placeholder="חפש לפי שם..."
          value={searchTerm}
          onChange={(e) => {
            const text = e.target.value;
            setSearchTerm(text);

            const filtered = employees.filter((emp) =>
              `${emp.first_name} ${emp.last_name}`
                .toLowerCase()
                .includes(text.toLowerCase())
            );

            if (filtered.length === 1) {
              const matchedId = filtered[0].id;
              if (matchedId !== selectedUserId) {
                setSelectedUserId(matchedId);
                fetchRequestsForUser(matchedId);
              }
            }
          }}
        />

        <select
          className="search-input"
          onChange={(e) => {
            const id = Number(e.target.value);
            setSelectedUserId(id);
            fetchRequestsForUser(id);
          }}
          value={selectedUserId || ""}
        >
          <option value="">בחר עובד</option>
          {employees
            .filter((emp) =>
              `${emp.first_name} ${emp.last_name}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
            )
            .map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.first_name} {emp.last_name}
                {emp.pending_count > 0 ? ` 🔔` : ""} ({emp.pending_count} פניות)
              </option>
            ))}
        </select>
      </div>

      {pendingRequests.length > 0 && (
        <div className="manage-requests-list">
          {pendingRequests.map((r) => (
            <div className="manage-requests-card" key={r.id}>
              <p>
                <strong>תאריך אילוץ:</strong>{" "}
                {new Date(r.date).toLocaleDateString("he-IL")}
              </p>
              <p>
                <strong>סיבה:</strong> {r.reason}
              </p>
              {r.file_path && (
                <p>
                  <strong>קובץ:</strong>
                  <a
                    href={`/uploads/${r.file_path}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    📎 לצפייה
                  </a>
                </p>
              )}
              <p>
                <strong>סטטוס:</strong> {renderStatus(r.status)}
              </p>
              <p>
                <strong>תגובה קודמת:</strong> {r.manager_comment || "אין"}
              </p>

              <div className="manage-requests-response">
                <textarea
                  placeholder="כתוב תגובת מנהל..."
                  value={managerComments[r.id] || ""}
                  onChange={(e) =>
                    setManagerComments((prev) => ({
                      ...prev,
                      [r.id]: e.target.value,
                    }))
                  }
                />
                <div className="manage-requests-buttons">
                  <button
                    className="manage-requests-approve"
                    onClick={() => handleDecision(r.id, "approved")}
                  >
                    ✅ מאשר
                  </button>
                  <button
                    className="manage-requests-reject"
                    onClick={() => handleDecision(r.id, "rejected")}
                  >
                    ❌ דוחה
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {requests.length > 0 && (
        <button
          className="toggle-old-messages-btn"
          onClick={() => setShowOldMessages((prev) => !prev)}
        >
          {showOldMessages ? "הסתר הודעות ישנות" : "צפייה בהודעות ישנות"}
        </button>
      )}

      {showOldMessages && (
        <div className="manage-requests-list">
          {oldRequests.map((r) => (
            <div className="manage-requests-card old-message" key={r.id}>
              <p>
                <strong>תאריך:</strong>{" "}
                {new Date(r.date).toLocaleDateString("he-IL")}
              </p>
              <p>
                <strong>סיבה:</strong> {r.reason}
              </p>
              <p>
                <strong>סטטוס:</strong> {renderStatus(r.status)}
              </p>
              <p>
                <strong>תגובה מנהל:</strong> {r.manager_comment || "אין"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function renderStatus(status) {
  switch (status) {
    case "approved":
      return <span className="status-approved">✅ אושר</span>;
    case "rejected":
      return <span className="status-rejected">❌ נדחה</span>;
    default:
      return <span className="status-pending">⏳ממתין לאישור</span>;
  }
}

export default ManageEmployeeRequests;
