document.addEventListener("DOMContentLoaded", () => {
    let panier = JSON.parse(localStorage.getItem("panier")) || [];
    const contenuPanier = document.getElementById("contenu-panier");
    const boutonVider = document.getElementById("vider-panier");
    const boutonPayer = document.getElementById("payer");
    const totalPanierElement = document.getElementById("total-panier");
    const totalProduitsElement = document.getElementById("total-produits");

    // Initialiser EmailJS
    function initialiserEmailJS() {
        emailjs.init("s34yGCgjKesaY6sk_"); // Remplacez par votre User ID EmailJS
    }

    // Fonction pour calculer le total du panier
    function calculerTotal() {
        let total = panier.reduce((sum, produit) => sum + parseFloat(produit.prix), 0);
        totalPanierElement.textContent = `${total.toFixed(2)}$`;
    }

    // Fonction pour afficher le panier
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
    window.supprimerProduit = async function (index) {
        panier.splice(index, 1);
        localStorage.setItem("panier", JSON.stringify(panier));
        await afficherPanier();
    };

    // Gestion du clic sur le bouton "Retirer"
    contenuPanier.addEventListener("click", (e) => {
        if (e.target.classList.contains("retirer-produit")) {
            const index = e.target.dataset.index;
            supprimerProduit(index);
        }
    });

    // Gestion du clic sur le bouton "Vider le panier"
    boutonVider.addEventListener("click", async () => {
        localStorage.removeItem("panier");
        panier = [];
        await afficherPanier();
    });

    // Fonction pour envoyer un commentaire par e-mail (avec EmailJS)
    function envoyerCommentaireParEmail(commentaire) {
        const templateParams = {
            to_email: "marcshop0705@gmail.com", // Remplacez par votre adresse e-mail
            subject: "Nouveau commentaire",
            message: `Un utilisateur a laissé un commentaire : "${commentaire}".`,
        };

        emailjs.send("marc1304", "VOTRE_TEMPLATE_ID", templateParams) // Remplacez par vos IDs EmailJS
            .then(response => {
                console.log("E-mail envoyé !", response.status);
                alert("Commentaire envoyé avec succès !");
            })
            .catch(error => {
                console.error("Erreur :", error);
                alert("Une erreur s'est produite lors de l'envoi du commentaire.");
            });
    }

    // Gestion du clic sur le bouton "Envoyer"
    contenuPanier.addEventListener("click", async (e) => {
        if (e.target.classList.contains("envoyer-commentaire")) {
            const index = e.target.dataset.index;
            const commentaire = document.querySelector(`textarea[data-index='${index}']`).value;
            if (commentaire.trim() === "") {
                alert("Veuillez entrer un commentaire avant d'envoyer.");
                return;
            }

            try {
                // Option 1 : Envoyer le commentaire à une API
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

                // Vérifier si la réponse est au format JSON
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    alert(data.message);
                } else {
                    throw new Error('La réponse n\'est pas au format JSON.');
                }
            } catch (error) {
                console.error('Erreur lors de l\'envoi du commentaire :', error);
                // Option 2 : Envoyer le commentaire par e-mail (si l'API échoue)
                envoyerCommentaireParEmail(commentaire);
            }
        }
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
