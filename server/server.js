const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const db = require('./db'); // Init DB

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Serve product images from public/assets
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/categories')); // New categories endpoint
app.use('/api', require('./routes/products'));    // categories (old), brands, products
app.use('/api', require('./routes/orders'));      // orders, coupons

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/stores', (req, res) => {
    res.json([
        { id: 1, name: 'Cửa hàng Quận 1', address: '123 Đinh Tiên Hoàng' },
        { id: 2, name: 'Cửa hàng Thủ Đức', address: '1 Võ Văn Ngân' }
    ]);
});

// Fallback to index.html for SPA feel (optional, but since we are static file serving, index.html is default at /)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
