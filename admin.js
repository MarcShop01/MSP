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

messaging.requestPermission()
    .then(() => getToken(messaging))
    .then((token) => {
        console.log("Token de notification : ", token);
    })
    .catch((err) => {
        console.error("Erreur lors de la demande de permission de notification : ", err);
    });

onMessage(messaging, (payload) => {
    console.log('Message reçu. ', payload);
});
