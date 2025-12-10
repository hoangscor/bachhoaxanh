const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const DELAY_MS = 2000;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function runScraper() {
    try {
        const urls = JSON.parse(fs.readFileSync('server/data/products_to_scrape.json', 'utf8'));
        console.log(`Loaded ${urls.length} URLs to scrape.`);

        const results = [];

        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            console.log(`[${i + 1}/${urls.length}] Scraping ${url}...`);

            try {
                const r = await axios.get(url, { headers: { 'User-Agent': UA } });
                const $ = cheerio.load(r.data);

                let product = { url };

                // 1. JSON-LD Extraction
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
                    product.name = jsonLd.name;
                    product.price = jsonLd.offers ? parseInt(jsonLd.offers.price) : 0;
                    product.image_url = jsonLd.image;
                    product.category = jsonLd.category || 'N/A';
                    product.description = jsonLd.description || '';
                } else {
                    // Fallback
                    product.name = $('h1').text().trim();
                    const pText = $('.price, .current-price').first().text().replace(/[^\d]/g, '');
                    product.price = pText ? parseInt(pText) : 0;
                    product.image_url = $('.slider-item img').first().attr('src') || '';
                    product.category = 'Unknown';
                    product.description = '';
                }

                // Refine Data
                // Extract Unit from Name (e.g. 500g, 1kg)
                const unitMatch = product.name ? product.name.match(/(\d+(?:kg|g|ml|l))/i) : null;
                product.unit = unitMatch ? unitMatch[0] : '';

                // Ensure Image URL is absolute
                if (product.image_url && !product.image_url.startsWith('http')) {
                    // Sometimes JSON-LD gives clean URL
                }

                console.log(`   -> Found: ${product.name} | ${product.price} | ${product.unit}`);
                results.push(product);

            } catch (e) {
                console.error(`   -> Failed: ${e.message}`);
            }

            // Rate Limit
            await delay(DELAY_MS + Math.random() * 1000);
        }

        // Save JSON
        fs.writeFileSync('server/data/bhx_products_full.json', JSON.stringify(results, null, 2));
        console.log("Saved server/data/bhx_products_full.json");

        // Save CSV
        const csvWriter = createCsvWriter({
            path: 'server/data/bhx_products_full.csv',
            header: [
                { id: 'name', title: 'Name' },
                { id: 'price', title: 'Price' },
                { id: 'unit', title: 'Unit' },
                { id: 'category', title: 'Category' },
                { id: 'image_url', title: 'Image URL' },
                { id: 'url', title: 'Product URL' },
                { id: 'description', title: 'Description' }
            ]
        });

        await csvWriter.writeRecords(results);
        console.log("Saved server/data/bhx_products_full.csv");

    } catch (e) { console.error("Fatal Error:", e); }
}

runScraper();
