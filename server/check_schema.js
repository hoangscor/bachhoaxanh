const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'bachhoa.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Checking categories table schema...\n');

db.all("PRAGMA table_info(categories)", (err, columns) => {
    if (err) {
        console.error('Error:', err);
        db.close();
        return;
    }

    console.log('Columns in categories table:');
    columns.forEach(col => {
        console.log(`  ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
    });

    // Check for unique constraints
    db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='categories'", (err, rows) => {
        if (err) {
            console.error('Error:', err);
        } else {
            console.log('\nTable definition:');
            rows.forEach(row => console.log(row.sql));
        }
        db.close();
    });
});
