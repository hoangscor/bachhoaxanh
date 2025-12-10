# 📦 ĐẦU RA SCRAPING - BÁCH HÓA XANH

---

## ✅ FILES ĐÃ TẠO

### 1. 📄 Dữ liệu JSON
**File**: `server/data/bhx_sample_products.json`  
**Kích thước**: 15.3 KB  
**Số bản ghi**: 17 sản phẩm  
**Cấu trúc**: Array of objects với 16 trường dữ liệu

### 2. 📊 Dữ liệu CSV  
**File**: `server/data/bhx_sample_products.csv`  
**Format**: UTF-8, comma-delimited  
**Sử dụng**: Import vào Excel, Google Sheets, hoặc Database

### 3. 🖼️ Thư mục ảnh
**Đường dẫn**: `assets/bhx-images/`  
**Số file**: 15 ảnh JPG  
**Tổng dung lượng**: ~2.3 MB  
**Chất lượng**: High-resolution từ CDN

---

## 📊 THỐNG KÊ

### Danh mục đã crawl:
✅ **Thịt heo** (Thịt, cá, trứng, hải sản): **17 sản phẩm**

### Chất lượng dữ liệu:
- **Thành công**: 16/17 (94%)
- **Thiếu dữ liệu**: 1/17 (6%)
- **Có ảnh local**: 16/17 (94%)

### Phân tích giá:
- **Giá thấp nhất**: 12.500₫ (Thịt heo xay 100g)
- **Giá cao nhất**: 64.000₫ (Sườn cốt lết 500g)  
- **Giá trung bình**: 39.306₫

---

## 📂 CẤU TRÚC DỮ LIỆU

Mỗi sản phẩm có **16 trường**:

| Trường | Mô tả | Ví dụ |
|--------|-------|-------|
| `name` | Tên sản phẩm | "Chân giò heo 300g..." |
| `category_main` | Nhóm chính | "Thịt, cá, trứng..." |
| `category_sub` | Danh mục con | "Thịt heo" |
| `price_text` | Giá hiển thị | "13.500₫" |
| `price_value` | Giá số | 13500 |
| `old_price_text` | Giá gốc (text) | null |
| `old_price_value` | Giá gốc (số) | null |
| `unit` | Đơn vị | "300g" |
| `discount_percent` | Giảm giá % | null |
| `sku_or_code` | Mã SP | null |
| `product_url` | Link SP | "https://..." |
| `image_url` | CDN image | "https://cdnv2..." |
| `description` | Mô tả | "Bách Hoá Xanh..." |
| `local_image_path` | Ảnh local | "assets/..." |
| `source` | Nguồn | "bachhoaxanh.com" |
| `error_note` | Ghi chú lỗi | null |

---

## 🎯 CÁCH SỬ DỤNG

### Option 1: Đọc JSON
```javascript
const data = require('./server/data/bhx_sample_products.json');
console.log(`Tổng: ${data.length} sản phẩm`);
```

### Option 2: Import CSV vào Database
```bash
# MySQL
LOAD DATA LOCAL INFILE 'bhx_sample_products.csv'
INTO TABLE products
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;

# SQLite
.mode csv
.import bhx_sample_products.csv products
```

### Option 3: Sử dụng ảnh local
```html
<!-- Offline mode -->
<img src="assets/bhx-images/ba-roi-heo-gia-tot-tai-bach-hoa-xanh.jpg">

<!-- Online mode -->
<img src="https://cdnv2.tgdd.vn/bhx-static/bhx/Products/Images/...">
```

---

## 🔍 MẪU DỮ LIỆU

```json
{
  "name": "Chân giò heo nhập khẩu 300g giá tốt tại Bách hoá XANH",
  "category_main": "Thịt, cá, trứng, hải sản",
  "category_sub": "Thịt heo", 
  "price_value": 13500,
  "unit": "300g",
  "image_url": "https://cdnv2.tgdd.vn/bhx-static/bhx/Products/Images/8781/226838/bhx/...",
  "local_image_path": "assets\\bhx-images\\chan-gio-heo-nhap-khau-300g-gia-tot-tai-bach-hoa-xanh.jpg"
}
```

---

## ⚠️ LƯU Ý

### 1. Giới hạn pháp lý
- ✅ Dữ liệu này chỉ dùng cho **MỤC ĐÍCH HỌC TẬP**
- ❌ KHÔNG sử dụng thương mại
- ✅ Tuân thủ robots.txt của bachhoaxanh.com
- ✅ Rate limiting: 1-2.5 giây/request

### 2. Chất lượng dữ liệu
- **1 sản phẩm thiếu thông tin**: `ba-roi-heo-g-khay-300g`
- Nguyên nhân: Trang không trả về JSON-LD
- Các sản phẩm khác: 100% đầy đủ

### 3. Mở rộng dataset
Để thu thập thêm:
1. Thêm URL vào `PRODUCT_URLS_BY_CATEGORY` trong scraper
2. Hoặc dùng Browser Automation để lấy URL tự động
3. Chạy lại: `node server/bhx_comprehensive_scraper.js`

---

## 📁 FILES LIÊN QUAN

| File | Mô tả |
|------|-------|
| `bhx_comprehensive_scraper.js` | Main scraper script |
| `example_usage.js` | Demo sử dụng dữ liệu |
| `SCRAPING_GUIDE.md` | Hướng dẫn chi tiết |
| `bhx_sample_products.json` | Dữ liệu JSON |
| `bhx_sample_products.csv` | Dữ liệu CSV |
| `ui_sample.json` | Mẫu 5 SP cho UI |

---

## 🚀 NEXT STEPS

1. **Import vào Database**: Dùng CSV import
2. **Test giao diện**: Dùng `ui_sample.json`
3. **Offline testing**: Dùng ảnh trong `assets/bhx-images/`
4. **Mở rộng**: Thu thập thêm từ danh mục khác

---

**📅 Ngày tạo**: 2025-12-08  
**🔧 Tool**: Custom Node.js Scraper  
**📦 Version**: 1.0  
**🌐 Nguồn**: bachhoaxanh.com
