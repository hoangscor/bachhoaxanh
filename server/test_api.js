const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const catId = 8781; // Thit Heo

async function testApi() {
    try {
        console.log("Testing API for CatID:", catId);

        // Attempt 1: Standard MWG pattern
        const url1 = 'https://www.bachhoaxanh.com/aj/CategoryV2/ProductList';
        const payload1 = {
            categoryID: catId,
            pageIndex: 0,
            pageSize: 10
        };

        console.log(`POST ${url1}...`);
        try {
            const r1 = await axios.post(url1, payload1, {
                headers: {
                    'User-Agent': UA,
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Referer': 'https://www.bachhoaxanh.com/thit-heo',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            console.log("Status:", r1.status);
            console.log("Data Length:", r1.data.length);
            console.log("Preview:", typeof r1.data === 'string' ? r1.data.slice(0, 100) : Object.keys(r1.data));
        } catch (e1) {
            console.log("Attempt 1 Failed:", e1.response ? e1.response.status : e1.message);
        }

        // Attempt 2: FormData
        const formData = new URLSearchParams();
        formData.append('categoryID', catId);
        formData.append('pageIndex', 0);
        formData.append('pageSize', 20);

        console.log(`POST ${url1} (FormData)...`);
        try {
            const r2 = await axios.post(url1, formData, {
                headers: {
                    'User-Agent': UA,
                    'Referer': 'https://www.bachhoaxanh.com/thit-heo',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            console.log("Status:", r2.status);
            console.log("Preview:", typeof r2.data === 'string' ? r2.data.slice(0, 500) : "JSON Object");
        } catch (e2) {
            console.log("Attempt 2 Failed:", e2.response ? e2.response.status : e2.message);
        }

    } catch (e) { console.log(e); }
}

testApi();
