const express = require("express");
const router = express.Router();
const multer = require("multer");
const db = require("../dbSingleton").getConnection("products_db");
const { isAuthenticated } = require("./middleware");

// הגדרת אחסון לקבצים
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // מגבלת קובץ: 5MB
});

// שליחת פנייה עם קובץ
router.post("/send", isAuthenticated, upload.single("file"), (req, res) => {
  const userId = req.session.user?.id;
  const { reason, fromDate, toDate } = req.body;
  const filePath = req.file ? req.file.filename : null;

  if (!reason || !fromDate || !toDate) {
    return res.status(400).json({ error: "יש למלא סיבה וטווח תאריכים" });
  }

  const checkOverlapSql = `
    SELECT id FROM employee_requests
    WHERE user_id = ? AND status != 'rejected'
    AND (
      (from_date BETWEEN ? AND ?) OR
      (to_date BETWEEN ? AND ?) OR
      (? BETWEEN from_date AND to_date)
    )
  `;

  db.query(
    checkOverlapSql,
    [userId, fromDate, toDate, fromDate, toDate, fromDate],
    (err, results) => {
      if (err) return res.status(500).json({ error: "שגיאה בבדיקת כפילויות" });

      if (results.length > 0) {
        return res.status(400).json({ error: "כבר שלחת אילוץ בטווח הזה" });
      }

      // המשך הכנסת הפנייה
      const sql = `
        INSERT INTO employee_requests (user_id, reason, from_date, to_date, file_path, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'pending', NOW())
      `;

      db.query(sql, [userId, reason, fromDate, toDate, filePath], (err) => {
        if (err) return res.status(500).json({ error: "שגיאה בשמירה" });
        res.status(201).json({ message: "הפנייה נשלחה" });
      });
    }
  );
});

// 🆕 שליפת ההודעות של העובד הנוכחי
router.get("/my-requests", isAuthenticated, (req, res) => {
  const userId = req.session.user?.id;

  const sql = `
  SELECT id, reason, file_path, response, status, manager_comment, from_date, to_date, created_at
  FROM employee_requests
  WHERE user_id = ?
  ORDER BY created_at DESC
`;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("שגיאה בשליפת ההודעות:", err);
      return res.status(500).json({ error: "שגיאה בשליפת ההודעות" });
    }

    res.json(results);
  });
});






module.exports = router;
