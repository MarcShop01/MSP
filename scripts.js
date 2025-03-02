document.addEventListener("DOMContentLoaded", () => {
    chargerProduits();
});

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
