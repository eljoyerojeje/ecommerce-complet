// ============================================
// CART.JS
// ============================================
// Gestion du panier - page cart.html

// Variables globales
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let appliedCoupon = JSON.parse(localStorage.getItem('appliedCoupon')) || null;
let shippingCost = 0;

// ============================================
// CHARGEMENT ET INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('cart.html')) {
        loadCartPage();
    }
});

// Charger la page panier
function loadCartPage() {
    updateCartDisplay();
    loadCrossSellingProducts();
    loadRecentlyViewed();
    updateCartSummary();
    
    // Initialiser les coupons
    if (appliedCoupon) {
        applyCoupon(appliedCoupon.code);
    }
}

// ============================================
// AFFICHAGE DU PANIER
// ============================================

// Mettre à jour l'affichage du panier
function updateCartDisplay() {
    const cartItemsList = document.getElementById('cart-items-list');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const cartItemsTable = document.getElementById('cart-items-table');
    
    if (!cartItemsList) return;
    
    // Vérifier si le panier est vide
    if (cart.length === 0) {
        if (emptyCartMessage) emptyCartMessage.style.display = 'block';
        if (cartItemsTable) cartItemsTable.style.display = 'none';
        
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.style.opacity = '0.5';
            checkoutBtn.style.pointerEvents = 'none';
        }
        
        return;
    }
    
    // Afficher les articles
    if (emptyCartMessage) emptyCartMessage.style.display = 'none';
    if (cartItemsTable) cartItemsTable.style.display = 'block';
    
    cartItemsList.innerHTML = '';
    
    cart.forEach(item => {
        const cartItem = createCartItemElement(item);
        cartItemsList.appendChild(cartItem);
    });
    
    // Mettre à jour le bouton checkout
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.style.opacity = '1';
        checkoutBtn.style.pointerEvents = 'auto';
    }
}

// Créer un élément d'article du panier
function createCartItemElement(item) {
    const itemTotal = item.price * item.quantity;
    const element = document.createElement('div');
    element.className = 'cart-item';
    element.dataset.id = item.id;
    
    element.innerHTML = `
        <div class="cart-item-product">
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="cart-item-details">
                <h3 class="cart-item-title">
                    <a href="product-detail.html?id=${item.id}">${item.name}</a>
                </h3>
                <div class="cart-item-meta">
                    <span class="cart-item-sku">SKU: ${item.sku || 'N/A'}</span>
                    <span class="cart-item-availability ${item.stock > 0 ? 'in-stock' : 'out-of-stock'}">
                        ${item.stock > 0 ? 'En stock' : 'Rupture'}
                    </span>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </div>
        </div>
        <div class="cart-item-price">
            <span class="price">${formatPrice(item.price)}</span>
        </div>
        <div class="cart-item-quantity">
            <div class="quantity-selector">
                <button class="quantity-btn minus" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="99" 
                       data-id="${item.id}" onchange="updateQuantity(${item.id}, this.value)">
                <button class="quantity-btn plus" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
            </div>
        </div>
        <div class="cart-item-total">
            <span class="total-price">${formatPrice(itemTotal)}</span>
        </div>
        <div class="cart-item-actions">
            <button class="action-btn wishlist-btn" title="Ajouter aux favoris" onclick="moveToWishlist(${item.id})">
                <i class="far fa-heart"></i>
            </button>
            <button class="action-btn remove-btn" title="Supprimer" onclick="removeFromCart(${item.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return element;
}

// ============================================
// GESTION DES QUANTITÉS
// ============================================

// Mettre à jour la quantité d'un produit
function updateQuantity(productId, newQuantity) {
    newQuantity = parseInt(newQuantity);
    
    if (isNaN(newQuantity) || newQuantity < 1) {
        removeFromCart(productId);
        return;
    }
    
    if (newQuantity > 99) {
        newQuantity = 99;
        showNotification('Quantité maximum de 99 atteinte', 'warning');
    }
    
    const item = cart.find(item => item.id === productId);
    if (item) {
        // Vérifier le stock (simulé)
        if (newQuantity > (item.stock || 99)) {
            showNotification(`Stock limité à ${item.stock} unités`, 'error');
            newQuantity = item.stock || 99;
        }
        
        item.quantity = newQuantity;
        updateCart();
        updateCartDisplay();
        updateCartSummary();
        
        // Mettre à jour le dropdown du panier
        if (window.updateCartDropdown) {
            window.updateCartDropdown();
        }
    }
}

// Mettre à jour toutes les quantités depuis les inputs
function updateAllQuantities() {
    const quantityInputs = document.querySelectorAll('.quantity-input');
    let updated = false;
    
    quantityInputs.forEach(input => {
        const productId = parseInt(input.dataset.id);
        const newQuantity = parseInt(input.value);
        const item = cart.find(item => item.id === productId);
        
        if (item && item.quantity !== newQuantity) {
            item.quantity = newQuantity;
            updated = true;
        }
    });
    
    if (updated) {
        updateCart();
        updateCartDisplay();
        updateCartSummary();
        showNotification('Panier mis à jour', 'success');
    }
}

// ============================================
// GESTION DU PANIER
// ============================================

// Retirer un produit du panier
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
    updateCartDisplay();
    updateCartSummary();
    
    if (window.updateCartDropdown) {
        window.updateCartDropdown();
    }
    
    showNotification('Produit retiré du panier');
}

// Vider complètement le panier
function clearCart() {
    cart = [];
    appliedCoupon = null;
    localStorage.removeItem('appliedCoupon');
    updateCart();
    updateCartDisplay();
    updateCartSummary();
    
    if (window.updateCartDropdown) {
        window.updateCartDropdown();
    }
    
    showNotification('Panier vidé', 'success');
}

// Déplacer vers les favoris
function moveToWishlist(productId) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    // Ajouter aux favoris
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    if (!wishlist.includes(productId)) {
        wishlist.push(productId);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        
        if (window.updateWishlistCount) {
            window.updateWishlistCount();
        }
    }
    
    // Retirer du panier
    removeFromCart(productId);
    showNotification('Produit déplacé vers les favoris', 'success');
}

// ============================================
// RÉCAPITULATIF ET CALCULS
// ============================================

// Mettre à jour le récapitulatif
function updateCartSummary() {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount(subtotal);
    const shipping = calculateShipping(subtotal);
    const total = subtotal - discount + shipping;
    
    // Mettre à jour les affichages
    document.getElementById('cart-subtotal').textContent = formatPrice(subtotal);
    document.getElementById('cart-discount').textContent = formatPrice(-discount);
    document.getElementById('cart-shipping').textContent = shipping === 0 ? 'Gratuit' : formatPrice(shipping);
    document.getElementById('cart-total').textContent = formatPrice(total);
}

// Calculer le sous-total
function calculateSubtotal() {
    return cart.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
}

// Calculer la remise
function calculateDiscount(subtotal) {
    if (!appliedCoupon) return 0;
    
    let discount = 0;
    
    switch (appliedCoupon.code) {
        case 'WELCOME10':
            discount = subtotal * 0.10;
            break;
        case 'FREE50':
            discount = 50;
            break;
        case 'SUMMER25':
            discount = subtotal * 0.25;
            break;
        default:
            discount = subtotal * 0.10; // Valeur par défaut
    }
    
    // Limiter la remise au montant maximum si spécifié
    if (appliedCoupon.maxDiscount && discount > appliedCoupon.maxDiscount) {
        discount = appliedCoupon.maxDiscount;
    }
    
    // S'assurer que la remise ne dépasse pas le sous-total
    return Math.min(discount, subtotal);
}

// Calculer les frais de livraison
function calculateShipping(subtotal) {
    const expressShipping = document.querySelector('input[name="shipping"]:checked')?.id === 'shipping-express';
    
    if (expressShipping) {
        shippingCost = 9.99;
    } else {
        // Livraison gratuite à partir de 50€
        shippingCost = subtotal >= 50 ? 0 : 4.99;
    }
    
    return shippingCost;
}

// Mettre à jour les frais de livraison
function updateShipping() {
    updateCartSummary();
}

// ============================================
// GESTION DES COUPONS
// ============================================

// Appliquer un coupon
function applyCoupon(code) {
    const couponMessage = document.getElementById('coupon-message');
    const subtotal = calculateSubtotal();
    
    // Liste des coupons valides
    const validCoupons = {
        'WELCOME10': {
            type: 'percentage',
            value: 10,
            minAmount: 0,
            maxDiscount: 100
        },
        'FREE50': {
            type: 'fixed',
            value: 50,
            minAmount: 100,
            maxDiscount: 50
        },
        'SUMMER25': {
            type: 'percentage',
            value: 25,
            minAmount: 50,
            maxDiscount: null
        }
    };
    
    const coupon = validCoupons[code];
    
    if (!coupon) {
        showCouponMessage('Code promo invalide', 'error');
        return;
    }
    
    // Vérifier le montant minimum
    if (subtotal < coupon.minAmount) {
        showCouponMessage(`Minimum ${coupon.minAmount}€ requis pour ce code`, 'error');
        return;
    }
    
    // Calculer la remise
    let discount;
    if (coupon.type === 'percentage') {
        discount = subtotal * (coupon.value / 100);
        if (coupon.maxDiscount) {
            discount = Math.min(discount, coupon.maxDiscount);
        }
    } else {
        discount = coupon.value;
    }
    
    // Appliquer le coupon
    appliedCoupon = {
        code: code,
        discount: discount,
        type: coupon.type,
        value: coupon.value
    };
    
    localStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon));
    
    // Afficher le message de succès
    showCouponMessage(`Coupon "${code}" appliqué ! Remise de ${formatPrice(discount)}`, 'success');
    
    // Mettre à jour le récapitulatif
    updateCartSummary();
}

// Afficher un message de coupon
function showCouponMessage(message, type = 'info') {
    const couponMessage = document.getElementById('coupon-message');
    if (!couponMessage) return;
    
    couponMessage.textContent = message;
    couponMessage.className = 'coupon-message ' + type;
    
    // Effacer après 5 secondes
    setTimeout(() => {
        couponMessage.textContent = '';
        couponMessage.className = 'coupon-message';
    }, 5000);
}

// Retirer le coupon
function removeCoupon() {
    appliedCoupon = null;
    localStorage.removeItem('appliedCoupon');
    updateCartSummary();
    showCouponMessage('Coupon retiré', 'info');
}

// ============================================
// PRODUITS SUGGÉRÉS
// ============================================

// Charger les produits suggérés
async function loadCrossSellingProducts() {
    const container = document.getElementById('cross-selling-products');
    if (!container) return;
    
    try {
        // Simuler un chargement de produits similaires
        const response = await fetch('/data/products.json');
        const data = await response.json();
        
        // Prendre 4 produits au hasard (sauf ceux dans le panier)
        const cartIds = cart.map(item => item.id);
        const availableProducts = data.products.filter(p => !cartIds.includes(p.id));
        const randomProducts = availableProducts
            .sort(() => Math.random() - 0.5)
            .slice(0, 4);
        
        container.innerHTML = '';
        randomProducts.forEach(product => {
            const productCard = createProductCard(product);
            container.appendChild(productCard);
        });
    } catch (error) {
        console.error('Erreur chargement produits suggérés:', error);
    }
}

// Charger les produits récemment consultés
function loadRecentlyViewed() {
    const container = document.getElementById('recent-products');
    if (!container) return;
    
    const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed')) || [];
    
    if (recentlyViewed.length === 0) {
        container.innerHTML = '<p class="no-recent">Aucun produit récemment consulté</p>';
        return;
    }
    
    container.innerHTML = '';
    
    // Afficher les 3 derniers produits consultés
    recentlyViewed.slice(-3).forEach(product => {
        const recentProduct = document.createElement('div');
        recentProduct.className = 'recent-product';
        recentProduct.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <div class="recent-product-info">
                <h4>${product.name}</h4>
                <span class="recent-product-price">${formatPrice(product.price)}</span>
                <a href="product-detail.html?id=${product.id}" class="btn btn-small">Voir</a>
            </div>
        `;
        container.appendChild(recentProduct);
    });
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

// Formater le prix (réimplémenté pour éviter les dépendances)
function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(price);
}

// Afficher une notification
function showNotification(message, type = 'success') {
    // Utiliser la fonction de main.js si disponible
    if (window.showNotification) {
        window.showNotification(message, type);
        return;
    }
    
    // Fallback simple
    alert(message);
}

// ============================================
// EXPORT DES FONCTIONS
// ============================================

// Rendre les fonctions accessibles globalement
window.loadCartPage = loadCartPage;
window.updateQuantity = updateQuantity;
window.updateAllQuantities = updateAllQuantities;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.moveToWishlist = moveToWishlist;
window.applyCoupon = applyCoupon;
window.removeCoupon = removeCoupon;
window.updateShipping = updateShipping;
