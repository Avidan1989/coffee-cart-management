const express = require("express");
const router = express.Router();
const db = require("../dbSingleton").getConnection("products_db");
const { isAuthenticated } = require("./middleware");
require("dotenv").config();
const nodemailer = require("nodemailer");

// הוספת לקוח (כבר קיים)
router.post("/add-customer", isAuthenticated, (req, res) => {
  const { name, email, phone } = req.body;
  if (!name || !email || !phone)
    return res.status(400).json({ message: "נא למלא את כל השדות" });

  const query = "INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)";
  db.query(query, [name, email, phone], (err) => {
    if (err) {
      console.error("שגיאה:", err);
      return res.status(500).json({ message: "שגיאה בהוספת לקוח" });
    }
    res.status(201).json({ message: "✔️ לקוח נוסף בהצלחה" });
  });
});

// שליפת כל הלקוחות
router.get("/all-customers", isAuthenticated, (req, res) => {
  db.query("SELECT * FROM customers", (err, results) => {
    if (err) return res.status(500).json({ error: "שגיאה בשליפת לקוחות" });
    res.json(results);
  });
});

// שליחת מייל לכל הלקוחות
router.post("/send-promo", isAuthenticated, async (req, res) => {
  const { subject, message, locationLink } = req.body;

  db.query("SELECT email FROM customers", async (err, customers) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ message: "שגיאה בשליפת לקוחות" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const htmlMessage = `
      <div style="direction: rtl; font-family: Arial">
        <h2>${subject}</h2>
        <p>${message}</p>
        ${
          locationLink
            ? `<p><a href="${locationLink}" target="_blank">📍 לחץ כאן למיקום</a></p>`
            : ""
        }
      </div>
    `;

    const sendTo = customers.map((c) => c.email).filter(Boolean);

    try {
      await transporter.sendMail({
        from: `"עגלת הקפה" <${process.env.GMAIL_USER}>`,
        to: sendTo,
        subject,
        html: htmlMessage,
      });

      res.json({ message: "✅ ההודעה נשלחה לכל הלקוחות" });
    } catch (error) {
      console.error("Send Error:", error);
      res.status(500).json({ message: "❌ שגיאה בשליחת הודעות" });
    }
  });
});



// עדכון לקוח לפי ID
router.put("/update/:id", isAuthenticated, (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ message: "נא למלא את כל השדות" });
  }

  const updateSql = `UPDATE customers SET name = ?, email = ?, phone = ? WHERE id = ?`;
  db.query(updateSql, [name, email, phone, id], (err, result) => {
    if (err) {
      console.error("שגיאה בעדכון:", err);
      return res.status(500).json({ message: "שגיאה בעדכון הלקוח" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "לקוח לא נמצא" });
    }

    res.json({ message: "✅ הלקוח עודכן בהצלחה" });
  });
});










module.exports = router;
