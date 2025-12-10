const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'bachhoa.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Recreating products table with correct schema...\n');

db.serialize(() => {
    // Drop existing products table
    console.log('Dropping old products table...');
    db.run('DROP TABLE IF EXISTS products', (err) => {
        if (err) {
            console.error('Error dropping table:', err);
            return;
        }
        console.log('✅ Dropped old table\n');

        // Create new products table with complete schema
        console.log('Creating new products table...');
        db.run(`
            CREATE TABLE products (
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
            )
        `, (err) => {
            if (err) {
                console.error('Error creating table:', err);
            } else {
                console.log('✅ Created new products table with complete schema\n');
                console.log('Columns: id, name, category_id, brand_id, price, old_price,');
                console.log('         unit, badge, is_fresh, image_url, description,');
                console.log('         stock, is_active');
            }

            setTimeout(() => {
                console.log('\n🎉 Table recreation complete!');
                db.close();
            }, 500);
        });
    });
});
