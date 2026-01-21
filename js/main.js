// ============================================
// FONCTIONS PRODUITS (suite)
// ============================================

// Charger les produits depuis le JSON
async function loadProducts() {
    try {
        const response = await fetch('/data/products.json');
        products = await response.json();
        return products;
    } catch (error) {
        console.error('Erreur chargement produits:', error);
        return [];
    }
}

// Afficher les produits
function displayProducts(productsList, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (productsList.length === 0) {
        container.innerHTML = '<p class="no-products">Aucun produit trouvé.</p>';
        return;
    }
    
    productsList.forEach(product => {
        const productCard = createProductCard(product);
        container.appendChild(productCard);
    });
}

// Créer une carte produit
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <div class="product-image">
            <img src="${product.image}" alt="${product.name}" loading="lazy">
            ${product.discount ? `<span class="discount-badge">-${product.discount}%</span>` : ''}
            <button class="quick-view" onclick="quickView(${product.id})">
                <i class="fas fa-eye"></i>
            </button>
        </div>
        <div class="product-info">
            <span class="product-category">${product.category}</span>
            <h3 class="product-title">${product.name}</h3>
            <div class="product-rating">
                ${generateStars(product.rating)}
                <span class="rating-count">(${product.reviewCount})</span>
            </div>
            <div class="product-price">
                ${product.discount 
                    ? `<span class="old-price">${formatPrice(product.price)}</span>
                       <span class="current-price">${formatPrice(product.price * (1 - product.discount/100))}</span>`
                    : `<span class="current-price">${formatPrice(product.price)}</span>`
                }
            </div>
            <button class="add-to-cart-btn" onclick="addToCart(${product.id}, '${product.name}', ${product.discount ? product.price * (1 - product.discount/100) : product.price}, '${product.image}')">
                <i class="fas fa-shopping-cart"></i>
                Ajouter au panier
            </button>
        </div>
    `;
    
    return card;
}

// Générer les étoiles de notation
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i === Math.ceil(rating) && !Number.isInteger(rating)) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

// Vue rapide produit
function quickView(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-modal" onclick="this.parentElement.parentElement.remove()">×</button>
            <div class="quick-view-content">
                <div class="quick-view-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="quick-view-details">
                    <h2>${product.name}</h2>
                    <div class="quick-view-rating">
                        ${generateStars(product.rating)}
                        <span>${product.rating} (${product.reviewCount} avis)</span>
                    </div>
                    <div class="quick-view-price">
                        ${product.discount 
                            ? `<span class="old-price">${formatPrice(product.price)}</span>
                               <span class="current-price">${formatPrice(product.price * (1 - product.discount/100))}</span>`
                            : `<span class="current-price">${formatPrice(product.price)}</span>`
                        }
                    </div>
                    <p class="quick-view-description">${product.description}</p>
                    <div class="quick-view-actions">
                        <div class="quantity-selector">
                            <button onclick="this.nextElementSibling.stepDown()">-</button>
                            <input type="number" value="1" min="1" max="10" id="quick-view-qty">
                            <button onclick="this.previousElementSibling.stepUp()">+</button>
                        </div>
                        <button class="btn btn-primary" onclick="addToCart(${product.id}, '${product.name}', ${product.discount ? product.price * (1 - product.discount/100) : product.price}, '${product.image}', document.getElementById('quick-view-qty').value)">
                            <i class="fas fa-shopping-cart"></i>
                            Ajouter au panier
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ============================================
// FILTRES ET RECHERCHE
// ============================================

// Filtrer les produits
function filterProducts() {
    const category = document.getElementById('category-filter')?.value || 'all';
    const priceMin = parseFloat(document.getElementById('price-min')?.value) || 0;
    const priceMax = parseFloat(document.getElementById('price-max')?.value) || 10000;
    const sortBy = document.getElementById('sort-by')?.value || 'featured';
    
    let filtered = [...products];
    
    // Filtre catégorie
    if (category !== 'all') {
        filtered = filtered.filter(p => p.category === category);
    }
    
    // Filtre prix
    filtered = filtered.filter(p => {
        const price = p.discount ? p.price * (1 - p.discount/100) : p.price;
        return price >= priceMin && price <= priceMax;
    });
    
    // Tri
    switch (sortBy) {
        case 'price-low':
            filtered.sort((a, b) => (a.discount ? a.price * (1 - a.discount/100) : a.price) - 
                                   (b.discount ? b.price * (1 - b.discount/100) : b.price));
            break;
        case 'price-high':
            filtered.sort((a, b) => (b.discount ? b.price * (1 - b.discount/100) : b.price) - 
                                   (a.discount ? a.price * (1 - a.discount/100) : a.price));
            break;
        case 'rating':
            filtered.sort((a, b) => b.rating - a.rating);
            break;
        case 'newest':
            filtered.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
            break;
    }
    
    return filtered;
}

// Recherche produits
function searchProducts(query) {
    if (!query.trim()) return products;
    
    const searchTerm = query.toLowerCase();
    return products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
    );
}

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    // Initialiser le panier
    updateCart
    
    // Charger les produits sur la page d'accueil
    if (document.getElementById('featured-products')) {
        products = await loadProducts();
        const featured = products.filter(p => p.featured).slice(0, 8);
        displayProducts(featured, 'featured-products');
    }
    
    // Charger tous les produits sur la page produits
    if (document.getElementById('products-grid')) {
        products = await loadProducts();
        displayProducts(products, 'products-grid');
        
        // Configurer les filtres
        const filterForm = document.getElementById('filter-form');
        if (filterForm) {
            filterForm.addEventListener('change', function() {
                const filtered = filterProducts();
                displayProducts(filtered, 'products-grid');
            });
        }
        
        // Configurer la recherche
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                const results = searchProducts(this.value);
                displayProducts(results, 'products-grid');
            });
        }
    }
    
    // Initialiser le menu mobile
    initMobileMenu();
    
    // Initialiser les modales
    initModals();
});

// Menu mobile
function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }
}

// Modales
function initModals() {
    // Fermer modale avec ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => modal.remove());
        }
    });
    
    // Fermer en cliquant à l'extérieur
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.remove();
        }
    });
}

// ============================================
// EXPORT POUR UTILISATION DANS D'AUTRES FICHIERS
// ============================================

// Rendre les fonctions accessibles globalement
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.updateCart = updateCart;
window.formatPrice = formatPrice;
window.showNotification = showNotification;
window.quickView = quickView;
window.filterProducts = filterProducts;
window.searchProducts = searchProducts;
