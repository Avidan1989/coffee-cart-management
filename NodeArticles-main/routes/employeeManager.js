// routes/employeeManager.js
const express = require("express");
const router = express.Router();
const db = require("../dbSingleton").getConnection("products_db");
const { isAuthenticated, checkRole } = require("./middleware");
const bcrypt = require("bcrypt");

// שליפת כל העובדים
router.get("/", isAuthenticated, checkRole("admin"), (req, res) => {
  const sql = `SELECT id, username, active FROM users`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "שגיאה" });
    res.json(results);
  });
});

router.get("/all-users", isAuthenticated, checkRole("admin"), (req, res) => {
  const sql =
    "SELECT id, username, first_name, last_name, email, role, active FROM users"; // <<< כאן תיקנתי
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "שגיאה בשליפת המשתמשים" });
    res.json(results);
  });
});
// חסימת עובד
router.put("/block/:id", isAuthenticated, checkRole("admin"), (req, res) => {
  const { id } = req.params;
  db.query("UPDATE users SET active = 0 WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "שגיאה" });
    res.json({ message: "המשתמש נחסם" });
  });
});


// עדכון תגובה לפנייה
router.put("/respond/:id", isAuthenticated, checkRole("admin"), (req, res) => {
  const { id } = req.params;
  const { response } = req.body;

  if (!response) return res.status(400).json({ error: "חסר תוכן תגובה" });

  const sql = "UPDATE employee_requests SET response = ? WHERE id = ?";
  db.query(sql, [response, id], (err) => {
    if (err) return res.status(500).json({ error: "שגיאה בעדכון התגובה" });
    res.json({ message: "התגובה נשמרה בהצלחה" });
  });
});

// שליפת פניות עובדים למנהל
router.get("/requests", isAuthenticated, checkRole("admin"), (req, res) => {
  const sql = `
    SELECT er.id, er.user_id, u.username, u.first_name, u.last_name, er.date, er.reason, er.file_path, er.response
    FROM employee_requests er
    JOIN users u ON er.user_id = u.id
    ORDER BY er.created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "שגיאה בשליפת הפניות" });
    res.json(results);
  });
});


// שליפת רשימת העובדים עם מספר הודעות לא נענו
router.get(
  "/requests/employees",
  isAuthenticated,
  checkRole("admin"),
  (req, res) => {
    const sql = `
    SELECT u.id, u.username, u.first_name, u.last_name,
           COUNT(CASE WHEN er.status = 'pending' THEN 1 END) AS pending_count
    FROM users u
    JOIN employee_requests er ON er.user_id = u.id
    GROUP BY u.id
  `;
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: "שגיאה בשליפת עובדים" });
      res.json(results);
    });
  }
);



// שליפת שיח של עובד מול המנהל לפי user_id
router.get("/requests/:userId", isAuthenticated, checkRole("admin"), (req, res) => {
  const { userId } = req.params;
  const sql = `
    SELECT id, date, reason, file_path, response, created_at, status, manager_comment
    FROM employee_requests
    WHERE user_id = ?
    ORDER BY created_at ASC
  `;
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: "שגיאה בשליפת הפניות" });
    res.json(results);
  });
});

// עדכון תגובת מנהל
router.put("/requests/respond/:id", isAuthenticated, checkRole("admin"), (req, res) => {
  const { id } = req.params;
  const { response } = req.body;
  const sql = "UPDATE employee_requests SET response = ? WHERE id = ?";
  db.query(sql, [response, id], (err) => {
    if (err) return res.status(500).json({ error: "שגיאה בעדכון התגובה" });
    res.json({ message: "התגובה נשמרה" });
  });
});






// החזרת עובד לרשימת הפעילים
router.put("/restore/:id", isAuthenticated, checkRole("admin"), (req, res) => {
  const { id } = req.params;
  db.query("UPDATE users SET active = 1 WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "שגיאה" });
    res.json({ message: "המשתמש הוחזר לרשימה" });
  });
});



// עדכון פרטי משתמש
router.put("/update-user/:id", isAuthenticated, checkRole("admin"), async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, username, password, role } = req.body;

 let sql =
   "UPDATE users SET first_name = ?, last_name = ?, email = ?, username = ?, role = ?";
 let params = [first_name, last_name, email, username, role];

  if (password) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10); // <<< כאן מצפינים
      sql += ", password_hash = ?";
      params.push(hashedPassword);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "שגיאה בהצפנת הסיסמה" });
    }
  }

  sql += " WHERE id = ?";
  params.push(id);

  db.query(sql, params, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "שגיאה בעדכון המשתמש" });
    }
    res.json({ message: "המשתמש עודכן בהצלחה" });
  });
});







// עדכון סטטוס + תגובה של המנהל
router.put("/requests/decision/:id", isAuthenticated, checkRole("admin"), (req, res) => {
  const { id } = req.params;
  const { status, manager_comment } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "סטטוס לא תקין" });
  }

  const sql = `
    UPDATE employee_requests
    SET status = ?, manager_comment = ?
    WHERE id = ?
  `;

  db.query(sql, [status, manager_comment, id], (err) => {
    if (err) return res.status(500).json({ error: "שגיאה בעדכון הפנייה" });
    res.json({ message: "עודכן בהצלחה" });
  });
});






module.exports = router;
