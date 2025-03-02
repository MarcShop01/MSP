document.addEventListener("DOMContentLoaded", () => {
    initialiserEmailJS();
    chargerProduits();
    afficherPanier();
});

// Initialiser EmailJS
function initialiserEmailJS() {
    emailjs.init("s34yGCgjKesaY6sk_"); // Remplacez par votre User ID EmailJS
}

// Charger les produits depuis produits.json
function chargerProduits() {
    fetch('produits.json')
        .then(response => response.json())
        .then(data => {
            const produitsContainer = document.getElementById("produits-list");
            if (produitsContainer) {
                produitsContainer.innerHTML = "";
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
        .catch(error => console.error('Erreur:', error));
}

// Ajouter un produit au panier
function ajouterAuPanier(produit) {
    let panier = JSON.parse(localStorage.getItem("panier")) || [];
    panier.push({ ...produit, couleur: "", taille: "", mesure: "" }); // Ajouter des champs pour la personnalisation
    localStorage.setItem("panier", JSON.stringify(panier));
    afficherPanier();
    envoyerNotificationEmail(
        "Nouveau produit ajouté au panier",
        `Le produit "${produit.nom}" a été ajouté au panier.`
    );
}

// Afficher le panier
function afficherPanier() {
    const panier = JSON.parse(localStorage.getItem("panier")) || [];
    const panierContainer = document.getElementById("panier-list");
    const totalPanierElement = document.getElementById("total-panier");

    if (panierContainer) {
        panierContainer.innerHTML = "";

        panier.forEach((produit, index) => {
            const produitDiv = document.createElement("div");
            produitDiv.classList.add("produit-panier");
            produitDiv.innerHTML = `
                <h3>${produit.nom}</h3>
                <p>Prix : ${produit.prix} $</p>
                <form class="form-personnalisation" onsubmit="enregistrerPersonnalisation(event, ${index})">
                    <label for="couleur-${index}">Couleur :</label>
                    <input type="text" id="couleur-${index}" value="${produit.couleur}" required>
                    <label for="taille-${index}">Taille :</label>
                    <input type="text" id="taille-${index}" value="${produit.taille}" required>
                    <label for="mesure-${index}">Mesure :</label>
                    <input type="text" id="mesure-${index}" value="${produit.mesure}" required>
                    <button type="submit">Enregistrer</button>
                </form>
                <button onclick="supprimerDuPanier(${index})">Supprimer</button>
            `;
            panierContainer.appendChild(produitDiv);
        });

        if (totalPanierElement) {
            const total = panier.reduce((sum, produit) => sum + parseFloat(produit.prix), 0);
            totalPanierElement.textContent = `${total.toFixed(2)} $`;
        }

        // Ajouter un bouton "Payer"
        if (panier.length > 0) {
            const payerButton = document.createElement("button");
            payerButton.textContent = "Payer";
            payerButton.classList.add("payer-btn");
            payerButton.onclick = effectuerPaiement;
            panierContainer.appendChild(payerButton);
        }
    }
}

// Enregistrer les options de personnalisation
function enregistrerPersonnalisation(event, index) {
    event.preventDefault();
    const panier = JSON.parse(localStorage.getItem("panier")) || [];
    panier[index].couleur = document.getElementById(`couleur-${index}`).value;
    panier[index].taille = document.getElementById(`taille-${index}`).value;
    panier[index].mesure = document.getElementById(`mesure-${index}`).value;
    localStorage.setItem("panier", JSON.stringify(panier));
    alert("Options enregistrées !");
}

// Supprimer un produit du panier
function supprimerDuPanier(index) {
    let panier = JSON.parse(localStorage.getItem("panier")) || [];
    panier.splice(index, 1);
    localStorage.setItem("panier", JSON.stringify(panier));
    afficherPanier();
}

// Effectuer un paiement
function effectuerPaiement() {
    const panier = JSON.parse(localStorage.getItem("panier")) || [];
    const total = panier.reduce((sum, produit) => sum + parseFloat(produit.prix), 0);

    // Simuler un nom d'utilisateur (vous pouvez remplacer par une authentification réelle)
    const utilisateur = { nom: "Utilisateur Test", email: "utilisateur@example.com" };

    // Envoyer une notification par e-mail
    envoyerNotificationEmail(
        "Paiement effectué",
        `Un paiement de ${total.toFixed(2)} $ a été effectué par ${utilisateur.nom}.\n\nDétails du panier :\n${panier.map(produit => `- ${produit.nom} (${produit.prix} $)`).join("\n")}`
    );

    // Vider le panier après le paiement
    localStorage.removeItem("panier");
    afficherPanier();
    alert("Paiement effectué avec succès !");
}

// Envoyer une notification par e-mail
function envoyerNotificationEmail(sujet, message) {
    const templateParams = {
        to_email: "marcshop0705@gmail.com", // Remplacez par votre adresse e-mail
        subject: sujet,
        message: message,
    };

    emailjs.send("marc1304", "template_zvo5tzs", templateParams) // Remplacez par vos IDs
        .then(response => console.log("E-mail envoyé !", response.status))
        .catch(error => console.error("Erreur :", error));
}
