// Initialisation EmailJS
emailjs.init("s34yGCgjKesaY6sk_");

document.addEventListener("DOMContentLoaded", function() {
    // Éléments du DOM
    const contenuPanier = document.getElementById("contenu-panier");
    const boutonVider = document.getElementById("vider-panier");
    const totalPanierElement = document.getElementById("total-panier");
    const totalProduitsElement = document.getElementById("total-produits");
    const commentaireForm = document.getElementById("commentaire-form");
    const paypalContainer = document.getElementById("paypal-button-container");

    // Récupérer le panier depuis localStorage
    let panier = JSON.parse(localStorage.getItem("panier")) || [];

    // Afficher le panier au chargement
    afficherPanier();

    // Fonction pour afficher le panier
    function afficherPanier() {
        contenuPanier.innerHTML = "";
        totalProduitsElement.textContent = panier.length;

        if (panier.length === 0) {
            contenuPanier.innerHTML = '<p class="panier-vide">Votre panier est vide</p>';
            totalPanierElement.textContent = "0.00";
            paypalContainer.innerHTML = "";
            return;
        }

        // Afficher chaque produit
        panier.forEach((produit, index) => {
            const produitElement = document.createElement("div");
            produitElement.className = "produit-panier";
            produitElement.innerHTML = `
                <img src="${produit.image || 'images/default-product.jpg'}" alt="${produit.nom}" class="produit-image">
                <div class="details">
                    <h3>${produit.nom}</h3>
                    <p class="price">${parseFloat(produit.prix).toFixed(2)} $</p>
                    ${produit.description ? `<p class="description">${produit.description}</p>` : ''}
                    <button class="retirer-produit" data-index="${index}">
                        <i class="fas fa-trash"></i> Retirer
                    </button>
                </div>
            `;
            contenuPanier.appendChild(produitElement);
        });

        // Calculer et afficher le total
        calculerTotal();

        // Initialiser PayPal si des produits sont dans le panier
        if (panier.length > 0) {
            initialiserPayPal();
        }
    }

    // Calculer le total du panier
    function calculerTotal() {
        const total = panier.reduce((sum, produit) => sum + parseFloat(produit.prix), 0);
        totalPanierElement.textContent = total.toFixed(2);
        return total;
    }

    // Supprimer un produit du panier
    window.supprimerProduit = function(index) {
        panier.splice(index, 1);
        localStorage.setItem("panier", JSON.stringify(panier));
        afficherPanier();
        showNotification("Produit retiré du panier");
    };

    // Vider complètement le panier
    function viderPanier() {
        panier = [];
        localStorage.removeItem("panier");
        afficherPanier();
        showNotification("Panier vidé");
    }

    // Initialiser PayPal
    function initialiserPayPal() {
        paypalContainer.innerHTML = "";

        if (typeof paypal === 'undefined') {
            console.error("PayPal SDK non chargé");
            showNotification("Erreur de paiement - Rechargez la page");
            return;
        }

        const total = calculerTotal();
        const items = panier.map(produit => ({
            name: produit.nom,
            unit_amount: {
                currency_code: "USD",
                value: parseFloat(produit.prix).toFixed(2)
            },
            quantity: "1"
        }));

        paypal.Buttons({
            style: {
                layout: 'vertical',
                color: 'gold',
                shape: 'rect',
                label: 'paypal'
            },
            createOrder: function(data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            currency_code: "USD",
                            value: total.toFixed(2),
                            breakdown: {
                                item_total: {
                                    currency_code: "USD",
                                    value: total.toFixed(2)
                                }
                            }
                        },
                        items: items
                    }]
                });
            },
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    envoyerConfirmationCommande(details);
                    viderPanier();
                    showNotification("Paiement réussi! Redirection...");
                    setTimeout(() => {
                        window.location.href = "suivi.html?payment_id=" + details.id;
                    }, 2000);
                });
            },
            onError: function(err) {
                console.error("Erreur PayPal:", err);
                showNotification("Erreur lors du paiement: " + err.message);
            }
        }).render(paypalContainer);
    }

    // Envoyer la confirmation de commande
    function envoyerConfirmationCommande(details) {
        const formData = {
            client_nom: document.getElementById("nom").value || "Non spécifié",
            client_email: document.getElementById("email").value || "Non spécifié",
            client_telephone: document.getElementById("telephone").value || "Non spécifié",
            client_adresse: `
                ${document.getElementById("adresse").value || ''}
                ${document.getElementById("ville").value || ''}
                ${document.getElementById("pays").value || ''}
            `,
            commande: JSON.stringify(panier),
            total: calculerTotal().toFixed(2),
            paypal_id: details.id,
            date: new Date().toLocaleString(),
            commentaire: document.getElementById("commentaire").value || "Aucun commentaire"
        };

        emailjs.send("marc1304", "template_zvo5tzs", formData)
            .then(() => console.log("Email de confirmation envoyé"))
            .catch(error => console.error("Erreur d'envoi d'email:", error));
    }

    // Gestion du formulaire
    commentaireForm.addEventListener("submit", function(e) {
        e.preventDefault();
        
        // Validation des champs requis
        const requiredFields = ["nom", "email", "telephone", "pays", "ville", "adresse"];
        let isValid = true;
        
        requiredFields.forEach(field => {
            const element = document.getElementById(field);
            if (!element.value.trim()) {
                element.style.borderColor = "var(--red)";
                isValid = false;
            } else {
                element.style.borderColor = "";
            }
        });
        
        if (!isValid) {
            showNotification("Veuillez remplir tous les champs obligatoires");
            return;
        }
        
        // Préparer les données du formulaire
        const formData = {
            sujet: "Nouvelle commande MarcShop",
            message: `
                Informations client:
                Nom: ${document.getElementById("nom").value}
                Email: ${document.getElementById("email").value}
                Téléphone: ${document.getElementById("telephone").value}
                
                Adresse:
                ${document.getElementById("adresse").value}
                ${document.getElementById("ville").value}
                ${document.getElementById("pays").value}
                
                Détails de la commande:
                ${panier.map(p => `- ${p.nom} (${parseFloat(p.prix).toFixed(2)}$)`).join('\n')}
                
                Total: ${calculerTotal().toFixed(2)}$
                
                Commentaire:
                ${document.getElementById("commentaire").value || "Aucun commentaire"}
            `
        };
        
        // Envoyer l'email
        emailjs.send("marc1304", "template_zvo5tzs", formData)
            .then(() => {
                showNotification("Informations enregistrées avec succès!");
                commentaireForm.reset();
            })
            .catch(error => {
                console.error("Erreur d'envoi:", error);
                showNotification("Erreur lors de l'envoi des informations");
            });
    });

    // Afficher une notification
    function showNotification(message) {
        const notification = document.getElementById("notification");
        if (notification) {
            notification.textContent = message;
            notification.classList.add("show");
            setTimeout(() => {
                notification.classList.remove("show");
            }, 3000);
        } else {
            alert(message);
        }
    }

    // Événements
    contenuPanier.addEventListener("click", function(e) {
        if (e.target.closest(".retirer-produit")) {
            const index = e.target.closest(".retirer-produit").dataset.index;
            supprimerProduit(index);
        }
    });

    boutonVider.addEventListener("click", viderPanier);
});
