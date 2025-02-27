document.addEventListener("DOMContentLoaded", () => {
    let panier = JSON.parse(localStorage.getItem("panier")) || [];
    const contenuPanier = document.getElementById("contenu-panier");
    const boutonVider = document.getElementById("vider-panier");
    const boutonPayer = document.getElementById("payer");
    const totalPanierElement = document.getElementById("total-panier");
    const totalProduitsElement = document.getElementById("total-produits");

    async function afficherPanier() {
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
                    <button onclick="supprimerProduit(${index})">Retirer</button>
                    <button class="envoyer-commentaire" data-index="${index}">Envoyer</button>
                </div>
            `;
            contenuPanier.appendChild(div);
        });

        boutonPayer.disabled = false;
        calculerTotal();
    }

    async function supprimerProduit(index) {
        panier.splice(index, 1);
        localStorage.setItem("panier", JSON.stringify(panier));
        await afficherPanier();
    }

    boutonVider.addEventListener("click", async () => {
        localStorage.removeItem("panier");
        panier = [];
        await afficherPanier();
    });

    contenuPanier.addEventListener("click", async (e) => {
        if (e.target.classList.contains("envoyer-commentaire")) {
            const index = e.target.dataset.index;
            const commentaire = document.querySelector(`textarea[data-index='${index}']`).value;

            if (commentaire.trim() === "") {
                alert("Veuillez entrer un commentaire avant d'envoyer.");
                return;
            }

            try {
                const response = await fetch('/api/commentaires', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        nomUtilisateur: "Utilisateur", // Remplacez par le nom réel de l'utilisateur
                        index: index,
                        commentaire: commentaire
                    }),
                });

                const data = await response.json();
                alert(data.message);
            } catch (error) {
                console.error('Erreur lors de l\'envoi du commentaire :', error);
                alert('Une erreur s\'est produite lors de l\'envoi du commentaire.');
            }
        }
    });

    boutonPayer.addEventListener("click", () => {
        if (typeof paypal !== 'undefined') {
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
        } else {
            console.error("Le SDK PayPal n'est pas chargé.");
        }
    });

    afficherPanier();
});
