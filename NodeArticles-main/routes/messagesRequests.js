const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
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
  const { reason, date } = req.body;
  const filePath = req.file ? req.file.filename : null;

  if (!reason || !date) {
    return res.status(400).json({ error: "יש למלא תאריך וסיבה" });
  }

  const sql = `
    INSERT INTO employee_requests (user_id, reason, date, file_path)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [userId, reason, date, filePath], (err) => {
    if (err) {
      console.error("שגיאה בשמירה ל־DB:", err);
      return res.status(500).json({ error: "שגיאה בשמירה" });
    }

    res.status(201).json({ message: "הפנייה נשלחה" });
  });
});

// 🆕 שליפת ההודעות של העובד הנוכחי
router.get("/my-requests", isAuthenticated, (req, res) => {
  const userId = req.session.user?.id;

  const sql = `
    SELECT id, date, reason, file_path, response, status, manager_comment
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
