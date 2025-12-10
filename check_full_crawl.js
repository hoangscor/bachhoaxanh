// Quick status checker for full crawl
const fs = require('fs');
const path = require('path');

const PROGRESS_FILE = 'server/data/crawl_progress.json';
const DATA_FILE = 'server/data/bhx_products_by_category.json';
const IMAGE_DIR = 'assets/bhx-images';

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   📊 CRAWL STATUS CHECK');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

try {
    // Check progress
    if (fs.existsSync(PROGRESS_FILE)) {
        const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
        console.log(`✅ Subcategories completed: ${progress.completed_subcategories.length}`);
        console.log(`📦 Total products crawled: ${progress.total_products_crawled}`);

        if (progress.completed_subcategories.length > 0) {
            const last = progress.completed_subcategories[progress.completed_subcategories.length - 1];
            console.log(`🔄 Last completed: ${last.main} > ${last.sub} (${last.count} products)`);
            console.log(`⏰ Last update: ${new Date(last.timestamp).toLocaleString('vi-VN')}`);
        }

        if (progress.errors && progress.errors.length > 0) {
            console.log(`\n⚠️  Errors: ${progress.errors.length}`);
            progress.errors.slice(-3).forEach(e => console.log(`   - ${e}`));
        }
    } else {
        console.log('⚠️  No progress file found - crawl may not have started yet');
    }

    // Check data file
    if (fs.existsSync(DATA_FILE)) {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        console.log(`\n📄 JSON file: ${data.length} products`);
    }

    // Check images
    if (fs.existsSync(IMAGE_DIR)) {
        const images = fs.readdirSync(IMAGE_DIR).filter(f => f.endsWith('.jpg'));
        const totalSize = images.reduce((sum, img) => {
            return sum + fs.statSync(path.join(IMAGE_DIR, img)).size;
        }, 0);
        console.log(`🖼️  Images: ${images.length} files (~${(totalSize / 1024 / 1024).toFixed(1)} MB)`);
    }

} catch (e) {
    console.error('❌ Error checking status:', e.message);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
