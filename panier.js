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

    // Initialiser EmailJS
    function initialiserEmailJS() {
        emailjs.init("s34yGCgjKesaY6sk_"); // Remplace par ton User ID EmailJS
    }
    initialiserEmailJS();

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

    // Gestion du clic sur le bouton "Envoyer"
    contenuPanier.addEventListener("click", (e) => {
        if (e.target.classList.contains("envoyer-commentaire")) {
            const index = e.target.dataset.index;
            const commentaire = document.querySelector(`textarea[data-index='${index}']`).value;

            if (commentaire.trim() === "") {
                alert("Veuillez entrer un commentaire avant d'envoyer.");
                return;
            }

            // Envoyer le commentaire par e-mail
            envoyerCommentaireParEmail(commentaire);
        }
    });

    // Fonction pour envoyer un commentaire par e-mail
    function envoyerCommentaireParEmail(commentaire) {
        const templateParams = {
            to_email: "marcshop0705@gmail.com", // Remplace par ton adresse e-mail
            subject: "Nouveau commentaire",
            message: `Un utilisateur a laissé un commentaire : "${commentaire}".`,
        };

        emailjs.send("marc1304", "template_zvo5tzs", templateParams) // Remplace par tes IDs EmailJS
            .then(response => {
                console.log("E-mail envoyé !", response.status);
                alert("Commentaire envoyé avec succès !");
            })
            .catch(error => {
                console.error("Erreur :", error);
                alert("Une erreur s'est produite lors de l'envoi du commentaire.");
            });
    }

    // Afficher le panier au chargement de la page
    afficherPanier();
});
