document.addEventListener("DOMContentLoaded", () => {
    let panier = JSON.parse(localStorage.getItem("panier")) || [];
    const contenuPanier = document.getElementById("contenu-panier");
    const boutonVider = document.getElementById("vider-panier");
    const boutonPayer = document.getElementById("payer");
    const totalPanierElement = document.getElementById("total-panier");

    // Fonction pour afficher le panier
    function afficherPanier() {
        if (!contenuPanier) {
            console.error("L'élément 'contenu-panier' est introuvable.");
            return;
        }

        contenuPanier.innerHTML = "";
        if (panier.length === 0) {
            contenuPanier.innerHTML = "<p>Votre panier est vide.</p>";
            if (boutonPayer) boutonPayer.disabled = true;
            if (totalPanierElement) totalPanierElement.textContent = "0$";
            return;
        }

        panier.forEach((produit, index) => {
            let div = document.createElement("div");
            div.classList.add("produit");
            div.innerHTML = `
                <h3>${produit.nom}</h3>
                <p>${produit.prix} $</p>
                <button onclick="supprimerProduit(${index})">Retirer</button>
            `;
            contenuPanier.appendChild(div);
        });

        if (boutonPayer) boutonPayer.disabled = false;
        calculerTotal();
    }

    // Fonction pour calculer le total du panier
    function calculerTotal() {
        if (!totalPanierElement) return;
        let total = panier.reduce((sum, produit) => sum + parseFloat(produit.prix), 0);
        totalPanierElement.textContent = `${total.toFixed(2)} $`;
    }

    // Fonction pour supprimer un produit du panier
    window.supprimerProduit = (index) => {
        panier.splice(index, 1);
        localStorage.setItem("panier", JSON.stringify(panier));
        afficherPanier();
    };

    // Fonction pour vider le panier
    if (boutonVider) {
        boutonVider.addEventListener("click", () => {
            localStorage.removeItem("panier");
            panier = [];
            afficherPanier();
        });
    }

    // Fonction pour gérer le paiement via PayPal
    if (boutonPayer) {
        boutonPayer.addEventListener("click", () => {
            if (typeof paypal !== 'undefined') {
                paypal.Buttons({
                    createOrder: function(data, actions) {
                        return actions.order.create({
                            purchase_units: [{
                                amount: {
                                    value: calculerTotal()
                                }
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
            } else {
                console.error("Le SDK PayPal n'est pas chargé.");
            }
        });
    }

    // Afficher le panier au chargement de la page
    afficherPanier();
});
