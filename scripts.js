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
    afficherCommentaires();
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
    const utilisateurConnecté = JSON.parse(localStorage.getItem("utilisateurConnecté"));
    if (!utilisateurConnecté) {
        alert("Vous devez être connecté pour ajouter un produit au panier.");
        return;
    }

    fetch('/api/panier', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            utilisateur_id: utilisateurConnecté.id,
            produit_id: produit.id,
            quantite: 1
        }),
    })
    .then(response => response.json())
    .then(data => {
        alert("Produit ajouté au panier !");
        sendCartNotification(utilisateurConnecté.nom, produit.nom);
    })
    .catch(error => {
        console.error('Erreur:', error);
        alert("Erreur lors de l'ajout du produit au panier.");
    });
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

    fetch(`/api/panier?utilisateur_id=${utilisateurConnecté.id}`)
        .then(response => response.json())
        .then(panier => {
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
        })
        .catch(error => {
            console.error('Erreur:', error);
            panierContainer.innerHTML = "<p>Erreur lors du chargement du panier.</p>";
        });
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

    const utilisateurConnecté = JSON.parse(localStorage.getItem("utilisateurConnecté"));
    if (!utilisateurConnecté) {
        paypalContainer.style.display = "none";
        return;
    }

    fetch(`/api/panier?utilisateur_id=${utilisateurConnecté.id}`)
        .then(response => response.json())
        .then(panier => {
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

                        fetch('/api/paiements', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                utilisateur_id: utilisateurConnecté.id,
                                montant: calculerTotal(),
                                produits_achetes: panier.map(produit => produit.nom).join(', ')
                            }),
                        })
                        .then(response => response.json())
                        .then(data => {
                            sendPaymentNotification(utilisateurConnecté.nom, utilisateurConnecté.telephone, utilisateurConnecté.email);
                            window.location.href = "index.html";
                        })
                        .catch(error => {
                            console.error('Erreur:', error);
                            alert("Erreur lors de l'enregistrement du paiement.");
                        });
                    });
                },
                onError: function(err) {
                    console.error("Erreur de paiement :", err);
                    alert("Une erreur est survenue lors du paiement.");
                }
            }).render('#paypal-button-container');
        })
        .catch(error => {
            console.error('Erreur:', error);
            paypalContainer.innerHTML = "<p>Erreur lors du chargement du panier.</p>";
        });
}

function envoyerCommentaire(index) {
    const commentaire = document.getElementById(`commentaire-${index}`).value;
    if (commentaire.trim() === "") {
        alert("Veuillez écrire un commentaire avant de l'envoyer.");
        return;
    }

    const utilisateurConnecté = JSON.parse(localStorage.getItem("utilisateurConnecté"));
    if (!utilisateurConnecté) {
        alert("Vous devez être connecté pour envoyer un commentaire.");
        return;
    }

    fetch('/api/commentaires', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            utilisateur_id: utilisateurConnecté.id,
            produit_id: panier[index].id, // Assurez-vous que panier est accessible ici
            commentaire: commentaire
        }),
    })
    .then(response => response.json())
    .then(data => {
        alert("Commentaire enregistré !");
    })
    .catch(error => {
        console.error('Erreur:', error);
        alert("Erreur lors de l'envoi du commentaire.");
    });
}

function viderPanier() {
    localStorage.removeItem("panier");
    afficherPanier();
}

function sendEmailNotification(templateParams) {
    emailjs.send('marc1304', 'xWUbde1iLkdZs4edGGzyQ', templateParams)
        .then(function(response) {
            console.log('Succès !',
