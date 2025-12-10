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
        // 1. Users
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password_hash TEXT,
            name TEXT,
            phone TEXT,
            role TEXT DEFAULT 'customer',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 2. Categories
        db.run(`CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            slug TEXT,
            parent_id INTEGER,
            FOREIGN KEY(parent_id) REFERENCES categories(id)
        )`);

        // 3. Brands
        db.run(`CREATE TABLE IF NOT EXISTS brands (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            slug TEXT,
            logo_url TEXT,
            default_discount INTEGER
        )`);

        // 4. Products
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

        // 5. Promotions
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

        // 6. Coupons
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

        // 7. Orders
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

        // 8. Order Items
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

        // 9. Stores
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

            // --- Users ---
            const adminPass = bcrypt.hashSync('admin123', 10);
            const userPass = bcrypt.hashSync('123456', 10);
            db.run(`INSERT INTO users (email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?)`, ['admin@bachhoa.com', adminPass, 'Admin User', '0909000111', 'admin']);
            db.run(`INSERT INTO users (email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?)`, ['khach@bachhoa.com', userPass, 'Khách Hàng Mẫu', '0901234567', 'customer']);

            // --- Categories (Full BHX Structure) ---
            const cats = [
                { name: 'Thịt, cá, trứng, hải sản', subs: ['Thịt heo', 'Thịt bò', 'Cá, hải sản', 'Trứng', 'Thịt gia cầm'] },
                { name: 'Rau, củ, nấm, trái cây', subs: ['Trái cây', 'Rau lá', 'Củ, quả', 'Nấm các loại', 'Rau gia vị'] },
                { name: 'Dầu ăn, nước chấm, gia vị', subs: ['Dầu ăn', 'Nước mắm', 'Nước tương', 'Hạt nêm', 'Đường', 'Muối'] },
                { name: 'Mì, miến, cháo, phở', subs: ['Mì ăn liền', 'Phở, bún ăn liền', 'Miến, hủ tiếu', 'Cháo gói'] },
                { name: 'Gạo, bột, đồ khô', subs: ['Gạo các loại', 'Bột mì, bột gạo', 'Đồ khô'] },
                { name: 'Bia, nước giải khát', subs: ['Bia', 'Nước ngọt', 'Nước suối', 'Nước trái cây', 'Trà, Cà phê'] },
                { name: 'Sữa các loại', subs: ['Sữa tươi', 'Sữa hạt', 'Sữa bột', 'Sữa đặc'] },
                { name: 'Kem, thực phẩm đông mát', subs: ['Kem cây', 'Kem hộp', 'Sữa chua', 'Váng sữa'] },
                { name: 'Bánh kẹo các loại', subs: ['Bánh quy', 'Bánh xốp', 'Kẹo dẻo', 'Kẹo cứng', 'Socola', 'Snack'] },
                { name: 'Vệ sinh nhà cửa', subs: ['Nước giặt', 'Nước xả', 'Nước rửa chén', 'Lau sàn, kính'] },
                { name: 'Chăm sóc cá nhân', subs: ['Dầu gội', 'Sữa tắm', 'Kem đánh răng', 'Sữa rửa mặt'] },
                { name: 'Sản phẩm mẹ và bé', subs: ['Tã bỉm', 'Sữa công thức', 'Khăn ướt'] },
                { name: 'Đồ dùng gia đình', subs: ['Màng bọc thực phẩm', 'Túi đựng rác', 'Đồ dùng bếp'] },
                { name: 'Hàng Noel', subs: ['Kẹo Giáng Sinh', 'Hộp quà', 'Trang trí'] } // Special
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

            // --- Brands (Real Logos) ---
            const brands = [
                ['Unilever', 'https://upload.wikimedia.org/wikipedia/en/thumb/9/91/Unilever_logo_2024.svg/150px-Unilever_logo_2024.svg.png', 26],
                ['PepsiCo', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/PepsiCo_logo.svg/150px-PepsiCo_logo.svg.png', 30],
                ['CocaCola', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Coca-Cola_logo.svg/150px-Coca-Cola_logo.svg.png', 15],
                ['Vinamilk', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Vinamilk_logo.svg/150px-Vinamilk_logo.svg.png', 12],
                ['Acecook', 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/Acecook_logo.svg/150px-Acecook_logo.svg.png', 10],
                ['Masand', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Masan_Group_Logo.svg/150px-Masan_Group_Logo.svg.png', 10]
            ];
            // Use Placehold.co fallback if real URL fails in frontend (handled there), but putting real ones here for "90% clone" feel.
            brands.forEach(b => db.run("INSERT INTO brands (name, logo_url, default_discount) VALUES (?,?,?)", b));

            // --- Stores ---
            const stores = [
                ["BH Pastel Quận 1", "123 Pasteur, Q1, TP.HCM"],
                ["BH Pastel Thủ Đức", "234 Võ Văn Ngân, Thủ Đức"],
                ["BH Pastel Gò Vấp", "15 Quang Trung, Gò Vấp"],
                ["BH Pastel Bình Thạnh", "205 Xô Viết Nghệ Tĩnh, Bình Thạnh"],
                ["BH Pastel Quận 7", "45 Nguyễn Thị Thập, Q7"]
            ];
            stores.forEach(s => db.run("INSERT INTO stores (name, address) VALUES (?, ?)", s));

            // --- Promotions ---
            db.run(`INSERT INTO promotions (title, banner_text) 
                    VALUES ('Giáng Sinh An Lành', 'NGÀY 10 LƯƠNG VỀ – MUA CÀNG NHIỀU GIÁ CÀNG RẺ')`);
            db.run(`INSERT INTO coupons (code, description, discount_type, discount_value, min_order_total, max_discount) 
                    VALUES ('LUONGVE10', 'Giảm 10% cho đơn từ 150k', 'percent', 10, 150000, 50000)`);

            // --- Products (Advanced Seeding) ---
            const { fetchBhxImageData } = require('./bhxImageFetcher');

            // Try to fetch 100 products
            fetchBhxImageData(100).then(bhxItems => {
                let bhxIndex = 0;
                const pickBhxData = (fallbackName, fallbackCat) => {
                    // Try to find a matching category item first
                    let match = null;
                    if (bhxItems.length > 0) {
                        match = bhxItems.find(i => i.categoryHint && i.categoryHint.includes(fallbackCat) && !i.used);
                        if (!match && bhxIndex < bhxItems.length) {
                            // Fallback to sequential
                            match = bhxItems[bhxIndex++];
                        }
                    }

                    if (match) {
                        match.used = true; // mark used
                        return {
                            name: match.name,
                            price: match.price || 50000,
                            img: match.imageUrl
                        };
                    }

                    return {
                        name: fallbackName,
                        price: 0, // 0 will trigger manual override below
                        img: "https://placehold.co/300x300?text=" + encodeURIComponent(fallbackName)
                    };
                };

                // Base manual list to ensure we have products for EVERY category if scraper fails or is sparse
                // We will merge this with fetched data
                // Base manual list to ensure we have products for EVERY category if scraper fails or is sparse
                // We will merge this with fetched data
                const baseProducts = [
                    // Specific Request: Gạo thơm Vua Gạo 5kg
                    {
                        n: "Gạo thơm Vua Gạo 5kg",
                        c: "Gạo các loại",
                        p: 180000,
                        fresh: 0,
                        // To add real image, paste URL here
                        img: "https://cdnv2.tgdd.vn/bhx-static/bhx/Products/Images/2513/332640/bhx/thiet-ke-chua-co-ten-2024-12-02t101141121_202412021017531362.jpg"
                    },
                    { n: "Nước giặt OMO Matic Túi 3.6kg", c: "Nước giặt", p: 168000, fresh: 0 },
                    { n: "Ba chỉ heo VietGAP (tươi) 500g", c: "Thịt heo", p: 85000, fresh: 1 },
                    { n: "Táo Envy Mỹ 1kg", c: "Trái cây", p: 199000, fresh: 1 },
                    { n: "Thùng 24 lon Bia Tiger Crystal", c: "Bia", p: 395000, fresh: 0 },
                    { n: "Rau muống 500g", c: "Rau lá", p: 15000, fresh: 1 },
                    { n: "Kẹo Gậy Giáng Sinh (Hộp)", c: "Hàng Noel", p: 45000, fresh: 0 },
                    { n: "Hộp Quà Bánh Quy Danisa", c: "Hàng Noel", p: 120000, fresh: 0 },
                    { n: "Sữa tươi Vinamilk 1L", c: "Sữa tươi", p: 32000, fresh: 0 },
                    { n: "Dầu ăn Tường An 1L", c: "Dầu ăn", p: 55000, fresh: 0 },
                    { n: "Nước mắm Nam Ngư 750ml", c: "Nước mắm", p: 42000, fresh: 0 },
                    { n: "Mì Hảo Hảo Tôm Chua Cay (Thùng)", c: "Mì ăn liền", p: 118000, fresh: 0 },
                    { n: "Gạo thơm lại 5kg", c: "Gạo các loại", p: 120000, fresh: 0 },
                    { n: "Nước ngọt Coca Cola 390ml", c: "Nước ngọt", p: 10000, fresh: 0 },
                    { n: "Dầu gội Clear Men 650g", c: "Dầu gội", p: 175000, fresh: 0 },
                    { n: "Kem đánh răng P/S", c: "Kem đánh răng", p: 35000, fresh: 0 }
                ];

                baseProducts.forEach(bp => {
                    const data = pickBhxData(bp.n, bp.c);
                    // Prioritize manual URL if set in baseProducts, else use fetched, else fallback
                    const finalName = bp.n; // Prioritize our manual name for specific items
                    const finalPrice = bp.p > 0 ? bp.p : data.price;
                    const finalImg = bp.img ? bp.img : data.img;

                    db.get("SELECT id FROM categories WHERE name = ?", [bp.c], (err, r) => {
                        let catId = r ? r.id : 1; // default to first cat if not found

                        // Insert
                        db.run(`INSERT INTO products (name, category_id, price, old_price, unit, badge, is_fresh, image_url, description) 
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [finalName, catId, finalPrice, finalPrice * 1.1, "Cái", "", bp.fresh, finalImg, `Mô tả cho ${finalName}`]);
                    });
                });

                // If we fetched MORE items than base, insert them too (up to 30)
                const remaining = bhxItems.filter(i => !i.used).slice(0, 30);
                remaining.forEach(item => {
                    // Try to guess category ID from hint
                    // This is fuzzy but okay for demo
                    const catName = item.categoryHint || "Bánh kẹo các loại";

                    db.get("SELECT id FROM categories WHERE name LIKE ?", [`%${catName}%`], (err, r) => {
                        const catId = r ? r.id : 6; // default fallback
                        db.run(`INSERT INTO products (name, category_id, price, old_price, unit, badge, is_fresh, image_url, description) 
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [item.name, catId, item.price, item.price * 1.2, "Cái", "", 0, item.imageUrl, `Sản phẩm ${item.name}`]);
                    });
                });

            });
        }
    });
}

module.exports = db;
