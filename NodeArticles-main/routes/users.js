const express = require("express");
const bcrypt = require("bcrypt");
const dbSingleton = require("../dbSingleton");
const db = dbSingleton.getConnection("products_db");
const router = express.Router();

/**
 * POST /register - User registration route
 * Input: Expects user details (id_number, email, phone, first_name, last_name, username, password, role) in the request body.
 * Output: Returns a success message with user ID or an error message if validation fails or the user already exists.
 */
router.post("/register", async (req, res) => {
  console.log(req.body);
  const {
    id_number,
    email,
    phone,
    first_name,
    last_name,
    user_name,
    password,
  } = req.body;

  console.log(req.body);
  if (
    !id_number ||
    !email ||
    !phone ||
    !first_name ||
    !last_name ||
    !user_name ||
    !password
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email.match(emailRegex)) {
    return res.status(400).json({ message: "Invalid email address" });
  }

  const phoneRegex = /^\d{10}$/;
  if (!phone.match(phoneRegex)) {
    return res.status(400).json({ message: "Phone number must be 10 digits" });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters" });
  }

  try {
    const queryCheck = "SELECT * FROM users WHERE username = ? OR email = ?";
    db.query(queryCheck, [user_name, email], async (err, results) => {
      if (err) {
        console.error("Error querying database:", err);
        return res.status(500).json({ message: "Server error" });
      }

      if (results.length > 0) {
        return res
          .status(400)
          .json({ message: "Username or email already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const queryInsert = `
  INSERT INTO users (id_number, email, phone, first_name, last_name, username, password_hash, role, active)
  VALUES (?, ?, ?, ?, ?, ?, ?, 'user', 0)
`;
      db.query(
        queryInsert,
        [
          id_number,
          email,
          phone,
          first_name,
          last_name,
          user_name,
          passwordHash,
        ],
        (err, results) => {
          if (err) {
            console.error("Error inserting user:", err);
            return res.status(500).json({ message: "Error inserting user" });
          }

          res.status(201).json({
            message: "User registered successfully",
            userId: results.insertId,
            user_name,
            email,
          });
        }
      );
    });
  } catch (error) {
    console.error("Error hashing password:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /login - User login route
 * Input: Expects username and password in the request body.
 * Output: Returns a success message with the user object or an error message if authentication fails.
 */
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  const query = "SELECT * FROM users WHERE username = ?";
  db.query(query, [username], async (err, results) => {
    if (err) {
      console.error("Error querying database:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = results[0];

    // ✅ בדיקה אם המשתמש חסום
    if (user.active === 0) {
      return res
        .status(403)
        .json({ message: "משתמש זה אינו פעיל לפתיחת ההחשבון אנא פנה למנהל " });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };
    req.session.save(() => {
      console.log("User logged in, session:", req.session);
      res
        .status(200)
        .json({ message: "Login successful", user: req.session.user });
    });
  });
});

/**
 * POST /logout - User logout route
 * Input: No specific input required.
 * Output: Destroys the user session and returns a success message.
 */
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("bar_user");
    res.json({ message: "Logout successful" });
  });
});

/**
 * GET /check-session - בודק האם יש סשן פעילה
 */
router.get("/check-session", (req, res) => {
  if (req.session.user) {
    return res.status(200).json(req.session.user);
  } else {
    return res.status(401).json({ message: "לא מחובר" });
  }
});

module.exports = router;
