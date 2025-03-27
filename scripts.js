// Variables globales
let tousLesProduits = [];
let produitActuel = null;

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser EmailJS
    emailjs.init("s34yGCgjKesaY6sk_"); // Remplacez par votre User ID
    
    // Charger les produits
    chargerProduits();
    
    // Configurer les événements
    document.getElementById('search-form').addEventListener('submit', function(e) {
        e.preventDefault();
        filtrerProduits();
    });
    
    // Vérifier si un produit est partagé via l'URL
    checkSharedProduct();
});

// Charger les produits depuis le JSON
async function chargerProduits() {
    try {
        const response = await fetch('produits.json');
        if (!response.ok) throw new Error('Erreur de réseau');
        
        tousLesProduits = await response.json();
        
        // Ajouter des IDs uniques si non existants
        tousLesProduits = tousLesProduits.map((produit, index) => {
            return {
                ...produit,
                id: produit.id || `prod_${index}`
            };
        });
        
        afficherProduits(tousLesProduits);
    } catch (error) {
        console.error("Erreur de chargement:", error);
        document.getElementById('produits-list').innerHTML = `
            <div class="error">
                Impossible de charger les produits. Rechargez la page.
                <button onclick="location.reload()">Actualiser</button>
            </div>
        `;
    }
}

// Afficher les produits dans la grille
function afficherProduits(produits) {
    const container = document.getElementById('produits-list');
    
    if (!produits || produits.length === 0) {
        container.innerHTML = '<div class="no-results">Aucun produit trouvé</div>';
        return;
    }

    container.innerHTML = produits.map(produit => `
        <div class="produit" data-id="${produit.id}">
            <img src="${escapeHtml(produit.image)}" 
                 alt="${escapeHtml(produit.nom)}"
                 onclick="openProductModal('${produit.id}')">
            <h3>${escapeHtml(produit.nom)}</h3>
            <p>${escapeHtml(produit.prix)} $</p>
            <button class="ajouter-panier" 
                    onclick="ajouterAuPanier('${produit.id}')">
                Ajouter au panier
            </button>
        </div>
    `).join('');
}

// Ouvrir la modale du produit
function openProductModal(productId) {
    produitActuel = tousLesProduits.find(p => p.id === productId);
    if (!produitActuel) return;

    const modal = document.getElementById('product-modal');
    const modalImg = modal.querySelector('.modal-image');
    const modalTitle = modal.querySelector('#modal-title');
    const modalPrice = modal.querySelector('#modal-price');
    const modalDesc = modal.querySelector('#modal-description');
    const whatsappLink = modal.querySelector('#whatsapp-product-link');

    modalImg.src = produitActuel.image;
    modalImg.alt = produitActuel.nom;
    modalTitle.textContent = produitActuel.nom;
    modalPrice.textContent = `${produitActuel.prix} $`;
    modalDesc.textContent = produitActuel.description;
    
    // Lien WhatsApp avec message pré-rempli
    whatsappLink.href = `https://wa.me/18093978951?text=${encodeURIComponent(
        `Bonjour MarcShop! Je suis intéressé par le produit : ${produitActuel.nom} (${produitActuel.prix}$).\n\nLien : ${window.location.origin}${window.location.pathname}?produit=${produitActuel.id}`
    )}`;

    modal.style.display = 'block';
}

// Fermer la modale
function closeModal() {
    document.getElementById('product-modal').style.display = 'none';
}

// Ajouter un produit au panier + envoyer email
function ajouterAuPanier(productId) {
    const produit = tousLesProduits.find(p => p.id === productId);
    if (!produit) return;

    let panier = JSON.parse(localStorage.getItem('panier')) || [];
    panier.push(produit);
    localStorage.setItem('panier', JSON.stringify(panier));
    
    // Envoyer l'email de notification
    envoyerEmailNotification(produit);
    
    // Afficher la notification
    showNotification(`${produit.nom} ajouté au panier !`);
}

// Envoyer l'email avec le bon format
function envoyerEmailNotification(produit) {
    const lienProduit = `${window.location.origin}${window.location.pathname}?produit=${produit.id}`;
    
    const templateParams = {
        to_email: "marcshop0705@gmail.com", // Votre email
        subject: `[MarcShop] Nouvel ajout panier - ${produit.nom}`,
        produit_nom: produit.nom,
        produit_prix: produit.prix,
        produit_lien: lienProduit,
        produit_image: produit.image,
        date_ajout: new Date().toLocaleString('fr-FR')
    };

    emailjs.send("marc1304", "template_zvo5tzs", templateParams)
        .then(response => console.log("Email envoyé ! Status:", response.status))
        .catch(error => console.error("Erreur d'envoi:", error));
}

// Vérifier le produit partagé dans l'URL
function checkSharedProduct() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('produit');
    
    if (productId) {
        // Nettoyer l'URL
        history.replaceState(null, '', window.location.pathname);
        
        // Ouvrir la modale si le produit existe
        const produit = tousLesProduits.find(p => p.id === productId);
        if (produit) {
            openProductModal(productId);
        }
    }
}

// Filtrer les produits
function filtrerProduits() {
    const terme = document.getElementById('search-input').value.toLowerCase().trim();
    if (!terme) {
        afficherProduits(tousLesProduits);
        return;
    }

    const produitsFiltres = tousLesProduits.filter(produit => 
        produit.nom.toLowerCase().includes(terme) || 
        (produit.description && produit.description.toLowerCase().includes(terme))
    );
    
    afficherProduits(produitsFiltres);
}

// Afficher une notification temporaire
function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Échapper les caractères HTML (sécurité)
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Exposer les fonctions globales
window.openProductModal = openProductModal;
window.closeModal = closeModal;
window.ajouterAuPanier = ajouterAuPanier;
