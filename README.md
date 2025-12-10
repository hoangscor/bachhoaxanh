# Bách Hóa Pastel - Full Stack E-commerce Clone 🎄

Phiên bản nâng cấp toàn diện của Bách Hóa Pastel, mô phỏng chức năng và trải nghiệm người dùng của `bachhoaxanh.com` với giao diện hiện đại và branding riêng.

## 🚀 Tính năng nổi bật

### 🛒 Frontend (Người dùng)
- **Giao diện Responsive**: Thiết kế tương thích mobile/desktop với theme Noel tùy chọn.
- **Tìm kiếm thông minh**: Gợi ý sản phẩm ngay khi gõ (Autocomplete).
- **Trang chi tiết sản phẩm**: Xem chi tiết hình ảnh, giá, mô tả và sản phẩm liên quan.
- **Hệ thống danh mục đa cấp**: Sidebar Accordion hỗ trợ duyệt danh mục sâu như BHX.
- **Giỏ hàng & Thanh toán**: Tính toán tự động, hỗ trợ Coupon, phí ship theo điều kiện (Freeship <3km & đơn >150k cho hàng tươi sống).
- **Lịch sử đơn hàng**: Theo dõi trạng thái đơn hàng (Đã đặt, Đang giao, Hoàn tất...).
- **Tìm cửa hàng**: Danh sách hệ thống cửa hàng.
- **Hiệu ứng đặc biệt**: Tuyết rơi, rung lắc giỏ hàng, Banner động.

### 🛡️ Admin Panel (Quản trị)
- **Dashboard**: Tab quản lý tách biệt (Đơn hàng / Sản phẩm).
- **Quản lý Đơn hàng**: Xem danh sách, lọc, và **cập nhật trạng thái** đơn hàng (Placed -> Delivered -> Completed).
- **Quản lý Sản phẩm (CRUD)**: Thêm, Xóa, Sửa sản phẩm trực tiếp từ giao diện.
- **Bảo mật**: Yêu cầu xác thực Token Admin.

### ⚙️ Backend (Node.js + SQLite)
- **API RESTful**: Đầy đủ endpoints cho Products, Orders, Auth, Categories, Stores.
- **Cơ sở dữ liệu**: SQLite với cấu trúc bảng quan hệ (Users, Products, Orders, Order_Items, Categories, Stores).
- **Image Fetcher**: Tự động lấy dữ liệu thật từ Bachhoaxanh.com (hoặc fallback hình ảnh thật hardcoded) để seed database.
- **Seed Data**: Tự động tạo dữ liệu mẫu phong phú khi khởi chạy lần đầu.

---

## 🖼️ Quản lý Hình ảnh (Mới)

Dự án ưu tiên hiển thị **ảnh thật (Online URL)** thay vì placeholder. Có 3 cách để cập nhật ảnh:

### 1. Nhập tay trong Admin Panel
- Đăng nhập Admin (`admin@bachhoa.com` / `admin123`).
- Vào tab **Quản lý Sản Phẩm**.
- Bấm **Sửa** (icon bút chì) hoặc **Thêm sản phẩm**.
- Dán link ảnh online vào ô **Hình ảnh URL**.
- Bấm **Lưu**.

### 2. Import hàng loạt (Bulk Import)
Sử dụng công cụ mapping để cập nhật ảnh cho nhiều sản phẩm cùng lúc dựa trên từ khóa.
1. Mở file `server/image-mapping.json`.
2. Thêm object mới: `{"keyword": "ten san pham", "image_url": "https://..."}`.
3. Chạy lệnh:
   ```bash
   node server/applyImageMapping.js
   ```

### 3. Cấu hình Seed Data
Sửa trực tiếp trong `server/db.js` phần `seedData()` để gán ảnh cứng ngay khi khởi tạo lại DB.

---

## 🛠️ Cài đặt & Chạy

1. **Cài đặt thư viện**:
   ```bash
   npm install
   ```

2. **Dọn dẹp & Khởi tạo lại (Khuyến nghị)**:
   Lệnh này sẽ xóa DB cũ, kill port 3000 đang treo, và khởi động lại sạch sẽ.
   ```bash
   node cleanup.js
   ```

3. **Chạy Server (Thủ công)**:
   ```bash
   npm run dev
   ```
   
4. **Truy cập**:
   - **User App**: [http://localhost:3000](http://localhost:3000)
   - **Admin CP**: [http://localhost:3000/admin.html](http://localhost:3000/admin.html)

## 🔑 Tài khoản Demo

| Vai trò | Email | Mật khẩu |
|:---|:---|:---|
| **Admin** | `admin@bachhoa.com` | `admin123` |
| **User** | `khach@bachhoa.com` | `123456` |

## 📦 Cấu trúc dự án

- `public/`: Frontend (HTML, CSS, JS).
- `server/`: Backend (Express, DB, Routes).
  - `bhxImageFetcher.js`: Module lấy ảnh/dữ liệu thật.
  - `db.js`: Khởi tạo và seed database.
  - `routes/`: Các API endpoints.

---
*Dự án demo phục vụ mục đích học tập.*
