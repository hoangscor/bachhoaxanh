const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'bachhoa.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Adding missing columns to products table...\n');

db.serialize(() => {
    // Check columns in products table
    db.all("PRAGMA table_info(products)", (err, columns) => {
        if (err) {
            console.error('Error:', err);
            db.close();
            return;
        }

        const hasBadge = columns.some(col => col.name === 'badge');

        if (!hasBadge) {
            console.log('Adding badge column...');
            db.run('ALTER TABLE products ADD COLUMN badge TEXT', (err) => {
                if (err) console.error('Error adding badge:', err);
                else console.log('✅ Added badge column');

                setTimeout(() => {
                    console.log('\n🎉 Migration complete!');
                    db.close();
                }, 500);
            });
        } else {
            console.log('✅ badge column already exists');
            db.close();
        }
    });
});
