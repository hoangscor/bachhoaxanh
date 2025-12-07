const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');

const CACHE_DIR = path.resolve(__dirname, 'cache');
const CACHE_FILE = path.resolve(CACHE_DIR, 'bhx_products.json');

// Real BHX Category URLs to scrape
const BHX_SOURCES = [
    { url: "https://www.bachhoaxanh.com/thit-heo", cat: "Thịt heo" },
    { url: "https://www.bachhoaxanh.com/rau-cu", cat: "Rau củ" },
    { url: "https://www.bachhoaxanh.com/trai-cay", cat: "Trái cây" },
    { url: "https://www.bachhoaxanh.com/nuoc-ngot", cat: "Nước ngọt" },
    { url: "https://www.bachhoaxanh.com/mi-an-lien", cat: "Mì ăn liền" },
    { url: "https://www.bachhoaxanh.com/banh-quy", cat: "Bánh quy" },
    { url: "https://www.bachhoaxanh.com/sua-tuoi", cat: "Sữa tươi" },
    { url: "https://www.bachhoaxanh.com/nuoc-giat", cat: "Nước giặt" }
];

// Fallback Curated Data (used if scraping fails)
const FALLBACK_DATA = [
    { name: "Ba rọi heo C.P khay 500g", price: 95000, image: "https://cdn.tgdd.vn/Products/Images/2565/76674/bhx/dau-an-tuong-an-chai-1-lit-202212021045237278.jpg", categoryHint: "Thịt heo" }, // Placeholder img for demo
    { name: "Dầu ăn Tường An 1L", price: 45000, image: "https://cdn.tgdd.vn/Products/Images/2565/76674/bhx/dau-an-tuong-an-chai-1-lit-202212021045237278.jpg", categoryHint: "Dầu ăn" },
    { name: "Nước mắm Nam Ngư 900ml", price: 32000, image: "https://cdn.tgdd.vn/Products/Images/3364/196307/bhx/nuoc-mam-nam-ngu-de-nhi-chai-900ml-202209301416395379.jpg", categoryHint: "Gia vị" },
    { name: "Coca Cola chai 390ml", price: 8000, image: "https://cdn.tgdd.vn/Products/Images/2386/76452/bhx/nuoc-ngot-coca-cola-original-vi-nguyen-ban-chai-390ml-202303080922485633.jpg", categoryHint: "Nước ngọt" },
    { name: "Thùng 30 gói mì Hảo Hảo", price: 115000, image: "https://cdn.tgdd.vn/Products/Images/2219/189728/bhx/thung-30-goi-mi-hao-hao-tom-chua-cay-75g-202109271408139599.jpg", categoryHint: "Mì ăn liền" },
    { name: "Gạo thơm lài BHX 5kg", price: 99000, image: "https://cdn.tgdd.vn/Products/Images/2563/87508/bhx/gao-thom-lai-bach-hoa-xanh-tui-5kg-202301091520108713.jpg", categoryHint: "Gạo" },
    { name: "Hạt nêm Knorr 400g", price: 35000, image: "https://cdn.tgdd.vn/Products/Images/3142/76695/bhx/hat-nem-tu-thit-knorr-goi-400g-202302220914170796.jpg", categoryHint: "Gia vị" },
    { name: "Bia Tiger Crystal thùng 24", price: 395000, image: "https://cdn.tgdd.vn/Products/Images/2464/230784/bhx/thung-24-lon-bia-tiger-crystal-330ml-202103131343588960.jpg", categoryHint: "Bia" },
    { name: "Sữa tươi Vinamilk 1L ít đường", price: 33000, image: "https://cdn.tgdd.vn/Products/Images/3015/194432/bhx/sua-tuoi-tiet-trung-khong-duong-vinamilk-100-sua-tuoi-hop-1-lit-202103191546255734.jpg", categoryHint: "Sữa tươi" },
    { name: "Nước giặt OMO 3.6kg", price: 169000, image: "https://cdn.tgdd.vn/Products/Images/2513/226002/bhx/nuoc-giat-omo-matic-cua-tren-tui-39kg-202103251508244985.jpg", categoryHint: "Nước giặt" },
    { name: "Kem đánh răng P/S Than hoạt tính", price: 38000, image: "https://cdn.tgdd.vn/Products/Images/8782/228943/bhx/kem-danh-rang-ps-bao-ve-123-than-hoat-tinh-230g-202103261619438062.jpg", categoryHint: "Chăm sóc cá nhân" }
];

async function fetchBhxImageData(limit = 100) {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);

    // 1. Check Cache
    if (fs.existsSync(CACHE_FILE)) {
        const stats = await fs.stat(CACHE_FILE);
        const hours = (new Date() - stats.mtime) / (1000 * 60 * 60);
        if (hours < 24) {
            console.log("Loading product data from cache...");
            return fs.readJson(CACHE_FILE);
        }
    }

    console.log("Fetching fresh product data from BHX...");
    let items = [];
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    try {
        for (const source of BHX_SOURCES) {
            if (items.length >= limit) break;
            try {
                console.log(`Scraping: ${source.url}`);
                const res = await axios.get(source.url, { headers, timeout: 6000 });
                const $ = cheerio.load(res.data);

                // Inspect DOM structure (generic BHX selectors)
                // Note: Selectors might change. We rely on common classes or structure.
                // Assuming product blocks are usually <li> or <div> with class containing 'product'

                $('.product-element-top, .product-item, .box-product .item').each((i, el) => {
                    if (items.length >= limit) return false;

                    const name = $(el).find('h3, .product-name').text().trim();
                    const priceText = $(el).find('.price, .product-price strong').text().trim();
                    const price = parseInt(priceText.replace(/\D/g, '')) || 0;

                    // Image: try data-src first (lazyload), then src
                    let img = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');

                    // Simple validation
                    if (name && price > 0 && img && img.includes('cdn.tgdd.vn')) {
                        items.push({
                            name: name,
                            price: price,
                            imageUrl: img,
                            categoryHint: source.cat
                        });
                    }
                });
            } catch (err) {
                console.log(`Failed to scrape ${source.url}:`, err.message);
            }
        }
    } catch (e) {
        console.error("Critical scraper error:", e);
    }

    if (items.length === 0) {
        console.log("Scraping blocked or empty. Using FALLBACK CURATED DATA.");
        items = FALLBACK_DATA;
    } else {
        console.log(`Scraped ${items.length} products successfully.`);
        // Remove duplicates by name
        items = items.filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i);
    }

    // Save to cache
    await fs.writeJson(CACHE_FILE, items.slice(0, limit));
    return items.slice(0, limit);
}

module.exports = { fetchBhxImageData };
