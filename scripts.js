document.addEventListener("DOMContentLoaded", () => {
    initialiserEmailJS();
    const produitsContainer = document.getElementById('produits-container');
    if (produitsContainer) {
        chargerProduits(produitsContainer);
    } else {
        afficherPanier();
    }
    afficherUtilisateurs();
    chargerPaypalSDK();
    afficherCommentaires(); // Ajout de la fonction pour afficher les commentaires
});

function initialiserEmailJS() {
    emailjs.init("JxX982TUPjSDpIlYg");
}

function chargerProduits(container) {
    fetch('produits.json')
        .then(response => response.ok ? response.json() : Promise.reject('Erreur de réseau'))
        .then(data => {
            data.forEach(produit => {
                const produitDiv = document.createElement('div');
                produitDiv.classList.add('produit');
                produitDiv.id = `produit-${produit.id}`;

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

                container.appendChild(produitDiv);
            });
        })
        .catch(error => {
            console.error('Erreur:', error);
            if (container) container.innerHTML = `<p class="error">Erreur lors du chargement des produits : ${error}</p>`;
        });
}

function showModal(imgSrc, description) {
    const modal = document.getElementById("modal");
    if (!modal) return;

    const modalImg = document.getElementById("modalImage");
    const captionText = document.getElementById("caption");

    modal.style.display = "block";
    modalImg.src = imgSrc;
    captionText.innerHTML = description;
}

function closeModal() {
    const modal = document.getElementById("modal");
    if (modal) modal.style.display = "none";
}

function ajouterAuPanier(produit) {
    let panier = JSON.parse(localStorage.getItem("panier")) || [];
    produit.idUnique = `produit-${produit.id}`;
    panier.push(produit);
    localStorage.setItem("panier", JSON.stringify(panier));
    alert("Produit ajouté au panier !");

    const utilisateurConnecté = JSON.parse(localStorage.getItem("utilisateurConnecté"));
    if (utilisateurConnecté) sendCartNotification(utilisateurConnecté.nom, produit.nom);
}

function afficherPanier() {
    const panierContainer = getElementOrThrow("panier-container");
    const totalPanierElement = getElementOrThrow("total-panier");
    const panierCountElement = getElementOrThrow("panier-count");
    const paypalContainer = getElementOrThrow("paypal-button-container");

    const utilisateurConnecté = JSON.parse(localStorage.getItem("utilisateurConnecté"));
    if (!utilisateurConnecté) {
        panierContainer.innerHTML = "<p>Vous devez être connecté pour accéder à la page de paiement.</p>";
        paypalContainer.style.display = "none";
        return;
    }

    let panier = JSON.parse(localStorage.getItem("panier")) || [];
    if (panier.length === 0) {
        panierContainer.innerHTML = "<p>Votre panier est vide.</p>";
        paypalContainer.style.display = "none";
        totalPanierElement.textContent = "0$";
        panierCountElement.textContent = "0";
        return;
    }

    afficherProduitsPanier(panier, panierContainer);
    panierCountElement.textContent = panier.length;
    calculerTotal();
    afficherPaypalButton();
}

function afficherProduitsPanier(panier, container) {
    container.innerHTML = "";
    panier.forEach((produit, index) => {
        const div = document.createElement("div");
        div.classList.add("produit-panier");
        div.innerHTML = `
            <img src="${produit.image || 'path/to/default-image.jpg'}" alt="${produit.nom}" class="produit-image">
            <div class="details">
                <h3>${produit.nom}</h3>
                <p>ID: ${produit.idUnique}</p>
                <p><strong>${parseFloat(produit.prix).toFixed(2)} $</strong></p>
                <textarea id="commentaire-${index}" placeholder="Commentaires : couleur, taille, mesure">${produit.commentaire || ""}</textarea>
                <button onclick="envoyerCommentaire(${index})">Envoyer Commentaire</button>
                <button onclick="supprimerProduit(${index})">Retirer</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function calculerTotal() {
    const totalPanierElement = getElementOrThrow("total-panier");
    let panier = JSON.parse(localStorage.getItem("panier")) || [];
    let total = panier.reduce((sum, produit) => sum + parseFloat(produit.prix), 0);
    totalPanierElement.textContent = `${total.toFixed(2)} $`;
    return total.toFixed(2);
}

window.supprimerProduit = function (index) {
    let panier = JSON.parse(localStorage.getItem("panier")) || [];
    panier.splice(index, 1);
    localStorage.setItem("panier", JSON.stringify(panier));
    afficherPanier();
};

function afficherPaypalButton() {
    const paypalContainer = document.getElementById("paypal-button-container");
    if (!paypalContainer) {
        console.error("Le conteneur PayPal est introuvable.");
        return;
    }

    let panier = JSON.parse(localStorage.getItem("panier")) || [];
    if (panier.length === 0) {
        paypalContainer.style.display = "none";
        return;
    }

    paypalContainer.style.display = "block";
    paypalContainer.innerHTML = "";

    if (typeof paypal === 'undefined') {
        console.error("Le SDK PayPal n'est pas chargé.");
        paypalContainer.innerHTML = "<p class='error'>Le service de paiement est temporairement indisponible.</p>";
        return;
    }

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

                const utilisateurConnecté = JSON.parse(localStorage.getItem("utilisateurConnecté"));
                if (utilisateurConnecté) {
                    sendPaymentNotification(utilisateurConnecté.nom, utilisateurConnecté.phone, utilisateurConnecté.email);
                }

                window.location.href = "index.html";
            });
        },
        onError: function(err) {
            console.error("Erreur de paiement :", err);
            alert("Une erreur est survenue lors du paiement.");
        }
    }).render('#paypal-button-container');
}

function chargerPaypalSDK() {
    const script = document.createElement("script");
    script.src = "https://www.paypal.com/sdk/js?client-id=ActOWDtEW7VcCkWDjChLthGFW3vlmi_AnhWBjGEk2nL7hYsCQ6O03H64tDXX6PliIW39E-OgIx1XQypx&currency=USD";
    script.onload = () => {
        console.log("SDK PayPal chargé avec succès.");
        afficherPaypalButton();
    };
    script.onerror = () => {
        console.error("Erreur lors du chargement du SDK PayPal.");
    };
    document.body.appendChild(script);
}

function envoyerCommentaire(index) {
    const commentaire = document.getElementById(`commentaire-${index}`).value;
    if (commentaire.trim() !== "") {
        let panier = JSON.parse(localStorage.getItem("panier")) || [];
        panier[index].commentaire = commentaire;
        localStorage.setItem("panier", JSON.stringify(panier));
        alert("Commentaire enregistré !");
    } else {
        alert("Veuillez écrire un commentaire avant de l'envoyer.");
    }
}

function viderPanier() {
    localStorage.removeItem("panier");
    afficherPanier();
}

function sendEmailNotification(templateParams) {
    emailjs.send('marc1304', 'xWUbde1iLkdZs4edGGzyQ', templateParams)
        .then(function(response) {
            console.log('Succès !', response.status);
        }, function(error) {
            console.error('Erreur :', error);
        });
}

function sendPaymentNotification(name, phone, email) {
    const templateParams = {
        user_name: name,
        user_phone: phone,
        user_email: email
    };
    sendEmailNotification(templateParams);
}

function sendCartNotification(name, product) {
    const templateParams = {
        user_name: name,
        product_name: product
    };
    sendEmailNotification(templateParams);
}

function afficherUtilisateurs() {
    const utilisateursContainer = document.getElementById("utilisateurs-container");
    if (!utilisateursContainer) return;

    let utilisateurs = JSON.parse(localStorage.getItem("utilisateurs")) || [];
    utilisateursContainer.innerHTML = "";
    if (utilisateurs.length === 0) {
        utilisateursContainer.innerHTML = "<p>Aucun utilisateur inscrit pour le moment.</p>";
        return;
    }
    utilisateurs.forEach(utilisateur => {
        const div = document.createElement("div");
        div.classList.add("utilisateur");
        div.innerHTML = `
            <p><strong>Nom:</strong> ${utilisateur.nom}</p>
            <p><strong>Téléphone:</strong> ${utilisateur.telephone}</p>
            <p><strong>Pays:</strong> ${utilisateur.pays}</p>
            <p><strong>Email:</strong> ${utilisateur.email}</p>
            <p><strong>Adresse:</strong> ${utilisateur.adresse}</p>
        `;
        utilisateursContainer.appendChild(div);
    });
}

// Nouvelle fonction pour afficher les commentaires
async function afficherCommentaires() {
    try {
        const response = await fetch('/api/commentaires');
        const commentaires = await response.json();

        const commentairesContainer = document.getElementById("commentaires-container");
        if (!commentairesContainer) return;

        commentairesContainer.innerHTML = "";

        if (commentaires.length === 0) {
            commentairesContainer.innerHTML = "<p>Aucun commentaire pour le moment.</p>";
            return;
        }

        commentaires.forEach(commentaire => {
            const div = document.createElement("div");
            div.classList.add("commentaire");
            div.innerHTML = `
                <p><strong>Utilisateur:</strong> ${commentaire.nomUtilisateur}</p>
                <p><strong>Commentaire:</strong> ${commentaire.commentaire}</p>
                <p><strong>Date:</strong> ${new Date(commentaire.date_ajout).toLocaleString()}</p>
            `;
            commentairesContainer.appendChild(div);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des commentaires :', error);
    }
}

function getElementOrThrow(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.error(`L'élément avec l'ID ${id} est introuvable.`);
        return null;
    }
    return element;
}
