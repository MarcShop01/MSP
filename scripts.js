// Variables globales
let tousLesProduits = [];
let produitActuel = null;
let lastScrollPosition = 0;

// Initialisation EmailJS
emailjs.init("s34yGCgjKesaY6sk_");

// Au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    chargerProduits();
    setupEventListeners();
    checkSharedProduct();
    initScrollHandler();
});

// Gestion du scroll pour le menu mobile
function initScrollHandler() {
    const mobileFooter = document.getElementById('mobile-footer');
    const header = document.getElementById('main-header');
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        
        if (currentScroll > 100 && currentScroll > lastScrollPosition) {
            mobileFooter.classList.add('show');
            header.style.transform = 'translateY(-100%)';
        } else {
            mobileFooter.classList.remove('show');
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollPosition = currentScroll;
    });
}

// Charger les produits
async function chargerProduits() {
    try {
        const response = await fetch('produits.json');
        tousLesProduits = await response.json();
        
        tousLesProduits.forEach((prod, index) => {
            if (!prod.id) prod.id = `prod_${index}`;
        });
        
        afficherProduits(tousLesProduits);
    } catch (error) {
        console.error("Erreur de chargement:", error);
        document.getElementById('produits-list').innerHTML = `
            <div class="error">
                Impossible de charger les produits. Rechargez la page.
            </div>
        `;
    }
}

// Afficher les produits
function afficherProduits(produitsAAfficher) {
    const container = document.getElementById('produits-list');
    
    if (produitsAAfficher.length === 0) {
        container.innerHTML = '<div class="no-results">Aucun produit trouvé</div>';
        return;
    }

    container.innerHTML = produitsAAfficher.map(produit => `
        <div class="produit" data-id="${produit.id}">
            <img src="${escapeHtml(produit.image)}" 
                 alt="${escapeHtml(produit.nom)}"
                 onclick="openProductModal('${produit.id}')">
            <h3>${escapeHtml(produit.nom)}</h3>
            <p>${escapeHtml(produit.prix)} $</p>
            <button class="ajouter-panier" 
                    onclick="ajouterAuPanier('${produit.id}', event)">
                Ajouter au panier
            </button>
        </div>
    `).join('');
}

// Configurer les événements
function setupEventListeners() {
    // Barre de recherche
    document.getElementById('search-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const terme = document.getElementById('search-input').value.toLowerCase();
        const produitsFiltres = tousLesProduits.filter(produit => 
            produit.nom.toLowerCase().includes(terme) || 
            (produit.description && produit.description.toLowerCase().includes(terme))
        );
        afficherProduits(produitsFiltres);
    });

    // Bouton recherche mobile
    document.getElementById('mobile-search-btn')?.addEventListener('click', function() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.focus();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.location.href = 'index.html#search-input';
        }
    });

    // Boutons de la modale
    document.getElementById('modal-add-to-cart')?.addEventListener('click', () => {
        if (produitActuel) {
            ajouterAuPanier(produitActuel.id);
            closeModal();
        }
    });

    document.getElementById('modal-share')?.addEventListener('click', partagerProduit);
    
    // Fermeture modale
    document.getElementById('product-modal')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('product-modal')) {
            closeModal();
        }
    });
}

// Ouvrir la modale
function openProductModal(productId) {
    produitActuel = tousLesProduits.find(p => p.id === productId);
    if (!produitActuel) return;

    document.getElementById('modal-image').src = produitActuel.image;
    document.getElementById('modal-title').textContent = produitActuel.nom;
    document.getElementById('modal-price').textContent = `${produitActuel.prix} $`;
    document.getElementById('modal-description').textContent = produitActuel.description || 'Aucune description disponible';

    const whatsappLink = document.getElementById('whatsapp-product-link');
    whatsappLink.href = `https://wa.me/18093978951?text=${encodeURIComponent(
        `Bonjour MarcShop! Je suis intéressé par votre produit "${produitActuel.nom}" (${produitActuel.prix}$). Pouvez-vous m'en dire plus ?`
    )}`;

    document.getElementById('product-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Fermer la modale
function closeModal() {
    document.getElementById('product-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Ajouter au panier
function ajouterAuPanier(productId, event = null) {
    if (event) event.stopPropagation();
    
    const produit = tousLesProduits.find(p => p.id === productId);
    if (!produit) return;

    let panier = JSON.parse(localStorage.getItem('panier')) || [];
    panier.push(produit);
    localStorage.setItem('panier', JSON.stringify(panier));
    
    envoyerEmailNotification(produit);
    showNotification(`${produit.nom} ajouté au panier !`);
}

// Envoyer l'email
function envoyerEmailNotification(produit) {
    const templateParams = {
        to_email: "marcshop0705@gmail.com",
        subject: `Nouvel achat: ${produit.nom}`,
        message: `
            Produit: ${produit.nom}
            Prix: ${produit.prix}$
            Image: ${produit.image}
            Date: ${new Date().toLocaleString()}
        `
    };

    emailjs.send("marc1304", "template_zvo5tzs", templateParams)
        .then(response => console.log("Email envoyé!", response))
        .catch(error => console.error("Erreur email:", error));
}

// Partager produit
async function partagerProduit() {
    if (!produitActuel) return;

    const urlPartage = `${window.location.origin}${window.location.pathname}?produit=${produitActuel.id}`;
    const textePartage = `Découvrez "${produitActuel.nom}" à ${produitActuel.prix}$ sur MarcShop: ${urlPartage}`;

    try {
        if (navigator.share) {
            await navigator.share({
                title: produitActuel.nom,
                text: `Seulement ${produitActuel.prix}$ !`,
                url: urlPartage
            });
        } else {
            await navigator.clipboard.writeText(textePartage);
            showNotification('Lien copié dans le presse-papiers !');
        }
    } catch (err) {
        prompt('Copiez ce lien:', urlPartage);
    }
}

// Vérifier le produit partagé
function checkSharedProduct() {
    const urlParams = new URLSearchParams(window.location.search);
    const produitId = urlParams.get('produit');
    
    if (produitId) {
        const produit = tousLesProduits.find(p => p.id === produitId);
        if (produit) {
            openProductModal(produitId);
            history.replaceState(null, '', window.location.pathname);
        }
    }
}

// Afficher notification
function showNotification(message) {
    const notif = document.getElementById('notification');
    if (notif) {
        notif.textContent = message;
        notif.classList.add('show');
        setTimeout(() => notif.classList.remove('show'), 3000);
    }
}

// Sécurité HTML
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Fonctions globales
window.openProductModal = openProductModal;
window.closeModal = closeModal;
window.ajouterAuPanier = ajouterAuPanier;
