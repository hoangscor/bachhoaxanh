/**
 * Bách Hóa Pastel - Core Logic
 */

const API_Base = '/api';

const app = {
    state: {
        cart: JSON.parse(localStorage.getItem('cart')) || [],
        user: JSON.parse(localStorage.getItem('user')) || null,
        token: localStorage.getItem('token') || null,
        products: [],
        categories: [],
        discountCode: null,
        discountAmount: 0,
        isNoel: localStorage.getItem('noelMode') === 'true'
    },

    init() {
        console.log("App initializing...");
        this.renderAuthUI();
        this.applyNoelMode();
        this.fetchCategories();
        this.fetchPromotions();
        this.fetchBrands();
        this.renderProducts();
        this.updateCartUI();
        if (this.state.isNoel) this.startSnow();
    },

    // --- NOEL LOGIC ---
    toggleNoelMode() {
        this.state.isNoel = !this.state.isNoel;
        localStorage.setItem('noelMode', this.state.isNoel);
        this.applyNoelMode();
        if (this.state.isNoel) this.startSnow();
        else this.stopSnow();
    },

    applyNoelMode() {
        if (this.state.isNoel) document.body.classList.add('noel-active');
        else document.body.classList.remove('noel-active');
    },

    startSnow() {
        const canvas = document.getElementById('snowCanvas');
        const ctx = canvas.getContext('2d');
        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        const snowflakes = Array.from({ length: 100 }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            r: Math.random() * 3 + 1,
            d: Math.random() * 100 // density
        }));

        const draw = () => {
            if (!this.state.isNoel) return;
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.beginPath();
            snowflakes.forEach(f => {
                ctx.moveTo(f.x, f.y);
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true);
            });
            ctx.fill();
            update();
            requestAnimationFrame(draw);
        };

        let angle = 0;
        const update = () => {
            angle += 0.01;
            snowflakes.forEach((f, i) => {
                f.y += Math.cos(angle + f.d) + 1 + f.r / 2;
                f.x += Math.sin(angle) * 2;
                if (f.x > width + 5 || f.x < -5 || f.y > height) {
                    snowflakes[i] = { x: Math.random() * width, y: -10, r: f.r, d: f.d };
                }
            });
        }
        draw();
    },

    stopSnow() {
        const canvas = document.getElementById('snowCanvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    },

    // --- API CALLS ---
    async fetchCategories() {
        try {
            const res = await fetch(`${API_Base}/categories`);
            const data = await res.json();
            this.state.categories = data;
            this.renderSidebar();
        } catch (e) { console.error("Cat fetch error", e); }
    },

    async fetchBrands() {
        try {
            const res = await fetch(`${API_Base}/brands`);
            const data = await res.json();
            const grid = document.getElementById('brandGrid');
            grid.innerHTML = data.map(b => `
                <div class="brand-card" style="min-width:120px; text-align:center; padding:10px; border-radius:12px; background:white; position:relative">
                    <img src="${b.logo_url}" style="width:60px; height:60px; object-fit:contain" alt="${b.name}">
                    ${b.default_discount ? `<div style="position:absolute; bottom:5px; right:5px; background:red; color:white; font-size:0.7rem; padding:2px 4px; border-radius:4px">-${b.default_discount}%</div>` : ''}
                </div>
            `).join('');
        } catch (e) { console.error(e); }
    },

    async fetchPromotions() {
        try {
            const res = await fetch(`${API_Base}/orders/promotions/active`);
            const data = await res.json();
            if (data && data.banner_text) {
                const banner = document.getElementById('heroBanner');
                banner.innerHTML = `
                    <i class="fa-solid fa-tree banner-icon" style="top:10px; left:20px; animation: sway 5s infinite; color:#4caf93"></i>
                    <i class="fa-solid fa-snowflake banner-icon" style="bottom:10px; right:50px; animation: float 6s infinite; color:skyblue"></i>
                    <div style="position:relative; z-index:2; text-align:center">
                        <h1 style="color:var(--primary-dark); margin:0 0 10px 0; font-size:1.8rem">${data.banner_text}</h1>
                        <p style="font-weight:bold; color:var(--accent); text-transform:uppercase">${data.title}</p>
                        <p style="color:#666; font-size:0.9rem">(Mua hàng tươi sống 150k, freeship 3km)</p>
                    </div>
                `;
            }
        } catch (e) { console.error(e); }
    },

    async renderProducts(params = {}) {
        const grid = document.getElementById('productGrid');
        grid.innerHTML = 'Loading...';

        let url = `${API_Base}/products?limit=20`;
        if (params.categoryId) url += `&categoryId=${params.categoryId}`;
        if (params.search) url += `&search=${encodeURIComponent(params.search)}`;

        try {
            const res = await fetch(url);
            const { data } = await res.json();
            this.state.products = data;

            if (data.length === 0) {
                grid.innerHTML = '<p>Không tìm thấy sản phẩm</p>';
                return;
            }

            grid.innerHTML = data.map(p => `
                <div class="product-card">
                    ${p.badge ? `<span class="prod-badge">${p.badge}</span>` : ''}
                    <div class="prod-img-wrap">
                        <img src="${p.image_url}" class="prod-img" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                    </div>
                    ${p.is_fresh ? `<span class="fresh-tag">Freeship 3km</span>` : ''}
                    <div style="flex:1">
                        <h3 style="font-size:1rem;height:2.8em;overflow:hidden;margin-bottom:4px;">${p.name}</h3>
                        <div style="display:flex; gap:8px; align-items:baseline">
                            <span style="color:var(--danger);font-weight:700;font-size:1.1rem">${this.formatCurrency(p.price)}</span>
                            ${p.old_price ? `<span style="text-decoration:line-through;color:#999;font-size:0.9rem">${this.formatCurrency(p.old_price)}</span>` : ''}
                        </div>
                    </div>
                    <div style="margin-top:10px; display:grid; grid-template-columns:1fr 1fr; gap:5px">
                         <button class="btn btn-outline btn-sm" onclick="app.openQuickView(${p.id})">Xem</button>
                         <button class="btn btn-primary btn-sm" onclick="app.addToCart(${p.id})">Thêm</button>
                    </div>
                </div>
            `).join('');

            if (params.search) document.getElementById('productSectionTitle').innerText = `Kết quả: "${params.search}"`;
        } catch (e) {
            grid.innerHTML = '<p>Lỗi tải sản phẩm</p>';
        }
    },

    // --- UI HELPERS ---
    formatCurrency(val) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    },

    renderSidebar() {
        const container = document.getElementById('categoryList');
        container.innerHTML = "";

        this.state.categories.forEach(cat => {
            const hasKids = cat.children && cat.children.length > 0;
            const div = document.createElement('div');
            div.className = 'cate-group';
            div.innerHTML = `
                <div class="cate-parent" onclick="app.toggleCat(this)">
                    <span>${cat.name}</span>
                    ${hasKids ? '<i class="fa-solid fa-chevron-right" style="transition:0.3s"></i>' : ''}
                </div>
                ${hasKids ? `<ul class="cate-list">${cat.children.map(c => `<li class="cate-item" onclick="app.filterByCat(${c.id}, '${c.name}')">• ${c.name}</li>`).join('')}</ul>` : ''}
             `;
            if (!hasKids) div.querySelector('.cate-parent').onclick = () => app.filterByCat(cat.id, cat.name);

            container.appendChild(div);
        });
    },

    toggleCat(el) {
        const list = el.nextElementSibling;
        const icon = el.querySelector('i');
        if (list && list.classList.contains('cate-list')) {
            if (list.style.maxHeight) {
                list.style.maxHeight = null;
                if (icon) icon.style.transform = "rotate(0deg)";
            } else {
                list.style.maxHeight = list.scrollHeight + "px";
                if (icon) icon.style.transform = "rotate(90deg)";
            }
        }
    },

    filterByCat(id, name) {
        document.getElementById('productSectionTitle').innerText = `Danh mục: ${name}`;
        this.renderProducts({ categoryId: id });
    },

    resetHome() {
        document.getElementById('searchInput').value = '';
        document.getElementById('productSectionTitle').innerText = 'Sản phẩm nổi bật';
        this.renderProducts();
    },

    // --- CART LOGIC ---
    addToCart(id) {
        const prod = this.state.products.find(p => p.id === id);
        if (!prod) return;

        const existing = this.state.cart.find(c => c.productId === id);
        if (existing) {
            existing.quantity++;
        } else {
            this.state.cart.push({
                productId: id,
                name: prod.name,
                price: prod.price,
                imageUrl: prod.image_url,
                isFresh: prod.is_fresh,
                quantity: 1
            });
        }
        this.saveCart();
    },

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.state.cart));
        this.updateCartUI();
        this.showToast("Đã cập nhật giỏ hàng");
    },

    updateCartUI() {
        const badge = document.getElementById('cartBadge');
        const count = this.state.cart.reduce((sum, i) => sum + i.quantity, 0);
        badge.innerText = count;

        const container = document.getElementById('cartItems');
        if (this.state.cart.length === 0) {
            container.innerHTML = "Giỏ hàng trống";
            this.renderTotals(0);
            return;
        }

        container.innerHTML = this.state.cart.map(item => `
            <div class="cart-item">
                <img src="${item.imageUrl}" style="width:50px;height:50px;object-fit:cover;border-radius:6px" onerror="this.src='https://via.placeholder.com/50'">
                <div style="flex:1">
                    <div style="font-weight:600;font-size:0.9rem">${item.name}</div>
                    <div style="color:var(--danger)">${this.formatCurrency(item.price)}</div>
                    <div style="display:flex;gap:10px;margin-top:5px;align-items:center">
                        <button style="background:#eee;width:24px;border-radius:4px" onclick="app.changeQty(${item.productId}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button style="background:#eee;width:24px;border-radius:4px" onclick="app.changeQty(${item.productId}, 1)">+</button>
                        <i class="fa-solid fa-trash" style="margin-left:auto;color:#999;cursor:pointer" onclick="app.changeQty(${item.productId}, -999)"></i>
                    </div>
                </div>
            </div>
        `).join('');

        const subtotal = this.state.cart.reduce((s, i) => s + (i.price * i.quantity), 0);
        this.renderTotals(subtotal);
    },

    changeQty(pid, delta) {
        const idx = this.state.cart.findIndex(c => c.productId === pid);
        if (idx === -1) return;
        this.state.cart[idx].quantity += delta;
        if (this.state.cart[idx].quantity <= 0) this.state.cart.splice(idx, 1);
        this.saveCart();
    },

    async applyCoupon() {
        const code = document.getElementById('couponInput').value.trim();
        if (!code) return;

        const subtotal = this.state.cart.reduce((s, i) => s + (i.price * i.quantity), 0);

        try {
            const res = await fetch(`${API_Base}/orders/coupons/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, cartTotal: subtotal })
            });
            const data = await res.json();

            if (data.error) {
                this.showToast(data.error);
                this.state.discountAmount = 0;
            } else {
                this.state.discountCode = data.discountCode;
                this.state.discountAmount = data.discountAmount;
                this.showToast(`Giảm ${this.formatCurrency(data.discountAmount)}`);
            }
            this.updateCartUI();
        } catch (e) { this.showToast("Lỗi kiểm tra mã"); }
    },

    renderTotals(subtotal) {
        // Simple logic for shipping display, real calc happens on checkout
        const hasFresh = this.state.cart.some(c => c.isFresh);
        const shipping = (hasFresh && subtotal >= 150000) ? 0 : 30000;
        const total = subtotal - this.state.discountAmount + shipping;

        document.getElementById('cartSubtotal').innerText = this.formatCurrency(subtotal);
        document.getElementById('cartDiscount').innerText = `-${this.formatCurrency(this.state.discountAmount)}`;
        document.getElementById('cartShipping').innerText = shipping ? this.formatCurrency(shipping) : "Miễn phí";
        document.getElementById('cartTotal').innerText = this.formatCurrency(total < 0 ? 0 : total);

        document.getElementById('freeshipBadge').style.display = (shipping === 0 && subtotal > 0 && hasFresh) ? 'block' : 'none';
    },

    toggleCart() {
        document.getElementById('cartDrawer').classList.toggle('active');
        document.getElementById('overlay').style.display = document.getElementById('cartDrawer').classList.contains('active') ? 'block' : 'none';
    },

    // --- CHECKOUT ---
    openCheckout() {
        if (!this.state.cart.length) return this.showToast("Giỏ trống");
        if (!this.state.token) {
            this.showToast("Vui lòng đăng nhập");
            this.openModal('authModal');
            return;
        }
        this.toggleCart();
        this.openModal('checkoutModal');
    },

    async processCheckout() {
        const name = document.getElementById('cxName').value;
        const phone = document.getElementById('cxPhone').value;
        const address = document.getElementById('cxAddress').value;
        const method = document.getElementById('cxMethod').value;

        if (!name || !phone || !address) return this.showToast("Nhập đủ thông tin!");

        const payload = {
            shipping: { name, phone, address },
            payment_method: method,
            items: this.state.cart,
            couponCode: this.state.discountCode
        };

        try {
            const res = await fetch(`${API_Base}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.state.token
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.orderId) {
                this.showToast("Đặt hàng thành công! " + data.orderId);
                this.state.cart = [];
                this.state.discountAmount = 0;
                localStorage.removeItem('cart');
                this.updateCartUI();
                this.closeModal('checkoutModal');
                this.openOrderHistory();
            } else {
                this.showToast("Lỗi: " + data.error);
            }
        } catch (e) { this.showToast("Lỗi kết nối"); }
    },

    // --- AUTH ---
    renderAuthUI() {
        const box = document.getElementById('authBox');
        if (this.state.user) {
            box.innerHTML = `<span>Hi, ${this.state.user.name}</span> | <a href="#" onclick="app.logout()">Thoát</a>`;
            if (this.state.user.role === 'admin') document.getElementById('adminLink').style.display = 'block';
        } else {
            box.innerHTML = `<a href="#" onclick="app.openModal('authModal')">Login/Register</a>`;
            document.getElementById('adminLink').style.display = 'none';
        }
    },

    async handleLogin(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());

        try {
            const res = await fetch(`${API_Base}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const json = await res.json();
            if (json.accessToken) {
                this.state.token = json.accessToken;
                this.state.user = json.user;
                localStorage.setItem('token', this.state.token);
                localStorage.setItem('user', JSON.stringify(this.state.user));
                this.renderAuthUI();
                this.closeModal('authModal');
                this.showToast("Đăng nhập thành công");
            } else {
                this.showToast(json.error);
            }
        } catch (e) { this.showToast("Lỗi đăng nhập"); }
    },

    async handleRegister(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());
        try {
            const res = await fetch(`${API_Base}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const json = await res.json();
            if (json.error) this.showToast(json.error);
            else {
                this.showToast("Đăng ký thành công, hãy đăng nhập");
                // Flip to login
                document.getElementById('regForm').style.display = 'none';
                document.getElementById('loginForm').style.display = 'block';
            }
        } catch (e) { }
    },

    logout() {
        localStorage.clear();
        location.reload();
    },

    // --- MODAL UTILS ---
    openModal(id) { document.getElementById(id).classList.add('active'); },
    closeModal(id) { document.getElementById(id).classList.remove('active'); },

    // --- ORDERS ---
    async openOrderHistory() {
        if (!this.state.token) return this.showToast("Bạn chưa đăng nhập");
        try {
            const res = await fetch(`${API_Base}/orders/my`, {
                headers: { 'Authorization': 'Bearer ' + this.state.token }
            });
            const orders = await res.json();
            const list = document.getElementById('ordersList');
            if (orders.length === 0) list.innerHTML = "Chưa có đơn hàng";
            else {
                list.innerHTML = orders.map(o => `
                    <div style="border:1px solid #eee; padding:10px; border-radius:8px; margin-bottom:10px">
                        <div style="font-weight:bold; color:#4caf93; display:flex; justify-content:space-between">
                            <span>${o.id}</span> <span>${o.status}</span>
                        </div>
                        <div style="font-size:0.9rem; color:#666">${new Date(o.created_at).toLocaleString()}</div>
                        <div style="font-weight:bold; color:#ff6b6b; margin-top:4px">${this.formatCurrency(o.total_amount)}</div>
                    </div>
                `).join('');
            }
            this.openModal('ordersModal');
        } catch (e) { this.showToast("Lỗi tải đơn hàng"); }
    },

    // --- QUICK VIEW ---
    async openQuickView(id) {
        const prod = this.state.products.find(p => p.id === id);
        if (!prod) return;
        const body = document.getElementById('quickViewBody');
        body.innerHTML = `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px">
                <img src="${prod.image_url}" style="width:100%; object-fit:contain">
                <div>
                    <h2>${prod.name}</h2>
                    <h3 style="color:#ff6b6b">${this.formatCurrency(prod.price)}</h3>
                    <p>${prod.description}</p>
                    <button class="btn btn-primary" onclick="app.addToCart(${id}); app.closeModal('quickViewModal')">Thêm vào giỏ</button>
                </div>
            </div>
        `;
        this.openModal('quickViewModal');
    },

    showToast(msg) {
        const t = document.getElementById('toast');
        t.innerText = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
    // Search listener
    const inp = document.getElementById('searchInput');
    document.getElementById('searchBtn').onclick = () => app.renderProducts({ search: inp.value });
    inp.onkeypress = (e) => { if (e.key === 'Enter') app.renderProducts({ search: inp.value }); };
});
