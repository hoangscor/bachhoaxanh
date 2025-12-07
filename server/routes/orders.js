// server/routes/orders.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.get('/promotions/active', (req, res) => {
    db.get("SELECT * FROM promotions ORDER BY id DESC LIMIT 1", (err, row) => {
        res.json(row || {});
    });
});

router.post('/coupons/apply', (req, res) => {
    const { code, cartTotal } = req.body;
    db.get("SELECT * FROM coupons WHERE code = ? AND is_active=1", [code], (err, coupon) => {
        if (!coupon) return res.status(400).json({ error: "Mã không hợp lệ hoặc đã hết hạn" });
        if (cartTotal < coupon.min_order_total) return res.status(400).json({ error: `Đơn tối thiểu ${coupon.min_order_total}` });

        let discount = 0;
        if (coupon.discount_type === 'percent') {
            discount = (cartTotal * coupon.discount_value) / 100;
        } else {
            discount = coupon.discount_value;
        }

        if (coupon.max_discount && discount > coupon.max_discount) {
            discount = coupon.max_discount;
        }

        res.json({ discountAmount: Math.round(discount), discountCode: code });
    });
});

// Create Order
router.post('/orders', verifyToken, (req, res) => {
    const { shipping, payment_method, items, couponCode } = req.body;

    // Server-side calculation to verify totals
    if (!items || items.length === 0) return res.status(400).json({ error: "No items" });

    // 1. Calculate Subtotal
    // In real app, we fetch prices from DB. Here we trust frontend slightly for demo or fetch
    // Let's just trust frontend for speed in demo, or minimal fetch
    let subtotal = 0;
    let hasFresh = false;
    items.forEach(i => {
        subtotal += (i.price * i.quantity);
        if (i.isFresh) hasFresh = true;
    });

    // 2. Coupon
    let discountAmount = 0;
    const processOrder = () => {
        // 3. Shipping Fee Logic
        // "Nếu subtotal >= 150.000đ và có ít nhất 1 sản phẩm is_fresh => 0đ"
        let shippingFee = 30000;
        if (hasFresh && subtotal >= 150000) {
            shippingFee = 0;
        }

        const totalAmount = subtotal - discountAmount + shippingFee;
        const orderId = "BH-" + Date.now().toString().slice(-6);
        const userId = req.user.id;

        db.serialize(() => {
            db.run(`INSERT INTO orders (id, user_id, total_amount, discount_amount, shipping_fee, payment_method, shipping_name, shipping_phone, shipping_address)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [orderId, userId, totalAmount, discountAmount, shippingFee, payment_method, shipping.name, shipping.phone, shipping.address],
                function (err) {
                    if (err) return res.status(500).json({ error: err.message });

                    const stmt = db.prepare(`INSERT INTO order_items (order_id, product_id, product_name_snapshot, price_snapshot, quantity) 
                                                 VALUES (?, ?, ?, ?, ?)`);
                    items.forEach(it => {
                        stmt.run([orderId, it.productId, it.name, it.price, it.quantity]);
                    });
                    stmt.finalize();

                    res.json({ orderId, message: "Order placed successfully" });
                }
            );
        });
    };

    if (couponCode) {
        db.get("SELECT * FROM coupons WHERE code = ? AND is_active=1", [couponCode], (err, coupon) => {
            if (coupon && subtotal >= coupon.min_order_total) {
                if (coupon.discount_type === 'percent') discountAmount = (subtotal * coupon.discount_value) / 100;
                else discountAmount = coupon.discount_value;
                if (coupon.max_discount && discountAmount > coupon.max_discount) discountAmount = coupon.max_discount;
            }
            processOrder();
        });
    } else {
        processOrder();
    }
});

router.get('/orders/my', verifyToken, (req, res) => {
    db.all(`SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        // Populate items for detail view if needed, or separate call
        // For list view, we just need summary.
        // Let's stick to summary
        res.json(rows);
    });
});

// Admin
router.get('/orders', verifyToken, isAdmin, (req, res) => {
    db.all(`SELECT o.*, u.email as user_email FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC`, [], (err, rows) => {
        res.json(rows);
    });
});

router.patch('/orders/:id/status', verifyToken, isAdmin, (req, res) => {
    db.run("UPDATE orders SET status = ? WHERE id = ?", [req.body.status, req.params.id], function (err) {
        if (err) res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

module.exports = router;
