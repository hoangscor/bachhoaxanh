const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// ============================================
// CẤU HÌNH
// ============================================
const CONFIG = {
    LIMIT_PER_CATEGORY: 30,  // Giới hạn sản phẩm mỗi danh mục
    DELAY_MIN: 1000,         // Delay tối thiểu (ms)
    DELAY_MAX: 2500,         // Delay tối đa (ms)
    DOWNLOAD_IMAGES: true,   // Có tải ảnh về không
    IMAGE_DIR: 'assets/bhx-images',
    OUTPUT_JSON: 'server/data/bhx_sample_products.json',
    OUTPUT_CSV: 'server/data/bhx_sample_products.csv',
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

// Danh mục cần crawl
const CATEGORIES = [
    { main: 'Thịt, cá, trứng, hải sản', sub: 'Thịt heo', url: 'https://www.bachhoaxanh.com/thit-heo' },
    { main: 'Thịt, cá, trứng, hải sản', sub: 'Thịt bò', url: 'https://www.bachhoaxanh.com/thit-bo' },
    { main: 'Thịt, cá, trứng, hải sản', sub: 'Thịt gà', url: 'https://www.bachhoaxanh.com/thit-ga' },
    { main: 'Thịt, cá, trứng, hải sản', sub: 'Cá, hải sản', url: 'https://www.bachhoaxanh.com/ca-tom-muc-ech' },
    { main: 'Rau, củ, nấm, trái cây', sub: 'Trái cây', url: 'https://www.bachhoaxanh.com/trai-cay' }
];

// ============================================
// UTILS
// ============================================
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = () => delay(CONFIG.DELAY_MIN + Math.random() * (CONFIG.DELAY_MAX - CONFIG.DELAY_MIN));

function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function parsePrice(priceText) {
    if (!priceText) return null;
    const match = priceText.replace(/\./g, '').match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
}

// ============================================
// TẢI ẢNH
// ============================================
async function downloadImage(imageUrl, filename) {
    if (!CONFIG.DOWNLOAD_IMAGES) return null;

    try {
        if (!fs.existsSync(CONFIG.IMAGE_DIR)) {
            fs.mkdirSync(CONFIG.IMAGE_DIR, { recursive: true });
        }

        const filepath = path.join(CONFIG.IMAGE_DIR, filename);

        // Kiểm tra đã tồn tại chưa
        if (fs.existsSync(filepath)) {
            console.log(`   [SKIP] Image exists: ${filename}`);
            return filepath;
        }

        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            headers: { 'User-Agent': CONFIG.USER_AGENT },
            timeout: 10000
        });

        fs.writeFileSync(filepath, response.data);
        console.log(`   [✓] Downloaded: ${filename}`);
        return filepath;
    } catch (e) {
        console.error(`   [✗] Image download failed: ${e.message}`);
        return null;
    }
}

// ============================================
// TRÍCH XUẤT CHI TIẾT SẢN PHẨM
// ============================================
async function scrapeProductDetail(productUrl, categoryMain, categorySub) {
    try {
        const response = await axios.get(productUrl, {
            headers: { 'User-Agent': CONFIG.USER_AGENT }
        });
        const $ = cheerio.load(response.data);

        let product = {
            name: null,
            category_main: categoryMain,
            category_sub: categorySub,
            price_text: null,
            price_value: null,
            old_price_text: null,
            old_price_value: null,
            unit: null,
            discount_percent: null,
            sku_or_code: null,
            product_url: productUrl,
            image_url: null,
            description: null,
            local_image_path: null,
            source: 'bachhoaxanh.com',
            error_note: null
        };

        // 1. Ưu tiên JSON-LD
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

            if (jsonLd.offers) {
                const priceStr = String(jsonLd.offers.price || '');
                product.price_text = priceStr.includes('₫') ? priceStr : `${priceStr}₫`;
                product.price_value = parsePrice(priceStr);
            }
        }

        // 2. Fallback HTML parsing
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

        // Giá gốc (nếu có)
        const oldPriceEl = $('.old-price, .price-original, del').first().text().trim();
        if (oldPriceEl) {
            product.old_price_text = oldPriceEl;
            product.old_price_value = parsePrice(oldPriceEl);
        }

        // Giảm giá %
        const discountBadge = $('.discount-badge, .percent-off').first().text().trim();
        if (discountBadge) {
            product.discount_percent = discountBadge;
        }

        // Đơn vị (tách từ tên hoặc HTML)
        const unitMatch = product.name ? product.name.match(/(\d+(?:kg|g|ml|l|chai|hộp|gói))/i) : null;
        product.unit = unitMatch ? unitMatch[0] : null;

        // Tải ảnh
        if (product.image_url) {
            const imageFilename = `${slugify(product.name || 'product')}.jpg`;
            const localPath = await downloadImage(product.image_url, imageFilename);
            product.local_image_path = localPath;
        }

        return product;

    } catch (e) {
        console.error(`   [✗] Failed to scrape ${productUrl}: ${e.message}`);
        return {
            name: 'ERROR',
            category_main: categoryMain,
            category_sub: categorySub,
            product_url: productUrl,
            error_note: e.message,
            source: 'bachhoaxanh.com'
        };
    }
}

// ============================================
// LẤY DANH SÁCH URL SẢN PHẨM TỪ DANH MỤC
// ============================================
// (Giả định: đã có sẵn hoặc dùng browser automation)
// Ở đây tôi sẽ dùng danh sách cứng từ lần crawl trước
const PRODUCT_URLS_BY_CATEGORY = {
    'thit-heo': [
        'https://www.bachhoaxanh.com/thit-heo/chan-gio-heo-tui-500g',
        'https://www.bachhoaxanh.com/thit-heo/chan-gio-heo-nhap-khau-1kg',
        'https://www.bachhoaxanh.com/thit-heo/xuong-que-heo-nhap-khau-dong-lanh-tui-500g',
        'https://www.bachhoaxanh.com/thit-heo/suon-non-heo-brazil-3kg',
        'https://www.bachhoaxanh.com/thit-heo/suon-cot-let-tui-500g',
        'https://www.bachhoaxanh.com/thit-heo/suon-cot-let-1kg',
        'https://www.bachhoaxanh.com/thit-heo/ba-roi-heo-1kg',
        'https://www.bachhoaxanh.com/thit-heo/ba-roi-heo',
        'https://www.bachhoaxanh.com/thit-heo/ba-roi-heo-nhap-khau',
        'https://www.bachhoaxanh.com/thit-heo/thit-heo-xay-cp-100g',
        'https://www.bachhoaxanh.com/thit-heo/thit-heo-xay-cp-khay-200g',
        'https://www.bachhoaxanh.com/thit-heo/thit-dui-heo-1kg',
        'https://www.bachhoaxanh.com/thit-heo/thit-dui-heo-300g',
        'https://www.bachhoaxanh.com/thit-heo/thit-nac-heo-300g',
        'https://www.bachhoaxanh.com/thit-heo/nac-dam-heo-1kg',
        'https://www.bachhoaxanh.com/thit-heo/suon-non-heo-1kg',
        'https://www.bachhoaxanh.com/thit-heo/ba-roi-heo-g-khay-300g'
    ]
    // Thêm các danh mục khác ở đây nếu có
};

function getProductUrlsForCategory(categoryUrl) {
    const slug = categoryUrl.split('/').pop();
    return PRODUCT_URLS_BY_CATEGORY[slug] || [];
}

// ============================================
// MAIN SCRAPER
// ============================================
async function runComprehensiveScraper() {
    console.log('='.repeat(60));
    console.log('BÁch HÓa XANH - COMPREHENSIVE SCRAPER');
    console.log('='.repeat(60));
    console.log(`Limit per category: ${CONFIG.LIMIT_PER_CATEGORY}`);
    console.log(`Categories to scrape: ${CATEGORIES.length}`);
    console.log(`Download images: ${CONFIG.DOWNLOAD_IMAGES ? 'YES' : 'NO'}`);
    console.log('='.repeat(60));

    const allProducts = [];
    let stats = {
        totalCategories: CATEGORIES.length,
        totalProducts: 0,
        successCount: 0,
        errorCount: 0
    };

    for (const category of CATEGORIES) {
        console.log(`\n🏷️  Category: ${category.sub} (${category.main})`);
        console.log(`   URL: ${category.url}`);

        const productUrls = getProductUrlsForCategory(category.url);
        const limit = Math.min(productUrls.length, CONFIG.LIMIT_PER_CATEGORY);

        console.log(`   Found ${productUrls.length} products, scraping ${limit}...`);

        for (let i = 0; i < limit; i++) {
            const url = productUrls[i];
            console.log(`   [${i + 1}/${limit}] ${url}`);

            const product = await scrapeProductDetail(url, category.main, category.sub);
            allProducts.push(product);

            if (product.error_note) {
                stats.errorCount++;
            } else {
                stats.successCount++;
            }
            stats.totalProducts++;

            // Rate limiting
            await randomDelay();
        }
    }

    // Lưu JSON
    fs.writeFileSync(CONFIG.OUTPUT_JSON, JSON.stringify(allProducts, null, 2), 'utf8');
    console.log(`\n✅ Saved JSON: ${CONFIG.OUTPUT_JSON}`);

    // Lưu CSV
    const csvWriter = createCsvWriter({
        path: CONFIG.OUTPUT_CSV,
        header: [
            { id: 'name', title: 'Name' },
            { id: 'category_main', title: 'Category Main' },
            { id: 'category_sub', title: 'Category Sub' },
            { id: 'price_text', title: 'Price Text' },
            { id: 'price_value', title: 'Price Value' },
            { id: 'old_price_text', title: 'Old Price Text' },
            { id: 'old_price_value', title: 'Old Price Value' },
            { id: 'unit', title: 'Unit' },
            { id: 'discount_percent', title: 'Discount %' },
            { id: 'sku_or_code', title: 'SKU/Code' },
            { id: 'product_url', title: 'Product URL' },
            { id: 'image_url', title: 'Image URL' },
            { id: 'local_image_path', title: 'Local Image Path' },
            { id: 'description', title: 'Description' },
            { id: 'source', title: 'Source' },
            { id: 'error_note', title: 'Error Note' }
        ]
    });

    await csvWriter.writeRecords(allProducts);
    console.log(`✅ Saved CSV: ${CONFIG.OUTPUT_CSV}`);

    // Thống kê
    console.log('\n' + '='.repeat(60));
    console.log('📊 SCRAPING SUMMARY');
    console.log('='.repeat(60));
    console.log(`Categories scraped: ${stats.totalCategories}`);
    console.log(`Total products: ${stats.totalProducts}`);
    console.log(`Success: ${stats.successCount}`);
    console.log(`Errors: ${stats.errorCount}`);
    if (CONFIG.DOWNLOAD_IMAGES) {
        console.log(`Images saved to: ${CONFIG.IMAGE_DIR}/`);
    }
    console.log('='.repeat(60));

    return stats;
}

// Chạy
runComprehensiveScraper().catch(console.error);
