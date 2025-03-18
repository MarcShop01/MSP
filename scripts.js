document.addEventListener("DOMContentLoaded", () => {
    initialiserEmailJS();
    chargerProduits();
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
                        <button class="partager-produit" onclick='shareProduct("${produit.nom}", "${produit.prix}", "${produit.image}")'>Partager</button>
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
    envoyerNotificationEmail(
        "Nouveau produit ajouté au panier",
        `Le produit "${produit.nom}" a été ajouté au panier.`
    );
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

// Afficher la modale avec les détails du produit
function showModal(imageSrc, description) {
    const modal = document.getElementById("modal");
    const modalImage = document.getElementById("modalImage");
    const caption = document.getElementById("caption");

    modal.style.display = "block";
    modalImage.src = imageSrc;
    caption.textContent = description;
}

// Fermer la modale
function closeModal() {
    const modal = document.getElementById("modal");
    modal.style.display = "none";
}

// Partager un produit sur les réseaux sociaux
function shareProduct(name, price, image) {
    const message = `Découvrez ${name} pour seulement ${price} ! ${image}`;
    const encodedMessage = encodeURIComponent(message);
    const encodedImage = encodeURIComponent(image);

    // Liens de partage pour chaque réseau
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedImage}`;
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    const tiktokUrl = `https://www.tiktok.com/share?url=${encodedImage}`;
    const instagramUrl = `https://www.instagram.com/?url=${encodedImage}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedMessage}`;

    // Ouvrir les liens dans une nouvelle fenêtre
    window.open(facebookUrl, '_blank');
    window.open(whatsappUrl, '_blank');
    window.open(tiktokUrl, '_blank');
    window.open(instagramUrl, '_blank');
    window.open(twitterUrl, '_blank');
}
