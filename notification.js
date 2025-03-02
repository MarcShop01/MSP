document.addEventListener("DOMContentLoaded", () => {
    const notificationsContainer = document.getElementById("notifications-container");

    // Fonction pour récupérer les notifications depuis l'API
    async function fetchNotifications() {
        try {
            const response = await fetch('/api/notifications'); // Remplacez par votre endpoint API
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des notifications');
            }
            const notifications = await response.json();

            if (notifications.length === 0) {
                notificationsContainer.innerHTML = "<p>Aucune notification pour le moment.</p>";
                return;
            }

            notificationsContainer.innerHTML = ""; // Effacer le contenu précédent
            notifications.forEach(notification => {
                const div = document.createElement("div");
                div.classList.add("notification");
                div.innerHTML = `
                    <p><strong>Nom Utilisateur:</strong> ${notification.username}</p>
                    <p>${notification.message}</p>
                    <p><small>${new Date(notification.date).toLocaleString()}</small></p>
                `;
                notificationsContainer.appendChild(div);
            });
        } catch (error) {
            console.error('Erreur:', error);
            notificationsContainer.innerHTML = "<p>Erreur lors du chargement des notifications.</p>";
        }
    }

    // Charger les notifications au démarrage
    fetchNotifications();

    // Optionnel : Rafraîchir les notifications toutes les 10 secondes
    setInterval(fetchNotifications, 10000);
});
