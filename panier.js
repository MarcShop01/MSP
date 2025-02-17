document.addEventListener("DOMContentLoaded", () => {
    let panier = JSON.parse(localStorage.getItem("panier")) || [];
    const contenuPanier = document.getElementById("contenu-panier");
    const boutonVider = document.getElementById("vider-panier");
    const boutonPayer = document.getElementById("payer");

    function afficherPanier() {
        contenuPanier.innerHTML = "";
        if (panier.length === 0) {
            contenuPanier.innerHTML = "<p>Votre panier est vide.</p>";
            boutonPayer.disabled = true;
            return;
        }
        panier.forEach((produit, index) => {
            let div = document.createElement("div");
            div.classList.add("produit");
            div.innerHTML = `<h3>${produit.nom}</h3><p>${produit.prix} €</p>
                             <button onclick="supprimerProduit(${index})">Retirer</button>`;
            contenuPanier.appendChild(div);
        });
        boutonPayer.disabled = false;
    }

    window.supprimerProduit = (index) => {
        panier.splice(index, 1);
        localStorage.setItem("panier", JSON.stringify(panier));
        afficherPanier();
    };

    boutonVider.addEventListener("click", () => {
        localStorage.removeItem("panier");
        panier = [];
        afficherPanier();
    });

    boutonPayer.addEventListener("click", () => {
        localStorage.removeItem("panier");
        panier = [];
        window.location.href = "paiement.html";
    });

    afficherPanier();
});