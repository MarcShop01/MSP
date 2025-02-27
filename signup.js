document.getElementById("signup-form").addEventListener("submit", async function (event) {
    event.preventDefault();

    const nom = document.getElementById("nom").value;
    const telephone = document.getElementById("telephone").value;
    const pays = document.getElementById("pays").value;
    const email = document.getElementById("email").value;
    const adresse = document.getElementById("adresse").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch('/api/inscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nom, telephone, pays, email, adresse, password }),
        });

        const data = await response.json();
        alert(data.message); // Afficher un message de succès ou d'erreur
        window.location.href = "login.html"; // Rediriger vers la page de connexion
    } catch (error) {
        console.error('Erreur lors de l\'inscription :', error);
        alert('Une erreur s\'est produite lors de l\'inscription.');
    }
});
