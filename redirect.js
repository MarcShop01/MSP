// Fonctionnalité de redirection vers marcshop.com
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si nous sommes sur l'ancien domaine
    if (window.location.hostname.includes('github.io')) {
        const redirectBanner = document.getElementById('redirectBanner');
        const redirectTimer = document.getElementById('redirectTimer');
        const redirectNow = document.getElementById('redirectNow');
        const cancelRedirect = document.getElementById('cancelRedirect');
        
        // Afficher la bannière de redirection
        redirectBanner.style.display = 'block';
        
        // Démarrer le compte à rebours
        let seconds = 5;
        const countdown = setInterval(function() {
            seconds--;
            redirectTimer.textContent = seconds;
            
            if (seconds <= 0) {
                clearInterval(countdown);
                window.location.href = 'https://marcshop.com';
            }
        }, 1000);
        
        // Redirection immédiate si on clique sur le bouton
        redirectNow.addEventListener('click', function() {
            clearInterval(countdown);
            window.location.href = 'https://marcshop.com';
        });
        
        // Annuler la redirection
        cancelRedirect.addEventListener('click', function() {
            clearInterval(countdown);
            redirectBanner.style.display = 'none';
            
            // Stocker dans le localStorage que l'utilisateur a choisi de rester
            localStorage.setItem('skipRedirect', 'true');
        });
    }
});