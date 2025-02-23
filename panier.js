document.addEventListener("DOMContentLoaded", () => {
    let panier = JSON.parse(localStorage.getItem("panier")) || [];
    const contenuPanier = document.getElementById("contenu-panier");
    const boutonVider = document.getElementById("vider-panier");
    const boutonPayer = document.getElementById("payer");
    const totalPanierElement = document.getElementById("total-panier");
    const totalProduitsElement = document.getElementById("total-produits"); // Éléments pour le nombre de produits

    // Fonction pour afficher le panier
    function afficherPanier() {
        contenuPanier.innerHTML = "";
        totalProduitsElement.textContent = panier.length; // Mettre à jour le nombre de produits

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

    // Fonction pour calculer le total du panier
    function calculerTotal() {
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
    boutonVider.addEventListener("click", () => {
        localStorage.removeItem("panier");
        panier = [];
        afficherPanier();
    });

    // Fonction pour envoyer un commentaire
    contenuPanier.addEventListener("click", (e) => {
        if (e.target.classList.contains("envoyer-commentaire")) {
            const index = e.target.dataset.index;
            const commentaire = document.querySelector(`textarea[data-index='${index}']`).value;

            if (commentaire.trim() === "") {
                alert("Veuillez entrer un commentaire avant d'envoyer.");
                return;
            }

            const commentaires = JSON.parse(localStorage.getItem("commentaires")) || [];
            const nomUtilisateur = "Utilisateur"; // Modifiez cette ligne pour obtenir le nom réel de l'utilisateur
            commentaires.push({
                nomUtilisateur: nomUtilisateur,
                index: index,
                commentaire: commentaire
            });
            localStorage.setItem("commentaires", JSON.stringify(commentaires));

            ajouterNotification(`Commentaire ajouté par ${nomUtilisateur} pour le produit ${index} : ${commentaire}`);

            console.log(`Commentaire pour le produit ${panier[index].nom}: ${commentaire}`);
            alert("Commentaire envoyé avec succès.");
        }
    });

    // Gestion du paiement avec PayPal
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
                        ajouterNotification(`Paiement réussi pour ${details.payer.name.given_name}`);
                    });
                },
                onError: function(err) {
                    console.error("Erreur de paiement :", err);
                    alert("Une erreur est survenue lors du paiement.");
                    ajouterNotification("Erreur de paiement.");
                }
            }).render('#paypal-button-container');
        } else {
            console.error("Le SDK PayPal n'est pas chargé.");
        }
    });

    // Fonction pour ajouter une notification dans le localStorage
    function ajouterNotification(message) {
        const notifications = JSON.parse(localStorage.getItem("notifications")) || [];
        notifications.push({
            nomUtilisateur: "Utilisateur", // Modifiez cette ligne pour obtenir le nom réel de l'utilisateur
            message: message
        });
        localStorage.setItem("notifications", JSON.stringify(notifications));
    }

    // Afficher le panier au chargement de la page
    afficherPanier();
});
