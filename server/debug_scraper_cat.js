const axios = require('axios');
const fs = require('fs');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function debugCat() {
    try {
        const url = 'https://www.bachhoaxanh.com/thit-heo';
        console.log(`Fetching Category ${url}...`);
        const r = await axios.get(url, { headers: { 'User-Agent': UA } });
        fs.writeFileSync('debug_category.html', r.data);
        console.log("Saved debug_category.html");

        // Check for product links
        if (r.data.includes('/ba-roi-heo')) {
            console.log("FOUND Product Links in HTML!");
        } else {
            console.log("NO Product Links found (Likely CSR/API).");
        }
    } catch (e) { console.log("Error:", e.message); }
}

debugCat();
