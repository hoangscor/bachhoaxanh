// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'bachhoa_pastel_secret_key_123'; // In prod use env

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).json({ error: 'No token provided' });
    }

    try {
        const bearer = token.split(' ')[1]; // Bearer <token>
        const decoded = jwt.verify(bearer, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Require Admin Role' });
    }
};

module.exports = { verifyToken, isAdmin, SECRET_KEY };
