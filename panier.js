// Initialiser EmailJS
emailjs.init("s34yGCgjKesaY6sk_"); // Remplacez par votre User ID EmailJS

document.addEventListener("DOMContentLoaded", () => {
    let panier = JSON.parse(localStorage.getItem("panier")) || [];
    const contenuPanier = document.getElementById("contenu-panier");
    const boutonVider = document.getElementById("vider-panier");
    const totalPanierElement = document.getElementById("total-panier");
    const totalProduitsElement = document.getElementById("total-produits");
    const commentaireForm = document.getElementById("commentaire-form");

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
                    <button class="retirer-produit" data-index="${index}">Retirer</button>
                </div>
            `;
            contenuPanier.appendChild(div);
        });
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

    // Gestion du formulaire de commentaire
    commentaireForm.addEventListener("submit", (e) => {
        e.preventDefault();
        console.log("Formulaire soumis !");

        // Récupérer les valeurs du formulaire
        const nom = document.getElementById("nom").value;
        const email = document.getElementById("email").value;
        const telephone = document.getElementById("telephone").value;
        const pays = document.getElementById("pays").value;
        const ville = document.getElementById("ville").value;
        const adresse = document.getElementById("adresse").value;
        const produit = document.getElementById("produit").value;
        const couleur = document.getElementById("couleur").value;
        const taille = document.getElementById("taille").value;
        const mesure = document.getElementById("mesure").value;
        const commentaire = document.getElementById("commentaire").value;

        // Construire le message
        const message = `
            Nom: ${nom}
            Email: ${email}
            Téléphone: ${telephone}
            Pays: ${pays}
            Ville: ${ville}
            Adresse: ${adresse}
            Produit: ${produit}
            Couleur: ${couleur}
            Taille: ${taille}
            Mesure: ${mesure}
            Commentaire: ${commentaire}
        `;

        // Envoyer le commentaire par e-mail
        console.log("Envoi du commentaire par e-mail...");
        envoyerNotificationEmail(
            "Nouveau commentaire avec informations client",
            message
        );

        // Réinitialiser le formulaire
        commentaireForm.reset();
        alert("Merci pour votre commentaire !");
    });

    // Afficher le panier au chargement de la page
    afficherPanier();
});

// Fonction pour envoyer une notification par e-mail
function envoyerNotificationEmail(sujet, message) {
    const templateParams = {
        to_email: "marcshop0705@gmail.com", // Remplacez par votre adresse e-mail
        subject: sujet,
        message: message,
    };

    emailjs.send("marc1304", "template_zvo5tzs", templateParams)
        .then(response => console.log("E-mail envoyé !", response.status))
        .catch(error => console.error("Erreur :", error));
}

// Initialiser PayPal
if (typeof paypal !== 'undefined') {
    paypal.Buttons({
        createOrder: function (data, actions) {
            const panier = JSON.parse(localStorage.getItem("panier")) || [];
            const total = panier.reduce((sum, produit) => sum + parseFloat(produit.prix), 0);
            return actions.order.create({
                purchase_units: [{
                    amount: {
                        value: total.toFixed(2),
                        currency_code: "USD"
                    }
                }]
            });
        },
        onApprove: function (data, actions) {
            return actions.order.capture().then(function (details) {
                alert("Paiement réussi ! Merci pour votre achat, " + details.payer.name.given_name + ".");
                localStorage.removeItem("panier");
                window.location.href = "confirmation.html";
            });
        },
        onError: function (err) {
            console.error(err);
            alert("Une erreur s'est produite lors du paiement. Veuillez réessayer.");
        }
    }).render("#paypal-button-container");
} else {
    console.error("PayPal SDK n'est pas chargé.");
}
