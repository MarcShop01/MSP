document.addEventListener("DOMContentLoaded", () => {
    initialiserEmailJS();
    chargerProduits();
    afficherCommentaires();
    afficherNotifications();
    chargerPaypalSDK();
});

// Initialiser EmailJS
function initialiserEmailJS() {
    emailjs.init("JxX982TUPjSDpIlYg"); // Remplacez par votre ID utilisateur EmailJS
}

// Charger les produits depuis produits.json
function chargerProduits() {
    fetch('produits.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur de réseau');
            }
            return response.json();
        })
        .then(data => {
            const produitsContainer = document.getElementById("produits-list");
            if (produitsContainer) {
                produitsContainer.innerHTML = ""; // Effacer le contenu précédent
                data.forEach(produit => {
                    const produitDiv = document.createElement("div");
                    produitDiv.classList.add("produit");
                    produitDiv.innerHTML = `
                        <img src="${produit.image}" alt="${produit.nom}" onclick="showModal('${produit.image}', '${produit.description}')">
                        <h3>${produit.nom}</h3>
                        <p>${produit.prix} $</p>
                        <button class="ajouter-panier" onclick='ajouterAuPanier(${JSON.stringify(produit)})'>Ajouter au panier</button>
                    `;
                    produitsContainer.appendChild(produitDiv);
                });
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            const produitsContainer = document.getElementById("produits-list");
            if (produitsContainer) {
                produitsContainer.innerHTML = `<p class="error">Erreur lors du chargement des produits : ${error.message}</p>`;
            }
        });
}

// Afficher les commentaires depuis l'API
async function afficherCommentaires() {
    try {
        const response = await fetch('/api/commentaires');
        const commentaires = await response.json();

        const commentairesList = document.getElementById("commentaires-list");
        if (!commentairesList) return;

        commentairesList.innerHTML = "";

        if (commentaires.length === 0) {
            commentairesList.innerHTML = "<p>Aucun commentaire pour le moment.</p>";
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
            commentairesList.appendChild(div);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des commentaires :', error);
    }
}

// Afficher les notifications depuis l'API
async function afficherNotifications() {
    try {
        const response = await fetch('/api/notifications');
        const notifications = await response.json();

        const notificationsList = document.getElementById("notifications-list");
        if (!notificationsList) return;

        notificationsList.innerHTML = "";

        if (notifications.length === 0) {
            notificationsList.innerHTML = "<p>Aucune notification pour le moment.</p>";
            return;
        }

        notifications.forEach(notification => {
            const div = document.createElement("div");
            div.classList.add("notification");
            div.innerHTML = `
                <p><strong>Utilisateur:</strong> ${notification.nomUtilisateur}</p>
                <p><strong>Message:</strong> ${notification.message}</p>
                <p><strong>Date:</strong> ${new Date(notification.date_notification).toLocaleString()}</p>
            `;
            notificationsList.appendChild(div);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des notifications :', error);
    }
}

// Ajouter un produit au panier
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

// Afficher la modale
function showModal(imgSrc, description) {
    const modal = document.getElementById("modal");
    const modalImg = document.getElementById("modalImage");
    const captionText = document.getElementById("caption");

    if (modal && modalImg && captionText) {
        modal.style.display = "block";
        modalImg.src = imgSrc;
        captionText.innerHTML = description;
    }
}

// Fermer la modale
function closeModal() {
    const modal = document.getElementById("modal");
    if (modal) {
        modal.style.display = "none";
    }
}

// Charger le SDK PayPal
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

// Afficher le bouton PayPal
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

// Calculer le total du panier
function calculerTotal() {
    const totalPanierElement = document.getElementById("total-panier");
    let panier = JSON.parse(localStorage.getItem("panier")) || [];
    let total = panier.reduce((sum, produit) => sum + parseFloat(produit.prix), 0);
    totalPanierElement.textContent = `${total.toFixed(2)} $`;
    return total.toFixed(2);
}

// Envoyer une notification par e-mail
function sendEmailNotification(templateParams) {
    emailjs.send('marc1304', 'xWUbde1iLkdZs4edGGzyQ', templateParams)
        .then(function(response) {
            console.log('Succès !', response.status);
        }, function(error) {
            console.error('Erreur :', error);
        });
}

// Envoyer une notification de paiement
function sendPaymentNotification(name, phone, email) {
    const templateParams = {
        user_name: name,
        user_phone: phone,
        user_email: email
    };
    sendEmailNotification(templateParams);
}

// Envoyer une notification d'ajout au panier
function sendCartNotification(name, product) {
    const templateParams = {
        user_name: name,
        product_name: product
    };
    sendEmailNotification(templateParams);
}
