
/**
 * Middleware to check if the logged-in user has the required role.
 * Input: Expects an active session with a user object containing a 'role' property.
 * Output: Calls next() if the user has the required role, otherwise returns a 403 status.
 */

const checkRole = (requiredRole) => {
    return (req, res, next) => {
        console.log('checkRole - user role:', req.session.user ? req.session.user.role : 'none');
        if (req.session.user && req.session.user.role === requiredRole) {
            next();
        } else {
            console.log('Access denied - user does not have required role:', requiredRole);
            res.status(403).json({ message: 'Access denied' });
        }
    };
};
/**
 * Middleware to verify if a user is authenticated.
 * Input: Expects an active session with a user object.
 * Output: Calls next() if authenticated, otherwise returns a 401 status.
 */
const isAuthenticated = (req, res, next) => {
  console.log("isAuthenticated - req.headers.cookie:", req.headers.cookie);
  console.log("isAuthenticated - req.session:", req.session);
  console.log("Session ID:", req.sessionID);

  if (req.session.user) {
    req.user = req.session.user; // ⬅️ זה הפתרון הקריטי!
    next();
  } else {
    console.log("❌ Unauthorized - no user in session");
    res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = {
    checkRole,
    isAuthenticated,
};
