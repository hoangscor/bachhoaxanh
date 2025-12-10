const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'bachhoa.db');
const mappingPath = path.resolve(__dirname, 'image-mapping.json');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error(err.message);
    console.log('Connected to DB');
    applyMapping();
});

function applyMapping() {
    if (!fs.existsSync(mappingPath)) {
        console.error("Mapping file not found at", mappingPath);
        return;
    }

    const mappings = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    console.log(`Found ${mappings.length} mappings.`);

    let updatedCount = 0;

    db.serialize(() => {
        const stmt = db.prepare("UPDATE products SET image_url = ? WHERE name LIKE ? AND (image_url IS NULL OR image_url LIKE '%placeholder%')");

        mappings.forEach(m => {
            const query = `%${m.keyword}%`;
            stmt.run([m.image_url, query], function (err) {
                if (err) console.error(err);
                else {
                    if (this.changes > 0) {
                        console.log(`Updated for keyword "${m.keyword}" -> ${this.changes} rows`);
                        updatedCount += this.changes;
                    }
                }
            });
        });

        stmt.finalize(() => {
            console.log("Done applying mappings.");
            // We can't easily wait for all async runs here in simple sqlite3 usage without promises wrapper
            // But for a script like this, a short timeout or just exiting process in callback is fine.
            // Let's just wait a sec
            setTimeout(() => {
                console.log(`Total updates triggered. check logs.`);
                db.close();
            }, 1000);
        });
    });
}
