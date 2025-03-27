document.addEventListener("DOMContentLoaded", () => {
    initialiserEmailJS();
    chargerProduits();
});

// Initialiser EmailJS
function initialiserEmailJS() {
    emailjs.init("s34yGCgjKesaY6sk_"); // Remplacez par votre User ID EmailJS
}

// Variable globale pour stocker les produits
let tousLesProduits = [];

// Charger les produits depuis produits.json
function chargerProduits() {
    fetch('produits.json')
        .then(response => response.json())
        .then(data => {
            tousLesProduits = data; // Sauvegarde pour la recherche
            afficherProduits(data);
        })
        .catch(error => console.error('Erreur:', error));
}

// Afficher les produits dans le DOM
function afficherProduits(produits) {
    const produitsContainer = document.getElementById("produits-list");
    if (produitsContainer) {
        produitsContainer.innerHTML = "";
        produits.forEach(produit => {
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
}

// Gérer la recherche de produits
function handleSearch(event) {
    event.preventDefault();
    const searchTerm = document.getElementById("search-input").value.toLowerCase();
    const produitsFiltres = tousLesProduits.filter(produit => 
        produit.nom.toLowerCase().includes(searchTerm) || 
        produit.description.toLowerCase().includes(searchTerm)
    );
    afficherProduits(produitsFiltres);
}

// Ajouter un produit au panier (inchangé)
function ajouterAuPanier(produit) {
    let panier = JSON.parse(localStorage.getItem("panier")) || [];
    panier.push({ ...produit, couleur: "", taille: "", mesure: "" });
    localStorage.setItem("panier", JSON.stringify(panier));
    envoyerNotificationEmail(
        "Nouveau produit ajouté au panier",
        `Le produit "${produit.nom}" a été ajouté au panier.`
    );
}

// Envoyer une notification par e-mail (inchangé)
function envoyerNotificationEmail(sujet, message) {
    const templateParams = {
        to_email: "marcshop0705@gmail.com",
        subject: sujet,
        message: message,
    };
    emailjs.send("marc1304", "template_zvo5tzs", templateParams)
        .then(response => console.log("E-mail envoyé !", response.status))
        .catch(error => console.error("Erreur :", error));
}

// Modale (inchangé)
function showModal(imageSrc, description) {
    const modal = document.getElementById("modal");
    const modalImage = document.getElementById("modalImage");
    const caption = document.getElementById("caption");
    modal.style.display = "block";
    modalImage.src = imageSrc;
    caption.textContent = description;
}

function closeModal() {
    const modal = document.getElementById("modal");
    modal.style.display = "none";
}
