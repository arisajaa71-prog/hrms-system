const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // 1. Get token from header
  const token = req.header('Authorization');

  // 2. Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const secret = 'hrms_secret_key_123'; 
    
    // Remove 'Bearer ' if present to get clean token string
    const tokenString = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;

    // 3. Verify token
    const decoded = jwt.verify(tokenString, secret);

    // 4. SMART ID ASSIGNMENT (The Fix)
    // Checks if the payload is wrapped in 'user' object OR is flat
    if (decoded.user) {
        req.user = decoded.user;
    } else {
        req.user = decoded;
    }

    next();
  } catch (err) {
    console.error("❌ Token Error:", err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};