const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function probe() {
    console.log("Probing BHX...");

    // 1. Robots
    try {
        console.log("Checking robots.txt...");
        const r1 = await axios.get('https://www.bachhoaxanh.com/robots.txt', { headers: { 'User-Agent': UA } });
        console.log("Robots.txt status:", r1.status);
        console.log("Robots preview:", r1.data.slice(0, 200));
    } catch (e) { console.log("Robots failed:", e.message); }

    // 2. Sitemap
    try {
        console.log("Checking sitemap.xml...");
        const r2 = await axios.get('https://www.bachhoaxanh.com/sitemap.xml', { headers: { 'User-Agent': UA } });
        console.log("Sitemap status:", r2.status);
        if (r2.status === 200) {
            console.log("Sitemap content preview:", r2.data.slice(0, 200));
        }
    } catch (e) {
        console.log("Sitemap failed:", e.message);
        // Try common alternative
        try {
            console.log("Checking sitemap_index.xml...");
            const r2b = await axios.get('https://www.bachhoaxanh.com/sitemap_index.xml', { headers: { 'User-Agent': UA } });
            console.log("Sitemap Index status:", r2b.status);
        } catch (ex) { console.log("Sitemap index failed:", ex.message); }
    }

    // 3. Product Page
    try {
        const url = 'https://www.bachhoaxanh.com/thit-heo/ba-roi-heo-1kg';
        console.log(`Checking Product Page: ${url}...`);
        const r3 = await axios.get(url, { headers: { 'User-Agent': UA } });
        console.log("Product status:", r3.status);

        if (r3.status === 200) {
            const $ = cheerio.load(r3.data);
            const title = $('h1').text().trim();
            const price = $('.price, .current-price, .box-price strong').first().text().trim(); // Guesses
            const img = $('img').first().attr('src'); // Rough guess

            console.log("Parsed Title:", title);
            console.log("Parsed Price:", price);
            console.log("First Img:", img);

            // Check specific BHX selectors if known
            // Usually .product-name h1, .box-price strong, .slider-item img
            const specificTitle = $('h1.title-product').text().trim() || $('h1').text().trim();
            const specificPrice = $('.box-price strong').text().trim() || $('.price').text().trim();

            console.log("Specific Title:", specificTitle);
            console.log("Specific Price:", specificPrice);
        }
    } catch (e) { console.log("Product page failed:", e.message); }
}

probe();
