document.getElementById("signup-form").addEventListener("submit", async function (event) {
    event.preventDefault();

    const nom = document.getElementById("nom").value;
    const telephone = document.getElementById("telephone").value;
    const pays = document.getElementById("pays").value;
    const email = document.getElementById("email").value;
    const adresse = document.getElementById("adresse").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch('https://votre-api-en-ligne.com/api/inscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nom, telephone, pays, email, adresse, password }),
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }

        const data = await response.json();
        console.log("Inscription réussie :", data);
        alert("Inscription réussie !");
        window.location.href = "login.html";
    } catch (error) {
        console.error("Erreur lors de l'inscription :", error);
        alert("Une erreur est survenue. Vérifiez votre connexion ou contactez le support.");
    }
});
