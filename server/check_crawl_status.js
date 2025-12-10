const fs = require('fs');
const FILE = 'server/data/bhx_browser_full.json';
const IMG_DIR = 'assets/bhx-images';

function check() {
    if (fs.existsSync(FILE)) {
        try {
            const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
            console.log(`\n📊 CRAWL STATUS:`);
            console.log(`   ✅ Valid Products: ${data.length}`);

            // Check images
            if (fs.existsSync(IMG_DIR)) {
                const files = fs.readdirSync(IMG_DIR);
                console.log(`   🖼️  Images Downloaded: ${files.length}`);
            }

            // Tail last modified
            const stat = fs.statSync(FILE);
            console.log(`   🕒 Last Update: ${stat.mtime.toLocaleTimeString()}`);

            console.log('\n(Chạy lại lệnh này để cập nhật trạng thái)');
        } catch (e) {
            console.log('Crawler đang ghi file...');
        }
    } else {
        console.log('⏳ Crawler đang khởi động...');
    }
}

check();
