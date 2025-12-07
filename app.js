/**
 * Bách Hóa Pastel - Core Logic
 * 
 * NOTE FOR USERS:
 * To change product/brand images:
 * - Place your images in an 'images' folder.
 * - Update the 'imageUrl' property in the 'products' and 'brands' arrays below.
 * - Example: imageUrl: "./images/thit-heo.jpg"
 * 
 * Alternatively, copy image addresses from bachhoaxanh.com or google images
 * and paste them directly into the imageUrl fields.
 */

// =========================================
// 1. DATA SOURCES (MOCK)
// =========================================

const categoriesData = [
    { title: "Khuyến mãi sốc", icon: "fa-bolt", children: [] },
    {
        title: "Thịt, cá, trứng, hải sản",
        icon: "fa-drumstick-bite",
        children: ["Thịt heo", "Thịt bò", "Thịt gà, vịt", "Cá, hải sản", "Trứng gà, vịt, cút"]
    },
    {
        title: "Rau, củ, nấm, trái cây",
        icon: "fa-carrot",
        children: ["Trái cây", "Rau lá", "Củ, quả", "Nấm các loại"]
    },
    { title: "Dầu ăn, nước chấm, gia vị", icon: "fa-bottle-droplet", children: [] },
    { title: "Gạo, bột, đồ khô", icon: "fa-wheat-awn", children: [] },
    { title: "Mì, miến, cháo, phở", icon: "fa-bowl-food", children: [] },
    { title: "Sữa các loại", icon: "fa-cow", children: [] },
    { title: "Kem, sữa chua", icon: "fa-ice-cream", children: [] },
    { title: "Thực phẩm đông mát", icon: "fa-snowflake", children: [] },
    { title: "Bia, nước giải khát", icon: "fa-beer-mug-empty", children: [] },
    { title: "Bánh kẹo các loại", icon: "fa-cookie", children: [] },
    { title: "Chăm sóc cá nhân", icon: "fa-pump-soap", children: [] },
    { title: "Vệ sinh nhà cửa", icon: "fa-broom", children: [] },
    { title: "Sản phẩm mẹ và bé", icon: "fa-baby-carriage", children: [] },
    { title: "Đồ dùng gia đình", icon: "fa-kitchen-set", children: [] },
];

const brandsData = [
    { name: "Unilever", discount: "26%", imageUrl: "https://via.placeholder.com/100x100?text=Uni" },
    { name: "PepsiCo", discount: "30%", imageUrl: "https://via.placeholder.com/100x100?text=Pepsi" },
    { name: "CocaCola", discount: "15%", imageUrl: "https://via.placeholder.com/100x100?text=Coke" },
    { name: "Nestle", discount: "20%", imageUrl: "https://via.placeholder.com/100x100?text=Nestle" },
    { name: "Acecook", discount: "10%", imageUrl: "https://via.placeholder.com/100x100?text=Ace" },
    { name: "Vinamilk", discount: "12%", imageUrl: "https://via.placeholder.com/100x100?text=VNM" },
];

const productsData = [
    {
        id: 1,
        name: "Nước giặt OMO Matic Túi 3.6kg",
        category: "Vệ sinh nhà cửa",
        price: 168000,
        oldPrice: 210000,
        unit: "Túi",
        badge: "-20%",
        isFresh: false,
        imageUrl: "https://via.placeholder.com/300x300?text=OMO",
        description: "Nước giặt OMO Matic cửa trên, xoáy bay vết bẩn cứng đầu, hương thơm dễ chịu."
    },
    {
        id: 2,
        name: "Ba chỉ heo VietGAP (thịt tươi) 500g",
        category: "Thịt heo",
        price: 85000,
        oldPrice: 95000,
        unit: "Khay",
        badge: "Tươi",
        isFresh: true,
        imageUrl: "https://via.placeholder.com/300x300?text=Thit+Heo",
        description: "Thịt ba chỉ heo tươi sạch, chuẩn VietGAP, thích hợp kho, luộc, nướng."
    },
    {
        id: 3,
        name: "Táo Envy Mỹ nhập khẩu 1kg",
        category: "Trái cây",
        price: 199000,
        oldPrice: 240000,
        unit: "kg",
        badge: "-17%",
        isFresh: true,
        imageUrl: "https://via.placeholder.com/300x300?text=Tao+Envy",
        description: "Táo Envy size lớn, giòn ngọt, thơm lừng, nhập khẩu trực tiếp từ Mỹ."
    },
    {
        id: 4,
        name: "Thùng 24 lon Bia Tiger Crystal 330ml",
        category: "Bia, nước giải khát",
        price: 395000,
        oldPrice: 420000,
        unit: "Thùng",
        badge: "HOT",
        isFresh: false,
        imageUrl: "https://via.placeholder.com/300x300?text=Tiger",
        description: "Bia Tiger Crystal tinh thể lạnh, sảng khoái, uống cực đã."
    },
    {
        id: 5,
        name: "Dầu ăn Tường An Cooking Oil 1 Lít",
        category: "Dầu ăn, nước chấm, gia vị",
        price: 45000,
        oldPrice: 52000,
        unit: "Chai",
        badge: "-13%",
        isFresh: false,
        imageUrl: "https://via.placeholder.com/300x300?text=Dau+An",
        description: "Dầu thực vật tinh luyện, tốt cho tim mạch, chiên xào ngon."
    },
    {
        id: 6,
        name: "Rau muống ruộng (tươi) 500g",
        category: "Rau lá",
        price: 15000,
        oldPrice: 0,
        unit: "Bó",
        badge: "Mới",
        isFresh: true,
        imageUrl: "https://via.placeholder.com/300x300?text=Rau+Muong",
        description: "Rau muống xanh non, mới hái trong ngày, thích hợp luộc, xào tỏi."
    },
    {
        id: 7,
        name: "Cá diêu hồng làm sạch (600g-800g)",
        category: "Cá, hải sản",
        price: 65000,
        oldPrice: 70000,
        unit: "Con",
        badge: "Sạch",
        isFresh: true,
        imageUrl: "https://via.placeholder.com/300x300?text=Ca+Dieu+Hong",
        description: "Cá diêu hồng sống, làm sạch mang vây, tiện lợi cho nội trợ."
    },
    {
        id: 8,
        name: "Sữa tươi Vinamilk không đường 1L",
        category: "Sữa các loại",
        price: 32000,
        oldPrice: 35000,
        unit: "Hộp",
        badge: "",
        isFresh: false,
        imageUrl: "https://via.placeholder.com/300x300?text=Vinamilk",
        description: "Sữa tươi tiệt trùng 100%, bổ sung dinh dưỡng cho cả gia đình."
    }
];

// =========================================
// 2. STATE & UTILS
// =========================================

const appState = {
    cart: [],
    discountCode: null,
    discountRate: 0,
    orders: JSON.parse(localStorage.getItem('myOrders')) || []
};

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// =========================================
// 3. MAIN APP CONTROLLER
// =========================================

const app = {
    init() {
        this.renderApp();
        this.setupEventListeners();
    },

    renderApp() {
        console.log("Rendering App...");
        this.renderSidebar();
        this.renderBrands();
        this.renderProducts(productsData);
        this.updateCartUI();

        // Show welcome toast if first load
        // this.showToast("Chào mừng bạn đến với Bách Hóa Pastel!");
    },

    resetHome() {
        document.getElementById('productSectionTitle').innerText = "Sản phẩm nổi bật";
        document.getElementById('searchInput').value = "";
        this.renderProducts(productsData);
    },

    // --- SIDEBAR ---
    renderSidebar() {
        const container = document.getElementById('categoryList');
        container.innerHTML = "";

        categoriesData.forEach((cat, index) => {
            const hasKids = cat.children && cat.children.length > 0;
            const groupId = `cat-group-${index}`;

            // Parent Item
            const groupDiv = document.createElement('div');
            groupDiv.className = 'cate-group';

            const parentHTML = `
                <div class="cate-parent" onclick="app.toggleCategory('${groupId}')">
                    <span><i class="fa-solid ${cat.icon}" style="width:24px; color:var(--primary-dark)"></i> ${cat.title}</span>
                    ${hasKids ? '<i class="fa-solid fa-chevron-right" id="icon-' + groupId + '"></i>' : ''}
                </div>
            `;

            let childrenHTML = '';
            if (hasKids) {
                const listItems = cat.children.map(sub =>
                    `<li class="cate-item" onclick="app.filterBySubCategory('${sub}')">• ${sub}</li>`
                ).join('');

                childrenHTML = `
                    <ul id="${groupId}" class="cate-list">
                        ${listItems}
                    </ul>
                `;
            }

            groupDiv.innerHTML = parentHTML + childrenHTML;
            container.appendChild(groupDiv);

            // Allow clicking parent to filter main category if no children, or filter main regardless
            if (!hasKids) {
                groupDiv.querySelector('.cate-parent').onclick = () => app.filterBySubCategory(cat.title);
            }
        });
    },

    toggleCategory(id) {
        const el = document.getElementById(id);
        const icon = document.getElementById('icon-' + id);
        if (!el) return;

        // Simple accordion logic
        if (el.style.maxHeight) {
            el.style.maxHeight = null;
            if (icon) icon.style.transform = "rotate(0deg)";
        } else {
            // Close others if needed (optional)
            // document.querySelectorAll('.cate-list').forEach(c => c.style.maxHeight = null);

            el.style.maxHeight = el.scrollHeight + "px";
            if (icon) icon.style.transform = "rotate(90deg)";
        }
    },

    toggleMobileSidebar() {
        const list = document.getElementById('categoryList');
        list.classList.toggle('active');
    },

    // --- PRODUCTS ---
    renderProducts(list) {
        const grid = document.getElementById('productGrid');
        grid.innerHTML = "";

        if (list.length === 0) {
            grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #777;">Không tìm thấy sản phẩm nào.</p>`;
            return;
        }

        list.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                ${p.badge ? `<span class="prod-badge">${p.badge}</span>` : ''}
                <div class="prod-img-wrap">
                    <img src="${p.imageUrl}" alt="${p.name}" class="prod-img" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                </div>
                ${p.isFresh ? `<span class="fresh-tag">Freeship 3km</span>` : ''}
                <div class="prod-info">
                    <h3>${p.name}</h3>
                    <div class="prod-meta">
                        <span class="price-current">${formatCurrency(p.price)}</span>
                        ${p.oldPrice ? `<span class="price-old">${formatCurrency(p.oldPrice)}</span>` : ''}
                    </div>
                </div>
                <div class="prod-actions">
                    <button class="btn btn-outline btn-sm" onclick="app.openQuickView(${p.id})">Xem nhanh</button>
                    <button class="btn btn-primary btn-sm" onclick="app.addToCart(${p.id})">Thêm</button>
                </div>
            `;
            grid.appendChild(card);
        });
    },

    renderBrands() {
        const grid = document.getElementById('brandGrid');
        grid.innerHTML = brandsData.map(b => `
            <div class="brand-card">
                <img src="${b.imageUrl}" class="brand-logo" alt="${b.name}">
                <div><span class="brand-discount">-${b.discount}</span></div>
            </div>
        `).join('');
    },

    // --- SEARCH & FILTER ---
    setupEventListeners() {
        // Search
        const input = document.getElementById('searchInput');
        const btn = document.getElementById('searchBtn');

        const doSearch = () => {
            const query = input.value.toLowerCase().trim();
            if (!query) return;

            const filtered = productsData.filter(p => p.name.toLowerCase().includes(query));
            document.getElementById('productSectionTitle').innerText = `Kết quả tìm kiếm: "${input.value}"`;
            this.renderProducts(filtered);
        };

        btn.onclick = doSearch;
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') doSearch();
        });

        // Close modal on click outside
        window.onclick = (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        }

        // Esc close
        document.addEventListener('keydown', (e) => {
            if (e.key === "Escape") {
                document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
                this.closeCart(); // if you want ESC to close cart too
            }
        });
    },

    filterBySubCategory(name) {
        document.getElementById('productSectionTitle').innerText = `Dòng hàng: ${name}`;
        // In a real app we'd map subcategories better. Here we search loosely.
        const filtered = productsData.filter(p =>
            p.category.includes(name) || p.name.includes(name)
        );
        this.renderProducts(filtered);
        // On mobile, close sidebar after pick
        document.getElementById('categoryList').classList.remove('active');
    },

    resetFilter() {
        this.resetHome();
    },

    // --- CART ---
    addToCart(id) {
        const prod = productsData.find(p => p.id === id);
        if (!prod) return;

        const existing = appState.cart.find(item => item.id === id);
        if (existing) {
            existing.quantity++;
        } else {
            appState.cart.push({ ...prod, quantity: 1 });
        }

        this.updateCartUI();
        this.showToast(`Đã thêm "${prod.name}" vào giỏ!`);
    },

    removeFromCart(id) {
        appState.cart = appState.cart.filter(c => c.id !== id);
        this.updateCartUI();
    },

    updateQuantity(id, change) {
        const item = appState.cart.find(c => c.id === id);
        if (!item) return;

        item.quantity += change;
        if (item.quantity <= 0) {
            this.removeFromCart(id);
        } else {
            this.updateCartUI();
        }
    },

    toggleCart() {
        const drawer = document.getElementById('cartDrawer');
        const overlay = document.getElementById('cartOverlay');
        drawer.classList.toggle('active');
        overlay.classList.toggle('active');
    },

    closeCart() {
        const drawer = document.getElementById('cartDrawer');
        const overlay = document.getElementById('cartOverlay');
        drawer.classList.remove('active');
        overlay.classList.remove('active');
    },

    updateCartUI() {
        const container = document.getElementById('cartItems');
        const countBadge = document.getElementById('cartBadge');
        const countHeader = document.getElementById('cartCountHeader');

        // Count total items
        const totalCount = appState.cart.reduce((sum, item) => sum + item.quantity, 0);
        countBadge.innerText = totalCount;
        countHeader.innerText = `(${totalCount})`;

        if (appState.cart.length === 0) {
            container.innerHTML = `<div class="empty-cart-msg">Giỏ hàng đang trống. Đi chợ ngay nào!</div>`;
            this.updateTotals();
            return;
        }

        container.innerHTML = appState.cart.map(item => `
            <div class="cart-item">
                <img src="${item.imageUrl}" alt="${item.name}">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">${formatCurrency(item.price)}</div>
                    <div class="cart-ctrl">
                        <div class="qty-btn" onclick="app.updateQuantity(${item.id}, -1)">-</div>
                        <span>${item.quantity}</span>
                        <div class="qty-btn" onclick="app.updateQuantity(${item.id}, 1)">+</div>
                        <i class="fa-solid fa-trash remove-item" onclick="app.removeFromCart(${item.id})"></i>
                    </div>
                </div>
            </div>
        `).join('');

        this.updateTotals();
    },

    applyCoupon() {
        const code = document.getElementById('couponInput').value.trim().toUpperCase();
        if (code === "LUONGVE10") {
            appState.discountCode = code;
            appState.discountRate = 0.10;
            this.showToast("Áp dụng mã giảm giá 10% thành công!");
            this.updateTotals();
        } else {
            this.showToast("Mã giảm giá không hợp lệ");
        }
    },

    updateTotals() {
        const subtotal = appState.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountAmt = Math.round(subtotal * appState.discountRate);
        const shipping = (subtotal > 150000) ? 0 : 30000; // Mock rule
        const total = subtotal - discountAmt + shipping;

        document.getElementById('cartSubtotal').innerText = formatCurrency(subtotal);

        const discRow = document.getElementById('discountRow');
        const discEl = document.getElementById('cartDiscount');
        if (discountAmt > 0) {
            discRow.style.display = 'flex';
            discEl.innerText = `-${formatCurrency(discountAmt)}`;
        } else {
            discRow.style.display = 'none';
        }

        document.getElementById('cartShipping').innerText = shipping === 0 ? "Miễn phí" : formatCurrency(shipping);
        document.getElementById('cartTotal').innerText = formatCurrency(total);

        // Freship badge logic
        const hasFresh = appState.cart.some(c => c.isFresh);
        const freeShipBadge = document.getElementById('freeshipBadge');
        if (subtotal >= 150000 && hasFresh) {
            freeShipBadge.style.display = 'block';
        } else {
            freeShipBadge.style.display = 'none';
        }
    },

    // --- QUICK VIEW ---
    openQuickView(id) {
        const prod = productsData.find(p => p.id === id);
        if (!prod) return;

        const modal = document.getElementById('quickViewModal');
        const body = document.getElementById('quickViewBody');

        body.innerHTML = `
            <div class="qv-img">
                <img src="${prod.imageUrl}" alt="${prod.name}">
            </div>
            <div class="qv-info">
                <h2>${prod.name}</h2>
                <div style="margin-bottom:12px;">
                    <span class="price-current" style="font-size:1.4rem;">${formatCurrency(prod.price)}</span>
                    ${prod.oldPrice ? `<span class="price-old">${formatCurrency(prod.oldPrice)}</span>` : ''}
                </div>
                ${prod.isFresh ? '<span class="fresh-tag">Hàng tươi sống</span>' : ''}
                <p class="qv-desc">${prod.description}</p>
                
                <div style="margin-top:20px;">
                    <button class="btn btn-primary" onclick="app.addToCart(${prod.id}); app.closeModal('quickViewModal')">
                        <i class="fa-solid fa-cart-plus"></i> Thêm vào giỏ
                    </button>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
    },

    closeModal(id) {
        document.getElementById(id).style.display = 'none';
    },

    // --- CHECKOUT ---
    openCheckout() {
        if (appState.cart.length === 0) {
            this.showToast("Giỏ hàng trống!");
            return;
        }
        this.closeCart();
        document.getElementById('checkoutModal').style.display = 'flex';
    },

    processCheckout() {
        const name = document.getElementById('cxName').value;
        const phone = document.getElementById('cxPhone').value;
        const address = document.getElementById('cxAddress').value;

        if (!name || !phone || !address) {
            this.showToast("Vui lòng nhập đủ thông tin giao hàng!");
            return;
        }

        const subtotal = appState.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountAmt = Math.round(subtotal * appState.discountRate);
        const shipping = (subtotal > 150000) ? 0 : 30000;
        const total = subtotal - discountAmt + shipping;

        const newOrder = {
            id: 'BH-' + Date.now().toString().slice(-6),
            date: new Date().toLocaleString('vi-VN'),
            items: [...appState.cart], // Clone
            total: total,
            customer: { name, phone, address },
            status: "Đã tiếp nhận"
        };

        appState.orders.unshift(newOrder); // Add to beginning
        localStorage.setItem('myOrders', JSON.stringify(appState.orders));

        // Reset cart
        appState.cart = [];
        appState.discountCode = null;
        appState.discountRate = 0;
        this.updateCartUI();

        this.closeModal('checkoutModal');
        this.showToast(`Đặt hàng thành công! Mã: ${newOrder.id}`);

        // Show thank you or switch to order list
        setTimeout(() => this.openOrderHistory(), 500);
    },

    // --- ORDERS ---
    openOrderHistory() {
        const modal = document.getElementById('ordersModal');
        const list = document.getElementById('ordersList');

        if (appState.orders.length === 0) {
            list.innerHTML = "<p>Bạn chưa có đơn hàng nào.</p>";
        } else {
            list.innerHTML = appState.orders.map(o => `
                <div class="order-card">
                    <div class="order-header">
                        <span>#${o.id}</span>
                        <span>${o.status}</span>
                    </div>
                    <div class="order-info">
                        <span>${o.date}</span>
                        <span>${o.items.length} sản phẩm</span>
                    </div>
                    <div class="order-total">
                        Tổng: ${formatCurrency(o.total)}
                    </div>
                </div>
            `).join('');
        }

        modal.style.display = 'flex';
    },

    // --- TOAST ---
    showToast(msg) {
        const t = document.getElementById('toast');
        t.innerText = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
    }
};

// Start the App
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
