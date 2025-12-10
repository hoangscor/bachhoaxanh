const fs = require('fs');

const INPUT = 'server/data/bhx_full_catalog.json';
const OUTPUT = 'server/data/bhx_valid_catalog.json';

try {
    const raw = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
    console.log(`original count: ${raw.length}`);

    const valid = raw.filter(p =>
        p.name &&
        p.name !== 'N/A' &&
        p.name !== 'ERROR' &&
        p.price_value &&
        p.price_value > 0
    );

    console.log(`valid count: ${valid.length}`);

    fs.writeFileSync(OUTPUT, JSON.stringify(valid, null, 2));
    console.log(`Saved ${valid.length} valid products to ${OUTPUT}`);

} catch (e) {
    console.error(e);
}
