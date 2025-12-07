// server/routes/products.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.get('/categories', (req, res) => {
    db.all(`SELECT * FROM categories`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const parents = rows.filter(r => r.parent_id == null);
        const result = parents.map(p => ({
            ...p,
            children: rows.filter(r => r.parent_id === p.id)
        }));
        res.json(result);
    });
});

router.get('/brands', (req, res) => {
    db.all(`SELECT * FROM brands`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.get('/products', (req, res) => {
    const { search, categoryId, brandId, isFresh, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let sql = `SELECT p.* FROM products p WHERE p.is_active = 1`;
    let params = [];

    if (search) {
        sql += ` AND p.name LIKE ?`;
        params.push(`%${search}%`);
    }
    if (categoryId) {
        // Find if parent or child
        // For simplicity, just exact match or we'd need recursion query or flat list check
        // Let's assume frontend passes exact subcat ID usually, or we can expand logic
        sql += ` AND (p.category_id = ? OR p.category_id IN (SELECT id FROM categories WHERE parent_id = ?))`;
        params.push(categoryId, categoryId);
    }
    if (brandId) {
        sql += ` AND p.brand_id = ?`;
        params.push(brandId);
    }
    if (isFresh) {
        sql += ` AND p.is_fresh = ?`;
        params.push(isFresh === 'true' ? 1 : 0);
    }

    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows, page, limit });
    });
});

router.get('/products/:id', (req, res) => {
    db.get("SELECT * FROM products WHERE id = ?", [req.params.id], (err, row) => {
        if (!row) return res.status(404).json({ error: "Not found" });
        res.json(row);
    });
});

// Admin
router.post('/products', verifyToken, isAdmin, (req, res) => {
    const { name, category_id, price, image_url } = req.body;
    db.run(`INSERT INTO products (name, category_id, price, image_url) VALUES (?,?,?,?)`,
        [name, category_id, price, image_url], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        });
});

router.put('/products/:id', verifyToken, isAdmin, (req, res) => {
    const { name, price } = req.body; // Simplified update
    db.run("UPDATE products SET name=?, price=? WHERE id=?", [name, price, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

router.delete('/products/:id', verifyToken, isAdmin, (req, res) => {
    db.run("UPDATE products SET is_active = 0 WHERE id = ?", [req.params.id], (err) => {
        res.json({ status: "deleted" });
    });
});

router.get('/stores', (req, res) => {
    db.all("SELECT * FROM stores", [], (err, rows) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json(rows);
    });
});

module.exports = router;
