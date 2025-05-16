// workers.js - נתיבי שרת מותאמים לרכיב Arrangement.jsx
const express = require("express");
const router = express.Router();
const db = require("../dbSingleton").getConnection("products_db");
const { isAuthenticated, checkRole } = require("./middleware");

// שמירה (הוספה / עדכון) של משמרות
router.post("/save", isAuthenticated, checkRole("admin"), (req, res) => {
  const data = req.body;
  if (!Array.isArray(data))
    return res.status(400).json({ error: "Invalid data" });

  // שלב 1: בדיקה כפילויות באותו יום
  const shiftMap = new Map();
  for (const row of data) {
    const key = `${row.user_id}-${row.date}`;
    if (shiftMap.has(key)) {
      return res.status(400).json({
        error: "שיבוץ כפול",
        message: `👮 העובד עם מזהה ${row.user_id} שובץ יותר מפעם אחת ביום ${row.date}`,
      });
    }
    shiftMap.set(key, true);
  }

  // שלב 2: המשך השמירה כרגיל אם אין כפילויות
  const sql = `
    INSERT INTO workers_schedule (day, shift_type, employee_name, user_id, week_start, date, hours)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      employee_name = VALUES(employee_name),
      user_id = VALUES(user_id),
      hours = VALUES(hours),
      date = VALUES(date)
  `;

  let completed = 0;
  data.forEach((r) => {
    db.query(
      sql,
      [
        r.day,
        r.shift_type,
        r.employee_name,
        r.user_id,
        r.week_start,
        r.date,
        r.hours,
      ],
      (err) => {
        if (err) console.error("DB Error:", err.message);
        completed++;
        if (completed === data.length) res.json({ message: "Saved" });
      }
    );
  });
});


// שליפת משמרות לפי תאריך שבועי
// שליפת משמרות לפי תאריך שבועי
router.get("/", isAuthenticated, (req, res) => {
  const { week_start } = req.query;

  console.log("📥 GET /schedule");
  console.log("🔍 week_start:", week_start);
  console.log("👤 req.user:", req.user);

  if (!week_start) {
    console.error("❌ week_start missing from query");
    return res.status(400).json({ error: "Missing week_start" });
  }

  if (!req.user || !req.user.role) {
    console.error("❌ req.user or req.user.role is undefined");
    return res
      .status(401)
      .json({ error: "Unauthorized - user not found in session" });
  }

  const isAdmin = req.user.role === "admin";
  const sql = isAdmin
    ? "SELECT * FROM workers_schedule WHERE week_start = ?"
    : "SELECT * FROM workers_schedule WHERE week_start = ? AND user_id = ?";
  const params = isAdmin ? [week_start] : [week_start, req.user.id];

  console.log("📤 SQL:", sql);
  console.log("📦 Params:", params);

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("❌ DB error:", err.message);
      return res.status(500).json({ error: "DB error", message: err.message });
    }

    console.log("✅ Schedule rows:", results.length);
    res.json(results);
  });
});

// שליפת כל העובדים עבור המנהל בלבד
router.get("/users", isAuthenticated, checkRole("admin"), (req, res) => {
  db.query(
    "SELECT id, first_name, last_name FROM users WHERE role = 'user'",
    (err, results) => {
      if (err) return res.status(500).json({ error: "User fetch failed" });
      res.json(results);
    }
  );
});

router.delete(
  "/delete/:id",
  isAuthenticated,
  checkRole("admin"),
  (req, res) => {
    const { id } = req.params;

    db.query(
      "DELETE FROM workers_schedule WHERE id = ?",
      [id],
      (err, result) => {
        if (err) {
          console.error("Delete error:", err.message);
          return res.status(500).json({ error: "Server error" });
        }

        res.json({ success: true });
      }
    );
  }
);


module.exports = router;
