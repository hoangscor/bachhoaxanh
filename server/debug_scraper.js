const axios = require('axios');
const fs = require('fs');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function debug() {
    try {
        const url = 'https://www.bachhoaxanh.com/thit-heo/ba-roi-heo-1kg';
        console.log(`Fetching ${url}...`);
        const r = await axios.get(url, { headers: { 'User-Agent': UA } });
        fs.writeFileSync('debug_product.html', r.data);
        console.log("Saved debug_product.html");

        // Quick check for NEXT_DATA
        if (r.data.includes('__NEXT_DATA__')) {
            console.log("FOUND __NEXT_DATA__!");
        } else {
            console.log("NO __NEXT_DATA__ found.");
        }
    } catch (e) { console.log("Error:", e.message); }
}

debug();
