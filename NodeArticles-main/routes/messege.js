// routes/messege.js
const express = require("express");
const router = express.Router();
const dbSingleton = require("../dbSingleton");
require("dotenv").config();
const db = dbSingleton.getConnection("products_db");
const { isAuthenticated } = require("./middleware");

// הוספת לקוח חדש
router.post("/add-customer", isAuthenticated, (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ message: "נא למלא את כל השדות" });
  }

  const insertQuery = `INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)`;
  db.query(insertQuery, [name, email, phone], (err, results) => {
    if (err) {
      console.error("שגיאה בהוספת לקוח:", err);
      return res.status(500).json({ message: "שגיאה בהוספת לקוח" });
    }
    res.status(201).json({ message: "✔️ לקוח נוסף בהצלחה" });
  });
});

module.exports = router;
