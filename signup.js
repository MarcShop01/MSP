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

        const text = await response.text();
        console.log("Contenu brut reçu :", text);

        // Vérifiez si le type de contenu est JSON
        const contentType = response.headers.get("Content-Type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("La réponse du serveur n'est pas au format JSON");
        }

        const data = JSON.parse(text);
        console.log("Données JSON parsées :", data);

        if (response.ok) {
            alert(data.message || "Inscription réussie !");
            localStorage.setItem("userEmail", email);
            window.location.href = "login.html";
        } else {
            alert(data.message || "Une erreur s'est produite.");
        }
    } catch (error) {
        console.error("Erreur lors de l'inscription :", error);
        alert("Une erreur est survenue. Veuillez réessayer plus tard.");
    }
});
