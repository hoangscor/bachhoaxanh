const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all categories in hierarchical structure
router.get('/categories', (req, res) => {
    // Get all categories
    db.all(`
        SELECT id, name, slug, parent_id 
        FROM categories 
        ORDER BY parent_id, id
    `, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Build hierarchical structure
        const mainCategories = rows.filter(cat => !cat.parent_id);
        const result = mainCategories.map(main => {
            const subcategories = rows.filter(cat => cat.parent_id === main.id);

            // Get product count for each subcategory
            const subsWithCount = subcategories.map(sub => ({
                id: sub.id,
                name: sub.name,
                slug: sub.slug,
                product_count: 0 // Will be populated if needed
            }));

            return {
                id: main.id,
                name: main.name,
                slug: main.slug,
                subcategories: subsWithCount
            };
        });

        res.json({ main_categories: result });
    });
});

// Get single category by ID
router.get('/categories/:id', (req, res) => {
    const categoryId = req.params.id;

    db.get(`SELECT * FROM categories WHERE id = ?`, [categoryId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json(row);
    });
});

module.exports = router;
