// ============================================
// CHECKOUT.JS
// ============================================
// Gestion de la page de paiement

// Variables globales
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let appliedCoupon = JSON.parse(localStorage.getItem('appliedCoupon')) || null;
let shippingCost = 0;

// ============================================
// INITIALISATION
// ============================================

// Initialiser la page checkout
function initCheckoutPage() {
    // Vérifier si le panier est vide
    if (cart.length === 0) {
        window.location.href = 'cart.html';
        return;
    }
    
    // Charger les informations
    loadOrderItems();
    updateOrderSummary();
    populateFormFromStorage();
    setupFormValidation();
    
    // Mettre à jour le compteur du panier
    if (window.updateCart) {
        window.updateCart();
    }
}

// ============================================
// AFFICHAGE DES ARTICLES
// ============================================

// Charger les articles de la commande
function loadOrderItems() {
    const container = document.getElementById('order-items');
    if (!container) return;
    
    container.innerHTML = '';
    
    cart.forEach(item => {
        const itemElement = createOrderItemElement(item);
        container.appendChild(itemElement);
    });
}

// Créer un élément d'article de commande
function createOrderItemElement(item) {
    const element = document.createElement('div');
    element.className = 'order-item';
    
    element.innerHTML = `
        <div class="order-item-image">
            <img src="${item.image}" alt="${item.name}">
        </div>
        <div class="order-item-details">
            <h4 class="order-item-title">${item.name}</h4>
            <div class="order-item-meta">
                <span class="order-item-quantity">Quantité : ${item.quantity}</span>
                <span class="order-item-price">${formatPrice(item.price)}</span>
            </div>
        </div>
        <div class="order-item-total">
            ${formatPrice(item.price * item.quantity)}
        </div>
    `;
    
    return element;
}

// ============================================
// CALCULS ET RÉCAPITULATIF
// ============================================

// Mettre à jour le récapitulatif
function updateOrderSummary() {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount(subtotal);
    shippingCost = calculateShippingCost();
    const total = subtotal - discount + shippingCost;
    
    // Mettre à jour les affichages
    document.getElementById('order-subtotal').textContent = formatPrice(subtotal);
    document.getElementById('order-discount').textContent = formatPrice(-discount);
    document.getElementById('order-shipping').textContent = shippingCost === 0 ? 'Gratuit' : formatPrice(shippingCost);
    document.getElementById('order-total').textContent = formatPrice(total);
    
    // Mettre à jour l'affichage du coupon
    updateCouponDisplay();
    
    // Mettre à jour la modal de confirmation
    updateConfirmationModal(total);
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
            discount = Math.min(50, subtotal);
            break;
        case 'SUMMER25':
            discount = subtotal * 0.25;
            break;
        default:
            discount = subtotal * 0.10;
    }
    
    return discount;
}

// Calculer les frais de livraison
function calculateShippingCost() {
    const selectedShipping = document.querySelector('input[name="shipping"]:checked');
    
    if (!selectedShipping) return 0;
    
    switch (selectedShipping.id) {
        case 'shipping-standard':
            // Livraison gratuite à partir de 50€
            const subtotal = calculateSubtotal();
            return subtotal >= 50 ? 0 : 4.99;
            
        case 'shipping-express':
            return 9.99;
            
        case 'shipping-pickup':
            return 0;
            
        default:
            return 0;
    }
}

// Mettre à jour l'affichage du coupon
function updateCouponDisplay() {
    const couponContainer = document.getElementById('applied-coupon');
    const couponCodeDisplay = document.getElementById('coupon-code-display');
    
    if (appliedCoupon) {
        couponContainer.style.display = 'block';
        couponCodeDisplay.textContent = appliedCoupon.code;
    } else {
        couponContainer.style.display = 'none';
    }
}

// Mettre à jour la modal de confirmation
function updateConfirmationModal(total) {
    const email = document.getElementById('email')?.value || 'client@example.com';
    document.getElementById('confirmation-email').textContent = email;
    document.getElementById('confirmation-total').textContent = formatPrice(total);
}

// ============================================
// GESTION DES COUPONS
// ============================================

// Appliquer un coupon
function applyCheckoutCoupon(code) {
    const subtotal = calculateSubtotal();
    
    // Liste des coupons valides
    const validCoupons = {
        'WELCOME10': { type: 'percentage', value: 10, minAmount: 0 },
        'FREE50': { type: 'fixed', value: 50, minAmount: 100 },
        'SUMMER25': { type: 'percentage', value: 25, minAmount: 50 }
    };
    
    const coupon = validCoupons[code];
    
    if (!coupon) {
        showNotification('Code promo invalide', 'error');
        return;
    }
    
    if (subtotal < coupon.minAmount) {
        showNotification(`Minimum ${coupon.minAmount}€ requis pour ce code`, 'error');
        return;
    }
    
    appliedCoupon = {
        code: code,
        type: coupon.type,
        value: coupon.value
    };
    
    localStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon));
    updateOrderSummary();
    showNotification(`Coupon "${code}" appliqué !`, 'success');
}

// Retirer le coupon
function removeCheckoutCoupon() {
    appliedCoupon = null;
    localStorage.removeItem('appliedCoupon');
    updateOrderSummary();
    showNotification('Coupon retiré', 'info');
}

// ============================================
// GESTION DU FORMULAIRE
// ============================================

// Remplir le formulaire depuis le stockage local
function populateFormFromStorage() {
    const savedData = JSON.parse(localStorage.getItem('checkoutData')) || {};
    
    // Informations de contact
    if (savedData.email) document.getElementById('email').value = savedData.email;
    if (savedData.phone) document.getElementById('phone').value = savedData.phone;
    
    // Adresse de livraison
    if (savedData.firstName) document.getElementById('first-name').value = savedData.firstName;
    if (savedData.lastName) document.getElementById('last-name').value = savedData.lastName;
    if (savedData.address) document.getElementById('address').value = savedData.address;
    if (savedData.address2) document.getElementById('address2').value = savedData.address2;
    if (savedData.city) document.getElementById('city').value = savedData.city;
    if (savedData.zip) document.getElementById('zip').value = savedData.zip;
    if (savedData.country) document.getElementById('country').value = savedData.country;
    
    // Méthode de livraison
    if (savedData.shippingMethod) {
        const shippingRadio = document.getElementById(savedData.shippingMethod);
        if (shippingRadio) shippingRadio.checked = true;
    }
    
    // Méthode de paiement
    if (savedData.paymentMethod) {
        const paymentRadio = document.getElementById(savedData.paymentMethod);
        if (paymentRadio) paymentRadio.checked = true;
    }
    
    // Recalculer les frais de livraison
    updateOrderSummary();
}

// Copier l'adresse de livraison vers l'adresse de facturation
function copyShippingToBilling() {
    document.getElementById('billing-first-name').value = document.getElementById('first-name').value;
    document.getElementById('billing-last-name').value = document.getElementById('last-name').value;
    document.getElementById('billing-address').value = document.getElementById('address').value;
    document.getElementById('billing-city').value = document.getElementById('city').value;
    document.getElementById('billing-zip').value = document.getElementById('zip').value;
    document.getElementById('billing-country').value = document.getElementById('country').value;
}

// Sauvegarder les données du formulaire
function saveFormData() {
    const formData = {
        // Informations de contact
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        
        // Adresse de livraison
        firstName: document.getElementById('first-name').value,
        lastName: document.getElementById('last-name').value,
        address: document.getElementById('address').value,
        address2: document.getElementById('address2').value,
        city: document.getElementById('city').value,
        zip: document.getElementById('zip').value,
        country: document.getElementById('country').value,
        
        // Méthodes
        shippingMethod: document.querySelector('input[name="shipping"]:checked')?.id,
        paymentMethod: document.querySelector('input[name="payment"]:checked')?.id
    };
    
    localStorage.setItem('checkoutData', JSON.stringify(formData));
}

// ============================================
// VALIDATION DU FORMULAIRE
// ============================================

// Configurer la validation
function setupFormValidation() {
    // Sauvegarder automatiquement les changements
    const formInputs = document.querySelectorAll('#checkout-form-container input, #checkout-form-container select, #checkout-form-container textarea');
    formInputs.forEach(input => {
        input.addEventListener('change', saveFormData);
        input.addEventListener('blur', saveFormData);
    });
}

// Valider le formulaire complet
function validateForm() {
    let isValid = true;
    const errors = [];
    
    // Informations de contact
    if (!validateEmail(document.getElementById('email').value)) {
        errors.push('Email invalide');
        isValid = false;
    }
    
    if (!validatePhone(document.getElementById('phone').value)) {
        errors.push('Téléphone invalide');
        isValid = false;
    }
    
    // Adresse de livraison
    const requiredFields = [
        { id: 'first-name', label: 'Prénom' },
        { id: 'last-name', label: 'Nom' },
        { id: 'address', label: 'Adresse' },
        { id: 'city', label: 'Ville' },
        { id: 'zip', label: 'Code postal' },
        { id: 'country', label: 'Pays' }
    ];
    
    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (!element.value.trim()) {
            errors.push(`${field.label} est requis`);
            isValid = false;
            
            // Ajouter une classe d'erreur
            element.classList.add('error');
        } else {
            element.classList.remove('error');
        }
    });
    
    // Adresse de facturation (si différente)
    if (!document.getElementById('same-as-shipping').checked) {
        const billingRequired = [
            { id: 'billing-first-name', label: 'Prénom (facturation)' },
            { id: 'billing-last-name', label: 'Nom (facturation)' },
            { id: 'billing-address', label: 'Adresse (facturation)' },
            { id: 'billing-city', label: 'Ville (facturation)' },
            { id: 'billing-zip', label: 'Code postal (facturation)' },
            { id: 'billing-country', label: 'Pays (facturation)' }
        ];
        
        billingRequired.forEach(field => {
            const element = document.getElementById(field.id);
            if (!element.value.trim()) {
                errors.push(`${field.label} est requis`);
                isValid = false;
                element.classList.add('error');
            } else {
                element.classList.remove('error');
            }
        });
    }
    
    // Validation carte de crédit (si sélectionnée)
    if (document.getElementById('payment-card').checked) {
        const cardErrors = validateCreditCard();
        if (cardErrors.length > 0) {
            errors.push(...cardErrors);
            isValid = false;
        }
    }
    
    // Conditions générales
    if (!document.getElementById('terms').checked) {
        errors.push('Vous devez accepter les conditions générales');
        isValid = false;
    }
    
    // Afficher les erreurs
    if (errors.length > 0) {
        showErrorMessages(errors);
    }
    
    return isValid;
}

// Valider l'email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Valider le téléphone
function validatePhone(phone) {
    const re = /^[\+]?[0-9\s\-\.\(\)]{10,}$/;
    return re.test(phone);
}

// Valider la carte de crédit
function validateCreditCard() {
    const errors = [];
    
    const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
    const cardName = document.getElementById('card-name').value;
    const cardExpiry = document.getElementById('card-expiry').value;
    const cardCvc = document.getElementById('card-cvc').value;
    
    // Numéro de carte (Luhn algorithm simplifié)
    if (!cardNumber || cardNumber.length < 13) {
        errors.push('Numéro de carte invalide');
    }
    
    // Nom sur la carte
    if (!cardName.trim()) {
        errors.push('Nom sur la carte requis');
    }
    
    // Date d'expiration
    if (!validateExpiryDate(cardExpiry)) {
        errors.push('Date d\'expiration invalide');
    }
    
    // CVC
    if (!cardCvc || cardCvc.length < 3) {
        errors.push('CVC invalide');
    }
    
    return errors;
}

// Valider la date d'expiration
function validateExpiryDate(expiry) {
    if (!expiry || !expiry.includes('/')) return false;
    
    const [month, year] = expiry.split('/').map(Number);
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    
    if (month < 1 || month > 12) return false;
    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;
    
    return true;
}

// Afficher les messages d'erreur
function showErrorMessages(errors) {
    // Créer un message d'erreur
    let errorHtml = '<div class="error-messages">';
    errorHtml += '<h4>Veuillez corriger les erreurs suivantes :</h4>';
    errorHtml += '<ul>';
    errors.forEach(error => {
        errorHtml += `<li>${error}</li>`;
    });
    errorHtml += '</ul></div>';
    
    // Afficher en haut de la page
    const errorContainer = document.createElement('div');
    errorContainer.className = 'checkout-errors';
    errorContainer.innerHTML = errorHtml;
    
    // Ajouter un bouton fermer
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-errors';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = () => errorContainer.remove();
    errorContainer.appendChild(closeBtn);
    
    // Insérer au début du contenu
    const checkoutContent = document.querySelector('.checkout-content');
    if (checkoutContent) {
        checkoutContent.insertBefore(errorContainer, checkoutContent.firstChild);
    }
    
    // Défiler vers le haut
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// TRAITEMENT DE LA COMMANDE
// ============================================

// Valider et passer la commande
function validateAndPlaceOrder() {
    // Valider le formulaire
    if (!validateForm()) {
        return;
    }
    
    // Vérifier que le panier n'est pas vide
    if (cart.length === 0) {
        showNotification('Votre panier est vide', 'error');
        return;
    }
    
    // Afficher l'indicateur de chargement
    const placeOrderBtn = document.getElementById('place-order');
    const originalText = placeOrderBtn.innerHTML;
    placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement en cours...';
    placeOrderBtn.disabled = true;
    
    // Simuler un traitement asynchrone
    setTimeout(() => {
        processOrder();
        
        // Restaurer le bouton
        placeOrderBtn.innerHTML = originalText;
        placeOrderBtn.disabled = false;
    }, 2000);
}

// Traiter la commande
function processOrder() {
    // Récupérer les données du formulaire
    const formData = {
        contact: {
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value
        },
        shipping: {
            firstName: document.getElementById('first-name').value,
            lastName: document.getElementById('last-name').value,
            address: document.getElementById('address').value,
            address2: document.getElementById('address2').value,
            city: document.getElementById('city').value,
            zip: document.getElementById('zip').value,
            country: document.getElementById('country').value
        },
        billing: document.getElementById('same-as-shipping').checked ? null : {
            firstName: document.getElementById('billing-first-name').value,
            lastName: document.getElementById('billing-last-name').value,
            address: document.getElementById('billing-address').value,
            city: document.getElementById('billing-city').value,
            zip: document.getElementById('billing-zip').value,
            country: document.getElementById('billing-country').value
        },
        shippingMethod: document.querySelector('input[name="shipping"]:checked')?.id,
        paymentMethod: document.querySelector('input[name="payment"]:checked')?.id,
        notes: document.getElementById('order-notes').value,
        subscribeNewsletter: document.getElementById('newsletter').checked
    };
    
    // Créer l'objet commande
    const order = {
        id: 'ESHOP-' + Date.now(),
        number: 'ESHOP-' + Math.floor(Math.random() * 100000),
        date: new Date().toISOString(),
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity
        })),
        totals: {
            subtotal: calculateSubtotal(),
            discount: calculateDiscount(calculateSubtotal()),
            shipping: shippingCost,
            total: calculateSubtotal() - calculateDiscount(calculateSubtotal()) + shippingCost
        },
        customer: formData,
        status: 'pending',
        paymentStatus: 'pending'
    };
    
    // Sauvegarder la commande
    saveOrder(order);
    
    // Vider le panier
    clearCartAfterOrder();
    
    // Afficher la confirmation
    showConfirmationModal(order);
}

// Sauvegarder la commande
function saveOrder(order) {
    // Récupérer les commandes existantes
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    
    // Ajouter la nouvelle commande
    orders.push(order);
    
    // Sauvegarder
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Sauvegarder aussi la dernière commande pour un accès rapide
    localStorage.setItem('lastOrder', JSON.stringify(order));
}

// Vider le panier après commande
function clearCartAfterOrder() {
    cart = [];
    localStorage.removeItem('cart');
    localStorage.removeItem('appliedCoupon');
    
    if (window.updateCart) {
        window.updateCart();
    }
}

// Afficher la modal de confirmation
function showConfirmationModal(order) {
    const modal = document.getElementById('confirmation-modal');
    if (!modal) return;
    
    // Mettre à jour les informations
    document.getElementById('confirmation-total').textContent = formatPrice(order.totals.total);
    
    // Afficher la modal
    modal.style.display = 'block';
    
    // Sauvegarder la commande pour la page de remerciement
    sessionStorage.setItem('currentOrder', JSON.stringify(order));
    
    // Rediriger après 30 secondes si l'utilisateur ne ferme pas
    setTimeout(() => {
        if (modal.style.display === 'block') {
            window.location.href = 'order-confirmation.html?id=' + order.id;
        }
    }, 30000);
}

// ============================================
// FONCTIONS UTILITAIRES
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
    
    alert(message);
}

// ============================================
// ÉCOUTEURS D'ÉVÉNEMENTS
// ============================================

// Mettre à jour le récapitulatif quand la livraison change
document.addEventListener('change', function(e) {
    if (e.target.name === 'shipping') {
        updateOrderSummary();
    }
});

// ============================================
// EXPORT DES FONCTIONS
// ============================================

// Rendre les fonctions accessibles globalement
window.initCheckoutPage = initCheckoutPage;
window.copyShippingToBilling = copyShippingToBilling;
window.applyCheckoutCoupon = applyCheckoutCoupon;
window.removeCheckoutCoupon = removeCheckoutCoupon;
window.validateAndPlaceOrder = validateAndPlaceOrder;
