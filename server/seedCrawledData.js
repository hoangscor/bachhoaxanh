const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database path
const dbPath = path.resolve(__dirname, 'bachhoa.db');
const db = new sqlite3.Database(dbPath);

// Import crawled data
const crawledData = require('./data/bhx_products_by_category.json');

console.log(`🚀 Starting data import...`);
console.log(`📦 Found ${crawledData.length} products to import`);

// Helper to run SQL with promise
function runAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function getAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function allAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function seedCrawledData() {
    try {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('   STEP 1: BUILD CATEGORY STRUCTURE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Build category map from crawled data
        const categoryMap = new Map();
        crawledData.forEach(product => {
            if (!categoryMap.has(product.category_main)) {
                categoryMap.set(product.category_main, new Set());
            }
            if (product.category_sub) {
                categoryMap.get(product.category_main).add(product.category_sub);
            }
        });

        console.log(`Found ${categoryMap.size} main categories`);
        let totalSubs = 0;
        categoryMap.forEach(subs => totalSubs += subs.size);
        console.log(`Found ${totalSubs} subcategories\n`);

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('   STEP 2: CLEAR EXISTING DATA');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Clear existing data
        await runAsync('DELETE FROM order_items');
        await runAsync('DELETE FROM orders');
        await runAsync('DELETE FROM products');
        await runAsync('DELETE FROM categories');
        console.log('✅ Cleared existing products and categories\n');

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('   STEP 3: INSERT CATEGORIES');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Store category mapping using composite key to handle duplicate subcategory names
        // Key format: "mainCategory|subCategory" for subs, just "mainCategory" for main
        const categoryIdMap = new Map();
        let categoryCount = 0;

        // Insert main categories and subcategories
        for (const [mainName, subNames] of categoryMap) {
            // Insert main category
            const mainResult = await runAsync(
                'INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, NULL)',
                [mainName, slugify(mainName)]
            );
            const mainId = mainResult.lastID;
            categoryIdMap.set(mainName, mainId);
            categoryCount++;

            console.log(`  ✓ ${mainName} (ID: ${mainId})`);

            // Insert subcategories
            for (const subName of subNames) {
                // Check if this subcategory already exists (by name)
                const existingByName = await getAsync('SELECT id FROM categories WHERE name = ?', [subName]);

                const compositeKey = `${mainName}|${subName}`;

                if (existingByName) {
                    // Subcategory with this name already exists, use existing ID
                    categoryIdMap.set(compositeKey, existingByName.id);
                    console.log(`    → ${subName} (ID: ${existingByName.id}) [existing name]`);
                } else {
                    // Create unique slug
                    let uniqueSlug = `${slugify(mainName)}-${slugify(subName)}`;

                    // Check if slug already exists and make it more unique if needed
                    const existingBySlug = await getAsync('SELECT id FROM categories WHERE slug = ?', [uniqueSlug]);
                    if (existingBySlug) {
                        // Append counter to make unique
                        let counter = 2;
                        while (await getAsync('SELECT id FROM categories WHERE slug = ?', [`${uniqueSlug}-${counter}`])) {
                            counter++;
                        }
                        uniqueSlug = `${uniqueSlug}-${counter}`;
                    }

                    const subResult = await runAsync(
                        'INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, ?)',
                        [subName, uniqueSlug, mainId]
                    );
                    categoryIdMap.set(compositeKey, subResult.lastID);
                    categoryCount++;
                    console.log(`    → ${subName} (ID: ${subResult.lastID})`);
                }
            }
        }

        console.log(`\n✅ Inserted ${categoryCount} categories\n`);

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('   STEP 4: INSERT PRODUCTS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (let i = 0; i < crawledData.length; i++) {
            const product = crawledData[i];

            try {
                // Get category ID using composite key (mainCategory|subCategory)
                const compositeKey = `${product.category_main}|${product.category_sub}`;
                const categoryId = categoryIdMap.get(compositeKey) ||
                    categoryIdMap.get(product.category_main) ||
                    1; // Fallback to first category

                // Determine if fresh
                const isFresh = ['Thịt, cá, trứng, hải sản', 'Rau, củ, nấm, trái cây']
                    .some(cat => product.category_main.includes(cat)) ? 1 : 0;

                // Parse image path
                let imagePath = '/assets/bhx-images/no-image.jpg';
                if (product.local_image_path) {
                    // Convert Windows path to URL path
                    imagePath = product.local_image_path
                        .replace(/\\/g, '/')
                        .replace('assets/', '/assets/');
                } else if (product.image_url) {
                    // Use external URL as fallback
                    imagePath = product.image_url;
                }

                // Determine badge
                let badge = '';
                if (product.discount_percent) {
                    badge = product.discount_percent;
                } else if (isFresh) {
                    badge = 'Tươi sống';
                }

                // Insert product
                await runAsync(`
                    INSERT INTO products (
                        name, category_id, price, old_price, unit, 
                        badge, is_fresh, image_url, description, stock
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    product.name,
                    categoryId,
                    product.price_value || 0,
                    product.old_price_value,
                    product.unit || '',
                    badge,
                    isFresh,
                    imagePath,
                    product.description || `Sản phẩm ${product.name} chất lượng cao từ Bách Hóa Xanh`,
                    100 // Default stock
                ]);

                successCount++;

                // Progress indicator
                if ((i + 1) % 100 === 0) {
                    console.log(`  Progress: ${i + 1}/${crawledData.length} products...`);
                }

            } catch (err) {
                errorCount++;
                errors.push({ product: product.name, error: err.message });
            }
        }

        console.log(`\n✅ Inserted ${successCount} products`);
        if (errorCount > 0) {
            console.log(`⚠️  Failed: ${errorCount} products`);
            console.log(`\nErrors:`);
            errors.slice(0, 5).forEach(e => {
                console.log(`  - ${e.product}: ${e.error}`);
            });
            if (errors.length > 5) {
                console.log(`  ... and ${errors.length - 5} more`);
            }
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('   STEP 5: VERIFY DATA');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const stats = await getAsync('SELECT COUNT(*) as count FROM products');
        const catStats = await getAsync('SELECT COUNT(*) as count FROM categories');

        console.log(`📊 Final Statistics:`);
        console.log(`  Categories: ${catStats.count}`);
        console.log(`  Products: ${stats.count}`);

        // Category breakdown
        console.log(`\n📊 Products per Main Category:`);
        const categoryBreakdown = await allAsync(`
            SELECT c.name, COUNT(p.id) as count
            FROM categories c
            LEFT JOIN categories sub ON sub.parent_id = c.id
            LEFT JOIN products p ON p.category_id = sub.id OR p.category_id = c.id
            WHERE c.parent_id IS NULL
            GROUP BY c.id
            ORDER BY count DESC
        `);

        categoryBreakdown.forEach(cat => {
            console.log(`  ${cat.name}: ${cat.count} products`);
        });

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('   ✅ DATA IMPORT COMPLETED');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('❌ Fatal error during seed:', error);
        throw error;
    }
}

// Helper function to slugify
function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Run the seed
seedCrawledData()
    .then(() => {
        console.log('🎉 Seed completed successfully!');
        db.close();
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ Seed failed:', err);
        db.close();
        process.exit(1);
    });
