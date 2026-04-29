// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

function authenticateToken(req, res, next) {
  if (req.path === '/logout') {
    return next();
  }

  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Acces non autorise',
      message: 'Token manquant dans le header Authorization'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      error: 'Acces non autorise',
      message: 'Format invalide, attendu: "Bearer <token>"'
    });
  }

  const token = parts[1];

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'nafassante_secret_key_2024');
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({
        success: false,
        error: 'Session expiree',
        message: 'Veuillez vous reconnecter'
      });
    }
    return res.status(403).json({
      success: false,
      error: 'Token invalide',
      message: 'Authentification echouee'
    });
  }
}

module.exports = authenticateToken;
