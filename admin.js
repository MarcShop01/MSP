// Inclure Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-messaging.js";

// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBbWrhfvhFU7rxUqcwaXa0FF2C-f7Ti3Sk",
    authDomain: "marcshop-3a594.firebaseapp.com",
    projectId: "marcshop-3a594",
    storageBucket: "marcshop-3a594.firebasestorage.app",
    messagingSenderId: "330349520113",
    appId: "1:330349520113:web:24dcf3869c616e14b8f550"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser Firebase Cloud Messaging
const messaging = getMessaging(app);

// Demander la permission pour envoyer des notifications
messaging.requestPermission()
    .then(() => getToken(messaging))
    .then((token) => {
        console.log("Token de notification : ", token);
        // Envoyer le token au serveur ou l'utiliser pour l'enregistrement des notifications
    })
    .catch((err) => {
        console.error("Erreur lors de la demande de permission de notification : ", err);
    });

// Recevoir les messages en arrière-plan
onMessage(messaging, (payload) => {
    console.log('Message reçu. ', payload);
    // Personnaliser l'affichage des notifications ici
});
