// routes/profits.js
const express = require("express");
const router = express.Router();
const dbSingleton = require("../dbSingleton");
require("dotenv").config();
const db = dbSingleton.getConnection("products_db");
const { isAuthenticated } = require("./middleware");
const nodemailer = require("nodemailer");

// הוספת רווח יומי
router.post("/add", isAuthenticated, (req, res) => {
  const { date, dailyProfit } = req.body;
  console.log("POST /profits/add body:", req.body); // ✅ הדפסה לבדיקה

  if (!date || dailyProfit === undefined || dailyProfit === null) {
    return res.status(400).json({ message: "חסר תאריך או רווח" });
  }

  const normalizedDate = new Date(date).toISOString().split("T")[0];

  const checkQuery = `SELECT COUNT(*) AS count FROM daily_profits WHERE DATE(date) = ?`;
  db.query(checkQuery, [normalizedDate], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("שגיאה בבדיקת קיום תאריך:", checkErr);
      return res.status(500).json({ message: "שגיאה בשרת" });
    }

    if (checkResults[0].count > 0) {
      return res
        .status(409)
        .json({ message: "כבר קיים רווח ליום הזה בבסיס הנתונים" });
    }

    const insertQuery = `INSERT INTO daily_profits (date, dailyProfit) VALUES (?, ?)`;
    db.query(insertQuery, [normalizedDate, dailyProfit], (err, results) => {
      if (err) {
        console.error("שגיאה בהוספת רווח:", err);
        return res.status(500).json({ message: "שגיאה בשרת" });
      }
      console.log("✅ רווח נשמר בהצלחה:", results);
      res.status(201).json({ message: "הרווח נשמר בהצלחה" });
    });
  });
});

// שליפת כל הרווחים
router.get("/", isAuthenticated, (req, res) => {
  const query = `SELECT * FROM daily_profits ORDER BY date DESC`;
  db.query(query, (err, results) => {
    if (err) {
      console.error("שגיאה בשליפת רווחים:", err);
      return res.status(500).json({ message: "שגיאה בשרת" });
    }
    console.log("✅ שליפת רווחים:", results); // ✅ הדפסה
    res.json(results);
  });
});

// שליחת דו"ח רווחים למייל לפי טווח תאריכים
router.post("/send-report", isAuthenticated, (req, res) => {
  const { startDate, endDate, total } = req.body;

  if (!startDate || !endDate || total === undefined) {
    return res.status(400).json({ message: 'חסרים נתונים לשליחת הדו"ח' });
  }

  // בדיקה שהמשתנים מה־.env קיימים
  console.log("GMAIL_USER:", process.env.GMAIL_USER);
  console.log("GMAIL_PASS:", process.env.GMAIL_PASS ? "Exists" : "Missing");

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",            // שינוי מומלץ במקום 'service'
    port: 465,
    secure: true,                      // נדרש עבור פורט 465
    auth: {
      user: process.env.GMAIL_USER,   // מתוך קובץ .env
      pass: process.env.GMAIL_PASS,   // מתוך קובץ .env
    },
    debug: true, // מציג לוג מלא של מה שקורה בזמן שליחת המייל
  });

  const mailOptions = {
    from: `"דו"ח רווחים" <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
    subject: 'דו"ח רווחים - מערכת עגלת קפה',
    html: `
      <h2>דו"ח רווחים לפי תאריכים</h2>
      <p><strong>מתאריך:</strong> ${startDate}</p>
      <p><strong>עד תאריך:</strong> ${endDate}</p>
      <p><strong>סה"כ רווח:</strong> ₪${total.toLocaleString()}</p>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("שגיאה בשליחת מייל:", error);
      return res.status(500).json({ message: "שגיאה בשליחת מייל" });
    }
    console.log("מייל נשלח בהצלחה:", info.response);
    res.status(200).json({ message: "המייל נשלח בהצלחה" });
  });
});


module.exports = router;
