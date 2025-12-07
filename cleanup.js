const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
    // 1. Kill
    console.log('Killing port 3000...');
    try {
        execSync('npx -y kill-port 3000', { stdio: 'inherit' });
    } catch (e) { console.log('Kill port error (maybe not running):', e.message); }

    // 2. Wait a bit for OS to release locks
    console.log('Waiting 2s for lock release...');
    const start = Date.now();
    while (Date.now() - start < 2000) { }

    // 3. Delete DB
    const dbPath = path.resolve(__dirname, 'server/bachhoa.db');
    const cachePath = path.resolve(__dirname, 'server/cache/bhx_images_v2.json');

    if (fs.existsSync(dbPath)) {
        console.log('Deleting DB at:', dbPath);
        fs.unlinkSync(dbPath);
        console.log('DB Deleted successfully.');
    } else {
        console.log('DB file does not exist.');
    }

    if (fs.existsSync(cachePath)) {
        fs.unlinkSync(cachePath);
        console.log('Cache cleared.');
    }

} catch (err) {
    console.error('Cleanup failed:', err);
    process.exit(1);
}
