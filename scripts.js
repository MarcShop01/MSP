// MarcShop - Script principal
document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let produits = [];
    const panier = JSON.parse(localStorage.getItem('panier')) || [];
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const produitsContainer = document.getElementById('produits-list');

    // Initialisation
    init();

    // Fonction d'initialisation
    async function init() {
        await chargerProduits();
        setupSearch();
        setupPanierListeners();
    }

    // Charger les produits depuis le JSON
    async function chargerProduits() {
        try {
            const response = await fetch('produits.json');
            if (!response.ok) throw new Error('Erreur de chargement');
            
            produits = await response.json();
            afficherProduits(produits);
        } catch (error) {
            console.error('Erreur:', error);
            produitsContainer.innerHTML = `
                <div class="error">
                    <p>Impossible de charger les produits</p>
                    <button onclick="location.reload()">Réessayer</button>
                </div>
            `;
        }
    }

    // Afficher les produits
    function afficherProduits(produitsAAfficher) {
        if (produitsAAfficher.length === 0) {
            produitsContainer.innerHTML = `
                <div class="no-results">
                    Aucun produit trouvé. Essayez d'autres termes.
                </div>
            `;
            return;
        }

        produitsContainer.innerHTML = produitsAAfficher.map(produit => `
            <div class="produit" data-id="${produit.id}">
                <img src="${escapeHtml(produit.image)}" 
                     alt="${escapeHtml(produit.nom)}" 
                     onclick="showModal('${escapeHtml(produit.image)}', '${escapeHtml(produit.description)}')">
                <h3>${escapeHtml(produit.nom)}</h3>
                <p>${escapeHtml(produit.prix)} $</p>
                <button class="ajouter-panier" 
                        data-produit='${escapeHtml(JSON.stringify(produit))}'>
                    Ajouter au panier
                </button>
            </div>
        `).join('');

        // Mettre à jour les écouteurs d'événements
        setupPanierListeners();
    }

    // Configurer la recherche
    function setupSearch() {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            filtrerProduits();
        });

        searchInput.addEventListener('input', function() {
            if (this.value === '') {
                afficherProduits(produits);
            }
        });
    }

    // Filtrer les produits
    function filtrerProduits() {
        const terme = searchInput.value.trim().toLowerCase();
        
        if (terme === '') {
            afficherProduits(produits);
            return;
        }

        const produitsFiltres = produits.filter(produit => 
            produit.nom.toLowerCase().includes(terme) || 
            (produit.description && produit.description.toLowerCase().includes(terme))
        );

        afficherProduits(produitsFiltres);
    }

    // Configurer les écouteurs pour le panier
    function setupPanierListeners() {
        document.querySelectorAll('.ajouter-panier').forEach(btn => {
            btn.addEventListener('click', function() {
                const produitData = this.getAttribute('data-produit');
                try {
                    const produit = JSON.parse(produitData);
                    ajouterAuPanier(produit);
                } catch (e) {
                    console.error('Erreur d\'ajout au panier:', e);
                }
            });
        });
    }

    // Ajouter un produit au panier
    function ajouterAuPanier(produit) {
        panier.push(produit);
        localStorage.setItem('panier', JSON.stringify(panier));
        
        // Feedback visuel
        const feedback = document.createElement('div');
        feedback.className = 'feedback-panier';
        feedback.textContent = `${produit.nom} ajouté au panier !`;
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.classList.add('show');
            setTimeout(() => {
                feedback.classList.remove('show');
                setTimeout(() => feedback.remove(), 300);
            }, 2000);
        }, 10);
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
});

// Fonctions de la modale (globales)
function showModal(imageSrc, description) {
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('modalImage');
    const caption = document.getElementById('caption');
    
    modal.style.display = 'block';
    modalImg.src = imageSrc;
    caption.textContent = description;

    // Fermer en cliquant à l'extérieur
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}
