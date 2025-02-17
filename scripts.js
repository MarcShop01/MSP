document.addEventListener("DOMContentLoaded", () => {
    fetch("produits.json")
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur HTTP ! statut : ' + response.status);
            }
            return response.json();
        })
        .then(produits => {
            let sectionProduits = document.getElementById("produits");
            produits.forEach(produit => {
                let div = document.createElement("div");
                div.classList.add("produit");
                div.innerHTML = `<img src="${produit.image}" alt="${produit.nom}" class="produit-image">
                                 <h3>${produit.nom}</h3>
                                 <p>${produit.description}</p>
                                 <p><strong>${produit.prix} $</strong></p>
                                 <button class="ajouter-panier" data-nom="${produit.nom}" data-prix="${produit.prix}">Ajouter au panier</button>`;
                sectionProduits.appendChild(div);
            });

            document.querySelectorAll(".ajouter-panier").forEach(bouton => {
                bouton.addEventListener("click", (e) => {
                    let produitAjoute = {
                        nom: e.target.dataset.nom,
                        prix: parseFloat(e.target.dataset.prix)
                    };
                    let panier = JSON.parse(localStorage.getItem("panier")) || [];
                    panier.push(produitAjoute);
                    localStorage.setItem("panier", JSON.stringify(panier));
                    document.getElementById("panier-count").textContent = panier.length;
                });
            });
        })
        .catch(error => console.error("Erreur lors du chargement des produits :", error));
});
