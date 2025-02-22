document.addEventListener("DOMContentLoaded", () => {
    const produitsContainer = document.getElementById('produits-container');

    if (produitsContainer) {
        // Code pour charger les produits sur index.html
        fetch('produits.json')
            .then(response => response.json())
            .then(data => {
                data.forEach(produit => {
                    const produitDiv = document.createElement('div');
                    produitDiv.classList.add('produit');
                    produitDiv.id = `produit-${produit.id}`; // Ajouter un ID unique

                    const produitImage = document.createElement('img');
                    produitImage.src = produit.image;
                    produitImage.alt = produit.nom;
                    produitImage.onclick = () => showModal(produit.image, produit.description, `Prix: ${produit.prix} $`);

                    const produitPrix = document.createElement('p');
                    produitPrix.textContent = `Prix: ${produit.prix} $`;

                    produitDiv.appendChild(produitImage);
                    produitDiv.appendChild(produitPrix);

                    produitsContainer.appendChild(produitDiv);
                });
            })
            .catch(error => console.error('Erreur:', error));
    } else {
        afficherPanier();
    }
}); // Fin de document.addEventListener

function showModal(imgSrc, description, price) {
    var modal = document.getElementById("modal");
    var modalImg = document.getElementById("modalImage");
    var captionText = document.getElementById("caption");
    
    modal.style.display = "block";
    modalImg.src = imgSrc;
    captionText.innerHTML = `${description}<br>${price}`;
}

function closeModal() {
    var modal = document.getElementById("modal");
    modal.style.display = "none";
}

// Reste des fonctions existantes...
