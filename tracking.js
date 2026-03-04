// ============================================
// SYSTÈME DE SUIVI DE COMMANDE MARC SHOP
// Version complète et corrigée
// ============================================

// ============================================
// CONFIGURATION DES TRANSPORTEURS
// ============================================

const CARRIERS = {
    temu: {
        name: "Temu",
        logo: "https://logodownload.org/wp-content/uploads/2024/01/temu-logo.png",
        trackingUrl: "https://www.temu.com/tracking?order=",
    },
    shein: {
        name: "SHEIN",
        logo: "https://logodownload.org/wp-content/uploads/2020/04/shein-logo-0.png",
        trackingUrl: "https://www.shein.com/tracking?order=",
    },
    aliexpress: {
        name: "AliExpress",
        logo: "https://logodownload.org/wp-content/uploads/2019/08/aliexpress-logo.png",
        trackingUrl: "https://track.aliexpress.com/tracking?order=",
    },
    dhl: {
        name: "DHL",
        logo: "https://logodownload.org/wp-content/uploads/2017/02/dhl-logo-0.png",
        trackingUrl: "https://www.dhl.com/fr-fr/home/suivi.html?tracking-id=",
    },
    fedex: {
        name: "FedEx",
        logo: "https://logodownload.org/wp-content/uploads/2017/02/fedex-logo-0.png",
        trackingUrl: "https://www.fedex.com/fr-fr/tracking.html?trackingnumbers=",
    },
    ups: {
        name: "UPS",
        logo: "https://logodownload.org/wp-content/uploads/2017/02/ups-logo-0.png",
        trackingUrl: "https://www.ups.com/track?trackingNumber=",
    },
    laposte: {
        name: "La Poste",
        logo: "https://logodownload.org/wp-content/uploads/2017/02/la-poste-logo.png",
        trackingUrl: "https://www.laposte.fr/outils/suivre-vos-envois?code=",
    },
    caribex: {
        name: "Caribex",
        logo: "https://via.placeholder.com/60?text=Caribex",
        trackingUrl: "https://caribex.com/tracking?num=",
    }
};

// ============================================
// CONFIGURATION DES STATUTS
// ============================================

const STATUS_STEPS = [
    { 
        status: "pending", 
        label: "Commande en attente", 
        icon: "📝",
        description: "Votre commande a été reçue et est en attente de traitement"
    },
    { 
        status: "processing", 
        label: "Préparation en cours", 
        icon: "🔨",
        description: "Nous préparons votre commande pour l'expédition"
    },
    { 
        status: "shipped", 
        label: "Colis expédié", 
        icon: "📦",
        description: "Votre colis a été remis au transporteur"
    },
    { 
        status: "transit", 
        label: "En transit", 
        icon: "🚚",
        description: "Votre colis est en route vers Haïti"
    },
    { 
        status: "customs", 
        label: "En douane", 
        icon: "🛃",
        description: "Votre colis est en cours de dédouanement"
    },
    { 
        status: "out_for_delivery", 
        label: "En cours de livraison", 
        icon: "🚀",
        description: "Votre colis est en cours de livraison finale"
    },
    { 
        status: "delivered", 
        label: "Livré", 
        icon: "✅",
        description: "Votre colis a été livré avec succès"
    }
];

const STATUS_COLORS = {
    pending: "#6b7280",
    processing: "#f59e0b",
    shipped: "#3b82f6",
    transit: "#8b5cf6",
    customs: "#ec4899",
    out_for_delivery: "#f97316",
    delivered: "#10b981"
};

// ============================================
// FONCTION PRINCIPALE DE RECHERCHE
// ============================================

window.trackOrder = async function() {
    const orderNumber = document.getElementById("orderNumber").value.trim();
    const trackingCard = document.getElementById("trackingCard");
    const notFound = document.getElementById("notFound");
    
    if (!orderNumber) {
        alert("Veuillez entrer un numéro de commande");
        return;
    }
    
    console.log("🔍 Recherche de la commande:", orderNumber);
    
    trackingCard.classList.remove("active");
    notFound.style.display = "none";
    
    try {
        // Vérifier que db est accessible
        if (!window.db) {
            throw new Error("Base de données non initialisée");
        }
        
        // Récupérer toutes les commandes
        const ordersRef = collection(window.db, "orders");
        const querySnapshot = await getDocs(ordersRef);
        
        console.log("📊 Total commandes dans la base:", querySnapshot.size);
        
        let foundOrder = null;
        let foundDoc = null;
        
        // Parcourir toutes les commandes
        querySnapshot.forEach(doc => {
            const data = doc.data();
            
            // Vérifier par ID du document
            if (doc.id === orderNumber) {
                foundOrder = data;
                foundDoc = doc;
                console.log("✅ Trouvé par ID exact:", doc.id);
            }
            // Vérifier si l'ID contient le numéro recherché
            else if (doc.id.includes(orderNumber) || orderNumber.includes(doc.id)) {
                foundOrder = data;
                foundDoc = doc;
                console.log("✅ Trouvé par correspondance partielle:", doc.id);
            }
            // Vérifier dans les champs de données
            else if (data.orderId === orderNumber || 
                     (data.paymentId && data.paymentId === orderNumber) ||
                     (data.id && data.id === orderNumber)) {
                foundOrder = data;
                foundDoc = doc;
                console.log("✅ Trouvé par champ:", doc.id);
            }
        });
        
        if (foundOrder && foundDoc) {
            foundOrder.id = foundDoc.id;
            console.log("✅ Commande trouvée:", foundOrder);
            
            if (foundOrder.trackingInfo) {
                displayTrackingInfo(foundOrder);
            } else {
                showNoTrackingYet(foundOrder);
            }
            trackingCard.classList.add("active");
            
        } else {
            console.log("❌ Commande non trouvée");
            notFound.style.display = "block";
            notFound.innerHTML = `
                <i class="fas fa-box-open"></i>
                <h3>Commande non trouvée</h3>
                <p>Le numéro "<strong>${orderNumber}</strong>" ne correspond à aucune commande</p>
                <div style="background: #f3f4f6; padding: 1.5rem; border-radius: 0.5rem; margin: 1.5rem 0; text-align: left;">
                    <p style="font-weight: 600; margin-bottom: 0.5rem;">📝 Conseils :</p>
                    <ul style="list-style: none;">
                        <li style="margin-bottom: 0.5rem;">✓ Vérifiez que vous avez bien copié le numéro complet</li>
                        <li style="margin-bottom: 0.5rem;">✓ Exemple: ORD-123456789-ABCDE</li>
                        <li style="margin-bottom: 0.5rem;">✓ Les commandes récentes peuvent prendre quelques minutes</li>
                        <li style="margin-bottom: 0.5rem;">✓ Vérifiez dans vos emails le numéro de commande</li>
                    </ul>
                </div>
                <p style="margin-top: 1rem;">
                    Si le problème persiste, contactez-nous au <strong style="color: #10b981;">8093-978-951</strong>
                </p>
                <button onclick="location.reload()" style="background: #10b981; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer; margin-top: 1rem;">
                    <i class="fas fa-sync"></i> Réessayer
                </button>
            `;
        }
    } catch (error) {
        console.error("❌ Erreur lors de la recherche:", error);
        notFound.style.display = "block";
        notFound.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>
            <h3>Erreur de connexion</h3>
            <p>${error.message}</p>
            <button onclick="location.reload()" style="background: #10b981; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer; margin-top: 1rem;">
                <i class="fas fa-sync"></i> Réessayer
            </button>
        `;
    }
};

// ============================================
// AFFICHAGE DES INFORMATIONS DE SUIVI
// ============================================

function displayTrackingInfo(order) {
    const tracking = order.trackingInfo;
    const carrier = CARRIERS[tracking.carrier] || {
        name: tracking.carrier || "Transporteur",
        logo: "https://via.placeholder.com/60?text=Logo",
        trackingUrl: "#"
    };
    
    // Informations générales
    document.getElementById("orderIdDisplay").textContent = order.id;
    document.getElementById("orderDate").textContent = formatDate(order.createdAt);
    document.getElementById("orderAmount").textContent = `$${order.totalAmount?.toFixed(2)}`;
    document.getElementById("orderCarrier").textContent = carrier.name;
    document.getElementById("trackingNumber").textContent = tracking.trackingNumber;
    
    // Informations transporteur
    document.getElementById("carrierName").textContent = carrier.name;
    document.getElementById("carrierTracking").textContent = tracking.trackingNumber;
    document.getElementById("carrierLogo").src = carrier.logo;
    document.getElementById("carrierLink").href = carrier.trackingUrl + tracking.trackingNumber;
    document.getElementById("carrierInfo").style.display = "flex";
    
    // Statut
    const statusElement = document.getElementById("orderStatus");
    statusElement.textContent = getStatusLabel(tracking.status);
    statusElement.style.background = STATUS_COLORS[tracking.status] || "#6b7280";
    statusElement.style.color = "white";
    
    // Timeline
    renderTimeline(tracking);
    
    // Carte
    if (tracking.lastLocation) {
        const mapDiv = document.getElementById("trackingMap");
        mapDiv.style.display = "block";
        const mapIframe = document.getElementById("mapIframe");
        const location = encodeURIComponent(tracking.lastLocation);
        mapIframe.src = `https://www.google.com/maps/embed/v1/place?key=AIzaSyC_krW6QcyTS6JZNJf-_7YAc_491mCWYaQ&q=${location}`;
    } else {
        document.getElementById("trackingMap").style.display = "none";
    }
}

function showNoTrackingYet(order) {
    document.getElementById("orderIdDisplay").textContent = order.id;
    document.getElementById("orderDate").textContent = formatDate(order.createdAt);
    document.getElementById("orderAmount").textContent = `$${order.totalAmount?.toFixed(2)}`;
    document.getElementById("orderCarrier").textContent = "En attente d'expédition";
    document.getElementById("trackingNumber").textContent = "Non disponible";
    
    document.getElementById("orderStatus").textContent = "En attente d'expédition";
    document.getElementById("orderStatus").style.background = "#6b7280";
    
    document.getElementById("carrierInfo").style.display = "none";
    document.getElementById("trackingMap").style.display = "none";
    
    const timeline = document.getElementById("trackingTimeline");
    timeline.innerHTML = `
        <div class="timeline-item">
            <div class="timeline-dot completed"></div>
            <div class="timeline-line"></div>
            <div class="timeline-content">
                <h4>✅ Commande confirmée</h4>
                <p>${formatDateTime(order.createdAt)}</p>
            </div>
        </div>
        <div class="timeline-item">
            <div class="timeline-dot active"></div>
            <div class="timeline-content">
                <h4>⏳ En attente d'expédition</h4>
                <p>Votre commande sera bientôt expédiée</p>
                <small>Nous vous enverrons une notification dès que le colis sera en route</small>
            </div>
        </div>
    `;
}

function renderTimeline(tracking) {
    const timeline = document.getElementById("trackingTimeline");
    const events = tracking.events || [];
    
    let html = '';
    
    // Ajouter les étapes standard
    for (let i = 0; i < STATUS_STEPS.length; i++) {
        const step = STATUS_STEPS[i];
        const isCompleted = isStepCompleted(step.status, tracking.status);
        const isCurrent = step.status === tracking.status;
        
        let dotClass = 'timeline-dot';
        
        if (isCompleted) {
            dotClass += ' completed';
        } else if (isCurrent) {
            dotClass += ' active';
        } else {
            dotClass += ' pending';
        }
        
        html += `
            <div class="timeline-item">
                <div class="${dotClass}"></div>
                ${i < STATUS_STEPS.length - 1 ? '<div class="timeline-line"></div>' : ''}
                <div class="timeline-content">
                    <h4>${step.icon} ${step.label}</h4>
                    <p>${step.description}</p>
                    ${isCurrent ? '<small style="color: #f59e0b;">En cours...</small>' : ''}
                    ${isCompleted && i === getStatusIndex(tracking.status) ? 
                      `<small>${formatDateTime(tracking.updatedAt)}</small>` : ''}
                </div>
            </div>
        `;
    }
    
    // Ajouter les événements du transporteur
    if (events.length > 0) {
        html += `
            <div style="margin-top: 2rem; padding-top: 1rem; border-top: 2px dashed #e5e7eb;">
                <h4 style="margin-bottom: 1rem;">📋 Détails du suivi</h4>
        `;
        
        events.forEach(event => {
            html += `
                <div class="timeline-item" style="opacity: 0.9;">
                    <div class="timeline-dot" style="background: #10b981; width: 16px; height: 16px; left: 4px;"></div>
                    <div class="timeline-line" style="left: 11px;"></div>
                    <div class="timeline-content">
                        <h4 style="font-size: 1rem;">${event.description}</h4>
                        <p style="font-size: 0.9rem;">${formatDateTime(event.date)}</p>
                        ${event.location ? `<p style="font-size: 0.9rem;">📍 ${event.location}</p>` : ''}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    timeline.innerHTML = html;
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

function formatDate(dateString) {
    if (!dateString) return "Date inconnue";
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return "Date invalide";
    }
}

function formatDateTime(dateString) {
    if (!dateString) return "Date inconnue";
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return "Date invalide";
    }
}

function getStatusIndex(status) {
    return STATUS_STEPS.findIndex(s => s.status === status);
}

function isStepCompleted(stepStatus, currentStatus) {
    const stepIndex = getStatusIndex(stepStatus);
    const currentIndex = getStatusIndex(currentStatus);
    return stepIndex <= currentIndex;
}

function getStatusLabel(status) {
    const step = STATUS_STEPS.find(s => s.status === status);
    return step ? step.label : status;
}

// ============================================
// IMPORT DES FONCTIONS FIRESTORE
// ============================================

const { collection, getDocs } = firebase.firestore();

// ============================================
// INITIALISATION
// ============================================

document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Page de suivi chargée");
    
    // Vérifier s'il y a un numéro dans l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const order = urlParams.get('order');
    
    if (order) {
        console.log("📦 Commande dans l'URL:", order);
        document.getElementById("orderNumber").value = order;
        // Petite attente pour que Firebase soit prêt
        setTimeout(() => trackOrder(), 1000);
    }
    
    // Ajouter un écouteur pour la touche Entrée
    const input = document.getElementById("orderNumber");
    if (input) {
        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                trackOrder();
            }
        });
    }
});

// Rendre la fonction disponible globalement
window.trackOrder = trackOrder;
