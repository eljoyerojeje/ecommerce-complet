// ============================================
// PRODUCTS.JS
// ============================================
// Gestion spécifique des produits, filtres et pagination

// Variables globales
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const productsPerPage = 12;
let currentSort = 'featured';
let currentView = 'grid';

// ============================================
// CHARGEMENT ET INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    // Charger les produits
    await loadAllProducts();
    
    // Initialiser les filtres depuis l'URL
    initFiltersFromURL();
    
    // Initialiser les événements
    initEvents();
    
    // Afficher les produits
    displayFilteredProducts();
    
    // Mettre à jour le compteur
    updateProductsCount();
});

// Charger tous les produits
async function loadAllProducts() {
    try {
        const response = await fetch('/data/products.json');
        const data = await response.json();
        allProducts = data.products;
        filteredProducts = [...allProducts];
    } catch (error) {
        console.error('Erreur chargement produits:', error);
        showNotification('Erreur de chargement des produits', 'error');
    }
}

// ============================================
// FILTRES ET RECHERCHE
// ============================================

// Initialiser les filtres depuis l'URL
function initFiltersFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Catégorie
    const category = urlParams.get('category');
    if (category) {
        const checkboxes = document.querySelectorAll(`input[value="${category}"]`);
        checkboxes.forEach(cb => cb.checked = true);
    }
    
    // Collection
    const collection = urlParams.get('collection');
    if (collection === 'nouveautes') {
        currentSort = 'newest';
        document.getElementById('sort-by').value = 'newest';
    } else if (collection === 'promotions') {
        const saleCheckbox = document.getElementById('on-sale');
        if (saleCheckbox) saleCheckbox.checked = true;
    }
    
    // Marque
    const brand = urlParams.get('brand');
    if (brand) {
        const brandCheckbox = document.querySelector(`input[value="${brand}"]`);
        if (brandCheckbox) brandCheckbox.checked = true;
    }
    
    // Promotion
    const promo = urlParams.get('promo');
    if (promo) {
        const saleCheckbox = document.getElementById('on-sale');
        if (saleCheckbox) saleCheckbox.checked = true;
    }
}

// Appliquer tous les filtres
function applyFilters() {
    let filtered = [...allProducts];
    
    // 1. Filtre par catégorie
    const selectedCategories = getSelectedCategories();
    if (selectedCategories.length > 0 && !selectedCategories.includes('all')) {
        filtered = filtered.filter(product => 
            selectedCategories.includes(product.category.toLowerCase())
        );
    }
    
    // 2. Filtre par prix
    const minPrice = parseFloat(document.getElementById('price-min').value) || 0;
    const maxPrice = parseFloat(document.getElementById('price-max').value) || 5000;
    filtered = filtered.filter(product => {
        const price = product.discount ? 
            product.price * (1 - product.discount/100) : 
            product.price;
        return price >= minPrice && price <= maxPrice;
    });
    
    // 3. Filtre par marque
    const selectedBrands = getSelectedBrands();
    if (selectedBrands.length > 0) {
        filtered = filtered.filter(product => {
            const productBrand = product.name.split(' ')[0].toLowerCase();
            return selectedBrands.some(brand => 
                productBrand.includes(brand) || 
                product.category.toLowerCase().includes(brand)
            );
        });
    }
    
    // 4. Filtre par note
    const selectedRating = document.querySelector('input[name="rating"]:checked');
    if (selectedRating) {
        const minRating = parseInt(selectedRating.value);
        filtered = filtered.filter(product => product.rating >= minRating);
    }
    
    // 5. Filtre en stock seulement
    const inStockOnly = document.getElementById('in-stock')?.checked;
    if (inStockOnly) {
        filtered = filtered.filter(product => product.stock > 0);
    }
    
    // 6. Filtre en promotion
    const onSaleOnly = document.getElementById('on-sale')?.checked;
    if (onSaleOnly) {
        filtered = filtered.filter(product => product.discount > 0);
    }
    
    // 7. Filtre livraison gratuite (simulé)
    const freeShippingOnly = document.getElementById('free-shipping')?.checked;
    if (freeShippingOnly) {
        filtered = filtered.filter(product => product.price >= 50);
    }
    
    // 8. Recherche par texte
    const searchInput = document.getElementById('search-input');
    if (searchInput && searchInput.value.trim()) {
        const searchTerm = searchInput.value.toLowerCase().trim();
        filtered = filtered.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );
    }
    
    // Trier les résultats
    filtered = sortProducts(filtered, currentSort);
    
    filteredProducts = filtered;
    currentPage = 1; // Retour à la première page
    
    return filtered;
}

// Obtenir les catégories sélectionnées
function getSelectedCategories() {
    const checkboxes = document.querySelectorAll('.category-item input:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

// Obtenir les marques sélectionnées
function getSelectedBrands() {
    const checkboxes = document.querySelectorAll('.brand-item input:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

// Trier les produits
function sortProducts(products, sortType) {
    const sorted = [...products];
    
    switch (sortType) {
        case 'price-low':
            sorted.sort((a, b) => {
                const priceA = a.discount ? a.price * (1 - a.discount/100) : a.price;
                const priceB = b.discount ? b.price * (1 - b.discount/100) : b.price;
                return priceA - priceB;
            });
            break;
            
        case 'price-high':
            sorted.sort((a, b) => {
                const priceA = a.discount ? a.price * (1 - a.discount/100) : a.price;
                const priceB = b.discount ? b.price * (1 - b.discount/100) : b.price;
                return priceB - priceA;
            });
            break;
            
        case 'rating':
            sorted.sort((a, b) => b.rating - a.rating);
            break;
            
        case 'newest':
            sorted.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
            break;
            
        case 'popularity':
            sorted.sort((a, b) => b.reviewCount - a.reviewCount);
            break;
            
        case 'featured':
        default:
            // Les produits featured d'abord, puis les autres
            sorted.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
            break;
    }
    
    return sorted;
}

// ============================================
// AFFICHAGE DES PRODUITS
// ============================================

// Afficher les produits filtrés
function displayFilteredProducts() {
    const container = document.getElementById('products-grid');
    if (!container) return;
    
    // Afficher le loading
    container.innerHTML = `
        <div class="loading-products">
            <div class="spinner"></div>
            <p>Chargement des produits...</p>
        </div>
    `;
    
    // Simuler un petit délai pour l'affichage
    setTimeout(() => {
        const filtered = applyFilters();
        
        if (filtered.length === 0) {
            showNoProductsMessage();
            return;
        }
        
        // Calculer les produits pour la page courante
        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        const paginatedProducts = filtered.slice(startIndex, endIndex);
        
        // Afficher les produits
        container.innerHTML = '';
        paginatedProducts.forEach(product => {
            const productCard = createProductCard(product);
            container.appendChild(productCard);
        });
        
        // Mettre à jour la pagination
        updatePagination(filtered.length);
        
        // Mettre à jour le compteur
        updateProductsCount();
        
        // Masquer le message "aucun produit"
        const noProductsMsg = document.querySelector('.no-products-message');
        if (noProductsMsg) noProductsMsg.style.display = 'none';
        
    }, 300);
}

// Créer une carte produit (version améliorée)
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.id = product.id;
    card.dataset.category = product.category.toLowerCase();
    
    const finalPrice = product.discount ? 
        product.price * (1 - product.discount/100) : 
        product.price;
    
    card.innerHTML = `
        <div class="product-image">
            <img src="${product.image}" alt="${product.name}" loading="lazy">
            ${product.discount ? `<span class="discount-badge">-${product.discount}%</span>` : ''}
            ${product.stock <= 10 && product.stock > 0 ? 
                `<span class="stock-badge">Plus que ${product.stock}</span>` : 
                product.stock === 0 ? 
                `<span class="out-of-stock-badge">Rupture</span>` : ''}
            <div class="product-actions">
                <button class="action-btn quick-view-btn" title="Vue rapide">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn wishlist-btn" title="Ajouter aux favoris">
                    <i class="far fa-heart"></i>
                </button>
                <button class="action-btn compare-btn" title="Comparer">
                    <i class="fas fa-exchange-alt"></i>
                </button>
            </div>
        </div>
        <div class="product-info">
            <span class="product-category">${product.category}</span>
            <h3 class="product-title">
                <a href="product-detail.html?id=${product.id}">${product.name}</a>
            </h3>
            <div class="product-rating">
                ${generateStars(product.rating)}
                <span class="rating-count">(${product.reviewCount})</span>
            </div>
            <div class="product-price">
                ${product.discount ? 
                    `<span class="old-price">${formatPrice(product.price)}</span>` : ''}
                <span class="current-price">${formatPrice(finalPrice)}</span>
            </div>
            <div class="product-stock">
                <span class="stock-status ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
                    ${product.stock > 0 ? 'En stock' : 'Rupture de stock'}
                </span>
            </div>
            <button class="add-to-cart-btn" 
                    onclick="addToCart(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${finalPrice}, '${product.image}')"
                    ${product.stock === 0 ? 'disabled' : ''}>
                <i class="fas fa-shopping-cart"></i>
                ${product.stock > 0 ? 'Ajouter au panier' : 'Indisponible'}
            </button>
        </div>
    `;
    
    // Ajouter les événements aux boutons
    const quickViewBtn = card.querySelector('.quick-view-btn');
    const wishlistBtn = card.querySelector('.wishlist-btn');
    const compareBtn = card.querySelector('.compare-btn');
    
    if (quickViewBtn) {
        quickViewBtn.addEventListener('click', () => quickView(product.id));
    }
    
    if (wishlistBtn) {
        wishlistBtn.addEventListener('click', () => toggleWishlist(product.id));
    }
    
    if (compareBtn) {
        compareBtn.addEventListener('click', () => addToCompare(product.id));
    }
    
    return card;
}

// Message "aucun produit"
function showNoProductsMessage() {
    const container = document.getElementById('products-grid');
    const noProductsMsg = document.querySelector('.no-products-message');
    
    if (container) {
        container.innerHTML = '';
    }
    
    if (noProductsMsg) {
        noProductsMsg.style.display = 'block';
    }
}

// Mettre à jour le compteur de produits
function updateProductsCount() {
    const countElement = document.querySelector('.products-count p strong');
    if (countElement) {
        countElement.textContent = filteredProducts.length;
    }
}

// ============================================
// PAGINATION
// ============================================

// Mettre à jour la pagination
function updatePagination(totalProducts) {
    const totalPages = Math.ceil(totalProducts / productsPerPage);
    const paginationContainer = document.querySelector('.pagination');
    
    if (!paginationContainer) return;
    
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'flex';
    
    // Boutons précédent/suivant
    const prevBtn = paginationContainer.querySelector('.page-btn:first-child');
    const nextBtn = paginationContainer.querySelector('.page-btn:last-child');
    
    if (prevBtn) {
        prevBtn.classList.toggle('disabled', currentPage === 1);
        prevBtn.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                displayFilteredProducts();
            }
        };
    }
    
    if (nextBtn) {
        nextBtn.classList.toggle('disabled', currentPage === totalPages);
        nextBtn.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                displayFilteredProducts();
            }
        };
    }
    
    // Numéros de page
    const pageNumbersContainer = paginationContainer.querySelector('.page-numbers');
    if (pageNumbersContainer) {
        pageNumbersContainer.innerHTML = '';
        
        // Afficher max 5 pages
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }
        
        // Première page
        if (startPage > 1) {
            const firstPageBtn = document.createElement('button');
            firstPageBtn.className = 'page-number';
            firstPageBtn.textContent = '1';
            firstPageBtn.onclick = () => {
                currentPage = 1;
                displayFilteredProducts();
            };
            pageNumbersContainer.appendChild(firstPageBtn);
            
            if (startPage > 2) {
                const dots = document.createElement('span');
                dots.textContent = '...';
                pageNumbersContainer.appendChild(dots);
            }
        }
        
        // Pages du milieu
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = 'page-number';
            if (i === currentPage) pageBtn.classList.add('active');
            pageBtn.textContent = i;
            pageBtn.onclick = () => {
                currentPage = i;
                displayFilteredProducts();
            };
            pageNumbersContainer.appendChild(pageBtn);
        }
        
        // Dernière page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const dots = document.createElement('span');
                dots.textContent = '...';
                pageNumbersContainer.appendChild(dots);
            }
            
            const lastPageBtn = document.createElement('button');
            lastPageBtn.className = 'page-number';
            lastPageBtn.textContent = totalPages;
            lastPageBtn.onclick = () => {
                currentPage = totalPages;
                displayFilteredProducts();
            };
            pageNumbersContainer.appendChild(lastPageBtn);
        }
    }
}

// ============================================
// GESTION DES ÉVÉNEMENTS
// ============================================

function initEvents() {
    // Écouter les changements de filtres
    const filterInputs = document.querySelectorAll('input[type="checkbox"], input[type="radio"]');
    filterInputs.forEach(input => {
        input.addEventListener('change', () => {
            currentPage = 1;
            displayFilteredProducts();
        });
    });
    
    // Prix
    const priceInputs = document.querySelectorAll('#price-min, #price-max, #apply-price');
    priceInputs.forEach(input => {
        if (input.id === 'apply-price') {
            input.addEventListener('click', () => {
                currentPage = 1;
                displayFilteredProducts();
            });
        } else {
            input.addEventListener('change', () => {
                currentPage = 1;
                displayFilteredProducts();
            });
        }
    });
    
    // Tri
    const sortSelect = document.getElementById('sort-by');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            currentSort = this.value;
            currentPage = 1;
            displayFilteredProducts();
        });
    }
    
    // Recherche
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            currentPage = 1;
            displayFilteredProducts();
        });
    }
    
    if (searchInput) {
        // Recherche en temps réel (avec délai)
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentPage = 1;
                displayFilteredProducts();
            }, 500);
        });
    }
    
    // Bouton réinitialiser la recherche
    const resetSearchBtn = document.getElementById('reset-search');
    if (resetSearchBtn) {
        resetSearchBtn.addEventListener('click', function() {
            if (searchInput) searchInput.value = '';
            currentPage = 1;
            displayFilteredProducts();
        });
    }
    
    // Slider de prix
    initPriceSlider();
}

// Initialiser le slider de prix
function initPriceSlider() {
    const minSlider = document.querySelector('.range-min');
    const maxSlider = document.querySelector('.range-max');
    const minInput = document.getElementById('price-min');
    const maxInput = document.getElementById('price-max');
    
    if (!minSlider || !maxSlider || !minInput || !maxInput) return;
    
    minSlider.addEventListener('input', function() {
        if (parseInt(this.value) > parseInt(maxSlider.value)) {
            this.value = maxSlider.value;
        }
        minInput.value = this.value;
    });
    
    maxSlider.addEventListener('input', function() {
        if (parseInt(this.value) < parseInt(minSlider.value)) {
            this.value = minSlider.value;
        }
        maxInput.value = this.value;
    });
    
    minInput.addEventListener('change', function() {
        if (parseInt(this.value) < parseInt(minSlider.min)) {
            this.value = minSlider.min;
        }
        if (parseInt(this.value) > parseInt(maxInput.value)) {
            this.value = maxInput.value;
        }
        minSlider.value = this.value;
    });
    
    maxInput.addEventListener('change', function() {
        if (parseInt(this.value) > parseInt(maxSlider.max)) {
            this.value = maxSlider.max;
        }
        if (parseInt(this.value) < parseInt(minInput.value)) {
            this.value = minInput.value;
        }
        maxSlider.value = this.value;
    });
}

// ============================================
// FONCTIONS SUPPLEMENTAIRES
// ============================================

// Ajouter aux favoris
function toggleWishlist(productId) {
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const index = wishlist.indexOf(productId);
    
    if (index > -1) {
        wishlist.splice(index, 1);
        showNotification('Produit retiré des favoris');
    } else {
        wishlist.push(productId);
        showNotification('Produit ajouté aux favoris');
    }
    
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistCount();
    
    // Mettre à jour l'apparence du bouton
    const wishlistBtn = document.querySelector(`[data-id="${productId}"] .wishlist-btn i`);
    if (wishlistBtn) {
        if (index > -1) {
            wishlistBtn.className = 'far fa-heart';
        } else {
            wishlistBtn.className = 'fas fa-heart';
            wishlistBtn.style.color = '#ff4757';
        }
    }
}

// Mettre à jour le compteur de favoris
function updateWishlistCount() {
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const wishlistCounts = document.querySelectorAll('.wishlist-count');
    
    wishlistCounts.forEach(el => {
        el.textContent = wishlist.length;
        el.style.display = wishlist.length > 0 ? 'inline' : 'none';
    });
}

// Ajouter à la comparaison
function addToCompare(productId) {
    let compare = JSON.parse(localStorage.getItem('compare')) || [];
    
    if (compare.length >= 4) {
        showNotification('Maximum 4 produits pour la comparaison', 'error');
        return;
    }
    
    if (!compare.includes(productId)) {
        compare.push(productId);
        localStorage.setItem('compare', JSON.stringify(compare));
        showNotification('Produit ajouté à la comparaison');
    } else {
        showNotification('Produit déjà dans la comparaison', 'info');
    }
}

// ============================================
// EXPORT DES FONCTIONS
// ============================================

// Rendre les fonctions accessibles globalement
window.applyFilters = applyFilters;
window.displayFilteredProducts = displayFilteredProducts;
window.toggleWishlist = toggleWishlist;
window.addToCompare = addToCompare;
window.updateWishlistCount = updateWishlistCount;

// Initialiser le compteur de favoris au chargement
document.addEventListener('DOMContentLoaded', updateWishlistCount);
