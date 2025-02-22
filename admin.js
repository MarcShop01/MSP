import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-messaging.js";

const firebaseConfig = {
    apiKey: "AIzaSyBbWrhfvhFU7rxUqcwaXa0FF2C-f7Ti3Sk",
    authDomain: "marcshop-3a594.firebaseapp.com",
    projectId: "marcshop-3a594",
    storageBucket: "marcshop-3a594.firebasestorage.app",
    messagingSenderId: "330349520113",
    appId: "1:330349520113:web:24dcf3869c616e14b8f550"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Vérifier la permission de notification
if (Notification.permission === 'granted') {
    // Obtenir le jeton de notification
    getToken(messaging, { vapidKey: 'VOTRE_VAPID_KEY' }).then((token) => {
        console.log("Token de notification : ", token);
        // Envoyer le token au serveur ou l'utiliser pour l'enregistrement des notifications
    }).catch((err) => {
        console.error("Erreur lors de l'obtention du token de notification : ", err);
    });
} else if (Notification.permission !== 'denied') {
    // Demander la permission de notification
    Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
            // Obtenir le jeton de notification
            getToken(messaging, { vapidKey: 'VOTRE_VAPID_KEY' }).then((token) => {
                console.log("Token de notification : ", token);
                // Envoyer le token au serveur ou l'utiliser pour l'enregistrement des notifications
            }).catch((err) => {
                console.error("Erreur lors de l'obtention du token de notification : ", err);
            });
        }
    });
}

// Recevoir les messages en arrière-plan
onMessage(messaging, (payload) => {
    console.log('Message reçu. ', payload);
    // Personnaliser l'affichage des notifications ici
});

// Afficher les utilisateurs, commentaires, et notifications dans l'interface d'administration
document.addEventListener("DOMContentLoaded", () => {
    afficherUtilisateurs();
    afficherCommentaires();
    fetchNotifications();

    // Rafraîchir les notifications toutes les 30 secondes
    setInterval(fetchNotifications, 30000);
});

function afficherUtilisateurs() {
    const utilisateursContainer = document.getElementById("utilisateurs-container");

    let utilisateurs = JSON.parse(localStorage.getItem("utilisateurs")) || [];
    utilisateursContainer.innerHTML = "";
    
    if (utilisateurs.length === 0) {
        utilisateursContainer.innerHTML = "<p>Aucun utilisateur inscrit pour le moment.</p>";
        return;
    }

    utilisateurs.forEach(utilisateur => {
        let div = document.createElement("div");
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

function afficherCommentaires() {
    const commentairesContainer = document.getElementById("commentaires-container");

    let commentaires = JSON.parse(localStorage.getItem("commentaires")) || [];
    commentairesContainer.innerHTML = "";
    
    if (commentaires.length === 0) {
        commentairesContainer.innerHTML = "<p>Aucun commentaire envoyé pour le moment.</p>";
        return;
    }

    commentaires.forEach(comment => {
        let div = document.createElement("div");
        div.classList.add("commentaire");
        div.innerHTML = `
            <p><strong>Nom Utilisateur:</strong> ${comment.nomUtilisateur}</p>
            <p><strong>Produit ID ${comment.index}:</strong></p>
            <p>${comment.commentaire}</p>
        `;
        commentairesContainer.appendChild(div);
    });
}

function fetchNotifications() {
    fetch('http://localhost:3000/get-notifications')
        .then(response => response.text())
        .then(data => {
            document.getElementById('notifications').innerHTML = data;
        })
        .catch(error => console.error('Erreur:', error));
}
