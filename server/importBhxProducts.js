/**
 * Import sản phẩm từ bhx_valid_products.json vào database
 * và sử dụng ảnh local từ thư mục bhx-images
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'bachhoa.db');
const db = new sqlite3.Database(dbPath);

// Đọc dữ liệu sản phẩm
const productsFile = path.join(__dirname, 'data', 'bhx_valid_products.json');
const products = JSON.parse(fs.readFileSync(productsFile, 'utf8'));

console.log(`📦 Đang import ${products.length} sản phẩm từ bhx_valid_products.json...`);

// Map category từ category_sub sang category_id trong database
const categoryMapping = {
    'Thịt heo': 'Thịt heo',
    'Thịt bò': 'Thịt bò',
    'Thịt gà, vịt': 'Thịt gia cầm',
    'Cá, hải sản': 'Cá, hải sản'
};

// Xóa sản phẩm cũ trước khi import (tùy chọn)
const clearFirst = process.argv.includes('--clear');

function getCategoryId(categoryName) {
    return new Promise((resolve, reject) => {
        // Thử tìm chính xác trước
        db.get("SELECT id FROM categories WHERE name = ?", [categoryName], (err, row) => {
            if (err) return reject(err);
            if (row) return resolve(row.id);

            // Tìm gần đúng
            const mapped = categoryMapping[categoryName] || categoryName;
            db.get("SELECT id FROM categories WHERE name LIKE ?", [`%${mapped}%`], (err, row) => {
                if (err) return reject(err);
                resolve(row ? row.id : 1); // Mặc định category 1 nếu không tìm thấy
            });
        });
    });
}

function cleanProductName(name) {
    // Loại bỏ phần "tại Bách hoá XANH"
    return name
        .replace(/\s+(tại|gia tot tai|gia re tai|chat luong tai)\s+Bách hoá XANH/gi, '')
        .replace(/\s+giá tốt\s*/gi, ' ')
        .replace(/\s+giá rẻ\s*/gi, ' ')
        .replace(/\s+chất lượng\s*/gi, ' ')
        .trim();
}

async function importProducts() {
    if (clearFirst) {
        console.log('🗑️ Đang xóa sản phẩm cũ...');
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM products WHERE image_url LIKE '%/bhx-images/%'", (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }

    for (const product of products) {
        try {
            const categoryId = await getCategoryId(product.category_sub);
            const cleanName = cleanProductName(product.name);

            // Chuyển đổi local_image_path thành URL cho web server
            // assets\\bhx-images\\file.jpg -> /bhx-images/file.jpg
            let imageUrl = product.image_url; // Dùng URL gốc làm backup

            if (product.local_image_path) {
                // Kiểm tra file có tồn tại không
                const localPath = path.join(__dirname, '..', product.local_image_path);
                if (fs.existsSync(localPath)) {
                    // Chuyển đổi sang đường dẫn web
                    imageUrl = '/bhx-images/' + path.basename(product.local_image_path);
                    console.log(`✅ Sử dụng ảnh local: ${imageUrl}`);
                } else {
                    console.log(`⚠️ File ảnh không tồn tại: ${localPath}, dùng URL gốc`);
                }
            }

            // Kiểm tra sản phẩm đã tồn tại chưa (theo tên)
            const existing = await new Promise((resolve, reject) => {
                db.get("SELECT id FROM products WHERE name = ?", [cleanName], (err, row) => {
                    if (err) return reject(err);
                    resolve(row);
                });
            });

            if (existing) {
                // Cập nhật ảnh nếu sản phẩm đã tồn tại
                await new Promise((resolve, reject) => {
                    db.run("UPDATE products SET image_url = ?, local_image = ? WHERE id = ?",
                        [imageUrl, imageUrl, existing.id], (err) => {
                            if (err) return reject(err);
                            console.log(`🔄 Cập nhật ảnh cho: ${cleanName}`);
                            resolve();
                        });
                });
            } else {
                // Thêm sản phẩm mới theo cấu trúc database thực tế
                await new Promise((resolve, reject) => {
                    db.run(
                        `INSERT INTO products (name, category_id, price, old_price, unit, discount_percent, image_url, local_image, description, product_url, fresh)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            cleanName,
                            categoryId,
                            product.price_value,
                            product.old_price_value || Math.round(product.price_value * 1.1),
                            product.unit || 'Kg',
                            product.discount_percent || null,
                            imageUrl, // image_url
                            imageUrl, // local_image
                            product.description || `Sản phẩm ${cleanName} chất lượng`,
                            product.product_url || null,
                            1 // fresh
                        ],
                        (err) => {
                            if (err) return reject(err);
                            console.log(`➕ Thêm mới: ${cleanName}`);
                            resolve();
                        }
                    );
                });
            }
        } catch (error) {
            console.error(`❌ Lỗi khi import sản phẩm ${product.name}:`, error.message);
        }
    }

    console.log('\n✨ Hoàn thành import sản phẩm!');
    db.close();
}

importProducts();
