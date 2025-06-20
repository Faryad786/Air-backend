 // Middleware to extract Bearer token from Authorization header
module.exports = function (req, res, next) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      req.accessToken = authHeader.substring(7);
    } else {
      req.accessToken = null;
    }
    next();
  };
  