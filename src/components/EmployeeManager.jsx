import React, { useEffect, useState } from "react";
import "../assets/styles/EmployeeManager.css";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

function EmployeeManager() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate(); // מאפשר ניווט מתכנות
  const [selectedUserId, setSelectedUserId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("permissions");
  const [subTab, setSubTab] = useState(""); // 'edit' or 'actions'
  const [messages, setMessages] = useState([]);
  const [editData, setEditData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "",
    role: "user",
  });

  useEffect(() => {
    fetch("/employee-manager/all-users", { credentials: "include" })
      .then((res) => res.json())
      .then(setUsers)
      .catch(() => toast.error("שגיאה בשליפת משתמשים"));
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      const selectedUser = users.find((u) => u.id === selectedUserId);
      if (selectedUser) {
        setEditData({
          first_name: selectedUser.first_name || "",
          last_name: selectedUser.last_name || "",
          username: selectedUser.username || "",
          email: selectedUser.email || "",
          password: "",
          role: selectedUser.role || "user",
        });
      }
    }
  }, [selectedUserId, users]);

  useEffect(() => {
    if (activeTab === "requests" && selectedUserId) {
      fetch(`/employee-manager/requests`, { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          const filtered = data.filter((m) => m.user_id === selectedUserId);
          setMessages(filtered);
        })
        .catch(() => toast.error("שגיאה בשליפת פניות"));
    }
  }, [activeTab, selectedUserId]);

  useEffect(() => {
    if (subTab === "edit") {
      setEditData((prev) => ({
        ...prev,
        password: "",
      }));
    }
  }, [subTab]);

  const handleBlock = () => {
    if (!selectedUserId) return;
    fetch(`/employee-manager/block/${selectedUserId}`, {
      method: "PUT",
      credentials: "include",
    })
      .then((res) => res.json())
      .then(() => {
        toast.success("נחסם בהצלחה");
        setUsers((prev) =>
          prev.map((u) => (u.id === selectedUserId ? { ...u, active: 0 } : u))
        );
      });
  };

  const handleRestore = () => {
    if (!selectedUserId) return;
    fetch(`/employee-manager/restore/${selectedUserId}`, {
      method: "PUT",
      credentials: "include",
    })
      .then((res) => res.json())
      .then(() => {
        toast.success("הוחזר בהצלחה");
        setUsers((prev) =>
          prev.map((u) => (u.id === selectedUserId ? { ...u, active: 1 } : u))
        );
      });
  };

  const handleSaveChanges = () => {
    if (!selectedUserId) return;

    const userBeforeEdit = users.find((u) => u.id === selectedUserId);
    const isPasswordChanged = editData.password.trim() !== "";
    const changes = [];

    if (userBeforeEdit.first_name !== editData.first_name)
      changes.push("שם פרטי");
    if (userBeforeEdit.last_name !== editData.last_name)
      changes.push("שם משפחה");
    if (userBeforeEdit.username !== editData.username) changes.push("שם משתמש");
    if (userBeforeEdit.email !== editData.email) changes.push("אימייל");
    if (userBeforeEdit.role !== editData.role) changes.push("תפקיד");
    if (isPasswordChanged) {
      changes.push("סיסמה");
    }

    if (changes.length === 0) {
      toast.info("ℹ️ אין שינויים לשמירה.");
      return;
    }
    const dataToSend = { ...editData };
    if (
      !editData.password ||
      editData.password.trim() === "" ||
      editData.password === ""
    ) {
      delete dataToSend.password;
    }
    fetch(`/employee-manager/update-user/${selectedUserId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(dataToSend),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Network Error");
        return res.json();
      })
      .then(() => {
        const fields = changes.filter((c) => c !== "סיסמה");
        if (isPasswordChanged) fields.push("סיסמה");

        if (fields.length > 0) {
          const message = `🟢 ${fields.join(", ")} עודכנו בהצלחה`;
          toast.success(message, { autoClose: 3000 });
        }

        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUserId
              ? {
                  ...u,
                  first_name: editData.first_name,
                  last_name: editData.last_name,
                  username: editData.username,
                  email: editData.email,
                  role: editData.role,
                }
              : u
          )
        );

        setSubTab(""); // סגירת תיבת העריכה
      })
      .catch(() => toast.error("❌ שגיאה בשמירת השינויים"));
  };

  const handleReply = async (id, responseText) => {
    if (!responseText) return;
    const res = await fetch(`/employee-manager/respond/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ response: responseText }),
    });
    if (res.ok) {
      toast.success("תגובה נשלחה");
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === id ? { ...msg, response: responseText } : msg
        )
      );
    } else {
      toast.error("שגיאה בשליחת תגובה");
    }
  };

  return (
    <div className="employee-manager-container">
      <h1 className="page-title">ניהול עובדים</h1>

      <div className="tab-buttons">
        <button
          className={activeTab === "permissions" ? "active" : ""}
          onClick={() => setActiveTab("permissions")}
        >
          ניהול הרשאות
        </button>

        <button
          className={activeTab === "requests" ? "active" : ""}
          onClick={() => navigate("/employee-manager/requests")}
        >
          ניהול פניות
        </button>
      </div>
      <div className="tab-content">
        {activeTab === "permissions" && (
          <>
            <input
              type="text"
              placeholder="חפש לפי שם או משתמש..."
              value={searchTerm}
              onChange={(e) => {
                const text = e.target.value;
                setSearchTerm(text);

                const filtered = users.filter((u) =>
                  `${u.first_name} ${u.last_name} ${u.username}`
                    .toLowerCase()
                    .includes(text.toLowerCase())
                );

                if (
                  filtered.length === 1 &&
                  filtered[0].id !== selectedUserId
                ) {
                  setSelectedUserId(filtered[0].id);
                }
              }}
              className="user-search-input"
            />
            <h3>בחר משתמש</h3>
            <select
              className="user-select-dropdown"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(Number(e.target.value))}
            >
              <option value="">בחר משתמש</option>
              {users
                .filter((u) => {
                  const fullName =
                    `${u.first_name} ${u.last_name} ${u.username}`.toLowerCase();
                  return fullName.includes(searchTerm.toLowerCase());
                })
                .map((u) => (
                  <option
                    key={u.id}
                    value={u.id}
                    style={{
                      color: u.active ? "black" : "#a0a0a0", // אפור בהיר לחסום
                      fontStyle: u.active ? "normal" : "italic", // נטוי אם חסום
                    }}
                  >
                    {u.first_name} {u.last_name} - {u.username} (
                    {u.active ? "פעיל" : "חסום"})
                  </option>
                ))}
            </select>

            {selectedUserId && (
              <>
                <div className="sub-tab-buttons">
                  <button onClick={() => setSubTab("actions")}>
                    ניהול הרשאות
                  </button>
                  <button onClick={() => setSubTab("edit")}>עריכת משתמש</button>
                </div>

                {subTab === "actions" && (
                  <div className="actions-box">
                    <button className="close-btn" onClick={() => setSubTab("")}>
                      ✖
                    </button>
                    <button className="block-btn" onClick={handleBlock}>
                      חסום
                    </button>
                    <button className="restore-btn" onClick={handleRestore}>
                      החזר
                    </button>
                  </div>
                )}

                {subTab === "edit" && (
                  <div className="edit-user-form">
                    <button className="close-btn" onClick={() => setSubTab("")}>
                      ✖
                    </button>
                    <h3>עריכת פרטי משתמש</h3>
                    <label>שם פרטי:</label>
                    <input
                      type="text"
                      value={editData.first_name}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          first_name: e.target.value,
                        }))
                      }
                    />
                    <label>שם משפחה:</label>
                    <input
                      type="text"
                      value={editData.last_name}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          last_name: e.target.value,
                        }))
                      }
                    />
                    <label>שם משתמש:</label>
                    <input
                      type="text"
                      value={editData.username}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                    />
                    <label>אימייל:</label>
                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                    />
                    <label>סיסמה חדשה:</label>
                    <input
                      type="password"
                      value={editData.password}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                    />
                    <div className="role-selection">
                      <label>
                        <input
                          type="radio"
                          value="admin"
                          checked={editData.role === "admin"}
                          onChange={() =>
                            setEditData((prev) => ({
                              ...prev,
                              role: "admin",
                            }))
                          }
                        />
                        מנהל
                      </label>
                      <label>
                        <input
                          type="radio"
                          value="user"
                          checked={editData.role === "user"}
                          onChange={() =>
                            setEditData((prev) => ({
                              ...prev,
                              role: "user",
                            }))
                          }
                        />
                        עובד
                      </label>
                    </div>
                    <button className="save-btn" onClick={handleSaveChanges}>
                      שמור שינויים
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === "requests" && (
          <div className="tab-section">
            <h3>ניהול פניות</h3>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(Number(e.target.value))}
            >
              <option value="">בחר עובד</option>
              {users
                .filter((u) => u.role !== "admin")
                .map((u) => {
                  const hasUnanswered = messages.some(
                    (m) => m.user_id === u.id && !m.response
                  );
                  return (
                    <option
                      key={u.id}
                      value={u.id}
                      style={{ color: hasUnanswered ? "red" : "black" }}
                    >
                      {u.first_name} {u.last_name} - {u.username}
                      {hasUnanswered ? " ⚠️" : ""}
                    </option>
                  );
                })}
            </select>

            <div className="request-list-scroll">
              {messages.length === 0 && <p>אין פניות להצגה.</p>}
              {messages.map((msg) => (
                <div className="request-card" key={msg.id}>
                  <p>
                    <strong>מאת:</strong> {msg.first_name} {msg.last_name} (
                    {msg.username})
                  </p>
                  <p>
                    <strong>תאריך:</strong> {msg.date}
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
                        rel="noopener noreferrer"
                      >
                        לצפייה
                      </a>
                    </p>
                  )}
                  <p>
                    <strong>תגובה:</strong>{" "}
                    {msg.response ? (
                      msg.response
                    ) : (
                      <SendReply id={msg.id} onReply={handleReply} />
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SendReply({ id, onReply }) {
  const [text, setText] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <textarea
        placeholder="כתוב תגובה..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ marginBottom: "10px", padding: "5px" }}
      />
      <button onClick={() => onReply(id, text)}>שלח</button>
    </div>
  );
}

export default EmployeeManager;
