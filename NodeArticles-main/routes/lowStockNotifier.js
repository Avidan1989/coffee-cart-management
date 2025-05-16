const cron = require("node-cron");
const nodemailer = require("nodemailer");
const db = require("../dbSingleton").getConnection("products_db");

// תזמון: כל יום ב-23:30 בלילה
cron.schedule("30 23 * * *", () => {
  console.log("בודק מלאי נמוך...");

  db.query(
    "SELECT name, quantity FROM products WHERE quantity <= 10",
    (err, rows) => {
      if (err) return console.error("שגיאה בבדיקה:", err);
      if (rows.length === 0) return;

      const listHtml = rows
        .map(
          (r) => `<li><strong>${r.name}</strong> – ${r.quantity} יחידות</li>`
        )
        .join("");

      const mailContent = `
      <html>
        <body style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
          <h2 style="color: #d9534f;">⚠️ התראת מלאי נמוך</h2>
          <p>המערכת זיהתה את המוצרים הבאים שנמצאים במלאי נמוך:</p>
          <ul>${listHtml}</ul>
          <p>יש להזמין מוצרים אלו מחדש בהקדם האפשרי.</p>
          <br />
          <p style="font-size: 12px; color: gray;">הודעה זו נשלחה אוטומטית ממערכת עגלת הקפה</p>
        </body>
      </html>
    `;

      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS,
        },
      });





      
      transporter.sendMail(
        {
          from: '"מערכת עגלת קפה" <your.email@gmail.com>',
          to: "avidab1989@gmail.com", // עדכן כתובת מייל מנהל בפועל
          subject: "📦 התראת מלאי נמוך - נדרשת פעולה",
          html: mailContent,
        },
        (err, info) => {
          if (err) console.error("שגיאה בשליחת מייל:", err);
          else console.log("✅ מייל התראה נשלח:", info.response);
        }
      );
    }
  );
});
