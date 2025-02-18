document.addEventListener("DOMContentLoaded", () => {
    fetch('produits.json')
        .then(response => response.json())
        .then(data => {
            let produits = data;
            afficherProduits(produits);
        })
        .catch(error => {
            console.error('Erreur lors du chargement des produits:', error);
        });

    const panierContainer = document.getElementById("panier-container");
    const totalPanierElement = document.getElementById("total-panier");
    const panierCountElement = document.getElementById("panier-count");
    const paypalContainer = document.getElementById("paypal-button-container");

    function afficherProduits(produits) {
        const produitsContainer = document.getElementById("produits");
        produits.forEach(produit => {
            let produitDiv = document.createElement("div");
            produitDiv.classList.add("produit");
            produitDiv.innerHTML = `
                <img src="${produit.image}" alt="${produit.nom}" class="produit-image">
                <div class="details">
                    <h3>${produit.nom}</h3>
                    <p>${produit.description}</p>
                    <p><strong>${produit.prix} $</strong></p>
                    <button onclick="ajouterAuPanier('${produit.nom}', ${produit.prix}, '${produit.image}')">Ajouter au panier</button>
                </div>
            `;
            produitsContainer.appendChild(produitDiv);
        });
    }

    function ajouterAuPanier(nom, prix, image) {
        let panier = JSON.parse(localStorage.getItem("panier")) || [];
        panier.push({ nom, prix, image });
        localStorage.setItem("panier", JSON.stringify(panier));
        mettreAJourPanier();
    }

    function mettreAJourPanier() {
        const panierCountElement = document.getElementById("panier-count");
        let panier = JSON.parse(localStorage.getItem("panier")) || [];
        panierCountElement.textContent = panier.length;
    }

    function afficherPanier() {
        if (!panierContainer || !totalPanierElement || !panierCountElement || !paypalContainer) {
            console.error("Un ou plusieurs éléments DOM sont introuvables.");
            return;
        }

        let panier = JSON.parse(localStorage.getItem("panier")) || [];
        panierContainer.innerHTML = "";
        if (panier.length === 0) {
            panierContainer.innerHTML = "<p>Votre panier est vide.</p>";
            paypalContainer.style.display = "none";
            totalPanierElement.textContent = "0$";
            panierCountElement.textContent = "0";
            return;
        }

        panier.forEach((produit, index) => {
            let div = document.createElement("div");
            div.classList.add("produit-panier");
            let imgSrc = produit.image ? produit.image : 'path/to/default-image.jpg'; // Image par défaut si produit.image est indéfini
            div.innerHTML = `
                <img src="${imgSrc}" alt="${produit.nom}" class="produit-image">
                <div class="details">
                    <h3>${produit.nom}</h3>
                    <p><strong>${produit.prix.toFixed(2)} $</strong></p>
                    <button onclick="supprimerProduit(${index})">Retirer</button>
                </div>
            `;
            panierContainer.appendChild(div);
        });

        panierCountElement.textContent = panier.length;
        calculerTotal();
        afficherPaypalButton();
    }

    function calculerTotal() {
        if (!totalPanierElement) return "0";
        let total = panier.reduce((sum, produit) => sum + parseFloat(produit.prix), 0);
        totalPanierElement.textContent = `${total.toFixed(2)} $`;
        return total.toFixed(2);
    }

    function supprimerProduit(index) {
        let panier = JSON.parse(localStorage.getItem("panier")) || [];
        panier.splice(index, 1);
        localStorage.setItem("panier", JSON.stringify(panier));
        afficherPanier();
    }

    function afficherPaypalButton() {
        if (typeof paypal === 'undefined') {
            console.error("PayPal SDK non chargé.");
            return;
        }
        if (!paypalContainer) return;
        if (panier.length === 0) return;

        paypalContainer.style.display = "block";
        paypalContainer.innerHTML = "";

        paypal.Buttons({
            createOrder: function(data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        amount: { value: calculerTotal() }
                    }]
                });
            },
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    alert("Paiement réussi ! Merci " + details.payer.name.given_name);
                    localStorage.removeItem("panier");
                    window.location.href = "index.html";
                });
            },
            onError: function(err) {
                console.error("Erreur de paiement :", err);
                alert("Une erreur est survenue lors du paiement.");
            }
        }).render('#paypal-button-container');
    }

    afficherPanier();
    mettreAJourPanier();
});
