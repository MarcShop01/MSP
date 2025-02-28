document.addEventListener("DOMContentLoaded", () => {
    const notificationsContainer = document.getElementById("notifications-container");

    // Exemple de récupération des notifications à partir du localStorage
    const notifications = JSON.parse(localStorage.getItem("notifications")) || [];

    if (notifications.length === 0) {
        notificationsContainer.innerHTML = "<p>Aucune notification pour le moment.</p>";
        return;
    }

    notifications.forEach(notification => {
        let div = document.createElement("div");
        div.classList.add("notification");
        div.innerHTML = `
            <p><strong>Nom Utilisateur:</strong> ${notification.username}</p>
            <p>${notification.message}</p>
        `;
        notificationsContainer.appendChild(div);
    });
});
