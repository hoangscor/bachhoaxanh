// server/routes/products.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Get all brands
router.get('/brands', (req, res) => {
    db.all(`SELECT * FROM brands`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// Get all products with search, filter, and pagination
router.get('/products', (req, res) => {
    const {
        search,
        category_id,
        categoryId, // Support both naming conventions
        brandId,
        isFresh,
        min_price,
        max_price,
        sort = 'id_desc',
        page = 1,
        limit = 20
    } = req.query;

    const offset = (page - 1) * limit;

    let sql = `SELECT p.*, c.name as category_name FROM products p 
               LEFT JOIN categories c ON p.category_id = c.id 
               WHERE 1=1`;
    let params = [];

    // Search by name
    if (search) {
        sql += ` AND p.name LIKE ?`;
        params.push(`%${search}%`);
    }

    // Filter by category (handle both parent and child categories)
    const catId = category_id || categoryId;
    if (catId) {
        sql += ` AND (p.category_id = ? OR p.category_id IN (SELECT id FROM categories WHERE parent_id = ?))`;
        params.push(catId, catId);
    }

    // Filter by brand
    if (brandId) {
        sql += ` AND p.brand_id = ?`;
        params.push(brandId);
    }

    // Filter by fresh products
    if (isFresh) {
        sql += ` AND p.is_fresh = ?`;
        params.push(isFresh === 'true' ? 1 : 0);
    }

    // Price range filter
    if (min_price) {
        sql += ` AND p.price >= ?`;
        params.push(parseInt(min_price));
    }
    if (max_price) {
        sql += ` AND p.price <= ?`;
        params.push(parseInt(max_price));
    }

    // Sorting
    const sortMap = {
        'price_asc': 'p.price ASC',
        'price_desc': 'p.price DESC',
        'name_asc': 'p.name ASC',
        'name_desc': 'p.name DESC',
        'id_desc': 'p.id DESC',
        'newest': 'p.id DESC'
    };
    sql += ` ORDER BY ${sortMap[sort] || 'p.id DESC'}`;

    // Pagination
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        // Get total count for pagination
        let countSql = `SELECT COUNT(*) as total FROM products p WHERE 1=1`;
        let countParams = [];

        if (search) {
            countSql += ` AND p.name LIKE ?`;
            countParams.push(`%${search}%`);
        }
        if (catId) {
            countSql += ` AND (p.category_id = ? OR p.category_id IN (SELECT id FROM categories WHERE parent_id = ?))`;
            countParams.push(catId, catId);
        }
        if (min_price) {
            countSql += ` AND p.price >= ?`;
            countParams.push(parseInt(min_price));
        }
        if (max_price) {
            countSql += ` AND p.price <= ?`;
            countParams.push(parseInt(max_price));
        }

        db.get(countSql, countParams, (err, countRow) => {
            res.json({
                data: rows,
                page: parseInt(page),
                limit: parseInt(limit),
                total: countRow ? countRow.total : 0,
                pages: countRow ? Math.ceil(countRow.total / parseInt(limit)) : 0
            });
        });
    });
});

// Get single product by ID
router.get('/products/:id', (req, res) => {
    db.get("SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?",
        [req.params.id], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(404).json({ error: "Product not found" });
            res.json(row);
        });
});

// Admin: Create product
router.post('/products', verifyToken, isAdmin, (req, res) => {
    const { name, category_id, price, image_url } = req.body;
    db.run(`INSERT INTO products (name, category_id, price, image_url) VALUES (?,?,?,?)`,
        [name, category_id, price, image_url], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        });
});

// Admin: Update product
router.put('/products/:id', verifyToken, isAdmin, (req, res) => {
    const { name, price, image_url } = req.body;
    db.run("UPDATE products SET name=?, price=?, image_url=? WHERE id=?", [name, price, image_url, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Admin: Delete product (soft delete)
router.delete('/products/:id', verifyToken, isAdmin, (req, res) => {
    db.run("UPDATE products SET is_active = 0 WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: "deleted" });
    });
});

// Get stores
router.get('/stores', (req, res) => {
    db.all("SELECT * FROM stores", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

module.exports = router;
