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

// Variables globales pour stocker les détails du produit à partager
let currentProductToShare = null;

// Afficher la modale de sélection des plateformes
function openSharePlatformModal(product) {
    currentProductToShare = product; // Stocker le produit à partager
    const modal = document.getElementById("share-platform-modal");
    modal.style.display = "block";
}

// Fermer la modale de sélection des plateformes
function closeSharePlatformModal() {
    const modal = document.getElementById("share-platform-modal");
    modal.style.display = "none";
}

// Partager sur une plateforme spécifique
function shareOnPlatform(platform) {
    if (!currentProductToShare) return;

    const { name, price, image } = currentProductToShare;

    // URL de votre site (remplacez par l'URL réelle de votre site)
    const siteUrl = "https://marcshop01.github.io/MSP/";

    // Message de partage avec le lien vers votre site
    const message = `Découvrez ${name} pour seulement ${price} ! Visitez notre site : ${siteUrl}`;
    const encodedMessage = encodeURIComponent(message);
    const encodedSiteUrl = encodeURIComponent(siteUrl);

    let shareUrl = "";

    switch (platform) {
        case "facebook":
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedSiteUrl}`;
            break;
        case "whatsapp":
            shareUrl = `https://wa.me/?text=${encodedMessage}`;
            break;
        case "tiktok":
            shareUrl = `https://www.tiktok.com/share?url=${encodedSiteUrl}`;
            break;
        case "instagram":
            shareUrl = `https://www.instagram.com/?url=${encodedSiteUrl}`;
            break;
        case "twitter":
            shareUrl = `https://twitter.com/intent/tweet?text=${encodedMessage}`;
            break;
        default:
            console.error("Plateforme non prise en charge");
            return;
    }

    window.open(shareUrl, '_blank');
    closeSharePlatformModal(); // Fermer la modale après le partage
}

// Mettre à jour la fonction shareProduct pour ouvrir la modale de sélection
function shareProduct(name, price, image) {
    const product = { name, price, image };
    openSharePlatformModal(product);
}
