document.addEventListener("DOMContentLoaded", () => {
    // Initialiser EmailJS
    initialiserEmailJS();

    // Afficher les produits
    const produitsContainer = document.getElementById('produits-container');
    if (produitsContainer) {
        chargerProduits(produitsContainer);
    } else {
        afficherPanier();
    }

    // Afficher les utilisateurs connectés sur la page d'administration
    afficherUtilisateurs();

    // Charger le SDK PayPal
    chargerPaypalSDK();
});

// Fonction pour initialiser EmailJS
function initialiserEmailJS() {
    emailjs.init("JxX982TUPjSDpIlYg");
}

// Fonction pour charger les produits depuis le fichier JSON
function chargerProduits(container) {
    fetch('produits.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur de réseau ou fichier introuvable.');
            }
            return response.json();
        })
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

                container.appendChild(produitDiv);
            });
        })
        .catch(error => {
            console.error('Erreur:', error);
            if (container) {
                container.innerHTML = `<p class="error">Erreur lors du chargement des produits : ${error.message}</p>`;
            }
        });
}

// Fonction pour afficher la modal
function showModal(imgSrc, description) {
    const modal = document.getElementById("modal");
    if (!modal) return;

    const modalImg = document.getElementById("modalImage");
    const captionText = document.getElementById("caption");

    modal.style.display = "block";
    modalImg.src = imgSrc;
    captionText.innerHTML = description;
}

// Fonction pour fermer la modal
function closeModal() {
    const modal = document.getElementById("modal");
    if (modal) {
        modal.style.display = "none";
    }
}

// Fonction pour ajouter un produit au panier
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

// Fonction pour afficher le panier
function afficherPanier() {
    const panierContainer = getElementOrThrow("panier-container");
    const totalPanierElement = getElementOrThrow("total-panier");
    const panierCountElement = getElementOrThrow("panier-count");
    const paypalContainer = getElementOrThrow("paypal-button-container");

    const utilisateurConnecté = JSON.parse(localStorage.getItem("utilisateurConnecté"));
    if (!utilisateurConnecté) {
        alert("Vous devez être connecté pour accéder à la page de paiement.");
        window.location.href = "login.html";
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

// Fonction pour afficher les produits dans le panier
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

// Fonction pour calculer le total du panier
function calculerTotal() {
    const totalPanierElement = getElementOrThrow("total-panier");
    let panier = JSON.parse(localStorage.getItem("panier")) || [];
    let total = panier.reduce((sum, produit) => sum + parseFloat(produit.prix), 0);
    totalPanierElement.textContent = `${total.toFixed(2)} $`;
    return total.toFixed(2);
}

// Fonction pour supprimer un produit du panier
function supprimerProduit(index) {
    let panier = JSON.parse(localStorage.getItem("panier")) || [];
    panier.splice(index, 1);
    localStorage.setItem("panier", JSON.stringify(panier));
    afficherPanier();
}

// Fonction pour afficher le bouton PayPal
function afficherPaypalButton() {
    const paypalContainer = document.getElementById("paypal-button-container");

    // Vérifier si l'élément conteneur existe
    if (!paypalContainer) {
        console.error("Le conteneur PayPal est introuvable.");
        return;
    }

    // Vérifier si le SDK PayPal est chargé
    if (typeof paypal === 'undefined') {
        console.error("Le SDK PayPal n'est pas chargé.");
        paypalContainer.innerHTML = "<p class='error'>Le service de paiement est temporairement indisponible.</p>";
        return;
    }

    // Vérifier si le panier est vide
    let panier = JSON.parse(localStorage.getItem("panier")) || [];
    if (panier.length === 0) {
        paypalContainer.style.display = "none";
        return;
    }

    // Afficher le bouton PayPal
    paypalContainer.style.display = "block";
    paypalContainer.innerHTML = ""; // Vider le contenu précédent

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
            alert("Une erreur est survenue lors du paiement.");
        }
    }).render('#paypal-button-container');

    // Surveiller les modifications du DOM pour le conteneur PayPal
    const observer = new MutationObserver((mutationsList) => {
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList') {
                const containerStillExists = document.getElementById("paypal-button-container");
                if (!containerStillExists) {
                    console.warn("Le conteneur PayPal a été supprimé du DOM.");
                    observer.disconnect(); // Arrêter d'observer
                    // Recharger le bouton PayPal si le conteneur est réajouté
                    setTimeout(() => {
                        if (document.getElementById("paypal-button-container")) {
                            afficherPaypalButton();
                        }
                    }, 500); // Vérifier après 500 ms
                }
            }
        }
    });

    // Démarrer l'observation du conteneur PayPal
    observer.observe(paypalContainer, { childList: true, subtree: true });
}

// Fonction pour charger le SDK PayPal
function chargerPaypalSDK() {
    const script = document.createElement("script");
    script.src = "https://www.paypal.com/sdk/js?client-id=ActOWDtEW7VcCkWDjChLthGFW3vlmi_AnhWBjGEk2nL7hYsCQ6O03H64tDXX6PliIW39E-OgIx1XQypx";
    script.onload = () => {
        console.log("SDK PayPal chargé avec succès.");
        afficherPaypalButton();
    };
    script.onerror = () => {
        console.error("Erreur lors du chargement du SDK PayPal.");
    };
    document.body.appendChild(script);
}

// Fonction pour envoyer un commentaire
function envoyerCommentaire(index) {
    const textarea = document.getElementById(`commentaire-${index}`);
    const commentaire = textarea.value;

    let panier = JSON.parse(localStorage.getItem("panier")) || [];
    panier[index].commentaire = commentaire;
    localStorage.setItem("panier", JSON.stringify(panier));
    alert("Commentaire enregistré !");
}

// Fonction pour vider le panier
function viderPanier() {
    localStorage.removeItem("panier");
    afficherPanier();
}

// Fonction pour envoyer une notification par email
function sendEmailNotification(templateParams) {
    emailjs.send(marc1304'', 'xWUbde1iLkdZs4edGGzyQ', templateParams)
        .then(function(response) {
            console.log('Succès !', response.status);
        }, function(error) {
            console.error('Erreur :', error);
        });
}

// Fonction pour envoyer une notification de paiement
function sendPaymentNotification(name, phone, email) {
    const templateParams = {
        user_name: name,
        user_phone: phone,
        user_email: email
    };
    sendEmailNotification(templateParams);
}

// Fonction pour envoyer une notification d'ajout au panier
function sendCartNotification(name, product) {
    const templateParams = {
        user_name: name,
        product_name: product
    };
    sendEmailNotification(templateParams);
}

// Fonction pour afficher les utilisateurs connectés
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

// Fonction utilitaire pour récupérer un élément ou lever une erreur
function getElementOrThrow(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`L'élément avec l'ID ${id} est introuvable.`);
    }
    return element;
}
