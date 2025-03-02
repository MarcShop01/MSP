document.addEventListener("DOMContentLoaded", () => {
    let panier = JSON.parse(localStorage.getItem("panier")) || [];
    const contenuPanier = document.getElementById("contenu-panier");
    const boutonVider = document.getElementById("vider-panier");
    const boutonPayer = document.getElementById("payer");
    const totalPanierElement = document.getElementById("total-panier");
    const totalProduitsElement = document.getElementById("total-produits");

    // Vérifier si les éléments existent
    if (!contenuPanier || !boutonVider || !boutonPayer || !totalPanierElement || !totalProduitsElement) {
        console.error("Un ou plusieurs éléments HTML sont manquants.");
        return;
    }

    // Fonction pour calculer le total du panier
    function calculerTotal() {
        let total = panier.reduce((sum, produit) => sum + parseFloat(produit.prix), 0);
        totalPanierElement.textContent = `${total.toFixed(2)}$`;
    }

    // Fonction pour afficher le panier
    function afficherPanier() {
        contenuPanier.innerHTML = "";
        totalProduitsElement.textContent = panier.length;
        if (panier.length === 0) {
            contenuPanier.innerHTML = "<p>Votre panier est vide.</p>";
            boutonPayer.disabled = true;
            totalPanierElement.textContent = "0$";
            return;
        }
        panier.forEach((produit, index) => {
            let div = document.createElement("div");
            div.classList.add("produit-panier");
            div.innerHTML = `
                <img src="${produit.image || 'path/to/default-image.jpg'}" alt="${produit.nom}" class="produit-image">
                <div class="details">
                    <h3>${produit.nom}</h3>
                    <p>${produit.prix} $</p>
                    <textarea class="commentaire" data-index="${index}" placeholder="Mesures, Taille, Couleur..."></textarea>
                    <button class="retirer-produit" data-index="${index}">Retirer</button>
                    <button class="envoyer-commentaire" data-index="${index}">Envoyer</button>
                </div>
            `;
            contenuPanier.appendChild(div);
        });
        boutonPayer.disabled = false;
        calculerTotal();
    }

    // Fonction pour supprimer un produit du panier
    window.supprimerProduit = function (index) {
        panier.splice(index, 1);
        localStorage.setItem("panier", JSON.stringify(panier));
        afficherPanier();
    };

    // Gestion du clic sur le bouton "Retirer"
    contenuPanier.addEventListener("click", (e) => {
        if (e.target.classList.contains("retirer-produit")) {
            const index = e.target.dataset.index;
            supprimerProduit(index);
        }
    });

    // Gestion du clic sur le bouton "Vider le panier"
    boutonVider.addEventListener("click", () => {
        localStorage.removeItem("panier");
        panier = [];
        afficherPanier();
    });

    // Gestion du paiement PayPal
    boutonPayer.addEventListener("click", () => {
        if (typeof paypal === 'undefined') {
            console.error("Le SDK PayPal n'est pas chargé.");
            return;
        }
        paypal.Buttons({
            createOrder: function(data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: panier.reduce((sum, produit) => sum + parseFloat(produit.prix), 0).toFixed(2)
                        }
                    }]
                });
            },
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    alert(`Paiement réussi ! Merci ${details.payer.name.given_name}.`);
                    localStorage.removeItem("panier");
                    panier = [];
                    afficherPanier();
                    window.location.href = "index.html";
                });
            },
            onError: function(err) {
                console.error("Erreur de paiement :", err);
                alert("Une erreur est survenue lors du paiement.");
            }
        }).render('#paypal-button-container');
    });

    // Afficher le panier au chargement de la page
    afficherPanier();
});
