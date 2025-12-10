const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const TARGET_URL_COUNT = 500; // Target 500 URLs
const MAX_PER_CATEGORY = 50;  // Max URLs per category

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function collectURLsFromCategory(categoryUrl, categoryName, limit) {
    try {
        console.log(`\n📂 ${categoryName}`);
        console.log(`   URL: ${categoryUrl}`);

        const response = await axios.get(categoryUrl, {
            headers: { 'User-Agent': UA }
        });

        const $ = cheerio.load(response.data);
        const urls = new Set();

        // Find product links
        $('a[href*="/"]').each((i, el) => {
            const href = $(el).attr('href');
            if (href &&
                href.includes('bachhoaxanh.com/') &&
                !href.includes('?') &&
                !href.includes('gioi-thieu') &&
                !href.includes('dang-nhap') &&
                href.split('/').length >= 5) { // Has product slug

                const fullUrl = href.startsWith('http') ? href : `https://www.bachhoaxanh.com${href}`;

                // Filter: must match category pattern
                const categorySlug = categoryUrl.split('/').pop();
                if (fullUrl.includes(`/${categorySlug}/`)) {
                    urls.add(fullUrl);
                }
            }
        });

        const urlArray = Array.from(urls).slice(0, limit);
        console.log(`   ✅ Found ${urlArray.length} URLs`);

        return urlArray;

    } catch (e) {
        console.error(`   ❌ Error: ${e.message}`);
        return [];
    }
}

async function collectAllProductURLs() {
    console.log('='.repeat(60));
    console.log('🔍 BHX URL COLLECTOR');
    console.log(`Target: ${TARGET_URL_COUNT} product URLs`);
    console.log('='.repeat(60));

    const categories = JSON.parse(fs.readFileSync('server/data/bhx_categories.json', 'utf8'));

    // Sort by priority
    const sortedCats = categories.sort((a, b) => a.priority - b.priority);

    const allURLs = new Set();
    const urlsByCategory = {};

    for (const cat of sortedCats) {
        if (allURLs.size >= TARGET_URL_COUNT) {
            console.log(`\n✋ Reached target of ${TARGET_URL_COUNT} URLs. Stopping.`);
            break;
        }

        const remaining = TARGET_URL_COUNT - allURLs.size;
        const toCollect = Math.min(MAX_PER_CATEGORY, remaining);

        const urls = await collectURLsFromCategory(cat.url, cat.sub, toCollect);

        urlsByCategory[cat.sub] = urls;
        urls.forEach(url => allURLs.add(url));

        console.log(`   📊 Total collected: ${allURLs.size}/${TARGET_URL_COUNT}`);

        // Rate limiting
        await delay(2000 + Math.random() * 1000);
    }

    // Save results
    const finalURLs = Array.from(allURLs);

    fs.writeFileSync(
        'server/data/all_product_urls.json',
        JSON.stringify(finalURLs, null, 2)
    );

    fs.writeFileSync(
        'server/data/urls_by_category.json',
        JSON.stringify(urlsByCategory, null, 2)
    );

    console.log('\n' + '='.repeat(60));
    console.log('✅ URL COLLECTION COMPLETE');
    console.log('='.repeat(60));
    console.log(`Total URLs collected: ${finalURLs.length}`);
    console.log(`Categories processed: ${Object.keys(urlsByCategory).length}`);
    console.log(`Saved to: server/data/all_product_urls.json`);
    console.log('='.repeat(60));

    return finalURLs;
}

collectAllProductURLs().catch(console.error);
