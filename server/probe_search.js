const axios = require('axios');
const fs = require('fs');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function debugSearch() {
    try {
        const url = 'https://www.bachhoaxanh.com/search?q=heo';
        console.log(`Fetching Search ${url}...`);
        const r = await axios.get(url, { headers: { 'User-Agent': UA } });

        if (r.data.includes('/thit-heo')) {
            console.log("FOUND Product Links in Search HTML!");
            const matches = r.data.match(/href="\/thit-heo\/[^"]+"/g);
            if (matches) {
                console.log("Found links:", matches.slice(0, 5));
            }
        } else {
            console.log("NO Product Links found in Search HTML (Likely CSR).");
            fs.writeFileSync('debug_search.html', r.data);
            console.log("Saved debug_search.html");
        }
    } catch (e) { console.log("Error:", e.message); }
}

debugSearch();
