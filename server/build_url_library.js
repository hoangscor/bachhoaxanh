const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// Tạo danh sách 500 URLs bằng cách kết hợp:
// 1. Seed URLs có sẵn
// 2. Pattern matching cho sản phẩm phổ biến
// 3. Incremental ID testing

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

// Seed URLs từ thit-heo (17 URLs)
const CONFIRMED_URLS = [
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
    'https://www.bachhoaxanh.com/thit-heo/suon-non-heo-1kg'
];

// Pattern-based URLs cho các danh mục phổ biến
const CATEGORY_PATTERNS = {
    'thit-bo': ['thit-bo-nhap-khau', 'thit-bo-uc', 'thit-bo-my', 'suon-bo', 'ba-chi-bo', 'dui-bo'],
    'thit-ga': ['thit-ga-ta', 'thit-ga-cong-nghiep', 'canh-ga', 'dui-ga', 'uc-ga'],
    'ca-tom-muc-ech': ['ca-hoi', 'ca-thu', 'tom-su', 'tom-sot', 'muc-ong', 'ca-tra'],
    'trai-cay': ['tao', 'cam', 'xoai', 'chuoi', 'nho', 'dua-hau', 'oi', 'thanh-long', 'buoi'],
    'rau': ['rau-muong', 'rau-cai', 'rau-den', 'xa-lach', 'cu-cai'],
    'gao': ['gao-st25', 'gao-jasmine', 'gao-thom', 'gao-tam', 'nep-than'],
    'dau-an': ['dau-an-simply', 'dau-an-neptune', 'dau-oliu'],
    'nuoc-ngot': ['coca-cola', 'pepsi', 'sting', 'revive', '7up'],
    'sua-tuoi': ['vinamilk', 'th-true-milk', 'dutch-lady'],
    'mi-an-lien': ['mi-hao-hao', 'mi-omachi', 'mi-kokomi', 'mi-3-mien']
};

// Tạo URLs từ patterns
function generatePatternURLs() {
    const urls = [];

    for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
        patterns.forEach(pattern => {
            // Base URL
            urls.push(`https://www.bachhoaxanh.com/${category}/${pattern}`);

            // With sizes
            const sizes = ['500g', '1kg', '300g', 'hop-6', 'lon-330ml', 'chai-1-5l'];
            sizes.forEach(size => {
                urls.push(`https://www.bachhoaxanh.com/${category}/${pattern}-${size}`);
            });
        });
    }

    return urls;
}

// Main
async function buildURLLibrary() {
    console.log('🔨 Building 500-URL library...\n');

    const allURLs = new Set(CONFIRMED_URLS);

    // Add pattern URLs
    const patternURLs = generatePatternURLs();
    console.log(`Generated ${patternURLs.length} pattern URLs`);

    // Validate a sample (check if URLs exist)
    console.log('\n✅ Validating sample URLs...');
    let validCount = 0;

    for (let i = 0; i < Math.min(20, patternURLs.length); i++) {
        const url = patternURLs[i];
        try {
            const r = await axios.head(url, {
                headers: { 'User-Agent': UA },
                timeout: 3000
            });

            if (r.status === 200) {
                allURLs.add(url);
                validCount++;
                console.log(`   ✓ ${url.split('/').pop()}`);
            }
        } catch (e) {
            // 404 or error - skip
        }

        await new Promise(r => setTimeout(r, 500)); // Rate limit
    }

    console.log(`\n   Validated: ${validCount}/20 patterns`);

    // Add rest without validation (will filter during scraping)
    patternURLs.forEach(url => allURLs.add(url));

    // Limit to 500
    const finalURLs = Array.from(allURLs).slice(0, 500);

    // Save
    fs.writeFileSync(
        'server/data/all_product_urls.json',
        JSON.stringify(finalURLs, null, 2)
    );

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Built library with ${finalURLs.length} URLs`);
    console.log(`Saved to: server/data/all_product_urls.json`);
    console.log('='.repeat(60));
}

buildURLLibrary().catch(console.error);
