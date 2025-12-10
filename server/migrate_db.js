const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'bachhoa.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Migrating database schema...\n');

db.serialize(() => {
    // Check if columns exist and add if missing
    db.all("PRAGMA table_info(categories)", (err, columns) => {
        if (err) {
            console.error('❌ Error checking schema:', err);
            db.close();
            return;
        }

        const hasParentId = columns.some(col => col.name === 'parent_id');
        const hasSlug = columns.some(col => col.name === 'slug');

        if (!hasParentId) {
            console.log('Adding parent_id column to categories...');
            db.run('ALTER TABLE categories ADD COLUMN parent_id INTEGER', (err) => {
                if (err) console.error('Error adding parent_id:', err);
                else console.log('✅ Added parent_id column');
            });
        } else {
            console.log('✅ parent_id column already exists');
        }

        if (!hasSlug) {
            console.log('Adding slug column to categories...');
            db.run('ALTER TABLE categories ADD COLUMN slug TEXT', (err) => {
                if (err) console.error('Error adding slug:', err);
                else console.log('✅ Added slug column');
            });
        } else {
            console.log('✅ slug column already exists');
        }

        // Wait a bit then close
        setTimeout(() => {
            console.log('\n🎉 Migration complete!');
            db.close();
        }, 1000);
    });
});
