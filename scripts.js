document.addEventListener("DOMContentLoaded", () => {
    // Initialiser EmailJS
    (function() {
       emailjs.init("VOTRE_ID_UTILISATEUR");
    })();

    const produitsContainer = document.getElementById('produits-container');

    if (produitsContainer) {
        fetch('produits.json')
            .then(response => response.json())
            .then(data => {
                data.forEach(produit => {
                    const produitDiv = document.createElement('div');
                    produitDiv.classList.add('produit');
                    produitDiv.id = `produit-${produit.id}`; // Ajouter un ID unique

                    const produitImage = document.createElement('img');
                    produitImage.src = produit.image;
                    produitImage.alt = produit.nom;
                    produitImage.onclick = () => showModal(produit.image, produit.description);

                    const produitPrix = document.createElement('p');
                    produitPrix.textContent = `Prix: ${produit.prix} $`;

                    const boutonAjouter = document.createElement('button');
                    boutonAjouter.classList.add('ajouter-panier');
                    boutonAjouter.textContent = 'Ajouter au panier';
                    boutonAjouter.onclick = () => ajouterAuPanier(produit);

                    produitDiv.appendChild(produitImage);
                    produitDiv.appendChild(produitPrix);
                    produitDiv.appendChild(boutonAjouter);

                    produitsContainer.appendChild(produitDiv);
                });
            })
            .catch(error => console.error('Erreur:', error));
    } else {
        afficherPanier();
    }
});

function showModal(imgSrc, description) {
    const modal = document.getElementById("modal");
    const modalImg = document.getElementById("modalImage");
    const captionText = document.getElementById("caption");

    modal.style.display = "block";
    modalImg.src = imgSrc;
    captionText.innerHTML = description;
}

function closeModal() {
    const modal = document.getElementById("modal");
    modal.style.display = "none";
}

function ajouterAuPanier(produit) {
    let panier = JSON.parse(localStorage.getItem("panier")) || [];
    produit.idUnique = `produit-${produit.id}`; // Ajouter un ID unique au produit
    panier.push(produit);
    localStorage.setItem("panier", JSON.stringify(panier));
    alert("Produit ajouté au panier !");

    // Envoyer la notification d'ajout au panier
    const utilisateurConnecté = JSON.parse(localStorage.getItem("utilisateurConnecté"));
    if (utilisateurConnecté) {
        sendCartNotification(utilisateurConnecté.nom, produit.nom);
    }
}

function afficherPanier() {
    const panierContainer = document.getElementById("panier-container");
    const totalPanierElement = document.getElementById("total-panier");
    const panierCountElement = document.getElementById("panier-count");
    const paypalContainer = document.getElementById("paypal-button-container");

    const utilisateurConnecté = JSON.parse(localStorage.getItem("utilisateurConnecté"));
    if (!utilisateurConnecté) {
        alert("Vous devez être connecté pour accéder à la page de paiement.");
        window.location.href = "login.html";
        return;
    }

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
        let produitPrix = parseFloat(produit.prix); // Convertir le prix en nombre
        div.innerHTML = `
            <img src="${imgSrc}" alt="${produit.nom}" class="produit-image">
            <div class="details">
                <h3>${produit.nom}</h3>
                <p>ID: ${produit.idUnique}</p>
                <p><strong>${produitPrix.toFixed(2)} $</strong></p>
                <textarea id="commentaire-${index}" placeholder="Commentaires : couleur, taille, mesure">${produit.commentaire || ""}</textarea>
                <button onclick="envoyerCommentaire(${index})">Envoyer Commentaire</button>
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
    const totalPanierElement = document.getElementById("total-panier");
    let panier = JSON.parse(localStorage.getItem("panier")) || [];
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
    const paypalContainer = document.getElementById("paypal-button-container");
    let panier = JSON.parse(localStorage.getItem("panier")) || [];
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
                purchase_units: [{ amount: { value: calculerTotal() } }]
            });
        },
        onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {
                alert("Paiement réussi ! Merci " + details.payer.name.given_name);
                localStorage.removeItem("panier");

                // Envoyer la notification de paiement
                const utilisateurConnecté = JSON.parse(localStorage.getItem("utilisateurConnecté"));
                if (utilisateurConnecté) {
                    sendPaymentNotification(utilisateurConnecté.nom, utilisateurConnecté.phone, utilisateurConnecté.email);
                }

                window.location.href = "index.html";
            });
        },
        onError: function(err) {
            console.error("Erreur de paiement :", err);
            alert("Une erreur est survenue lors
