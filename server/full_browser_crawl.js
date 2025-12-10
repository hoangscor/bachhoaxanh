const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// CONFIG
const CONFIG = {
    HEADLESS: true,
    SCROLL_DELAY: 1000,
    MAX_SCROLLS: 50, // Enough to load ~1000 items per category if available
    IMAGE_DIR: 'assets/bhx-images',
    OUTPUT_FILE: 'server/data/bhx_browser_full.json',
    CATEGORIES_FILE: 'server/data/bhx_categories.json'
};

// UTILS
const delay = (ms) => new Promise(r => setTimeout(r, ms));

function slugify(text) {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function downloadImage(url, name) {
    if (!url) return null;
    try {
        if (!fs.existsSync(CONFIG.IMAGE_DIR)) fs.mkdirSync(CONFIG.IMAGE_DIR, { recursive: true });
        const ext = path.extname(url).split('?')[0] || '.jpg';
        const filename = `${slugify(name)}${ext}`;
        const filepath = path.join(CONFIG.IMAGE_DIR, filename);

        if (fs.existsSync(filepath)) return filepath;

        const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000 });
        fs.writeFileSync(filepath, response.data);
        return filepath;
    } catch (e) {
        return null; // Silent fail
    }
}

async function scrapeCategory(page, category) {
    console.log(`\n📂 Visiting: ${category.sub} (${category.url})`);
    await page.goto(category.url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Scroll Loop
    let lastHeight = await page.evaluate('document.body.scrollHeight');
    for (let i = 0; i < CONFIG.MAX_SCROLLS; i++) {
        process.stdout.write(`   📜 Scroll ${i + 1}/${CONFIG.MAX_SCROLLS}\r`);
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
        await delay(CONFIG.SCROLL_DELAY);

        let newHeight = await page.evaluate('document.body.scrollHeight');
        if (newHeight === lastHeight) {
            // Try one more distinct scroll up and down to trigger
            await page.evaluate('window.scrollBy(0, -500)');
            await delay(500);
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await delay(1000);
            newHeight = await page.evaluate('document.body.scrollHeight');
            if (newHeight === lastHeight) break; // Really done
        }
        lastHeight = newHeight;

        // Anti-bot pause occasionally
        if (i % 5 === 0) await delay(1000);
    }
    console.log(''); // New line

    // Extract Data from DOM
    // Note: BHX selectors might change, using generic reliable ones where possible
    const products = await page.evaluate((catSub, catMain) => {
        const items = [];
        // Select all product cards
        const cards = document.querySelectorAll('.product-item, .box-product .item, li.item');

        cards.forEach(card => {
            try {
                // Name
                const nameEl = card.querySelector('.product-name, h3, .name');
                if (!nameEl) return;
                const name = nameEl.innerText.trim();

                // Price
                const priceEl = card.querySelector('.price, strong');
                const priceText = priceEl ? priceEl.innerText.trim() : '0';
                const priceValue = parseInt(priceText.replace(/\D/g, '')) || 0;

                // Image
                const imgEl = card.querySelector('img');
                let imageUrl = imgEl ? (imgEl.src || imgEl.dataset.src) : null;

                // URL
                const linkEl = card.querySelector('a');
                let productUrl = linkEl ? linkEl.href : null;

                if (name && priceValue > 0) {
                    items.push({
                        name,
                        price_value: priceValue,
                        price_text: priceText,
                        image_url: imageUrl,
                        product_url: productUrl,
                        category_sub: catSub,
                        category_main: catMain,
                        source: 'bachhoaxanh.com'
                    });
                }
            } catch (e) { }
        });
        return items;
    }, category.sub, category.main);

    console.log(`   Found ${products.length} products`);
    return products;
}

async function run() {
    console.log('🚀 STARTING FULL BROWSER CRAWL...');
    const browser = await puppeteer.launch({
        headless: CONFIG.HEADLESS,
        defaultViewport: { width: 1366, height: 768 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    // Set User Agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Load Categories
    const categories = JSON.parse(fs.readFileSync(CONFIG.CATEGORIES_FILE, 'utf8'));
    let allProducts = [];

    // Prioritize categories (Priority 1 first)
    const targetCats = categories.filter(c => c.priority === 1); // Only scrap main ones for speed first

    for (const cat of targetCats) {
        try {
            const items = await scrapeCategory(page, cat);

            // Download images in background for this batch
            console.log('   🖼️  Downloading images...');
            for (const p of items) {
                if (p.image_url) {
                    p.local_image_path = await downloadImage(p.image_url, p.name);
                }
                // Mock unit/desc
                p.unit = p.name.match(/\d+(g|kg|ml|l)/i)?.[0] || '1 cái';
                p.description = `Sản phẩm ${p.name} chất lượng cao từ Bách Hóa Xanh`;
                p.fresh = (['Thịt', 'Cá', 'Rau', 'Trái cây'].some(k => p.category_main.includes(k) || p.category_sub.includes(k))) ? 1 : 0;
            }

            allProducts = allProducts.concat(items);

            // Incremental Save
            fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(allProducts, null, 2));

        } catch (e) {
            console.error(`   ❌ Failed ${cat.sub}: ${e.message}`);
        }
    }

    await browser.close();
    console.log('=====================================');
    console.log(`✅ CRAWL FINISHED. Total: ${allProducts.length} products`);
    console.log(`File: ${CONFIG.OUTPUT_FILE}`);
}

run();
