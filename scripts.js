document.addEventListener("DOMContentLoaded", () => {
    initialiserEmailJS();
    chargerProduits();
    afficherPanier(); // Afficher le panier au chargement de la page
});

// Initialiser EmailJS (si nécessaire)
function initialiserEmailJS() {
    emailjs.init("JxX982TUPjSDpIlYg"); // Remplacez par votre ID utilisateur EmailJS
}

// Charger les produits depuis produits.json
function chargerProduits() {
    fetch('produits.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur de réseau');
            }
            return response.json();
        })
        .then(data => {
            const produitsContainer = document.getElementById("produits-list");
            if (produitsContainer) {
                produitsContainer.innerHTML = ""; // Effacer le contenu précédent
                data.forEach(produit => {
                    const produitDiv = document.createElement("div");
                    produitDiv.classList.add("produit");
                    produitDiv.innerHTML = `
                        <img src="${produit.image}" alt="${produit.nom}" onclick="showModal('${produit.image}', '${produit.description}')">
                        <h3>${produit.nom}</h3>
                        <p>${produit.prix} $</p>
                        <button class="ajouter-panier" onclick='ajouterAuPanier(${JSON.stringify(produit)})'>Ajouter au panier</button>
                    `;
                    produitsContainer.appendChild(produitDiv);
                });
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            const produitsContainer = document.getElementById("produits-list");
            if (produitsContainer) {
                produitsContainer.innerHTML = `<p class="error">Erreur lors du chargement des produits : ${error.message}</p>`;
            }
        });
}

// Ajouter un produit au panier
function ajouterAuPanier(produit) {
    let panier = JSON.parse(localStorage.getItem("panier")) || []; // Récupérer le panier depuis le localStorage
    const produitExistant = panier.find(p => p.id === produit.id); // Vérifier si le produit est déjà dans le panier

    if (produitExistant) {
        produitExistant.quantite += 1; // Augmenter la quantité si le produit existe déjà
    } else {
        produit.quantite = 1; // Ajouter une quantité de 1 si le produit n'existe pas encore
        panier.push(produit); // Ajouter le produit au panier
    }

    localStorage.setItem("panier", JSON.stringify(panier)); // Sauvegarder le panier dans le localStorage
    afficherPanier(); // Mettre à jour l'affichage du panier
    alert("Produit ajouté au panier !");
}

// Afficher le panier
function afficherPanier() {
    const panier = JSON.parse(localStorage.getItem("panier")) || [];
    const panierContainer = document.getElementById("panier-list");
    const totalPanierElement = document.getElementById("total-panier");

    if (panierContainer) {
        panierContainer.innerHTML = ""; // Effacer le contenu précédent

        if (panier.length === 0) {
            panierContainer.innerHTML = "<p>Votre panier est vide.</p>";
            if (totalPanierElement) {
                totalPanierElement.textContent = "0.00 $";
            }
            return;
        }

        panier.forEach(produit => {
            const div = document.createElement("div");
            div.classList.add("produit-panier");
            div.innerHTML = `
                <p><strong>${produit.nom}</strong> (${produit.prix} $) x ${produit.quantite}</p>
                <button onclick="supprimerDuPanier(${produit.id})">Supprimer</button>
            `;
            panierContainer.appendChild(div);
        });

        if (totalPanierElement) {
            const total = panier.reduce((sum, produit) => sum + (produit.prix * produit.quantite), 0);
            totalPanierElement.textContent = `${total.toFixed(2)} $`;
        }
    }
}

// Supprimer un produit du panier
function supprimerDuPanier(produitId) {
    let panier = JSON.parse(localStorage.getItem("panier")) || [];
    panier = panier.filter(produit => produit.id !== produitId); // Filtrer pour supprimer le produit
    localStorage.setItem("panier", JSON.stringify(panier)); // Mettre à jour le localStorage
    afficherPanier(); // Mettre à jour l'affichage du panier
}

// Afficher la modale
function showModal(imgSrc, description) {
    const modal = document.getElementById("modal");
    const modalImg = document.getElementById("modalImage");
    const captionText = document.getElementById("caption");

    if (modal && modalImg && captionText) {
        modal.style.display = "block";
        modalImg.src = imgSrc;
        captionText.innerHTML = description;
    }
}

// Fermer la modale
function closeModal() {
    const modal = document.getElementById("modal");
    if (modal) {
        modal.style.display = "none";
    }
}
