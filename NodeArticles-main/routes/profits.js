// routes/profits.js
const express = require("express");
const router = express.Router();
const dbSingleton = require("../dbSingleton");
require("dotenv").config();
const db = dbSingleton.getConnection("products_db");
const { isAuthenticated } = require("./middleware");
const nodemailer = require("nodemailer");

// פונקציית שליחת מייל כללית
const sendMail = (subject, html, res) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"${subject}" <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
    subject: `${subject} - מערכת עגלת קפה`,
    html,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("שגיאה בשליחת מייל:", error);
      return res.status(500).json({ message: "שגיאה בשליחת מייל" });
    }
    console.log("מייל נשלח בהצלחה:", info.response);
    res.status(200).json({ message: "המייל נשלח בהצלחה" });
  });
};

// הוספת רווח יומי
router.post("/add", isAuthenticated, (req, res) => {
  const { date, dailyProfit } = req.body;
  if (!date || dailyProfit === undefined || dailyProfit === null) {
    return res.status(400).json({ message: "חסר תאריך או רווח" });
  }
  const normalizedDate = new Date(date).toISOString().split("T")[0];
  const checkQuery = `SELECT COUNT(*) AS count FROM daily_profits WHERE DATE(date) = ?`;
  db.query(checkQuery, [normalizedDate], (checkErr, checkResults) => {
    if (checkErr) {
      return res.status(500).json({ message: "שגיאה בשרת" });
    }
    if (checkResults[0].count > 0) {
      return res
        .status(409)
        .json({ message: "כבר קיים רווח ליום הזה בבסיס הנתונים" });
    }
    const insertQuery = `INSERT INTO daily_profits (date, dailyProfit) VALUES (?, ?)`;
    db.query(insertQuery, [normalizedDate, dailyProfit], (err) => {
      if (err) return res.status(500).json({ message: "שגיאה בשרת" });
      res.status(201).json({ message: "הרווח נשמר בהצלחה" });
    });
  });
});

// שליפת כל הרווחים
router.get("/", isAuthenticated, (req, res) => {
  const query = `SELECT * FROM daily_profits ORDER BY date DESC`;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: "שגיאה בשרת" });
    res.json(results);
  });
});

// שליחת דו"ח רווחים
router.post("/send-report", isAuthenticated, (req, res) => {
  const { startDate, endDate, total, vat, totalWithVat } = req.body;
  if (!startDate || !endDate || total === undefined) {
    return res.status(400).json({ message: 'חסרים נתונים לשליחת הדו"ח' });
  }
  const html = `
    <h2>דו"ח רווחים לפי תאריכים</h2>
    <p><strong>מתאריך:</strong> ${startDate}</p>
    <p><strong>עד תאריך:</strong> ${endDate}</p>
    <p><strong>סה"כ רווח:</strong> ₪${Number(total).toLocaleString()}</p>
    <p><strong>מע"מ:</strong> ₪${Number(vat).toLocaleString()}</p>
    <p><strong>סה"כ כולל מע"מ:</strong> ₪${Number(
      totalWithVat
    ).toLocaleString()}</p>
  `;
  sendMail("דוח רווחים", html, res);
});

// שליחת דו"ח הכנסות
router.post("/send-income-report", isAuthenticated, (req, res) => {
  const { startDate, endDate, total, vat, totalWithVat } = req.body;
  if (!startDate || !endDate || total === undefined) {
    return res.status(400).json({ message: 'חסרים נתונים לשליחת הדו"ח' });
  }
  const html = `
    <h2>דו"ח הכנסות</h2>
    <p><strong>מתאריך:</strong> ${startDate}</p>
    <p><strong>עד תאריך:</strong> ${endDate}</p>
    <p><strong>סה"כ הכנסות:</strong> ₪${Number(total).toLocaleString()}</p>
    <p><strong>מע"מ:</strong> ₪${Number(vat).toLocaleString()}</p>
    <p><strong>סה"כ כולל מע"מ:</strong> ₪${Number(
      totalWithVat
    ).toLocaleString()}</p>
  `;
  sendMail("דוח הכנסות", html, res);
});

// שליחת דו"ח הוצאות
router.post("/send-expense-report", isAuthenticated, (req, res) => {
  const { startDate, endDate, total, vat, totalWithVat } = req.body;
  if (!startDate || !endDate || total === undefined) {
    return res.status(400).json({ message: 'חסרים נתונים לשליחת הדו"ח' });
  }
  const html = `
    <h2>דו"ח הוצאות</h2>
    <p><strong>מתאריך:</strong> ${startDate}</p>
    <p><strong>עד תאריך:</strong> ${endDate}</p>
    <p><strong>סה"כ הוצאות:</strong> ₪${Number(total).toLocaleString()}</p>
    <p><strong>מע"מ:</strong> ₪${Number(vat).toLocaleString()}</p>
    <p><strong>סה"כ כולל מע"מ:</strong> ₪${Number(
      totalWithVat
    ).toLocaleString()}</p>
  `;
  sendMail("דוח הוצאות", html, res);
});

// הוספת הכנסה יומית
router.post("/income/add", isAuthenticated, (req, res) => {
  const { date, amount } = req.body;
  if (!date || amount === undefined || amount === null) {
    return res.status(400).json({ message: "חסר תאריך או סכום הכנסה" });
  }
  const normalizedDate = new Date(date).toISOString().split("T")[0];
  const checkQuery = `SELECT COUNT(*) AS count FROM daily_income WHERE DATE(date) = ?`;
  db.query(checkQuery, [normalizedDate], (checkErr, checkResults) => {
    if (checkErr) return res.status(500).json({ message: "שגיאה בשרת" });
    if (checkResults[0].count > 0) {
      return res.status(409).json({ message: "כבר קיימת הכנסה ליום הזה" });
    }
    const insertQuery = "INSERT INTO daily_income (date, amount) VALUES (?, ?)";
    db.query(insertQuery, [normalizedDate, amount], (err) => {
      if (err) return res.status(500).json({ message: "שגיאה בשרת" });
      res.status(201).json({ message: "ההכנסה נשמרה בהצלחה" });
    });
  });
});

// הוספת הוצאה יומית
router.post("/expense/add", isAuthenticated, (req, res) => {
  const { date, amount } = req.body;
  if (!date || amount === undefined || amount === null) {
    return res.status(400).json({ message: "חסר תאריך או סכום הוצאה" });
  }
  const normalizedDate = new Date(date).toISOString().split("T")[0];
  const checkQuery = `SELECT COUNT(*) AS count FROM daily_expenses WHERE DATE(date) = ?`;
  db.query(checkQuery, [normalizedDate], (checkErr, checkResults) => {
    if (checkErr) return res.status(500).json({ message: "שגיאה בשרת" });
    if (checkResults[0].count > 0) {
      return res.status(409).json({ message: "כבר קיימת הוצאה ליום הזה" });
    }
    const insertQuery =
      "INSERT INTO daily_expenses (date, amount) VALUES (?, ?)";
    db.query(insertQuery, [normalizedDate, amount], (err) => {
      if (err) return res.status(500).json({ message: "שגיאה בשרת" });
      res.status(201).json({ message: "ההוצאה נשמרה בהצלחה" });
    });
  });
});

// שליפת כל ההכנסות
router.get("/income", isAuthenticated, (req, res) => {
  const query =
    "SELECT id, DATE(date) AS date, amount FROM daily_income ORDER BY date DESC";
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: "שגיאה בשרת" });
    res.json(results);
  });
});

// שליפת כל ההוצאות
router.get("/expenses", isAuthenticated, (req, res) => {
  const query =
    "SELECT id, DATE(date) AS date, amount FROM daily_expenses ORDER BY date DESC";
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: "שגיאה בשרת" });
    res.json(results);
  });
});

module.exports = router;
