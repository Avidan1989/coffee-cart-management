const express = require("express");
const session = require("express-session");
const cors = require("cors");
const app = express();
require("./routes/lowStockNotifier");
const messagesRequestsRoutes = require("./routes/messagesRequests");
require("dotenv").config();
const userRoutes = require("./routes/users");
const productRoutes = require("./routes/products");
const workersRoutes = require("./routes/workers");
const articlesRoutes = require("./routes/articles");
const customerRoutes = require("./routes/messege"); // אם הקובץ באמת נקרא messege.js
const profitRoutes = require("./routes/profits"); // ✅ נוסף
const weeklyScheduleRoutes = require("./routes/weeklySchedule");
const port = 8801;

app.use(express.json());

/**
 * CORS configuration to allow requests from the frontend.
 * Input: Allows GET, POST, DELETE, and PUT methods from 'http://localhost:3000'.
 * Output: Enables cross-origin requests with credentials support.
 */
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type"],
  })
);

/**
 * Session configuration for user authentication and authorization.
 * Input: Creates a session cookie named 'bar_user' with security and session management settings.
 * Output: Provides session management with cookies for authentication.
 */
app.use(
  session({
    name: "bar_user",
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

/**
 * Routes setup for different modules.
 * Input: Routes requests to specific endpoint handlers.
 * Output: Handles API calls for articles, workers, users, and products.
 */
app.use("/messages-requests", messagesRequestsRoutes);
app.use("/articles", articlesRoutes);
app.use("/workers", workersRoutes);
app.use("/schedule", workersRoutes);
app.use("/users", userRoutes);
app.use("/customers", customerRoutes); // לקוחות
app.use("/profits", profitRoutes); // ✅ רווחים - נוספה השורה החשובה הזו
app.use("/weekly-schedule", weeklyScheduleRoutes);
/**
 * Middleware for /prods route to log incoming requests.
 * Input: Logs the method and URL of the request.
 * Output: Passes control to the product routes.
 */
app.use(
  "/prods",
  (req, res, next) => {
    console.log(`Received request at /prods: ${req.method} ${req.url}`);
    next();
  },
  productRoutes
);

/**
 * Global error handler.
 * Input: Catches any unhandled errors in the application.
 * Output: Returns a 500 status with an error message.
 */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

const employeeManagerRoutes = require("./routes/employeeManager");
app.use("/employee-manager", employeeManagerRoutes);

/**
 * Starts the server and listens on the specified port.
 * Input: No specific input required.
 * Output: Logs the server URL to the console.
 */
app.listen(port, () => {
 console.log(`Server is running on http://localhost:${port}`);
});
