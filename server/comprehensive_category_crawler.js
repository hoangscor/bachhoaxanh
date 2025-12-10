const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// ============================
// CONFIGURATION
// ============================
const CONFIG = {
    LIMIT_PER_SUBCATEGORY: 50,      // Max products per subcategory
    DELAY_MIN: 500,                  // Min delay between requests (ms)
    DELAY_MAX: 1500,                 // Max delay between requests (ms)
    HEADLESS: true,                  // Run in headless mode for speed
    IMAGE_DIR: 'assets/bhx-images',  // Image storage directory
    OUTPUT_JSON: 'server/data/bhx_products_by_category.json',
    OUTPUT_CSV: 'server/data/bhx_products_by_category.csv',
    PROGRESS_FILE: 'server/data/crawl_progress.json',
    TEST_MODE: false,                // FULL CRAWL MODE
    BASE_URL: 'https://www.bachhoaxanh.com'
};

// ============================
// CATEGORY TREE (Hardcoded)
// ============================
const CATEGORY_TREE = [
    { main: "Khuyến mãi sốc", subs: [] },  // Skip

    {
        main: "Thịt, cá, trứng, hải sản",
        subs: ["Thịt heo", "Thịt bò", "Thịt gà, vịt", "Cá, hải sản", "Trứng gà, vịt, cút"]
    },

    {
        main: "Rau, củ, nấm, trái cây",
        subs: ["Trái cây", "Rau lá", "Củ, quả", "Nấm các loại"]
    },

    {
        main: "Dầu ăn, nước chấm, gia vị",
        subs: [
            "Dầu ăn", "Nước mắm", "Nước tương", "Đường",
            "Hạt nêm, bột ngọt, bột canh", "Muối",
            "Tương ớt-đen, mayonnaise", "Dầu hào, giấm, bơ",
            "Gia vị nêm sẵn", "Nước chấm, mắm",
            "Tiêu, sa tế, ớt bột", "Bột nghệ, tỏi, hồi, quế,..."
        ]
    },

    {
        main: "Gạo, bột, đồ khô",
        subs: [
            "Gạo, nếp", "Xúc xích", "Cá hộp", "Heo, bò, pate hộp",
            "Mì, hủ tiếu chay", "Chao", "Đồ chay các loại",
            "Bột các loại", "Đậu, nấm, đồ khô", "Rong biển",
            "Cá mắm, dưa mắm", "Bánh phồng, bánh đa", "Bánh tráng",
            "Nước cốt dừa lon", "Ngũ cốc, yến mạch"
        ]
    },

    {
        main: "Mì, miến, cháo, phở",
        subs: [
            "Mì ăn liền", "Hủ tiếu, miến", "Phở, bún ăn liền",
            "Cháo gói, cháo tươi", "Bún các loại", "Nui các loại",
            "Miến, hủ tiếu, phở khô", "Bánh gạo Hàn Quốc", "Mì Ý, mì trứng"
        ]
    },

    {
        main: "Sữa các loại",
        subs: [
            "Sữa tươi", "Sữa ca cao, lúa mạch", "Sữa chua uống liền",
            "Sữa pha sẵn", "Sữa hạt, sữa đậu", "Sữa đặc",
            "Ngũ cốc", "Sữa chua"
        ]
    },

    {
        main: "Kem, sữa chua",
        subs: ["Kem", "Sữa chua"]
    },

    {
        main: "Thực phẩm đông mát",
        subs: [
            "Xúc xích, lạp xưởng, giò chả", "Hàng đông chế biến",
            "Hàng mát chế biến", "Chả giò", "Viên đông, viên mát",
            "Thủy hải sản, thịt đông"
        ]
    },

    {
        main: "Bia, nước giải khát",
        subs: [
            "Bia, nước có cồn", "Rượu", "Nước trà", "Nước ngọt",
            "Nước tăng lực, bù khoáng", "Nước suối", "Nước yến",
            "Nước ép trái cây", "Sữa trái cây", "Trái cây hộp, si rô",
            "Cà phê hoà tan", "Trà khô, túi lọc", "Cà phê pha phin",
            "Cà phê lon", "Mật ong"
        ]
    },

    {
        main: "Bánh kẹo các loại",
        subs: [
            "Giỏ quà tết", "Bánh quy", "Bánh tươi, Sandwich",
            "Bánh bông lan", "Bánh Chocopie", "Bánh snack",
            "Bánh gạo", "Bánh que", "Bánh quế", "Kẹo cứng",
            "Kẹo dẻo, kẹo marshmallow", "Kẹo Singum",
            "Khô chế biến sẵn", "Trái cây sấy", "Hạt khô",
            "Rau câu, thạch dừa", "Bánh xốp", "Cơm cháy, bánh tráng",
            "Ngũ cốc, yến mạch", "Socola"
        ]
    },

    {
        main: "Chăm sóc cá nhân",
        subs: [
            "Dầu gội", "Sữa tắm", "Sữa rửa mặt", "Giấy vệ sinh",
            "Kem đánh răng", "Bàn chải, tăm chỉ nha khoa", "Nước súc miệng",
            "Khăn giấy", "Khăn ướt", "Nước rửa tay", "Xà bông cục",
            "Khẩu trang", "Dầu xả, kem ủ", "Sữa dưỡng thể",
            "Lăn xịt khử mùi", "Tẩy trang", "Kem chống nắng",
            "Băng vệ sinh", "Dung dịch vệ sinh", "Bao cao su",
            "Dao cạo, bọt cạo râu", "Tăm bông", "Kem tẩy lông",
            "Keo vuốt tóc", "Thuốc nhuộm tóc"
        ]
    },

    {
        main: "Vệ sinh nhà cửa",
        subs: [
            "Nước giặt", "Nước xả", "Bột giặt", "Nước rửa chén",
            "Nước lau sàn", "Tẩy rửa nhà tắm", "Bình xịt côn trùng",
            "Xịt phòng, sáp thơm", "Lau kính, lau bếp", "Nước tẩy",
            "Khăn giấy", "Túi đựng rác"
        ]
    },

    {
        main: "Sản phẩm mẹ và bé",
        subs: [
            "Tắm gội cho bé", "Giặt xả cho bé", "Kem đánh răng bé",
            "Bàn chải cho bé", "Phấn thơm, dưỡng ẩm"
        ]
    },

    {
        main: "Đồ dùng gia đình",
        subs: [
            "Túi đựng rác", "Pin tiểu", "Màng bọc thực phẩm",
            "Đồ dùng một lần", "Hộp đựng thực phẩm", "Chảo",
            "Dao, kéo", "Nhấc lót nồi", "Khăn lau bếp",
            "Miếng rửa chén", "Khăn tắm, bông tắm", "Bàn chải",
            "Bút bi, thước kẻ", "Băng keo, bao thư", "Bật lửa"
        ]
    }
];

// ============================
// UTILITY FUNCTIONS
// ============================
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function randomDelay() {
    return delay(CONFIG.DELAY_MIN + Math.random() * (CONFIG.DELAY_MAX - CONFIG.DELAY_MIN));
}

function slugify(text) {
    return text.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function saveProgress(data) {
    try {
        fs.writeFileSync(CONFIG.PROGRESS_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('❌ Failed to save progress:', e.message);
    }
}

function loadProgress() {
    try {
        if (fs.existsSync(CONFIG.PROGRESS_FILE)) {
            return JSON.parse(fs.readFileSync(CONFIG.PROGRESS_FILE, 'utf8'));
        }
    } catch (e) {
        console.error('⚠️  Failed to load progress:', e.message);
    }
    return { completed_subcategories: [], total_products_crawled: 0, errors: [] };
}

// ============================
// IMAGE DOWNLOADER
// ============================
async function downloadProductImage(imageUrl, productName) {
    if (!imageUrl) return null;

    try {
        if (!fs.existsSync(CONFIG.IMAGE_DIR)) {
            fs.mkdirSync(CONFIG.IMAGE_DIR, { recursive: true });
        }

        const filename = `${slugify(productName)}.jpg`;
        const filepath = path.join(CONFIG.IMAGE_DIR, filename);

        // Skip if already exists
        if (fs.existsSync(filepath)) {
            return filepath;
        }

        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        fs.writeFileSync(filepath, response.data);
        return filepath;

    } catch (e) {
        console.error(`   ⚠️  Image download failed for ${productName}:`, e.message);
        return null;
    }
}

// ============================
// NAVIGATION & EXTRACTION
// ============================

async function navigateToSubcategory(page, mainCat, subCat) {
    console.log(`\n🔍 Navigating to: ${mainCat} > ${subCat}`);

    try {
        // Go to homepage first
        await page.goto(CONFIG.BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        await randomDelay();

        // Use JavaScript to find and click the subcategory link by text
        const clicked = await page.evaluate((subCatText) => {
            // Find an <a> tag that contains the exact subcategory text
            const links = Array.from(document.querySelectorAll('a'));
            const targetLink = links.find(link => {
                const text = link.textContent.trim();
                return text === subCatText || text.includes(subCatText);
            });

            if (targetLink) {
                targetLink.click();
                return true;
            }
            return false;
        }, subCat);

        if (!clicked) {
            throw new Error(`Could not find menu link for: ${subCat}`);
        }

        // Wait for navigation
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

        // Wait for products to load (async rendering)
        await page.waitForSelector('a[id^="product_"].relative', { timeout: 10000 });

        // Verify we're on a product listing page
        const hasProducts = await page.evaluate(() => {
            return document.querySelectorAll('a[id^="product_"].relative').length > 0;
        });

        if (!hasProducts) {
            throw new Error(`No products found on page after clicking: ${subCat}`);
        }

        const currentUrl = page.url();
        console.log(`   ✅ Navigated to: ${currentUrl}`);

        await randomDelay();
        return true;

    } catch (e) {
        console.error(`   ❌ Navigation failed:`, e.message);
        return false;
    }
}

async function extractProductLinksFromListPage(page, limit) {
    console.log(`   📋 Extracting product links (max ${limit})...`);

    const productUrls = [];
    let currentPage = 1;

    try {
        while (productUrls.length < limit) {
            // Extract product URLs from current page
            const urls = await page.evaluate(() => {
                const links = [];
                const cards = document.querySelectorAll('a[id^="product_"].relative');

                cards.forEach(card => {
                    const href = card.href;
                    if (href && href.includes('/')) {
                        links.push(href);
                    }
                });

                return [...new Set(links)];  // Remove duplicates
            });

            productUrls.push(...urls);
            console.log(`      Page ${currentPage}: found ${urls.length} products (total: ${productUrls.length})`);

            // Check if we have enough or no more products found
            if (productUrls.length >= limit || urls.length === 0) {
                break;
            }

            // Try to go to next page
            const hasNextPage = await page.evaluate(() => {
                const nextBtn = document.querySelector('.page-next, .pagination .next, a[rel="next"]');
                if (nextBtn && !nextBtn.classList.contains('disabled')) {
                    nextBtn.click();
                    return true;
                }
                return false;
            });

            if (!hasNextPage) {
                console.log(`      No more pages found`);
                break;
            }

            await randomDelay();
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => { });
            currentPage++;
        }

    } catch (e) {
        console.error(`   ⚠️  Error during pagination:`, e.message);
    }

    // Return only the requested limit
    return productUrls.slice(0, limit);
}

async function extractProductDetail(page, productUrl, mainCat, subCat) {
    try {
        await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        await randomDelay();

        // Extract product data from page
        const product = await page.evaluate((url, main, sub) => {
            // Try to get JSON-LD first
            let jsonLd = null;
            try {
                const scriptTag = document.querySelector('script[type="application/ld+json"]');
                if (scriptTag) {
                    jsonLd = JSON.parse(scriptTag.textContent);
                }
            } catch (e) { }

            // Extract from DOM
            const nameEl = document.querySelector('h1, .product-name, .detail-name');
            const name = nameEl ? nameEl.innerText.trim() : (jsonLd?.name || '');

            const priceEl = document.querySelector('.price, .product-price, strong.red');
            const priceText = priceEl ? priceEl.innerText.trim() : (jsonLd?.offers?.price || '0₫');
            const priceValue = parseInt(priceText.replace(/\D/g, '')) || 0;

            const oldPriceEl = document.querySelector('.old-price, .original-price, .price-old');
            const oldPriceText = oldPriceEl ? oldPriceEl.innerText.trim() : '';
            const oldPriceValue = parseInt(oldPriceText.replace(/\D/g, '')) || null;

            const discountEl = document.querySelector('.discount, .percent, [class*="discount"]');
            const discountPercent = discountEl ? discountEl.innerText.trim() : null;

            const imgEl = document.querySelector('.product-image img, .detail-image img, img[itemprop="image"]');
            let imageUrl = imgEl ? (imgEl.src || imgEl.dataset.src) : (jsonLd?.image || null);

            // Get high-res version if possible
            if (imageUrl && imageUrl.includes('/thumbs/')) {
                imageUrl = imageUrl.replace('/thumbs/', '/');
            }

            const descEl = document.querySelector('.description, .product-description, [itemprop="description"]');
            const description = descEl ? descEl.innerText.trim().substring(0, 500) : '';

            // Extract unit from name
            const unitMatch = name.match(/(\d+\s*(g|kg|ml|l|gr|lit|chai|lon|hộp|gói|túi|cái|quả))/i);
            const unit = unitMatch ? unitMatch[0] : '';

            return {
                name,
                category_main: main,
                category_sub: sub,
                price_text: priceText,
                price_value: priceValue,
                old_price_text: oldPriceText || null,
                old_price_value: oldPriceValue,
                unit,
                discount_percent: discountPercent,
                sku_or_code: null,
                product_url: url,
                image_url: imageUrl,
                description,
                source: 'bachhoaxanh.com',
                error_note: null
            };

        }, productUrl, mainCat, subCat);

        if (!product.name) {
            throw new Error('Could not extract product name');
        }

        return product;

    } catch (e) {
        console.error(`   ❌ Failed to extract: ${productUrl} - ${e.message}`);
        return {
            name: null,
            category_main: mainCat,
            category_sub: subCat,
            price_text: null,
            price_value: 0,
            old_price_text: null,
            old_price_value: null,
            unit: null,
            discount_percent: null,
            sku_or_code: null,
            product_url: productUrl,
            image_url: null,
            description: null,
            source: 'bachhoaxanh.com',
            error_note: e.message
        };
    }
}

async function crawlSubcategory(page, mainCat, subCat) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📂 CRAWLING: ${mainCat} > ${subCat}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    const products = [];

    try {
        // Navigate to subcategory
        const navigated = await navigateToSubcategory(page, mainCat, subCat);
        if (!navigated) {
            throw new Error('Navigation failed');
        }

        // Extract product URLs from listing page
        const productUrls = await extractProductLinksFromListPage(page, CONFIG.LIMIT_PER_SUBCATEGORY);
        console.log(`   ✅ Found ${productUrls.length} product URLs`);

        if (productUrls.length === 0) {
            throw new Error('No products found');
        }

        // Crawl each product detail page
        console.log(`\n   🔎 Extracting product details...`);
        for (let i = 0; i < productUrls.length; i++) {
            const url = productUrls[i];
            process.stdout.write(`      [${i + 1}/${productUrls.length}] `);

            const product = await extractProductDetail(page, url, mainCat, subCat);

            if (product.name) {
                // Download image
                if (product.image_url) {
                    const localPath = await downloadProductImage(product.image_url, product.name);
                    product.local_image_path = localPath;
                }

                products.push(product);
                console.log(`✅ ${product.name.substring(0, 50)}...`);
            } else {
                products.push(product);
                console.log(`⚠️  Failed`);
            }

            await randomDelay();
        }

        console.log(`\n   ✅ Completed: ${products.filter(p => p.name).length}/${products.length} products`);

    } catch (e) {
        console.error(`\n   ❌ Subcategory failed: ${e.message}`);
    }

    return products;
}

// ============================
// DATA EXPORT
// ============================
function exportToJSON(products, filepath) {
    try {
        fs.writeFileSync(filepath, JSON.stringify(products, null, 2));
        console.log(`\n✅ JSON saved: ${filepath} (${products.length} products)`);
    } catch (e) {
        console.error(`❌ JSON export failed:`, e.message);
    }
}

function exportToCSV(products, filepath) {
    try {
        const headers = [
            'name', 'category_main', 'category_sub', 'price_text', 'price_value',
            'old_price_text', 'old_price_value', 'unit', 'discount_percent',
            'sku_or_code', 'product_url', 'image_url', 'local_image_path',
            'description', 'source', 'error_note'
        ];

        const rows = products.map(p => {
            return headers.map(h => {
                const value = p[h] || '';
                // Escape CSV values
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(',');
        });

        const csv = [headers.join(','), ...rows].join('\n');
        fs.writeFileSync(filepath, csv);
        console.log(`✅ CSV saved: ${filepath}`);

    } catch (e) {
        console.error(`❌ CSV export failed:`, e.message);
    }
}

function generateSummaryReport(products, progress) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 CRAWL SUMMARY`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Total subcategories crawled: ${progress.completed_subcategories.length}`);
    console.log(`Total products: ${products.length}`);
    console.log(`Successful: ${products.filter(p => p.name).length}`);
    console.log(`Failed: ${products.filter(p => !p.name).length}`);
    console.log(`With images: ${products.filter(p => p.local_image_path).length}`);

    if (progress.errors.length > 0) {
        console.log(`\n⚠️  Errors encountered:`);
        progress.errors.forEach(e => console.log(`   - ${e}`));
    }

    console.log(`\n📁 Output files:`);
    console.log(`   - ${CONFIG.OUTPUT_JSON}`);
    console.log(`   - ${CONFIG.OUTPUT_CSV}`);
    console.log(`   - ${CONFIG.IMAGE_DIR}/ (${products.filter(p => p.local_image_path).length} images)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

// ============================
// MAIN CRAWLER
// ============================
async function main() {
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🤖 BACH HOA XANH COMPREHENSIVE CRAWLER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

    if (CONFIG.TEST_MODE) {
        console.log(`⚠️  TEST MODE: Will only crawl 2-3 subcategories\n`);
    }

    const progress = loadProgress();
    const allProducts = [];

    // Launch browser
    console.log(`🚀 Launching browser...`);
    const browser = await puppeteer.launch({
        headless: CONFIG.HEADLESS,
        defaultViewport: { width: 1366, height: 768 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        // Filter categories to crawl
        let categoriesToCrawl = CATEGORY_TREE.filter(c => c.subs.length > 0);

        if (CONFIG.TEST_MODE) {
            // Test mode: only crawl 2 subcategories from first category
            categoriesToCrawl = [
                { main: "Thịt, cá, trứng, hải sản", subs: ["Thịt heo", "Rau lá"] }
            ];
        }

        // Crawl each category
        for (const category of categoriesToCrawl) {
            for (const subCat of category.subs) {
                // Check if already completed
                const alreadyDone = progress.completed_subcategories.some(
                    c => c.main === category.main && c.sub === subCat
                );

                if (alreadyDone) {
                    console.log(`⏭️  Skipping (already done): ${category.main} > ${subCat}`);
                    continue;
                }

                // Crawl subcategory
                const products = await crawlSubcategory(page, category.main, subCat);
                allProducts.push(...products);

                // Update progress
                progress.completed_subcategories.push({
                    main: category.main,
                    sub: subCat,
                    count: products.length,
                    timestamp: new Date().toISOString()
                });
                progress.total_products_crawled = allProducts.length;

                if (products.length === 0) {
                    progress.errors.push(`No products found: ${category.main} > ${subCat}`);
                }

                saveProgress(progress);

                // Incremental save to JSON
                exportToJSON(allProducts, CONFIG.OUTPUT_JSON);
            }
        }

    } catch (e) {
        console.error(`\n❌ Fatal error:`, e.message);
        progress.errors.push(`Fatal: ${e.message}`);
        saveProgress(progress);
    }

    await browser.close();

    // Final export
    exportToJSON(allProducts, CONFIG.OUTPUT_JSON);
    exportToCSV(allProducts, CONFIG.OUTPUT_CSV);

    // Generate summary
    generateSummaryReport(allProducts, progress);

    if (CONFIG.TEST_MODE) {
        console.log(`✅ Test mode completed. Review results before running full crawl.`);
        console.log(`To run full crawl, set TEST_MODE=false in CONFIG.\n`);
    } else {
        console.log(`✅ Full crawl completed!\n`);
    }
}

// Run
main().catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
});
