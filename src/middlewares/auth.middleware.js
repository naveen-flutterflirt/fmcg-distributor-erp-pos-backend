const jwt = require('jsonwebtoken');

function protect(req, res, next) {
  let token = null;

  // 1. Check Bearer token in Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fmcg_fallback_secret_key'
    );
    req.user = decoded; // { id, email, name, role }
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token. Please log in again.',
    });
  }
}

// Optional: Role-based authorization middleware
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user?.role}' does not have permission to access this resource`,
      });
    }
    next();
  };
}

module.exports = {
  protect,
  authorize,
};
