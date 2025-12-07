// server/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { verifyToken, SECRET_KEY } = require('../middleware/authMiddleware');

router.post('/register', (req, res) => {
    const { email, password, name, phone } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    const hash = bcrypt.hashSync(password, 10);

    db.run(`INSERT INTO users (email, password_hash, name, phone) VALUES (?, ?, ?, ?)`,
        [email, hash, name, phone],
        function (err) {
            if (err) return res.status(500).json({ error: "Email exists or db error" });
            res.json({ message: "Registered successfully" });
        }
    );
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err || !user) return res.status(400).json({ error: "User not found" });

        if (!bcrypt.compareSync(password, user.password_hash)) {
            return res.status(401).json({ error: "Wrong password" });
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ accessToken: token, user: { id: user.id, name: user.name, role: user.role } });
    });
});

router.get('/me', verifyToken, (req, res) => {
    db.get(`SELECT id, email, name, phone, role FROM users WHERE id = ?`, [req.user.id], (err, row) => {
        res.json(row);
    });
});

module.exports = router;
