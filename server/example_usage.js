// ========================================
// VÍ DỤ: SỬ DỤNG DỮ LIỆU SCRAPING
// ========================================

const fs = require('fs');
const path = require('path');

// Đọc dữ liệu JSON
const products = JSON.parse(
    fs.readFileSync('server/data/bhx_sample_products.json', 'utf8')
);

console.log('='.repeat(60));
console.log('📊 BÁch HÓa XANH - DỮ LIỆU DEMO');
console.log('='.repeat(60));

// 1. Thống kê tổng quan
console.log(`\n📈 Tổng số sản phẩm: ${products.length}`);

const categories = [...new Set(products.map(p => p.category_sub))];
console.log(`📂 Số danh mục: ${categories.length}`);
categories.forEach(cat => {
    const count = products.filter(p => p.category_sub === cat).length;
    console.log(`   - ${cat}: ${count} sản phẩm`);
});

// 2. Phân tích giá
const prices = products
    .filter(p => p.price_value && p.price_value > 0)
    .map(p => p.price_value);

const minPrice = Math.min(...prices);
const maxPrice = Math.max(...prices);
const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

console.log(`\n💰 Phân tích giá:`);
console.log(`   Min: ${minPrice.toLocaleString('vi-VN')}₫`);
console.log(`   Max: ${maxPrice.toLocaleString('vi-VN')}₫`);
console.log(`   Avg: ${avgPrice.toLocaleString('vi-VN')}₫`);

// 3. Top 5 sản phẩm đắt nhất
console.log(`\n🏆 Top 5 sản phẩm đắt nhất:`);
products
    .filter(p => p.price_value)
    .sort((a, b) => b.price_value - a.price_value)
    .slice(0, 5)
    .forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name}`);
        console.log(`      Giá: ${p.price_value?.toLocaleString('vi-VN')}₫ | ${p.unit || 'N/A'}`);
    });

// 4. Kiểm tra hình ảnh local
console.log(`\n🖼️  Kiểm tra ảnh đã tải:`);
const withImages = products.filter(p => p.local_image_path).length;
const withoutImages = products.length - withImages;
console.log(`   ✅ Có ảnh local: ${withImages}`);
console.log(`   ❌ Chưa có ảnh: ${withoutImages}`);

// 5. Xuất mẫu sản phẩm để test UI
const sampleForUI = products.slice(0, 5).map(p => ({
    id: products.indexOf(p) + 1,
    name: p.name,
    price: p.price_value,
    image: p.local_image_path || p.image_url,
    category: p.category_sub,
    unit: p.unit
}));

console.log(`\n💾 Xuất mẫu UI (5 sản phẩm):`);
fs.writeFileSync(
    'server/data/ui_sample.json',
    JSON.stringify(sampleForUI, null, 2)
);
console.log('   ✅ Saved: server/data/ui_sample.json');

// 6. Kiểm tra lỗi
console.log(`\n⚠️  Kiểm tra lỗi:`);
const errors = products.filter(p => p.error_note || !p.name || p.name === 'N/A');
if (errors.length > 0) {
    console.log(`   Tìm thấy ${errors.length} sản phẩm có vấn đề:`);
    errors.forEach(e => {
        console.log(`   - ${e.product_url}`);
        console.log(`     Lỗi: ${e.error_note || 'Thiếu thông tin'}`);
    });
} else {
    console.log('   ✅ Không có lỗi!');
}

console.log('\n' + '='.repeat(60));
console.log('✨ HOÀN TẤT!');
console.log('='.repeat(60));
