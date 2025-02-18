// scripts.js - Mise à jour pour intégrer PayPal Checkout

document.addEventListener("DOMContentLoaded", () => {
    let panier = JSON.parse(localStorage.getItem("panier")) || [];
    const totalPanierElement = document.getElementById("total-panier");
    const paypalContainer = document.getElementById("paypal-button-container");

    function calculerTotal() {
        let total = panier.reduce((sum, produit) => sum + produit.prix, 0);
        totalPanierElement.textContent = `${total.toFixed(2)} $`;
        return total.toFixed(2);
    }

    function afficherPaypalButton() {
        if (panier.length === 0) {
            paypalContainer.style.display = "none";
            return;
        }
        paypalContainer.style.display = "block";
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
                    localStorage.removeItem("panier"); // Vider le panier après paiement
                    window.location.href = "index.html"; // Retour à la page d'accueil
                });
            },
            onError: function(err) {
                console.error("Erreur de paiement :", err);
                alert("Une erreur est survenue lors du paiement.");
            }
        }).render('#paypal-button-container');
    }

    calculerTotal();
    afficherPaypalButton();
});
