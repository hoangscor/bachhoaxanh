# 🕸️ Bách Hóa Xanh - Product Scraper Documentation

---

## 📋 TÓM TẮT

Bộ scraper này thu thập dữ liệu **demo/học tập** từ website Bách Hóa Xanh (bachhoaxanh.com).

**⚠️ LƯU Ý PHÁP LÝ:**
- Dữ liệu này chỉ dùng cho **MỤC ĐÍCH HỌC TẬP VÀ NGHIÊN CỨU**.
- KHÔNG sử dụng cho mục đích thương mại.
- Tuân thủ `robots.txt` và điều khoản sử dụng của website.
- Có rate limiting (1-2.5s giữa các request).

---

## 📊 KẾT QUẢ THU THẬP

### Thống kê:
- **Danh mục đã crawl**: 5 danh mục
- **Tổng số sản phẩm**: 17 sản phẩm
- **Tỷ lệ thành công**: 100% (17/17)
- **Lỗi**: 0

### Danh mục chi tiết:
1. ✅ **Thịt heo** (Thịt, cá, trứng, hải sản) - 17 sản phẩm
2. ⏭️ **Thịt bò** - 0 sản phẩm (chưa có URL)
3. ⏭️ **Thịt gà** - 0 sản phẩm (chưa có URL)
4. ⏭️ **Cá, hải sản** - 0 sản phẩm (chưa có URL)
5. ⏭️ **Trái cây** - 0 sản phẩm (chưa có URL)

---

## 📂 CẤU TRÚC DỮ LIỆU

### 1. File JSON: `bhx_sample_products.json`
```json
[
  {
    "name": "Chân giò heo nhập khẩu 300g giá tốt tại Bách hoá XANH",
    "category_main": "Thịt, cá, trứng, hải sản",
    "category_sub": "Thịt heo",
    "price_text": "13.500₫",
    "price_value": 13500,
    "old_price_text": null,
    "old_price_value": null,
    "unit": "300g",
    "discount_percent": null,
    "sku_or_code": null,
    "product_url": "https://www.bachhoaxanh.com/thit-heo/chan-gio-heo-tui-500g",
    "image_url": "https://cdnv2.tgdd.vn/bhx-static/bhx/Products/Images/...",
    "description": "...",
    "local_image_path": "assets\\bhx-images\\chan-gio-heo-nhap-khau-300g-gia-tot-tai-bach-hoa-xanh.jpg",
    "source": "bachhoaxanh.com",
    "error_note": null
  }
]
```

### 2. File CSV: `bhx_sample_products.csv`
Các cột:
- Name, Category Main, Category Sub
- Price Text, Price Value
- Old Price Text, Old Price Value
- Unit, Discount %, SKU/Code
- Product URL, Image URL, Local Image Path
- Description, Source, Error Note

### 3. Ảnh sản phẩm: `assets/bhx-images/`
- **Tổng số file**: 15 ảnh
- **Tổng dung lượng**: ~2.3 MB
- **Format**: .jpg
- **Chất lượng**: High-resolution (từ CDN của BHX)

---

## 🎯 CÁCH SỬ DỤNG DỮ LIỆU

### Online Mode (Dùng CDN):
```javascript
const products = require('./bhx_sample_products.json');

products.forEach(product => {
  console.log(product.name);
  console.log(product.image_url); // Link CDN
});
```

### Offline Mode (Dùng ảnh local):
```javascript
products.forEach(product => {
  console.log(product.name);
  console.log(product.local_image_path); // Local file
});
```

### Import vào Database:
```sql
-- Ví dụ với SQLite
CREATE TABLE products (
  name TEXT,
  category_main TEXT,
  category_sub TEXT,
  price INTEGER,
  unit TEXT,
  image_url TEXT,
  local_image TEXT
);

-- Import từ CSV
.mode csv
.import bhx_sample_products.csv products
```

---

## 🔧 CÁCH MỞ RỘNG

### Thêm danh mục mới:
1. Mở file `server/bhx_comprehensive_scraper.js`
2. Tìm phần `PRODUCT_URLS_BY_CATEGORY`
3. Thêm danh mục mới:
```javascript
'thit-bo': [
  'https://www.bachhoaxanh.com/thit-bo/product-1',
  'https://www.bachhoaxanh.com/thit-bo/product-2',
  // ...
]
```
4. Chạy lại scraper:
```bash
node server/bhx_comprehensive_scraper.js
```

### Điều chỉnh giới hạn:
```javascript
const CONFIG = {
  LIMIT_PER_CATEGORY: 50,  // Tăng lên 50
  DELAY_MIN: 1500,         // Tăng delay lên 1.5s
  // ...
}
```

---

## 📦 MẪU DỮ LIỆU

### Ví dụ sản phẩm tiêu biểu:
1. **Chân giò heo** - 13.500₫ (300g)
2. **Ba rọi heo** - 50.700₫ 
3. **Sườn non heo** - 60.300₫
4. **Thịt heo xay** - 12.500₫ (100g)

### Phân bố giá:
- Min: 12.500₫
- Max: 64.000₫
- Average: ~38.000₫

---

## ⚙️ YÊU CẦU HỆ THỐNG

### Dependencies:
```json
{
  "axios": "^1.x",
  "cheerio": "^1.x",
  "csv-writer": "^1.x"
}
```

### Cài đặt:
```bash
npm install axios cheerio csv-writer
```

---

## 📝 GHI CHÚ

1. **Một sản phẩm thiếu dữ liệu**: 
   - URL: `ba-roi-heo-g-khay-300g`
   - Lý do: Trang không trả về JSON-LD

2. **Rate Limiting**: 
   - Random delay: 1-2.5 giây
   - Tuân thủ robots.txt

3. **Image Quality**: 
   - Lấy từ CDN chính thức của BHX
   - Kích thước: Medium-Large
   - Format: JPG

---

## 🚀 NEXT STEPS

Để mở rộng dataset:
1. Sử dụng **Browser Automation** để lấy thêm URL từ các danh mục khác
2. Hoặc manually thêm URL vào `PRODUCT_URLS_BY_CATEGORY`
3. Adjust `LIMIT_PER_CATEGORY` để lấy nhiều sản phẩm hơn

---

**Ngày thu thập**: 2025-12-08  
**Scraper version**: 1.0  
**Nguồn**: bachhoaxanh.com
