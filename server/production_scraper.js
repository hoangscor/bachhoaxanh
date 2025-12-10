const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// ============================================
// CONFIG
// ============================================
const CONFIG = {
    BATCH_SIZE: 50,          // Process in batches
    DELAY_MIN: 2000,         // 2s min delay
    DELAY_MAX: 3500,         // 3.5s max delay
    MAX_RETRIES: 3,          // Retry failed URLs
    DOWNLOAD_IMAGES: true,   // Download all images
    IMAGE_DIR: 'assets/bhx-images',
    PROGRESS_FILE: 'server/data/scrape_progress.json',
    OUTPUT_JSON: 'server/data/bhx_full_catalog.json',
    OUTPUT_CSV: 'server/data/bhx_full_catalog.csv',
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = () => delay(CONFIG.DELAY_MIN + Math.random() * (CONFIG.DELAY_MAX - CONFIG.DELAY_MIN));

// ============================================
// UTILS
// ============================================
function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 100); // Limit length
}

function parsePrice(priceText) {
    if (!priceText) return null;
    const match = priceText.replace(/\./g, '').match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
}

function loadProgress() {
    if (fs.existsSync(CONFIG.PROGRESS_FILE)) {
        return JSON.parse(fs.readFileSync(CONFIG.PROGRESS_FILE, 'utf8'));
    }
    return { scrapedURLs: [], failedURLs: [], lastIndex: 0 };
}

function saveProgress(progress) {
    fs.writeFileSync(CONFIG.PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// ============================================
// IMAGE DOWNLOAD
// ============================================
async function downloadImage(imageUrl, filename) {
    if (!CONFIG.DOWNLOAD_IMAGES) return null;

    try {
        if (!fs.existsSync(CONFIG.IMAGE_DIR)) {
            fs.mkdirSync(CONFIG.IMAGE_DIR, { recursive: true });
        }

        const filepath = path.join(CONFIG.IMAGE_DIR, filename);

        if (fs.existsSync(filepath)) {
            return filepath;
        }

        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            headers: { 'User-Agent': CONFIG.USER_AGENT },
            timeout: 15000
        });

        fs.writeFileSync(filepath, response.data);
        return filepath;
    } catch (e) {
        console.error(`      [IMG FAIL] ${e.message}`);
        return null;
    }
}

// ============================================
// SCRAPE PRODUCT
// ============================================
async function scrapeProduct(url, retryCount = 0) {
    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': CONFIG.USER_AGENT },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);

        let product = {
            name: null,
            category_main: null,
            category_sub: null,
            price_text: null,
            price_value: null,
            old_price_text: null,
            old_price_value: null,
            unit: null,
            discount_percent: null,
            sku_or_code: null,
            product_url: url,
            image_url: null,
            description: null,
            local_image_path: null,
            source: 'bachhoaxanh.com',
            error_note: null
        };

        // JSON-LD parsing
        let jsonLd = null;
        $('script[type="application/ld+json"]').each((i, el) => {
            try {
                const json = JSON.parse($(el).html());
                if (json['@type'] === 'Product') {
                    jsonLd = json;
                }
            } catch (e) { }
        });

        if (jsonLd) {
            product.name = jsonLd.name || null;
            product.description = jsonLd.description || null;
            product.image_url = jsonLd.image || null;
            product.category_sub = jsonLd.category || null;

            if (jsonLd.offers) {
                const priceStr = String(jsonLd.offers.price || '');
                product.price_text = priceStr.includes('₫') ? priceStr : `${priceStr}₫`;
                product.price_value = parsePrice(priceStr);
            }
        }

        // Fallback HTML parsing
        if (!product.name) {
            product.name = $('h1').first().text().trim() || 'N/A';
        }

        if (!product.price_text) {
            product.price_text = $('.price, .current-price, strong.price').first().text().trim();
            product.price_value = parsePrice(product.price_text);
        }

        if (!product.image_url) {
            const imgSrc = $('.slider-item img, .product-image img').first().attr('src') ||
                $('.slider-item img, .product-image img').first().attr('data-src');
            product.image_url = imgSrc;
        }

        // Extract category from URL
        const urlParts = url.split('/');
        if (urlParts.length >= 4 && !product.category_sub) {
            product.category_sub = urlParts[3];
        }

        // Unit extraction
        const unitMatch = product.name ? product.name.match(/(\d+(?:kg|g|ml|l|chai|hộp|gói|lon))/i) : null;
        product.unit = unitMatch ? unitMatch[0] : null;

        // Download image
        if (product.image_url) {
            const imageFilename = `${slugify(product.name || 'product')}.jpg`;
            const localPath = await downloadImage(product.image_url, imageFilename);
            product.local_image_path = localPath;
        }

        return { success: true, product };

    } catch (e) {
        if (retryCount < CONFIG.MAX_RETRIES) {
            console.error(`      [RETRY ${retryCount + 1}/${CONFIG.MAX_RETRIES}] ${e.message}`);
            await delay(5000); // Wait 5s before retry
            return await scrapeProduct(url, retryCount + 1);
        }

        return {
            success: false,
            product: {
                name: 'ERROR',
                product_url: url,
                error_note: e.message,
                source: 'bachhoaxanh.com'
            }
        };
    }
}

// ============================================
// MAIN SCRAPER
// ============================================
async function runProductionScraper() {
    console.log('='.repeat(70));
    console.log('🚀 PRODUCTION BHX SCRAPER - 500 PRODUCTS');
    console.log('='.repeat(70));
    console.log(`Batch size: ${CONFIG.BATCH_SIZE}`);
    console.log(`Retry limit: ${CONFIG.MAX_RETRIES}`);
    console.log(`Download images: ${CONFIG.DOWNLOAD_IMAGES ? 'YES' : 'NO'}`);
    console.log('='.repeat(70));

    // Load URLs
    const allURLs = JSON.parse(fs.readFileSync('server/data/all_product_urls.json', 'utf8'));
    console.log(`\n📦 Loaded ${allURLs.length} URLs`);

    // Load progress
    const progress = loadProgress();
    const startIndex = progress.lastIndex;
    console.log(`📊 Resume from index: ${startIndex}`);

    const allProducts = [];
    let stats = {
        total: allURLs.length,
        success: progress.scrapedURLs.length,
        failed: progress.failedURLs.length,
        skipped: 0
    };

    // Process in batches
    for (let i = startIndex; i < allURLs.length; i += CONFIG.BATCH_SIZE) {
        const batch = allURLs.slice(i, i + CONFIG.BATCH_SIZE);
        const batchNum = Math.floor(i / CONFIG.BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(allURLs.length / CONFIG.BATCH_SIZE);

        console.log(`\n${'='.repeat(70)}`);
        console.log(`📦 BATCH ${batchNum}/${totalBatches} (${batch.length} URLs)`);
        console.log(`${'='.repeat(70)}`);

        for (let j = 0; j < batch.length; j++) {
            const url = batch[j];
            const overallIndex = i + j + 1;

            // Skip if already scraped
            if (progress.scrapedURLs.includes(url)) {
                stats.skipped++;
                continue;
            }

            console.log(`\n[${overallIndex}/${allURLs.length}] ${url.split('/').slice(-2).join('/')}`);

            const result = await scrapeProduct(url);

            if (result.success) {
                console.log(`   ✅ ${result.product.name?.slice(0, 50)}...`);
                console.log(`   💰 ${result.product.price_value?.toLocaleString('vi-VN')}₫`);
                if (result.product.local_image_path) {
                    console.log(`   🖼️  Image saved`);
                }
                stats.success++;
                progress.scrapedURLs.push(url);
            } else {
                console.log(`   ❌ ${result.product.error_note}`);
                stats.failed++;
                progress.failedURLs.push(url);
            }

            allProducts.push(result.product);
            progress.lastIndex = overallIndex;

            // Save progress after each product
            if (overallIndex % 10 === 0) {
                saveProgress(progress);
            }

            // Rate limiting
            await randomDelay();
        }

        // Save after each batch
        saveProgress(progress);
        console.log(`\n💾 Progress saved. Success: ${stats.success}, Failed: ${stats.failed}`);
    }

    // Final save
    fs.writeFileSync(CONFIG.OUTPUT_JSON, JSON.stringify(allProducts, null, 2));
    console.log(`\n✅ Saved JSON: ${CONFIG.OUTPUT_JSON}`);

    // Save CSV
    const csvWriter = createCsvWriter({
        path: CONFIG.OUTPUT_CSV,
        header: [
            { id: 'name', title: 'Name' },
            { id: 'category_main', title: 'Category Main' },
            { id: 'category_sub', title: 'Category Sub' },
            { id: 'price_value', title: 'Price' },
            { id: 'unit', title: 'Unit' },
            { id: 'image_url', title: 'Image URL' },
            { id: 'local_image_path', title: 'Local Image' },
            { id: 'product_url', title: 'URL' },
            { id: 'error_note', title: 'Error' }
        ]
    });

    await csvWriter.writeRecords(allProducts);
    console.log(`✅ Saved CSV: ${CONFIG.OUTPUT_CSV}`);

    // Final stats
    console.log('\n' + '='.repeat(70));
    console.log('📊 FINAL STATISTICS');
    console.log('='.repeat(70));
    console.log(`Total URLs: ${stats.total}`);
    console.log(`✅ Success: ${stats.success}`);
    console.log(`❌ Failed: ${stats.failed}`);
    console.log(`⏭️  Skipped: ${stats.skipped}`);
    console.log(`📈 Success Rate: ${((stats.success / stats.total) * 100).toFixed(1)}%`);
    if (CONFIG.DOWNLOAD_IMAGES) {
        console.log(`🖼️  Images directory: ${CONFIG.IMAGE_DIR}/`);
    }
    console.log('='.repeat(70));
}

runProductionScraper().catch(console.error);
