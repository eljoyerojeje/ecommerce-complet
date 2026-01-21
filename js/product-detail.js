// ============================================
// PRODUCT-DETAIL.JS
// ============================================
// Gestion de la page détail produit

// Variables globales
let currentProduct = null;
let selectedColor = null;
let selectedStorage = null;
let currentPrice = 0;
let productImages = [];

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    // Récupérer l'ID du produit depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (productId) {
        await loadProductDetails(productId);
    } else {
        // Charger un produit par défaut si pas d'ID
        await loadProductDetails(1);
    }
    
    // Initialiser les fonctionnalités
    initProductPage();
    loadRelatedProducts();
    loadRecentlyViewed();
    
    // Ajouter aux produits récemment consultés
    if (currentProduct) {
        addToRecentlyViewed(currentProduct);
    }
});

// ============================================
// CHARGEMENT DES DONNÉES
// ============================================

// Charger les détails du produit
async function loadProductDetails(productId) {
    try {
        const response = await fetch('/data/products.json');
        const data = await response.json();
        
        // Trouver le produit par ID
        const product = data.products.find(p => p.id == productId);
        
        if (product) {
            currentProduct = product;
            displayProductDetails(product);
            updateProductImages(product);
        } else {
            // Produit non trouvé, rediriger
            window.location.href = 'products.html';
        }
    } catch (error) {
        console.error('Erreur chargement produit:', error);
        showNotification('Erreur de chargement du produit', 'error');
    }
}

// Afficher les détails du produit
function displayProductDetails(product) {
    // Mettre à jour les informations de base
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-category').textContent = product.category;
    document.getElementById('product-category-link').textContent = product.category;
    document.getElementById('product-title').textContent = product.name;
    document.getElementById('product-short-description').textContent = product.description.substring(0, 150) + '...';
    document.getElementById('product-rating').textContent = product.rating;
    document.getElementById('product-reviews').textContent = `(${product.reviewCount} avis)`;
    document.getElementById('product-sku').textContent = product.specs?.sku || 'N/A';
    
    // Calculer et afficher le prix
    const discount = product.discount || 0;
    const finalPrice = discount > 0 ? 
        product.price * (1 - discount/100) : 
        product.price;
    
    currentPrice = finalPrice;
    
    document.getElementById('current-price').textContent = formatPrice(finalPrice);
    
    if (discount > 0) {
        document.getElementById('old-price').textContent = formatPrice(product.price);
        document.getElementById('discount-percent').textContent = `-${discount}%`;
        document.getElementById('discount-badge').textContent = `-${discount}%`;
        document.getElementById('discount-badge').style.display = 'inline';
    } else {
        document.getElementById('old-price').style.display = 'none';
        document.getElementById('discount-percent').style.display = 'none';
        document.getElementById('discount-badge').style.display = 'none';
    }
    
    // Gestion du stock
    const stock = product.stock || 0;
    const stockElement = document.getElementById('product-stock');
    const remainingStockElement = document.getElementById('remaining-stock');
    
    if (stock > 10) {
        stockElement.textContent = `En stock (${stock} unités)`;
        stockElement.parentElement.style.color = '#2ed573';
        remainingStockElement.textContent = `Il reste ${stock} produits en stock`;
    } else if (stock > 0) {
        stockElement.textContent = `Stock limité (${stock} unités)`;
        stockElement.parentElement.style.color = '#ffa502';
        remainingStockElement.textContent = `Plus que ${stock} produits en stock`;
    } else {
        stockElement.textContent = 'Rupture de stock';
        stockElement.parentElement.style.color = '#ff4757';
        remainingStockElement.textContent = 'Produit temporairement indisponible';
        
        // Désactiver le bouton d'ajout au panier
        const addToCartBtn = document.getElementById('add-to-cart');
        if (addToCartBtn) {
            addToCartBtn.disabled = true;
            addToCartBtn.textContent = 'Indisponible';
        }
    }
    
    // Mettre à jour les étoiles de notation
    updateRatingStars(product.rating);
    
    // Remplir les spécifications techniques
    if (product.specs) {
        fillSpecifications(product.specs);
    }
    
    // Remplir la description détaillée
    fillDetailedDescription(product);
}

// Mettre à jour les images du produit
function updateProductImages(product) {
    productImages = [
        product.image,
        '/images/products/iphone15-pro-2.jpg',
        '/images/products/iphone15-pro-3.jpg',
        '/images/products/iphone15-pro-4.jpg'
    ];
    
    const mainImage = document.getElementById('main-image');
    const mainImageLink = document.getElementById('main-image-link');
    const thumbnailsContainer = document.getElementById('product-thumbnails');
    
    if (mainImage && productImages.length > 0) {
        mainImage.src = productImages[0];
        mainImage.alt = product.name;
        mainImageLink.href = productImages[0];
    }
    
    if (thumbnailsContainer) {
        thumbnailsContainer.innerHTML = '';
        
        productImages.forEach((img, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
            thumbnail.innerHTML = `<img src="${img}" alt="${product.name} vue ${index + 1}">`;
            
            thumbnail.addEventListener('click', () => {
                // Mettre à jour la miniature active
                document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                thumbnail.classList.add('active');
                
                // Mettre à jour l'image principale
                mainImage.src = img;
                mainImageLink.href = img;
            });
            
            thumbnailsContainer.appendChild(thumbnail);
        });
    }
}

// Mettre à jour les étoiles de notation
function updateRatingStars(rating) {
    const starsContainer = document.querySelector('.product-rating .stars');
    if (!starsContainer) return;
    
    starsContainer.innerHTML = '';
    
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('i');
        
        if (i <= Math.floor(rating)) {
            star.className = 'fas fa-star';
        } else if (i === Math.ceil(rating) && !Number.isInteger(rating)) {
            star.className = 'fas fa-star-half-alt';
        } else {
            star.className = 'far fa-star';
        }
        
        starsContainer.appendChild(star);
    }
}

// Remplir les spécifications techniques
function fillSpecifications(specs) {
    // Cette fonction pourrait être étendue pour remplir dynamiquement
    // le tableau des spécifications depuis l'objet specs
}

// Remplir la description détaillée
function fillDetailedDescription(product) {
    // Cette fonction pourrait être étendue pour remplir dynamiquement
    // la description détaillée depuis les données du produit
}

// ============================================
// GESTION DES VARIANTES
// ============================================

// Initialiser la page produit
function initProductPage() {
    // Initialiser les variantes par défaut
    selectedColor = document.querySelector('.color-option.active')?.dataset.color || null;
    selectedStorage = document.querySelector('.storage-option.active')?.dataset.storage || null;
    
    // Écouter les changements de variantes
    setupVariantListeners();
    
    // Écouter les actions du produit
    setupProductActions();
}

// Configurer les écouteurs pour les variantes
function setupVariantListeners() {
    // Couleurs
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            selectedColor = this.dataset.color;
            updateProductVariant(this.dataset.sku);
        });
    });
    
    // Stockage
    const storageOptions = document.querySelectorAll('.storage-option');
    storageOptions.forEach(option => {
        option.addEventListener('click', function() {
            selectedStorage = this.dataset.storage;
            const newPrice = parseFloat(this.dataset.price);
            updateProductPrice(newPrice);
        });
    });
}

// Mettre à jour le prix du produit
function updateProductPrice(newPrice) {
    currentPrice = newPrice;
    document.getElementById('current-price').textContent = formatPrice(newPrice);
    
    // Recalculer l'ancien prix si promotion
    if (currentProduct && currentProduct.discount) {
        const originalPrice = newPrice / (1 - currentProduct.discount/100);
        document.getElementById('old-price').textContent = formatPrice(originalPrice);
    }
}

// Mettre à jour la variante du produit
function updateProductVariant(sku) {
    document.getElementById('product-sku').textContent = sku;
    
    // Ici, tu pourrais charger des images différentes selon la couleur
    if (selectedColor && productImages.length > 1) {
        // Simuler le changement d'image pour la couleur sélectionnée
        const colorImages = {
            'Titane Naturel': productImages[0],
            'Titane Bleu': '/images/products/iphone15-pro-blue.jpg',
            'Titane Blanc': '/images/products/iphone15-pro-white.jpg',
            'Titane Noir': '/images/products/iphone15-pro-black.jpg'
        };
        
        const mainImage = document.getElementById('main-image');
        const mainImageLink = document.getElementById('main-image-link');
        
        if (colorImages[selectedColor] && mainImage) {
            mainImage.src = colorImages[selectedColor];
            mainImageLink.href = colorImages[selectedColor];
            
            // Mettre à jour la première miniature
            const firstThumbnail = document.querySelector('.thumbnail:first-child img');
            if (firstThumbnail) {
                firstThumbnail.src = colorImages[selectedColor];
            }
        }
    }
}

// ============================================
// ACTIONS DU PRODUIT
// ============================================

// Configurer les actions du produit
function setupProductActions() {
    // Ajouter au panier
    const addToCartBtn = document.getElementById('add-to-cart');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', addToCartFromDetail);
    }
    
    // Ajouter aux favoris
    const addToWishlistBtn = document.getElementById('add-to-wishlist');
    if (addToWishlistBtn) {
        addToWishlistBtn.addEventListener('click', addToWishlistFromDetail);
    }
    
    // Ajouter à la comparaison
    const addToCompareBtn = document.getElementById('add-to-compare');
    if (addToCompareBtn) {
        addToCompareBtn.addEventListener('click', addToCompareFromDetail);
    }
}

// Ajouter au panier depuis la page détail
function addToCartFromDetail() {
    if (!currentProduct) return;
    
    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    
    // Créer un nom de produit avec les variantes
    let productName = currentProduct.name;
    if (selectedColor) {
        productName += ` - ${selectedColor}`;
    }
    if (selectedStorage) {
        productName += ` - ${selectedStorage} Go`;
    }
    
    // Ajouter au panier
    if (window.addToCart) {
        window.addToCart(
            currentProduct.id,
            productName,
            currentPrice,
            currentProduct.image,
            quantity
        );
    }
    
    // Animation de confirmation
    const btn = document.getElementById('add-to-cart');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<i class="fas fa-check"></i> Ajouté !';
    btn.style.backgroundColor = '#2ed573';
    
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.backgroundColor = '';
    }, 2000);
}

// Ajouter aux favoris depuis la page détail
function addToWishlistFromDetail() {
    if (!currentProduct) return;
    
    if (window.toggleWishlist) {
        window.toggleWishlist(currentProduct.id);
    }
    
    // Animation de confirmation
    const btn = document.getElementById('add-to-wishlist');
    const icon = btn.querySelector('i');
    
    if (icon.classList.contains('far')) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        icon.style.color = '#ff4757';
        
        btn.innerHTML = '<i class="fas fa-heart"></i> Favori';
    } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
        icon.style.color = '';
        
        btn.innerHTML = '<i class="far fa-heart"></i> Favoris';
    }
}

// Ajouter à la comparaison depuis la page détail
function addToCompareFromDetail() {
    if (!currentProduct) return;
    
    if (window.addToCompare) {
        window.addToCompare(currentProduct.id);
    }
    
    // Animation de confirmation
    const btn = document.getElementById('add-to-compare');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<i class="fas fa-check"></i> Ajouté !';
    
    setTimeout(() => {
        btn.innerHTML = originalText;
    }, 2000);
}

// ============================================
// PRODUITS ASSOCIÉS
// ============================================

// Charger les produits similaires
async function loadRelatedProducts() {
    const container = document.getElementById('related-products');
    if (!container || !currentProduct) return;
    
    try {
        const response = await fetch('/data/products.json');
        const data = await response.json();
        
        // Filtrer les produits de la même catégorie (sauf le produit actuel)
        const relatedProducts = data.products
            .filter(p => p.category === currentProduct.category && p.id !== currentProduct.id)
            .slice(0, 4);
        
        // Afficher les produits
        container.innerHTML = '';
        relatedProducts.forEach(product => {
            const productCard = createProductCard(product);
            container.appendChild(productCard);
        });
        
    } catch (error) {
        console.error('Erreur chargement produits similaires:', error);
        container.innerHTML = '<p class="no-products">Aucun produit similaire disponible.</p>';
    }
}

// Créer une carte produit pour les produits associés
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const finalPrice = product.discount ? 
        product.price * (1 - product.discount/100) : 
        product.price;
    
    card.innerHTML = `
        <div class="product-image">
            <img src="${product.image}" alt="${product.name}" loading="lazy">
            ${product.discount ? `<span class="discount-badge">-${product.discount}%</span>` : ''}
            <button class="quick-view" onclick="window.location.href='product-detail.html?id=${product.id}'">
                <i class="fas fa-eye"></i>
            </button>
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
            <button class="add-to-cart-btn" onclick="addToCartFromCard(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${finalPrice}, '${product.image}')">
                <i class="fas fa-shopping-cart"></i>
                Ajouter au panier
            </button>
        </div>
    `;
    
    return card;
}

// Générer les étoiles pour les avis
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

// Fonction helper pour ajouter au panier depuis les cartes produits
function addToCartFromCard(productId, productName, productPrice, productImage) {
    if (window.addToCart) {
        window.addToCart(productId, productName, productPrice, productImage);
    }
}

// ============================================
## PRODUITS RÉCEMMENT CONSULTÉS
// ============================================

// Ajouter aux produits récemment consultés
function addToRecentlyViewed(product) {
    let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed')) || [];
    
    // Retirer le produit s'il est déjà dans la liste
    recentlyViewed = recentlyViewed.filter(p => p.id !== product.id);
    
    // Ajouter au début de la liste
    recentlyViewed.unshift({
        id: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        category: product.category
    });
    
    // Garder seulement les 10 derniers produits
    if (recentlyViewed.length > 10) {
        recentlyViewed = recentlyViewed.slice(0, 10);
    }
    
    // Sauvegarder
    localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
    
    // Mettre à jour l'affichage
    loadRecentlyViewed();
}

// Charger les produits récemment consultés
function loadRecentlyViewed() {
    const container = document.getElementById('recently-viewed-products');
    if (!container) return;
    
    const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed')) || [];
    
    // Filtrer le produit actuel
    const filteredProducts = recentlyViewed.filter(p => 
        !currentProduct || p.id !== currentProduct.id
    ).slice(0, 4);
    
    if (filteredProducts.length === 0) {
        container.innerHTML = '<p class="no-products">Aucun produit récemment consulté.</p>';
        return;
    }
    
    container.innerHTML = '';
    filteredProducts.forEach(product => {
        const productCard = createProductCard(product);
        container.appendChild(productCard);
    });
}

// ============================================
## GESTION DES AVIS
// ============================================

// Soumettre un avis
function submitReview(event) {
    event.preventDefault();
    
    const rating = parseInt(document.getElementById('review-rating').value);
    const title = document.getElementById('review-title').value.trim();
    const text = document.getElementById('review-text').value.trim();
    const name = document.getElementById('review-name').value.trim();
    const email = document.getElementById('review-email').value.trim();
    
    // Validation
    if (rating === 0) {
        showNotification('Veuillez donner une note', 'error');
        return;
    }
    
    if (!title || !text || !name || !email) {
        showNotification('Veuillez remplir tous les champs', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showNotification('Email invalide', 'error');
        return;
    }
    
    // Sauvegarder l'avis (dans localStorage pour la démo)
    const review = {
        id: Date.now(),
        productId: currentProduct?.id || 1,
        rating: rating,
        title: title,
        text: text,
        name: name,
        email: email,
        date: new Date().toISOString(),
        helpful: { yes: 0, no: 0 }
    };
    
    let reviews = JSON.parse(localStorage.getItem('productReviews')) || [];
    reviews.push(review);
    localStorage.setItem('productReviews', JSON.stringify(reviews));
    
    // Réinitialiser le formulaire
    document.getElementById('submit-review-form').reset();
    document.getElementById('review-rating').value = 0;
    document.querySelectorAll('.rating-input i').forEach(star => {
        star.classList.remove('fas');
        star.classList.add('far');
    });
    
    // Cacher le formulaire
    document.getElementById('review-form').style.display = 'none';
    
    // Afficher une notification
    showNotification('Merci pour votre avis ! Il sera publié après modération.', 'success');
    
    // Recharger les avis
    loadProductReviews();
}

// Charger les avis du produit
function loadProductReviews() {
    if (!currentProduct) return;
    
    const reviews = JSON.parse(localStorage.getItem('productReviews')) || [];
    const productReviews = reviews.filter(r => r.productId === currentProduct.id);
    
    // Mettre à jour le nombre d'avis
    const reviewsCountElement = document.querySelector('.tab-btn[data-tab="reviews"]');
    if (reviewsCountElement) {
        const totalReviews = currentProduct.reviewCount + productReviews.length;
        reviewsCountElement.textContent = `Avis (${totalReviews})`;
    }
    
    // Ici, tu pourrais mettre à jour la liste des avis affichés
}

// Valider l'email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ============================================
## FONCTIONS UTILITAIRES
// ============================================

// Formater le prix
function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(price);
}

// Afficher une notification
function showNotification(message, type = 'success') {
    if (window.showNotification) {
        window.showNotification(message, type);
        return;
    }
    
    // Fallback simple
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#2ed573' : '#ff4757'};
        color: white;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ============================================
## ÉCOUTEURS D'ÉVÉNEMENTS
// ============================================

// Soumission du formulaire d'avis
document.addEventListener('DOMContentLoaded', function() {
    const reviewForm = document.getElementById('submit-review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', submitReview);
    }
    
    // Gestion des boutons "avis utile"
    document.addEventListener('click', function(e) {
        if (e.target.closest('.helpful-btn')) {
            const btn = e.target.closest('.helpful-btn');
            const reviewId = btn.closest('.review')?.id;
            const isHelpful = btn.querySelector('.fa-thumbs-up') ? 'yes' : 'no';
            
            if (reviewId) {
                voteHelpful(reviewId, isHelpful, btn);
            }
        }
    });
});

// Voter pour un avis
function voteHelpful(reviewId, voteType, button) {
    // Empêcher les votes multiples (simplifié pour la démo)
    const hasVoted = localStorage.getItem(`voted_${reviewId}`);
    
    if (hasVoted) {
        showNotification('Vous avez déjà voté pour cet avis', 'info');
        return;
    }
    
    // Mettre à jour le compteur visuel
    const countSpan = button.querySelector('span') || button.nextSibling;
    if (countSpan) {
        const currentCount = parseInt(countSpan.textContent.match(/\d+/)?.[0]) || 0;
        countSpan.textContent = countSpan.textContent.replace(/\d+/, currentCount + 1);
    }
    
    // Marquer comme voté
    localStorage.setItem(`voted_${reviewId}`, 'true');
    
    // Changer le style du bouton
    button.style.backgroundColor = '#2ed573';
    button.style.color = 'white';
    
    showNotification('Merci pour votre vote !', 'success');
}

// ============================================
## EXPORT DES FONCTIONS
// ============================================

// Rendre les fonctions accessibles globalement
window.initProductPage = initProductPage;
window.updateProductPrice = updateProductPrice;
window.updateProductVariant = updateProductVariant;
window.addToCartFromCard = addToCartFromCard;
