const { fetchBhxImageUrls } = require('./server/bhxImageFetcher');

async function test() {
    console.log("Testing scraper...");
    try {
        const images = await fetchBhxImageUrls(10);
        console.log("Result:", images);
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
