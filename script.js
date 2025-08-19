// Données des produits (chargées depuis products.json)
let produits = [];

// Gestion du panier
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Chargement initial
document.addEventListener('DOMContentLoaded', async () => {
    // Charger les produits depuis le fichier JSON
    try {
        const response = await fetch('products.json');
        produits = await response.json();
        
        displayProducts(produits, 'products-grid');
        displayProducts(produits.slice(0, 4), 'new-products-grid');
        updateCartCount();
        setupEventListeners();
    } catch (error) {
        console.error('Erreur de chargement des produits:', error);
    }
});

// Affichage des produits
function displayProducts(products, containerId) {
    const productsGrid = document.getElementById(containerId);
    if (!productsGrid) return;
    
    productsGrid.innerHTML = '';

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        const badge = product.id <= 3 ? `<div class="product-badge">Nouveau</div>` : '';
        
        productCard.innerHTML = `
            ${badge}
            <img src="${product.images[0]}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3>${product.name}</h3>
                <div class="product-price">
                    <span class="current-price">${product.price.toFixed(2)} €</span>
                </div>
                <p class="description">${product.description}</p>
                <button class="add-to-cart" data-id="${product.id}">
                    <i class="fas fa-shopping-cart"></i> Ajouter
                </button>
            </div>
        `;
        productsGrid.appendChild(productCard);
    });
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Ajout au panier
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-to-cart') || 
            e.target.closest('.add-to-cart')) {
            
            const button = e.target.closest('.add-to-cart');
            const productId = parseInt(button.getAttribute('data-id'));
            
            addToCart(productId);
        }
    });

    // Recherche de produits
    const searchButton = document.querySelector('.search-bar button');
    const searchInput = document.querySelector('.search-bar input');
    
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            const searchTerm = searchInput.value.toLowerCase();
            alert(`Recherche pour: ${searchTerm}\nCette fonctionnalité sera implémentée prochainement!`);
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = searchInput.value.toLowerCase();
                alert(`Recherche pour: ${searchTerm}\nCette fonctionnalité sera implémentée prochainement!`);
            }
        });
    }
}

// Ajouter un produit au panier
function addToCart(productId) {
    const product = produits.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.images[0],
            quantity: 1
        });
    }
    
    saveCart();
    updateCartCount();
    
    // Animation de confirmation
    const button = document.querySelector(`.add-to-cart[data-id="${productId}"]`);
    if (button) {
        button.innerHTML = '<i class="fas fa-check"></i> Ajouté';
        button.style.background = '#2ed573';
        button.style.color = '#000';
        setTimeout(() => {
            button.innerHTML = '<i class="fas fa-shopping-cart"></i> Ajouter';
            button.style.background = '';
            button.style.color = '';
        }, 2000);
    }
}

// Enregistrer le panier dans localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}
ScriptPro
// Mise à jour du compteur de panier
function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = count;
    }
}