const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function scrapeOne() {
    try {
        const url = 'https://www.bachhoaxanh.com/thit-heo/ba-roi-heo-1kg';
        console.log(`Scraping ${url}...`);

        const r = await axios.get(url, { headers: { 'User-Agent': UA } });
        const $ = cheerio.load(r.data);

        // 1. Try JSON-LD
        let productData = null;
        $('script[type="application/ld+json"]').each((i, el) => {
            try {
                const json = JSON.parse($(el).html());
                if (json['@type'] === 'Product') {
                    productData = json;
                }
            } catch (e) { }
        });

        if (productData) {
            console.log("JSON-LD Found:");
            console.log("Name:", productData.name);
            console.log("Price:", productData.offers ? productData.offers.price : 'N/A');
            console.log("Image:", productData.image);
            console.log("Category:", productData.category || 'N/A');
        } else {
            console.log("JSON-LD NOT found. Trying selectors...");
            const name = $('h1').text().trim();
            const price = $('.price, .current-price, strong.price').first().text().trim();
            console.log("Name (Sel):", name);
            console.log("Price (Sel):", price);
        }

    } catch (e) { console.log("Error:", e.message); }
}

scrapeOne();
