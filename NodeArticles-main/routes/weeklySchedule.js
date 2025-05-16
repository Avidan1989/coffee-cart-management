const express = require("express");
const router = express.Router();
const dbSingleton = require("../dbSingleton");
const db = dbSingleton.getConnection("products_db");
const { isAuthenticated, checkRole } = require("./middleware");

// שליפת משמרות לכל המשתמשים (למנהל)
router.get("/", isAuthenticated, checkRole("admin"), (req, res) => {
  db.query(
    `SELECT 
       ws.*, 
       CONCAT(u.first_name, ' ', u.last_name) AS employee_name 
     FROM weekly_schedule ws 
     JOIN users u ON ws.user_id = u.id 
     ORDER BY ws.user_id, ws.day_name`,
    (err, results) => {
      if (err) return res.status(500).json({ error: "שגיאה בשליפה" });
      res.json(results);
    }
  );
});
// שליפת משמרות של משתמש רגיל (עובד)
router.get("/my", isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  db.query(
    `SELECT * FROM weekly_schedule WHERE user_id = ? ORDER BY FIELD(day_name, 'ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת')`,
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "שגיאה בשליפה" });
      res.json(results);
    }
  );
});

// שמירת כל הטבלה – למנהל בלבד
router.post("/save-table", isAuthenticated, checkRole("admin"), (req, res) => {
  const shifts = req.body;

  // מחיקה של כל הנתונים הישנים
  db.query("DELETE FROM weekly_schedule", (err) => {
    if (err) return res.status(500).json({ error: "שגיאה במחיקה" });

   const values = shifts
     .filter((r) => r.user_id && r.day_name)
     .map((r) => [
       r.user_id,
       r.employee_name || "", // הוסף גם שם העובד
       r.day_name,
       r.shift || null,
     ]);

    if (values.length === 0) return res.json({ message: "אין מה לשמור" });

    db.query(
      "INSERT INTO weekly_schedule (user_id, employee_name, day_name, shift) VALUES ?",
      [values],
      
      (err2) => {
        if (err2) return res.status(500).json({ error: "שגיאה בשמירה" });
        res.status(201).json({ message: "נשמר בהצלחה" });
      }
    );
  });
});

module.exports = router;
