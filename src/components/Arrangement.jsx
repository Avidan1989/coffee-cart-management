// Arrangement.jsx (React)
import React, { useContext, useEffect, useState } from "react";
import "../assets/styles/Arrangement.css";
import { AuthContext } from "./AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Arrangement() {
  const { user } = useContext(AuthContext);
  const [allUsers, setAllUsers] = useState([]);
  const [scheduleData, setScheduleData] = useState([]);
  const [weekStart, setWeekStart] = useState(
    () => localStorage.getItem("weekStart") || ""
  );
  const [datesForWeek, setDatesForWeek] = useState([]);
  const [constraints, setConstraints] = useState([]);

  function getWeekEnd(startDate) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + 6);
    return d.toISOString().split("T")[0];
  }
  useEffect(() => {
    if (user?.role !== "admin" || !weekStart) return;

    fetch(
      `/workers/constraints?from=${weekStart}&to=${getWeekEnd(weekStart)}`,
      {
        credentials: "include",
      }
    )
      .then((res) => res.json())
      .then(setConstraints)
      .catch(() => toast.error("שגיאה בשליפת אילוצים"));
  }, [user, weekStart]);

  function hasConstraint(userId, date) {
    return constraints.some(
      (c) =>
        c.user_id === userId &&
        new Date(date) >= new Date(c.from_date) &&
        new Date(date) <= new Date(c.to_date)
    );
  }
  const unlockConstraint = async (constraintId) => {
    try {
      const res = await fetch(`/workers/unlock/${constraintId}`, {
        method: "PUT",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "שגיאה לא ידועה");
      }

      toast.success("האילוץ שוחרר בהצלחה");

      // ❗ חובה להסיר מהסטייט כדי לעדכן את התצוגה
      setConstraints((prev) => prev.filter((c) => c.id !== constraintId));
    } catch (err) {
      console.error("שגיאה בשחרור האילוץ:", err);
      toast.error("שגיאה בשחרור האילוץ");
    }
  };
  

  const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  const shifts = ["בוקר", "צהריים", "ערב"];
  const shiftHoursMap = {
    בוקר: ["07:00-13:00", "08:00-14:00", "09:00-15:00"],
    צהריים: ["13:00-19:00", "14:00-20:00"],
    ערב: ["15:00-21:00", "16:00-22:00", "17:00-23:00"],
  };

  useEffect(() => {
    if (!user || !weekStart) return;
    fetch(`/schedule?week_start=${weekStart}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) =>
        Array.isArray(data) ? setScheduleData(data) : setScheduleData([])
      )
      .catch(() => toast.error("שגיאה בטעינת המשמרות"));

    if (user.role === "admin") {
      fetch("/schedule/users", { credentials: "include" })
        .then((res) => res.json())
        .then(setAllUsers)
        .catch(() => toast.error("שגיאה בטעינת העובדים"));
    }
  }, [user, weekStart]);

  useEffect(() => {
    if (!weekStart) return;
    const baseDate = new Date(weekStart);
    const sunday = new Date(baseDate);
    sunday.setDate(baseDate.getDate() - baseDate.getDay());
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + i);
      dates.push(date.toISOString().split("T")[0]);
    }
    setDatesForWeek(dates);
  }, [weekStart]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;

    const today = new Date();
    const daysList = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
    const todayDay = daysList[today.getDay()];
    const reminderDay = localStorage.getItem("reminderDay");

    if (reminderDay && todayDay === reminderDay) {
      fetch(`/schedule?week_start=${weekStart}`, { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          if (!Array.isArray(data) || data.length === 0) {
            // במקום טוסט, רק רושם ללוג – אפשר גם לעדכן state אם רוצים חיווי במסך
            console.log("🔔 אין סידור עבודה לשבוע זה");
          }
        })
        .catch(() => {
          console.warn("שגיאה בבדיקת סידור קיים לתזכורת");
        });
    }
  }, [user, weekStart]);

  // ⬅️ כולל user כאן, כי אנחנו בודקים את user.role

  const getShiftData = (day, shiftType) =>
    scheduleData.find((r) => r.day === day && r.shift_type === shiftType);

  const updateShift = (day, shiftType, employee_name) => {
    const selectedUser = allUsers.find(
      (u) =>
        `${u.first_name} ${u.last_name}`.trim().toLowerCase() ===
        employee_name.trim().toLowerCase()
    );

    const user_id = selectedUser ? selectedUser.id : undefined;

    setScheduleData((prev) => {
      const updated = [...prev];
      const idx = updated.findIndex(
        (r) => r.day === day && r.shift_type === shiftType
      );
      if (idx !== -1) {
        updated[idx].employee_name = employee_name;
        updated[idx].user_id = user_id; // 💥 שמירה של user_id
      } else {
        updated.push({
          id: undefined,
          day,
          shift_type: shiftType,
          employee_name,
          user_id, // 💥 כאן מוסיפים
          hours: "",
          week_start: weekStart,
        });
      }
      return updated;
    });
  };
  

  const updateHours = (day, shiftType, part, value) => {
    setScheduleData((prev) => {
      const updated = [...prev];
      const idx = updated.findIndex(
        (r) => r.day === day && r.shift_type === shiftType
      );

      if (idx !== -1) {
        if (part === "full") {
          updated[idx].hours = value;
        } else {
          const parts = updated[idx].hours?.split("-") || ["", ""];
          parts[part === "start" ? 0 : 1] = value;
          updated[idx].hours = `${parts[0]}-${parts[1]}`;
        }
      } else {
        const hours =
          part === "full"
            ? value
            : part === "start"
            ? `${value}-`
            : `-${value}`;

        updated.push({
          id: undefined,
          day,
          shift_type: shiftType,
          employee_name: "",
          hours,
          week_start: weekStart,
        });
      }

      return updated;
    });
  };

  const deleteShift = (day, shiftType) => {
    const shift = scheduleData.find(
      (r) => r.day === day && r.shift_type === shiftType
    );

    if (!shift || !shift.id) return;

    // מחיקת שיבוץ מהשרת
    fetch(`/workers/delete/${shift.id}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("מחיקה נכשלה");
        toast.success("המשמרת נמחקה");
        // מחיקת השיבוץ מהסטייט
        setScheduleData((prev) =>
          prev.filter((r) => r.day !== day || r.shift_type !== shiftType)
        );
      })
      .catch(() => toast.error("שגיאה במחיקת המשמרת"));
  };

  const handleSave = async () => {
    const userIdMap = {};
    allUsers.forEach(
      (u) => (userIdMap[`${u.first_name} ${u.last_name}`] = u.id)
    );

    const rows = [];

    days.forEach((day, i) => {
      shifts.forEach((shift) => {
        const match = getShiftData(day, shift);
        if (match?.employee_name && match?.hours) {
          rows.push({
            day,
            shift_type: shift,
            employee_name: match.employee_name,
            user_id: userIdMap[match.employee_name],
            hours: match.hours,
            week_start: weekStart,
            date: datesForWeek[i],
          });
        }
      });
    });

    // ✅ הבדיקה מגיעה עכשיו אחרי ש־rows התמלא
    // ✅ בדיקות חוקיות משמרות
    const seen = new Set();
    const shiftsByUser = {}; // לשימוש עבור כללים נוספים

    for (const row of rows) {
      const key = `${row.user_id}-${row.date}`;
      if (seen.has(key)) {
        toast.error(
          `⚠️ ${row.employee_name} שובץ ביותר ממשמרת אחת ביום ${row.date}`
        );
        return;
      }
      seen.add(key);

      // ארגון לפי עובד
      if (!shiftsByUser[row.user_id]) shiftsByUser[row.user_id] = [];
      shiftsByUser[row.user_id].push({ ...row });
    }

    // כללים מתקדמים
    for (const userId in shiftsByUser) {
      const shifts = shiftsByUser[userId].sort((a, b) =>
        a.date.localeCompare(b.date)
      );
      let totalHours = 0;
      let consecutiveEvenings = 0;
      let prevShiftEndHour = null;
      let prevDate = null;
      let prevShiftType = null;

      const uniqueDates = new Set();

      for (let i = 0; i < shifts.length; i++) {
        const { date, hours, shift_type, employee_name } = shifts[i];

        uniqueDates.add(date); // כל יום עבודה של העובד

        // שעות כוללות
        const [startStr, endStr] = hours.split("-");
        const [startH, startM] = startStr.split(":").map(Number);
        const [endH, endM] = endStr.split(":").map(Number);
        const duration = endH + endM / 60 - (startH + startM / 60);
        totalHours += duration;

        // מנוחה יומית – לפחות 8 שעות בין שיבוצים
        if (prevDate) {
          const prev = new Date(prevDate);
          const curr = new Date(date);
          const dayDiff = (curr - prev) / (1000 * 60 * 60 * 24);

          if (dayDiff === 0 && prevShiftEndHour !== null) {
            const [prevH, prevM] = prevShiftEndHour.split(":").map(Number);
            const restGap = startH + startM / 60 - (prevH + prevM / 60);
            if (restGap < 8) {
              toast.error(
                `⛔ ${employee_name} קיבל פחות מ־8 שעות מנוחה בין משמרות בתאריך ${date}`
              );
              return;
            }
          }
        }

        // מנוחה אחרי ערב/לילה
        if (prevDate && prevShiftType === "ערב" && shift_type === "בוקר") {
          const prev = new Date(prevDate);
          const curr = new Date(date);
          if ((curr - prev) / (1000 * 60 * 60 * 24) === 1) {
            toast.error(
              `⛔ ${employee_name} שובץ לבוקר אחרי ערב – אין מספיק מנוחה`
            );
            return;
          }
        }

        // שתי משמרות ערב רצופות לכל היותר
        if (shift_type === "ערב") {
          consecutiveEvenings++;
          if (consecutiveEvenings > 2) {
            toast.error(`⛔ ${employee_name} שובץ ליותר מ־2 ערבים רצופים`);
            return;
          }
        } else {
          consecutiveEvenings = 0;
        }

        prevDate = date;
        prevShiftEndHour = endStr;
        prevShiftType = shift_type;
      }

      // בדיקת מקסימום שעות שבועיות
      if (totalHours > 43) {
        toast.error(`⛔ ${shifts[0].employee_name} שובץ ליותר מ־43 שעות בשבוע`);
        return;
      }

      // בדיקת שבתון שבועי – אם עבד 7 ימים אז אין יום מנוחה
      if (uniqueDates.size >= 7) {
        toast.error(`⛔ ${shifts[0].employee_name} לא קיבל יום מנוחה השבוע`);
        return;
      }
    }

    try {
      const res = await fetch("/schedule/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(rows),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("❌ Save error:", errorData);
        toast.error("שגיאה בשמירת המשמרות");
        return;
      }

      toast.success("נשמר בהצלחה");

      const response = await fetch(`/schedule?week_start=${weekStart}`, {
        credentials: "include",
      });
      const data = await response.json();
      setScheduleData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("❌ Unexpected error during save:", error);
      toast.error("שגיאה כללית בשמירה");
    }
  };

  return (
    <div className="arrangement-container">
      <ToastContainer />
      <h1 className="arrangement-title">סידור עבודה שבועי</h1>

      {user?.role === "admin" && (
        <div className="reminder-setup">
          <label htmlFor="reminderDay">בחר יום קבוע להצגת תזכורת:</label>

          <select
            id="reminderDay"
            value={localStorage.getItem("reminderDay") || ""}
            onChange={(e) =>
              localStorage.setItem("reminderDay", e.target.value)
            }
          >
            <option value="">-- בחר יום --</option>
            {days.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>
      )}

      {user?.role === "admin" && (
        <input
          type="date"
          className="arrangement-date-input"
          value={weekStart}
          onChange={(e) => {
            setWeekStart(e.target.value);
            localStorage.setItem("weekStart", e.target.value);
          }}
        />
      )}
      {user?.role === "admin" && (
        <button className="save-buttonn" onClick={handleSave}>
          שמור שינויים
        </button>
      )}
      <div className="weekly-table-wrapper">
        <table className="weekly-table">
          <thead>
            <tr>
              <th>משמרת</th>
              {days.map((day, i) => (
                <th key={i}>
                  {day}
                  <br />
                  <span>{datesForWeek[i]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift) => (
              <tr key={shift} className={`shift-row shift-${shift}`}>
                <td className="shift-label">{shift}</td>
                {days.map((day) => {
                  const current = getShiftData(day, shift);

                  return (
                    <td key={day + shift} className="shift-cell">
                      {user?.role === "admin" ? (
                        <>
                          <div className="employee-select-wrapper">
                            <select
                              className="employee-select"
                              value={current?.employee_name || ""}
                              onChange={(e) =>
                                updateShift(day, shift, e.target.value)
                              }
                            >
                              <option value="" hidden></option>
                              {allUsers.map((u) => {
                                const fullName = `${u.first_name} ${u.last_name}`;
                                const date = datesForWeek[days.indexOf(day)];
                                const isBlocked = hasConstraint(u.id, date);

                                return (
                                  <option
                                    key={u.id}
                                    value={fullName}
                                    disabled={isBlocked}
                                    style={isBlocked ? { color: "#999" } : {}}
                                  >
                                    {fullName} {isBlocked ? "🔒 אילוץ" : ""}
                                  </option>
                                );
                              })}
                            </select>

                            {(() => {
                              const date = datesForWeek[days.indexOf(day)];

                              // מחפש אילוץ לפי כל המשתמשים האפשריים בתאריך הזה
                              const matchingConstraint = constraints.find(
                                (c) =>
                                  new Date(date) >= new Date(c.from_date) &&
                                  new Date(date) <= new Date(c.to_date)
                              );

                              return (
                                matchingConstraint && (
                                  <button
                                    className="eiluz"
                                    onClick={() =>
                                      unlockConstraint(matchingConstraint.id)
                                    }
                                    style={{
                                      marginTop: "6px",
                                      fontSize: "1rem", // ⬅️ גודל טקסט גדול יותר
                                      backgroundColor: "#ffc107",
                                      border: "none",
                                      padding: "8px 14px", // ⬅️ ריווח פנימי גדול יותר
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                      fontWeight: "bold", // ⬅️ טקסט מודגש
                                      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)", // ⬅️ צל קל
                                    }}
                                  >
                                    🔓 שחרר אילוץ
                                  </button>
                                )
                              );
                            })()}
                          </div>

                          {(() => {
                            const date = datesForWeek[days.indexOf(day)];
                            const selectedUser = allUsers.find(
                              (u) =>
                                `${u.first_name} ${u.last_name}`
                                  .trim()
                                  .toLowerCase() ===
                                (current?.employee_name || "")
                                  .trim()
                                  .toLowerCase()
                            );

                            const constraint = selectedUser
                              ? constraints.find((c) => {
                                  const currentDate = date;
                                  return (
                                    c.user_id === selectedUser.id &&
                                    currentDate >= c.from_date &&
                                    currentDate <= c.to_date
                                  );
                                })
                              : null;

                            // הדפסות דיבאג ברורות:
                            console.log("📅 תאריך המשמרת:", date);
                            console.log("👤 עובד שנבחר:", selectedUser);
                            console.log("📋 אילוצים זמינים:", constraints);
                            console.log("✅ אילוץ תואם שמצאנו:", constraint);

                            return (
                              constraint && (
                                <button
                                  onClick={() =>
                                    unlockConstraint(constraint.id)
                                  }
                                  className="unlock-button"
                                >
                                  🔓 שחרר אילוץ
                                </button>
                              )
                            );
                          })()}

                          <div className="time-range">
                            <select
                              value={current?.hours || ""}
                              onChange={(e) =>
                                updateHours(day, shift, "full", e.target.value)
                              }
                            >
                              <option value="">בחר שעות</option>
                              {(shiftHoursMap[shift] || []).map((range) => (
                                <option key={range} value={range}>
                                  {range}
                                </option>
                              ))}
                            </select>

                            <button
                              className="delete-shift-btn"
                              onClick={() => deleteShift(day, shift)}
                            >
                              🗑 מחק
                            </button>
                          </div>
                        </>
                      ) : current?.user_id === user?.id ? (
                        <div>
                          {current?.employee_name}
                          <br />
                          <small>{current?.hours}</small>
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Arrangement;
