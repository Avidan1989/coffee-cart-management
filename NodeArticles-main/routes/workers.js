// workers.js - נתיבי שרת מותאמים לרכיב Arrangement.jsx
const express = require("express");
const router = express.Router();
const db = require("../dbSingleton").getConnection("products_db");
const { isAuthenticated, checkRole } = require("./middleware");

// שמירה (הוספה / עדכון) של משמרות
router.post("/save", isAuthenticated, checkRole("admin"), async (req, res) => {
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
    const checkConstraintSql = `
  SELECT 1 FROM employee_requests
  WHERE user_id = ? AND status != 'rejected'
    AND ? BETWEEN from_date AND to_date
`;

    const hasConstraint = await new Promise((resolve, reject) => {
      db.query(checkConstraintSql, [row.user_id, row.date], (err, results) => {
        if (err) return reject(err);
        resolve(results.length > 0);
      });
    });

    if (hasConstraint) {
      return res.status(400).json({
        error: "אילוץ קיים",
        message: `⛔ העובד עם מזהה ${row.user_id} שלח אילוץ בתאריך ${row.date}`,
      });
    }

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



// שליפת אילוצים לפי טווח תאריכים
router.get("/constraints", isAuthenticated, checkRole("admin"), (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: "חסרים פרמטרים from או to" });
  }

  const sql = `
    SELECT * FROM employee_requests
    WHERE status != 'rejected' AND (
      (from_date BETWEEN ? AND ?) OR
      (to_date BETWEEN ? AND ?) OR
      (? BETWEEN from_date AND to_date)
    )
  `;

  db.query(sql, [from, to, from, to, from], (err, results) => {
    if (err) {
      console.error("שגיאה בשליפת אילוצים:", err);
      return res.status(500).json({ error: "שגיאה בשליפת אילוצים" });
    }

    res.json(results);
  });
});



// שחרור אילוץ לפי מזהה הפנייה
router.put("/unlock/:id", isAuthenticated, checkRole("admin"), (req, res) => {
  const { id } = req.params;

  const sql = `
    UPDATE employee_requests
    SET status = 'rejected'
    WHERE id = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("❌ שגיאה בעדכון סטטוס לאילוץ:", err.message);
      return res.status(500).json({ error: "שגיאה בעדכון אילוץ" });
    }

    res.json({ message: "האילוץ שוחרר בהצלחה" });
  });
});











module.exports = router;
