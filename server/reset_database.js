const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_FILE = 'server/bachhoa.db';
const BACKUP_FILE = 'server/bachhoa.db.backup';
const CATALOG_FILE = 'server/data/bhx_valid_catalog.json';
const CATEGORIES_FILE = 'server/data/bhx_categories.json';

console.log('='.repeat(70));
console.log('🔄 DATABASE RESET & SEED');
console.log('='.repeat(70));

// Backup existing DB
console.log('\n📦 Step 1: Backing up current database...');
if (fs.existsSync(DB_FILE)) {
    fs.copyFileSync(DB_FILE, BACKUP_FILE);
    console.log(`   ✅ Backup saved: ${BACKUP_FILE}`);
} else {
    console.log('   ⚠️  No existing database found');
}

// Delete old DB
console.log('\n🗑️  Step 2: Removing old database...');
if (fs.existsSync(DB_FILE)) {
    fs.unlinkSync(DB_FILE);
    console.log('   ✅ Old database removed');
}

// Create new DB
console.log('\n🏗️  Step 3: Creating fresh database...');
const db = new sqlite3.Database(DB_FILE);

db.serialize(() => {
    // Create tables
    console.log('   Creating tables...');

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password TEXT,
            full_name TEXT,
            is_admin INTEGER DEFAULT 0
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            slug TEXT UNIQUE,
            main_category TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            category_id INTEGER,
            price INTEGER,
            old_price INTEGER,
            unit TEXT,
            discount_percent TEXT,
            image_url TEXT,
            local_image TEXT,
            description TEXT,
            product_url TEXT,
            fresh INTEGER DEFAULT 0,
            FOREIGN KEY(category_id) REFERENCES categories(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            total INTEGER,
            status TEXT DEFAULT 'PLACED',
            created_at TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    `);

    console.log('   ✅ Tables created');

    // Seed default users
    console.log('\n👤 Step 4: Seeding users...');
    const stmt1 = db.prepare('INSERT INTO users (email, password, full_name, is_admin) VALUES (?, ?, ?, ?)');
    stmt1.run('admin@bachhoa.com', 'admin123', 'Admin User', 1);
    stmt1.run('user@example.com', 'user123', 'Demo User', 0);
    stmt1.finalize();
    console.log('   ✅ 2 users created');

    // Seed categories
    console.log('\n📂 Step 5: Seeding categories...');
    const categories = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf8'));

    const categoryMap = {};
    const stmt2 = db.prepare('INSERT INTO categories (name, slug, main_category) VALUES (?, ?, ?)');

    categories.forEach((cat, index) => {
        const slug = cat.url.split('/').pop();
        stmt2.run(cat.sub, slug, cat.main);
        categoryMap[cat.sub] = index + 1; // ID will be index + 1
    });
    stmt2.finalize();
    console.log(`   ✅ ${categories.length} categories created`);

    // Seed products
    console.log('\n📦 Step 6: Seeding products...');
    const catalog = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8'));

    const stmt3 = db.prepare(`
        INSERT INTO products 
        (name, category_id, price, old_price, unit, discount_percent, image_url, local_image, description, product_url, fresh)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let successCount = 0;
    let errorCount = 0;

    catalog.forEach(product => {
        if (product.error_note || !product.name || product.name === 'N/A' || product.name === 'ERROR') {
            errorCount++;
            return;
        }

        // Map category
        let catId = 1; // Default
        if (product.category_sub) {
            catId = categoryMap[product.category_sub] || 1;
        }

        // Determine if fresh (meat, fish, veggies, fruits)
        const freshCategories = ['thit-heo', 'thit-bo', 'thit-ga', 'ca-tom-muc-ech', 'trai-cay', 'rau'];
        const catSlug = product.category_sub || '';
        const isFresh = freshCategories.some(fc => catSlug.includes(fc)) ? 1 : 0;

        stmt3.run(
            product.name,
            catId,
            product.price_value || 0,
            product.old_price_value || null,
            product.unit || null,
            product.discount_percent || null,
            product.image_url || null,
            product.local_image_path || null,
            product.description || null,
            product.product_url || null,
            isFresh
        );

        successCount++;
    });

    stmt3.finalize();

    console.log(`   ✅ ${successCount} products inserted`);
    console.log(`   ⚠️  ${errorCount} products skipped (errors)`);

    // Create indexes
    console.log('\n🔍 Step 7: Creating indexes...');
    db.run('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_products_price ON products(price)');
    db.run('CREATE INDEX IF NOT EXISTS idx_products_fresh ON products(fresh)');
    console.log('   ✅ Indexes created');

    // Verify
    console.log('\n✅ Step 8: Verification...');
    db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
        if (err) {
            console.error('   ❌ Error:', err.message);
        } else {
            console.log(`   📊 Total products in DB: ${row.count}`);
        }

        db.get('SELECT COUNT(*) as count FROM categories', (err, row) => {
            if (err) {
                console.error('   ❌ Error:', err.message);
            } else {
                console.log(`   📂 Total categories in DB: ${row.count}`);
            }

            console.log('\n' + '='.repeat(70));
            console.log('✅ DATABASE RESET COMPLETE!');
            console.log('='.repeat(70));
            console.log(`Database file: ${DB_FILE}`);
            console.log(`Backup file: ${BACKUP_FILE}`);
            console.log('='.repeat(70));

            db.close();
        });
    });
});
