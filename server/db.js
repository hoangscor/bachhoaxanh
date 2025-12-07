const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'bachhoa.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error(err.message);
    else {
        console.log('Connected to SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Users
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password_hash TEXT,
            name TEXT,
            phone TEXT,
            role TEXT DEFAULT 'customer',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Categories
        db.run(`CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            slug TEXT,
            parent_id INTEGER,
            FOREIGN KEY(parent_id) REFERENCES categories(id)
        )`);

        // Brands
        db.run(`CREATE TABLE IF NOT EXISTS brands (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            slug TEXT,
            logo_url TEXT,
            default_discount INTEGER
        )`);

        // Products
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            category_id INTEGER,
            brand_id INTEGER,
            price INTEGER,
            old_price INTEGER,
            unit TEXT,
            badge TEXT,
            is_fresh INTEGER DEFAULT 0,
            image_url TEXT,
            description TEXT,
            stock INTEGER DEFAULT 100,
            is_active INTEGER DEFAULT 1,
            FOREIGN KEY(category_id) REFERENCES categories(id),
            FOREIGN KEY(brand_id) REFERENCES brands(id)
        )`);

        // Promotions
        db.run(`CREATE TABLE IF NOT EXISTS promotions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            description TEXT,
            banner_text TEXT,
            start_date DATETIME,
            end_date DATETIME,
            type TEXT,
            value INTEGER,
            min_order_total INTEGER
        )`);

        // Coupons
        db.run(`CREATE TABLE IF NOT EXISTS coupons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE,
            description TEXT,
            discount_type TEXT, 
            discount_value INTEGER,
            min_order_total INTEGER,
            max_discount INTEGER,
            start_date DATETIME,
            end_date DATETIME,
            is_active INTEGER DEFAULT 1
        )`);

        // Orders
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            user_id INTEGER,
            total_amount INTEGER,
            discount_amount INTEGER,
            shipping_fee INTEGER,
            status TEXT DEFAULT 'PLACED',
            payment_method TEXT,
            shipping_name TEXT,
            shipping_phone TEXT,
            shipping_address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        // Order Items
        db.run(`CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT,
            product_id INTEGER,
            product_name_snapshot TEXT,
            price_snapshot INTEGER,
            quantity INTEGER,
            FOREIGN KEY(order_id) REFERENCES orders(id),
            FOREIGN KEY(product_id) REFERENCES products(id)
        )`);

        // Stores
        db.run(`CREATE TABLE IF NOT EXISTS stores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT, 
            address TEXT, 
            lat REAL, 
            lng REAL
        )`);

        seedData();
    });
}

function seedData() {
    db.get("SELECT count(*) as count FROM users", (err, row) => {
        if (row.count === 0) {
            console.log("Seeding data...");

            // Users
            const adminPass = bcrypt.hashSync('admin123', 10);
            const userPass = bcrypt.hashSync('123456', 10);
            db.run(`INSERT INTO users (email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?)`, ['admin@bachhoa.com', adminPass, 'Admin User', '0909000111', 'admin']);
            db.run(`INSERT INTO users (email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?)`, ['khach@bachhoa.com', userPass, 'Khách Hàng Mẫu', '0901234567', 'customer']);

            // Categories
            const cats = [
                { name: 'Thịt, cá, trứng, hải sản', subs: ['Thịt heo', 'Thịt bò', 'Cá, hải sản', 'Trứng'] },
                { name: 'Rau, củ, nấm, trái cây', subs: ['Trái cây', 'Rau lá', 'Củ, quả'] },
                { name: 'Bia, nước giải khát', subs: ['Bia', 'Nước ngọt'] },
                { name: 'Sữa các loại', subs: ['Sữa tươi', 'Sữa chua', 'Sữa hạt'] },
                { name: 'Vệ sinh nhà cửa', subs: ['Nước giặt', 'Nước rửa chén'] },
                { name: 'Bánh kẹo', subs: ['Bánh quy', 'Kẹo dẻo', 'Snack'] },
                { name: 'Hàng Noel', subs: ['Kẹo Giáng Sinh', 'Hộp quà', 'Trang trí'] } // Special category
            ];

            const stmtCat = db.prepare("INSERT INTO categories (name, parent_id) VALUES (?, ?)");
            cats.forEach((c) => {
                db.run("INSERT INTO categories (name, parent_id) VALUES (?, NULL)", [c.name], function (e) {
                    if (!e) {
                        const pid = this.lastID;
                        c.subs.forEach(s => db.run("INSERT INTO categories (name, parent_id) VALUES (?, ?)", [s, pid]));
                    }
                });
            });

            // Brands
            const brands = [
                ['Unilever', 'https://placehold.co/100x100?text=Unilever', 26],
                ['PepsiCo', 'https://placehold.co/100x100?text=PepsiCo', 30],
                ['CocaCola', 'https://placehold.co/100x100?text=Coke', 15],
                ['Vinamilk', 'https://placehold.co/100x100?text=Vinamilk', 12],
                ['Acecook', 'https://placehold.co/100x100?text=Acecook', 10]
            ];
            brands.forEach(b => db.run("INSERT INTO brands (name, logo_url, default_discount) VALUES (?,?,?)", b));

            // Stores
            db.run("INSERT INTO stores (name, address) VALUES (?, ?)", ["BH Pastel Quận 1", "123 Pasteur, Q1, TP.HCM"]);
            db.run("INSERT INTO stores (name, address) VALUES (?, ?)", ["BH Pastel Thủ Đức", "234 Võ Văn Ngân, Thủ Đức"]);

            // Promotions & Coupons
            db.run(`INSERT INTO promotions (title, banner_text) 
                    VALUES ('Giáng Sinh An Lành', 'NGÀY 10 LƯƠNG VỀ – MUA CÀNG NHIỀU GIÁ CÀNG RẺ')`);

            db.run(`INSERT INTO coupons (code, description, discount_type, discount_value, min_order_total, max_discount) 
                    VALUES ('LUONGVE10', 'Giảm 10% cho đơn từ 150k', 'percent', 10, 150000, 50000)`);

            // Seed Products (Delayed to ensure cats exist)
            // Seed Products with Image Fetching
            const { fetchBhxImageUrls } = require('./bhxImageFetcher');

            fetchBhxImageUrls(50).then(imageUrls => {
                const products = [
                    { name: "Nước giặt OMO Matic Túi 3.6kg", cat: "Nước giặt", price: 168000, old: 210000, unit: "Túi", badge: "-20%", fresh: 0 },
                    { name: "Ba chỉ heo VietGAP (tươi) 500g", cat: "Thịt heo", price: 85000, old: 95000, unit: "Khay", badge: "Tươi", fresh: 1 },
                    { name: "Táo Envy Mỹ 1kg", cat: "Trái cây", price: 199000, old: 240000, unit: "kg", badge: "-17%", fresh: 1 },
                    { name: "Thùng 24 lon Bia Tiger Crystal", cat: "Bia", price: 395000, old: 420000, unit: "Thùng", badge: "HOT", fresh: 0 },
                    { name: "Rau muống 500g", cat: "Rau lá", price: 15000, old: 0, unit: "Bó", badge: "Mới", fresh: 1 },
                    { name: "Kẹo Gậy Giáng Sinh (Hộp)", cat: "Kẹo Giáng Sinh", price: 45000, old: 55000, unit: "Hộp", badge: "Noel", fresh: 0 },
                    { name: "Hộp Quà Bánh Quy Danisa", cat: "Hộp quà", price: 120000, old: 150000, unit: "Hộp", badge: "-20%", fresh: 0 },
                    { name: "Sữa tươi Vinamilk 1L", cat: "Sữa tươi", price: 32000, old: 35000, unit: "Hộp", badge: "", fresh: 0 }
                ];

                products.forEach((p, index) => {
                    // Assign fetched image or fallback (remote)
                    const img = imageUrls[index] || "https://placehold.co/300x300?text=" + encodeURIComponent(p.name);

                    db.get("SELECT id FROM categories WHERE name = ?", [p.cat], (err, r) => {
                        if (r) {
                            db.run(`INSERT INTO products (name, category_id, price, old_price, unit, badge, is_fresh, image_url, description) 
                                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [p.name, r.id, p.price, p.old, p.unit, p.badge, p.fresh, img, `Mô tả cho ${p.name}`]);
                        }
                    });
                });
            });
        }
    });
}

module.exports = db;
