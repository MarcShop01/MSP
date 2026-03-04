// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC_krW6QcyTS6JZNJf-_7YAc_491mCWYaQ",
    authDomain: "marchat-e4d21.firebaseapp.com",
    projectId: "marchat-e4d21",
    storageBucket: "marchat-e4d21.appspot.com",
    messagingSenderId: "211043298263",
    appId: "1:211043298263:web:dcf751d299aa4360d83992",
    measurementId: "G-CZHXLDZTBW"
};

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// UID et email du propriétaire
const OWNER_EMAIL = 'emmanuelmarc130493@gmail.com';

// Variables globales
let products = [];
let users = [];
let orders = [];
let carts = [];
let activities = [];
let filteredProducts = [];
let filteredUsers = [];
let filteredOrders = [];

// Références aux écouteurs en temps réel
let productsUnsubscribe = null;
let usersUnsubscribe = null;
let ordersUnsubscribe = null;
let cartsUnsubscribe = null;

// Tailles disponibles par catégorie
const sizesByCategory = {
    clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    shoes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45']
};

// Configuration des transporteurs
const CARRIERS = {
    temu: { name: "Temu", logo: "https://logodownload.org/wp-content/uploads/2024/01/temu-logo.png" },
    shein: { name: "SHEIN", logo: "https://logodownload.org/wp-content/uploads/2020/04/shein-logo-0.png" },
    aliexpress: { name: "AliExpress", logo: "https://logodownload.org/wp-content/uploads/2019/08/aliexpress-logo.png" },
    dhl: { name: "DHL", logo: "https://logodownload.org/wp-content/uploads/2017/02/dhl-logo-0.png" },
    fedex: { name: "FedEx", logo: "https://logodownload.org/wp-content/uploads/2017/02/fedex-logo-0.png" },
    ups: { name: "UPS", logo: "https://logodownload.org/wp-content/uploads/2017/02/ups-logo-0.png" },
    laposte: { name: "La Poste", logo: "https://logodownload.org/wp-content/uploads/2017/02/la-poste-logo.png" },
    caribex: { name: "Caribex", logo: "https://via.placeholder.com/60?text=Caribex" }
};

document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
    checkOwnerSession();
});

function setupEventListeners() {
    document.getElementById("loginForm").addEventListener("submit", (e) => {
        e.preventDefault();
        login();
    });
    
    document.getElementById("productForm").addEventListener("submit", (e) => {
        e.preventDefault();
        saveProduct();
    });
    
    document.getElementById("trackingForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        await saveTrackingInfo();
    });
    
    document.getElementById("productCategory").addEventListener("change", toggleSizeSection);
}

function toggleSizeSection() {
    const category = document.getElementById("productCategory").value;
    const sizeSection = document.getElementById("sizeSection");
    
    if (category === 'clothing' || category === 'shoes') {
        sizeSection.style.display = 'block';
        renderSizeOptions(category);
    } else {
        sizeSection.style.display = 'none';
    }
}

function renderSizeOptions(category) {
    const sizes = sizesByCategory[category] || [];
    const sizeOptions = document.getElementById("sizeOptions");
    const selectedSizes = window.currentProductSizes || [];
    
    sizeOptions.innerHTML = sizes.map(size => `
        <div class="size-item ${selectedSizes.includes(size) ? 'selected' : ''}" 
             onclick="toggleSize('${size}')">
            ${size}
        </div>
    `).join('');
}

window.toggleSize = function(size) {
    if (!window.currentProductSizes) {
        window.currentProductSizes = [];
    }
    
    const index = window.currentProductSizes.indexOf(size);
    if (index === -1) {
        window.currentProductSizes.push(size);
    } else {
        window.currentProductSizes.splice(index, 1);
    }
    
    renderSizeOptions(document.getElementById("productCategory").value);
};

function checkOwnerSession() {
    const ownerSession = localStorage.getItem("marcshop-owner-session");
    if (ownerSession) {
        const sessionData = JSON.parse(ownerSession);
        const now = new Date().getTime();
        if (now - sessionData.timestamp < 24 * 60 * 60 * 1000) {
            auth.onAuthStateChanged((user) => {
                if (user && user.email === OWNER_EMAIL) {
                    showDashboard();
                    setupRealtimeListeners();
                } else {
                    showLogin();
                }
            });
            return;
        }
    }
    showLogin();
}

function setupRealtimeListeners() {
    // Écouter les produits
    productsUnsubscribe = db.collection("products").onSnapshot((snapshot) => {
        products = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        filteredProducts = [...products];
        renderProductsList();
        updateStats();
    }, handleError);

    // Écouter les utilisateurs
    usersUnsubscribe = db.collection("users").onSnapshot((snapshot) => {
        users = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        filteredUsers = [...users];
        renderUsersList();
        updateStats();
        checkNewUsers(snapshot);
    }, handleError);

    // Écouter les commandes
    const ordersQuery = db.collection("orders").orderBy("createdAt", "desc");
    ordersUnsubscribe = ordersQuery.onSnapshot((snapshot) => {
        orders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        filteredOrders = [...orders];
        renderOrdersList();
        updateStats();
        checkNewOrders(snapshot);
    }, handleError);

    // Écouter les paniers
    cartsUnsubscribe = db.collection("carts").onSnapshot((snapshot) => {
        carts = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        renderCartsList();
        updateStats();
    }, handleError);
}

function handleError(error) {
    console.error("Erreur Firebase:", error);
    showNotification("Erreur de synchronisation: " + error.message, "error");
}

function checkNewUsers(snapshot) {
    snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
            const user = change.doc.data();
            showNotification(`👤 Nouvel utilisateur inscrit: ${user.name || 'Anonyme'}`, "info");
            addActivity(`Nouvel utilisateur: ${user.name} (${user.email})`, 'user');
        }
    });
}

function checkNewOrders(snapshot) {
    snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
            const order = change.doc.data();
            showNotification(`🛒 Nouvelle commande: $${order.totalAmount?.toFixed(2)}`, "success");
            addActivity(`Nouvelle commande de ${order.customerName}: $${order.totalAmount?.toFixed(2)}`, 'order');
        }
    });
}

function login() {
    const email = document.getElementById("adminEmail").value;
    const password = document.getElementById("adminPassword").value;
    
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            if (user.email === OWNER_EMAIL) {
                localStorage.setItem("marcshop-owner-session", JSON.stringify({
                    timestamp: new Date().getTime(),
                    isOwner: true,
                }));
                showDashboard();
                setupRealtimeListeners();
            } else {
                showAlert("Accès refusé : vous n'êtes pas le propriétaire.", "error");
                auth.signOut();
            }
        })
        .catch((error) => {
            showAlert("Erreur de connexion: " + error.message, "error");
            document.getElementById("adminPassword").value = "";
        });
}

function logout() {
    if (productsUnsubscribe) productsUnsubscribe();
    if (usersUnsubscribe) usersUnsubscribe();
    if (ordersUnsubscribe) ordersUnsubscribe();
    if (cartsUnsubscribe) cartsUnsubscribe();
    
    auth.signOut().then(() => {
        localStorage.removeItem("marcshop-owner-session");
        showLogin();
    }).catch(handleError);
}

function showAlert(message, type) {
    const alertDiv = document.getElementById("loginAlert");
    alertDiv.textContent = message;
    alertDiv.className = `alert alert-${type}`;
    alertDiv.style.display = "block";
    setTimeout(() => alertDiv.style.display = "none", 5000);
}

function showNotification(message, type = "info") {
    const toast = document.createElement('div');
    toast.className = `notification-toast alert-${type}`;
    toast.innerHTML = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

function addActivity(message, type = 'info') {
    const activity = {
        message,
        type,
        timestamp: new Date().toISOString()
    };
    activities.unshift(activity);
    if (activities.length > 50) activities.pop();
    renderLiveActivity();
}

function showLogin() {
    document.getElementById("adminLogin").style.display = "flex";
    document.getElementById("adminDashboard").style.display = "none";
}

function showDashboard() {
    document.getElementById("adminLogin").style.display = "none";
    document.getElementById("adminDashboard").style.display = "block";
    updateStats();
    renderRecentActivity();
}

window.showSection = function(sectionName) {
    document.querySelectorAll(".sidebar-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".admin-section").forEach(section => section.classList.remove("active"));
    event.target.classList.add("active");
    document.getElementById(sectionName + "Section").classList.add("active");
    
    switch(sectionName) {
        case "dashboard":
            updateStats();
            renderRecentActivity();
            break;
        case "products":
            renderProductsList();
            break;
        case "users":
            renderUsersList();
            break;
        case "orders":
            renderOrdersList();
            break;
        case "carts":
            renderCartsList();
            break;
        case "activity":
            renderLiveActivity();
            break;
    }
};

// ============================================
// GESTION DES PRODUITS
// ============================================

function openAddProductModal() {
    document.getElementById("modalTitle").textContent = "Ajouter un produit";
    document.getElementById("productForm").reset();
    document.getElementById("productId").value = "";
    window.currentProductSizes = [];
    toggleSizeSection();
    document.getElementById("productModal").classList.add("active");
    document.getElementById("overlay").classList.add("active");
}

window.editProduct = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById("modalTitle").textContent = "Modifier le produit";
    document.getElementById("productId").value = product.id;
    document.getElementById("productName").value = product.name || '';
    document.getElementById("productCategory").value = product.category || '';
    document.getElementById("productPrice").value = product.price || '';
    document.getElementById("productOriginalPrice").value = product.originalPrice || '';
    document.getElementById("productDescription").value = product.description || '';
    document.getElementById("productStock").value = product.stock || 100;
    document.getElementById("productImage1").value = product.images?.[0] || '';
    document.getElementById("productImage2").value = product.images?.[1] || '';
    document.getElementById("productImage3").value = product.images?.[2] || '';
    document.getElementById("productImage4").value = product.images?.[3] || '';
    
    window.currentProductSizes = product.sizes || [];
    toggleSizeSection();
    document.getElementById("productModal").classList.add("active");
    document.getElementById("overlay").classList.add("active");
};

function closeProductModal() {
    document.getElementById("productModal").classList.remove("active");
    document.getElementById("overlay").classList.remove("active");
}

async function saveProduct() {
    const productId = document.getElementById("productId").value;
    const category = document.getElementById("productCategory").value;
    
    const productData = {
        name: document.getElementById("productName").value,
        category: category,
        price: parseFloat(document.getElementById("productPrice").value),
        originalPrice: parseFloat(document.getElementById("productOriginalPrice").value),
        description: document.getElementById("productDescription").value,
        stock: parseInt(document.getElementById("productStock").value) || 100,
        images: [
            document.getElementById("productImage1").value,
            document.getElementById("productImage2").value,
            document.getElementById("productImage3").value,
            document.getElementById("productImage4").value
        ].filter(img => img.trim() !== ""),
        sizes: (category === 'clothing' || category === 'shoes') ? window.currentProductSizes : [],
        status: "active",
        updatedAt: new Date().toISOString()
    };
    
    if (!productId) {
        productData.createdAt = new Date().toISOString();
    }
    
    try {
        if (productId) {
            await db.collection("products").doc(productId).update(productData);
            showNotification("Produit modifié avec succès!", "success");
        } else {
            await db.collection("products").add(productData);
            showNotification("Produit ajouté avec succès!", "success");
        }
        closeProductModal();
    } catch (error) {
        showNotification("Erreur: " + error.message, "error");
    }
}

window.deleteProduct = async function(id) {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce produit?")) {
        try {
            await db.collection("products").doc(id).delete();
            showNotification("Produit supprimé avec succès!", "success");
            addActivity(`Produit supprimé: ${id}`, 'delete');
        } catch (error) {
            showNotification("Erreur lors de la suppression: " + error.message, "error");
        }
    }
};

// ============================================
// GESTION DU SUIVI DE COMMANDE
// ============================================

window.openTrackingModal = function(orderId) {
    document.getElementById("trackingOrderId").value = orderId;
    document.getElementById("trackingModal").classList.add("active");
    document.getElementById("overlay").classList.add("active");
    
    // Réinitialiser le formulaire
    document.getElementById("trackingForm").reset();
    document.getElementById("eventsSection").style.display = "none";
    window.tempEvents = [];
    
    // Charger les infos existantes si disponibles
    loadExistingTracking(orderId);
};

window.closeTrackingModal = function() {
    document.getElementById("trackingModal").classList.remove("active");
    document.getElementById("overlay").classList.remove("active");
    window.tempEvents = [];
};

async function loadExistingTracking(orderId) {
    try {
        const orderRef = db.collection("orders").doc(orderId);
        const orderSnap = await orderRef.get();
        
        if (orderSnap.exists && orderSnap.data().trackingInfo) {
            const tracking = orderSnap.data().trackingInfo;
            
            document.getElementById("trackingCarrier").value = tracking.carrier || '';
            document.getElementById("trackingNumber").value = tracking.trackingNumber || '';
            document.getElementById("trackingStatus").value = tracking.status || 'pending';
            document.getElementById("trackingLocation").value = tracking.lastLocation || '';
            
            // Afficher les événements
            if (tracking.events && tracking.events.length > 0) {
                displayEvents(tracking.events);
                document.getElementById("eventsSection").style.display = "block";
            }
        }
    } catch (error) {
        console.error("Erreur chargement suivi:", error);
    }
}

function displayEvents(events) {
    const eventsList = document.getElementById("eventsList");
    eventsList.innerHTML = events.map(event => `
        <div style="padding: 0.5rem; background: #f9fafb; margin-bottom: 0.5rem; border-radius: 0.375rem; border-left: 3px solid #10b981;">
            <strong>${formatDateTime(event.date)}</strong>
            <p>${event.description}</p>
            ${event.location ? `<small>📍 ${event.location}</small>` : ''}
        </div>
    `).join('');
}

window.addEvent = function() {
    const eventDesc = prompt("Description de l'événement:");
    if (!eventDesc) return;
    
    const eventLocation = prompt("Localisation (optionnel):");
    const eventsList = document.getElementById("eventsList");
    const newEvent = {
        description: eventDesc,
        location: eventLocation || '',
        date: new Date().toISOString()
    };
    
    // Stocker temporairement
    if (!window.tempEvents) window.tempEvents = [];
    window.tempEvents.push(newEvent);
    
    // Afficher
    const eventHtml = `
        <div style="padding: 0.5rem; background: #f9fafb; margin-bottom: 0.5rem; border-radius: 0.375rem; border-left: 3px solid #10b981;">
            <strong>${formatDateTime(newEvent.date)}</strong>
            <p>${newEvent.description}</p>
            ${newEvent.location ? `<small>📍 ${newEvent.location}</small>` : ''}
        </div>
    `;
    
    if (eventsList.innerHTML === 'Aucun événement' || eventsList.innerHTML === '') {
        eventsList.innerHTML = eventHtml;
    } else {
        eventsList.innerHTML += eventHtml;
    }
    
    document.getElementById("eventsSection").style.display = "block";
};

async function saveTrackingInfo() {
    const orderId = document.getElementById("trackingOrderId").value;
    const carrier = document.getElementById("trackingCarrier").value;
    const trackingNumber = document.getElementById("trackingNumber").value;
    const status = document.getElementById("trackingStatus").value;
    const location = document.getElementById("trackingLocation").value;
    const description = document.getElementById("trackingDescription").value;
    
    if (!carrier || !trackingNumber) {
        alert("Veuillez remplir tous les champs obligatoires");
        return;
    }
    
    try {
        // Récupérer les événements existants
        const orderRef = db.collection("orders").doc(orderId);
        const orderSnap = await orderRef.get();
        let existingEvents = [];
        
        if (orderSnap.exists && orderSnap.data().trackingInfo) {
            existingEvents = orderSnap.data().trackingInfo.events || [];
        }
        
        // Ajouter le nouvel événement
        const newEvent = {
            status: status,
            description: description || getDefaultDescription(status),
            date: new Date().toISOString(),
            location: location
        };
        
        // Fusionner avec les événements temporaires
        const allEvents = [...existingEvents, newEvent];
        if (window.tempEvents) {
            allEvents.push(...window.tempEvents);
            window.tempEvents = [];
        }
        
        // Mettre à jour Firestore
        await orderRef.update({
            trackingInfo: {
                carrier: carrier,
                trackingNumber: trackingNumber,
                status: status,
                lastLocation: location,
                events: allEvents,
                updatedAt: new Date().toISOString()
            },
            status: status === 'delivered' ? 'delivered' : 'processing'
        });
        
        // Notifier le client
        await notifyCustomer(orderId, trackingNumber);
        
        showNotification("✅ Suivi ajouté avec succès !", "success");
        closeTrackingModal();
        renderOrdersList(); // Rafraîchir la liste
        
    } catch (error) {
        console.error("Erreur:", error);
        showNotification("❌ Erreur: " + error.message, "error");
    }
}

function getDefaultDescription(status) {
    const descriptions = {
        pending: "Commande en attente de traitement",
        processing: "Préparation de votre commande en cours",
        shipped: "Colis expédié vers Haïti",
        transit: "Colis en transit",
        customs: "Colis en cours de dédouanement",
        out_for_delivery: "Colis en cours de livraison finale",
        delivered: "Colis livré avec succès"
    };
    return descriptions[status] || "Mise à jour du statut";
}

async function notifyCustomer(orderId, trackingNumber) {
    try {
        const orderRef = db.collection("orders").doc(orderId);
        const orderSnap = await orderRef.get();
        
        if (!orderSnap.exists) return;
        
        const order = orderSnap.data();
        const trackingLink = `https://marcshop01.github.io/MSP/tracking.html?order=${orderId}`;
        
        // 1. ENVOYER UN EMAIL
        console.log("=================================");
        console.log("📧 EMAIL DE SUIVI ENVOYÉ");
        console.log("=================================");
        console.log("À:", order.customerEmail);
        console.log("Sujet: 📦 Votre colis MarcShop est en route !");
        console.log("");
        console.log(`Bonjour ${order.customerName},`);
        console.log("");
        console.log("Bonne nouvelle ! Votre colis a été expédié !");
        console.log("");
        console.log(`Numéro de suivi: ${trackingNumber}`);
        console.log(`Transporteur: ${CARRIERS[order.trackingInfo?.carrier]?.name || order.trackingInfo?.carrier}`);
        console.log("");
        console.log("Suivez votre colis en direct ici:");
        console.log(trackingLink);
        console.log("");
        console.log("Merci de votre confiance !");
        console.log("=================================");
        
        // 2. ENVOYER UN SMS
        console.log("📱 SMS ENVOYÉ");
        console.log("Au:", order.customerPhone);
        console.log(`MarcShop: Votre colis ${trackingNumber} est en route! Suivez-le: ${trackingLink}`);
        
        // 3. CRÉER UNE NOTIFICATION DANS LA BASE
        await db.collection("notifications").add({
            userId: order.userId,
            orderId: orderId,
            type: "tracking_added",
            message: "Votre colis a été expédié !",
            trackingNumber: trackingNumber,
            trackingLink: trackingLink,
            read: false,
            createdAt: new Date().toISOString()
        });
        
        // 4. AFFICHER UNE NOTIFICATION DANS L'ADMIN
        showNotification(`Notification envoyée au client ${order.customerName}`, "success");
        
    } catch (error) {
        console.error("Erreur notification:", error);
    }
}

// ============================================
// GESTION DES COMMANDES
// ============================================

window.markOrderDelivered = async function(orderId) {
    try {
        await db.collection("orders").doc(orderId).update({
            status: "delivered",
            deliveredAt: new Date().toISOString()
        });
        showNotification("Commande marquée comme livrée ✓", "success");
        addActivity(`Commande #${orderId} livrée`, 'success');
    } catch (error) {
        showNotification("Erreur: " + error.message, "error");
    }
};

// ============================================
// RENDU DES LISTES
// ============================================

function renderProductsList() {
    const productsList = document.getElementById("productsList");
    if (!filteredProducts || filteredProducts.length === 0) {
        productsList.innerHTML = "<p>Aucun produit trouvé.</p>";
        return;
    }
    
    productsList.innerHTML = filteredProducts.map(product => `
        <div class="product-card">
            <div class="product-image">
                <img src="${product.images?.[0] || 'https://via.placeholder.com/300x200?text=Image+Manquante'}" 
                     alt="${product.name}">
            </div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div>
                    <span class="product-price">$${product.price?.toFixed(2)}</span>
                    <span class="product-original-price">$${product.originalPrice?.toFixed(2)}</span>
                </div>
                <div style="color: #6b7280; font-size: 0.875rem; margin-top: 5px;">
                    ${product.category} • Stock: ${product.stock || 0}
                </div>
                ${product.sizes?.length ? `
                    <div class="product-sizes">
                        <strong>Tailles:</strong> ${product.sizes.join(', ')}
                    </div>
                ` : ''}
            </div>
            <div class="product-actions">
                <button onclick="editProduct('${product.id}')" class="btn-warning" style="padding: 8px 12px;">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteProduct('${product.id}')" class="btn-danger" style="padding: 8px 12px;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function renderUsersList() {
    const usersList = document.getElementById("usersList");
    if (!filteredUsers || filteredUsers.length === 0) {
        usersList.innerHTML = "<p>Aucun utilisateur trouvé.</p>";
        return;
    }
    
    usersList.innerHTML = filteredUsers.map(user => {
        const isActive = isUserActive(user);
        const lastSeen = user.lastActivity ? new Date(user.lastActivity).toLocaleString() : 'Jamais';
        
        return `
            <div class="user-card">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h4 style="margin: 0 0 5px 0;">${user.name || 'Nom non défini'}</h4>
                        <p style="margin: 2px 0;"><i class="fas fa-envelope"></i> ${user.email || 'Email non défini'}</p>
                        <p style="margin: 2px 0;"><i class="fas fa-phone"></i> ${user.phone || 'Téléphone non défini'}</p>
                        <p style="margin: 2px 0;"><i class="fas fa-map-marker-alt"></i> ${user.fullAddress || 'Adresse non définie'}</p>
                        <p style="margin: 2px 0;"><i class="fas fa-calendar"></i> Inscrit: ${user.registeredAt ? new Date(user.registeredAt).toLocaleDateString() : 'Date inconnue'}</p>
                        <p style="margin: 2px 0;"><i class="fas fa-clock"></i> Dernière activité: ${lastSeen}</p>
                    </div>
                    <div>
                        <span class="status-badge ${isActive ? 'status-active' : 'status-inactive'}">
                            ${isActive ? '🟢 Actif' : '⚫ Inactif'}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderOrdersList() {
    const ordersList = document.getElementById("ordersList");
    if (!filteredOrders || filteredOrders.length === 0) {
        ordersList.innerHTML = "<p>Aucune commande trouvée.</p>";
        return;
    }
    
    ordersList.innerHTML = filteredOrders.map(order => {
        const orderDate = order.createdAt || order.orderDate;
        const isDelivered = order.status === 'delivered';
        const hasTracking = order.trackingInfo;
        const carrier = order.trackingInfo ? CARRIERS[order.trackingInfo.carrier] : null;
        const trackingLink = hasTracking ? `https://marcshop01.github.io/MSP/tracking.html?order=${order.id}` : '#';
        
        return `
            <div class="order-card">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <div>
                        <h4 style="margin: 0;">Commande #${order.id?.substring(0, 8)}</h4>
                        <span class="status-badge ${isDelivered ? 'status-delivered' : 'status-pending'}">
                            ${isDelivered ? '✓ LIVRÉE' : '⏳ ' + (order.status || 'En attente')}
                        </span>
                        ${hasTracking ? `
                            <span class="status-badge" style="background: #3b82f6; color: white; margin-left: 0.5rem;">
                                <i class="fas fa-truck"></i> Suivi actif
                            </span>
                        ` : ''}
                    </div>
                    <span style="color: #10b981; font-weight: bold; font-size: 18px;">
                        $${order.totalAmount?.toFixed(2)}
                    </span>
                </div>
                
                <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                    <p><strong>👤 Client:</strong> ${order.customerName || 'Non spécifié'}</p>
                    <p><strong>📧 Email:</strong> ${order.customerEmail || 'Non spécifié'}</p>
                    <p><strong>📞 Téléphone:</strong> ${order.customerPhone || 'Non spécifié'}</p>
                    <p><strong>📍 Adresse:</strong> ${order.customerAddress || order.shippingAddress || 'Non spécifiée'}</p>
                    ${order.customerCity ? `<p><strong>🏙️ Ville:</strong> ${order.customerCity}, ${order.customerCountry || ''}</p>` : ''}
                </div>
                
                ${hasTracking ? `
                    <div class="tracking-info">
                        <p><strong><i class="fas fa-truck"></i> Suivi:</strong> ${carrier ? carrier.name : order.trackingInfo.carrier}</p>
                        <p><strong>Numéro:</strong> ${order.trackingInfo.trackingNumber}</p>
                        <p><strong>Statut:</strong> ${order.trackingInfo.status}</p>
                        <p><strong>Dernière localisation:</strong> ${order.trackingInfo.lastLocation || 'Inconnue'}</p>
                        <a href="${trackingLink}" target="_blank" class="tracking-link">
                            <i class="fas fa-external-link-alt"></i> Voir le suivi client
                        </a>
                    </div>
                ` : ''}
                
                <div>
                    <strong>📦 Produits commandés:</strong>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        ${order.items ? order.items.map(item => `
                            <li style="margin: 5px 0;">
                                ${item.quantity}x ${item.name} 
                                ${item.size ? `(Taille: ${item.size})` : ''} 
                                ${item.color ? `(Couleur: ${item.color})` : ''}
                                - $${item.price?.toFixed(2)}
                            </li>
                        `).join('') : 'Aucun détail produit'}
                    </ul>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; gap: 10px; flex-wrap: wrap;">
                    <small style="color: #6b7280;">
                        📅 ${orderDate ? new Date(orderDate).toLocaleString() : 'Date inconnue'}
                    </small>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="openTrackingModal('${order.id}')" class="btn-info" style="padding: 8px 15px;">
                            <i class="fas fa-truck"></i> ${hasTracking ? 'Modifier suivi' : 'Ajouter suivi'}
                        </button>
                        ${!isDelivered ? `
                            <button onclick="markOrderDelivered('${order.id}')" class="btn-success" style="padding: 8px 15px;">
                                <i class="fas fa-check"></i> Marquer livrée
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderCartsList() {
    const cartsList = document.getElementById("cartsList");
    const activeCarts = carts.filter(cart => cart.items && cart.items.length > 0);
    
    if (activeCarts.length === 0) {
        cartsList.innerHTML = "<p>Aucun panier actif.</p>";
        return;
    }
    
    cartsList.innerHTML = activeCarts.map(cart => {
        const user = users.find(u => u.id === cart.userId);
        const userName = user ? user.name : 'Utilisateur inconnu';
        const userEmail = user ? user.email : 'Email inconnu';
        const userPhone = user ? user.phone : 'Téléphone inconnu';
        const lastUpdated = cart.lastUpdated ? new Date(cart.lastUpdated) : new Date();
        
        return `
            <div class="cart-card">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <h4 style="margin: 0;">${userName}</h4>
                    <span style="color: #10b981; font-weight: bold;">
                        Total: $${cart.totalAmount?.toFixed(2) || '0.00'}
                    </span>
                </div>
                
                <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                    <p><strong>📧 Email:</strong> ${userEmail}</p>
                    <p><strong>📞 Téléphone:</strong> ${userPhone}</p>
                    <p><strong>🛒 Articles:</strong> ${cart.items?.length || 0}</p>
                </div>
                
                <div>
                    <strong>Articles dans le panier:</strong>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        ${cart.items ? cart.items.map(item => `
                            <li style="margin: 5px 0;">
                                ${item.quantity}x ${item.name} 
                                ${item.size ? `(Taille: ${item.size})` : ''}
                                - $${item.price?.toFixed(2)}
                            </li>
                        `).join('') : 'Aucun article'}
                    </ul>
                </div>
                
                <small style="color: #6b7280;">
                    ⏰ Dernière activité: ${lastUpdated.toLocaleString()}
                </small>
            </div>
        `;
    }).join('');
}

function renderRecentActivity() {
    const recentActivity = document.getElementById("recentActivity");
    const recentOrders = orders.slice(0, 5);
    
    if (recentOrders.length === 0) {
        recentActivity.innerHTML = "<p>Aucune activité récente.</p>";
        return;
    }
    
    recentActivity.innerHTML = recentOrders.map(order => `
        <div class="activity-card">
            <div style="display: flex; justify-content: space-between;">
                <span><i class="fas fa-shopping-cart"></i> Nouvelle commande</span>
                <small>${order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</small>
            </div>
            <p style="margin-top: 5px;">
                ${order.customerName} - $${order.totalAmount?.toFixed(2)}
            </p>
        </div>
    `).join('');
}

function renderLiveActivity() {
    const liveActivity = document.getElementById("liveActivity");
    if (activities.length === 0) {
        liveActivity.innerHTML = "<p>En attente d'activité...</p>";
        return;
    }
    
    liveActivity.innerHTML = activities.map(activity => `
        <div class="activity-card">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span class="live-indicator"></span>
                <span>${activity.message}</span>
                <small style="color: #6b7280; margin-left: auto;">
                    ${new Date(activity.timestamp).toLocaleTimeString()}
                </small>
            </div>
        </div>
    `).join('');
}

// ============================================
// FILTRES
// ============================================

window.filterProducts = function() {
    const searchTerm = document.getElementById("productSearch").value.toLowerCase();
    const category = document.getElementById("categoryFilter").value;
    
    filteredProducts = products.filter(product => {
        const matchesSearch = product.name?.toLowerCase().includes(searchTerm) ||
                             product.description?.toLowerCase().includes(searchTerm);
        const matchesCategory = !category || product.category === category;
        return matchesSearch && matchesCategory;
    });
    
    renderProductsList();
};

window.filterUsers = function() {
    const searchTerm = document.getElementById("userSearch").value.toLowerCase();
    const statusFilter = document.getElementById("userStatusFilter").value;
    
    filteredUsers = users.filter(user => {
        const matchesSearch = user.name?.toLowerCase().includes(searchTerm) ||
                             user.email?.toLowerCase().includes(searchTerm) ||
                             user.phone?.toLowerCase().includes(searchTerm);
        
        let matchesStatus = true;
        if (statusFilter === 'active') {
            matchesStatus = isUserActive(user);
        } else if (statusFilter === 'inactive') {
            matchesStatus = !isUserActive(user);
        }
        
        return matchesSearch && matchesStatus;
    });
    
    renderUsersList();
};

window.filterOrders = function() {
    const searchTerm = document.getElementById("orderSearch").value.toLowerCase();
    const statusFilter = document.getElementById("orderStatusFilter").value;
    
    filteredOrders = orders.filter(order => {
        const matchesSearch = order.customerName?.toLowerCase().includes(searchTerm) ||
                             order.customerEmail?.toLowerCase().includes(searchTerm) ||
                             order.id?.toLowerCase().includes(searchTerm);
        
        const matchesStatus = !statusFilter || order.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    renderOrdersList();
};

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

function isUserActive(user) {
    if (!user.lastActivity) return false;
    const lastActivity = new Date(user.lastActivity);
    const now = new Date();
    const diffMinutes = (now - lastActivity) / (1000 * 60);
    return diffMinutes < 30;
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updateStats() {
    document.getElementById("totalProducts").textContent = products.length;
    document.getElementById("totalUsers").textContent = users.length;
    
    const activeUsersCount = users.filter(isUserActive).length;
    document.getElementById("activeUsers").textContent = activeUsersCount;
    
    const activeCartsCount = carts.filter(cart => cart.items && cart.items.length > 0).length;
    document.getElementById("activeCarts").textContent = activeCartsCount;
    
    document.getElementById("totalOrders").textContent = orders.length;
    
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    document.getElementById("totalRevenue").textContent = `$${totalRevenue.toFixed(2)}`;
}

// Exposer les fonctions globales
window.openAddProductModal = openAddProductModal;
window.closeProductModal = closeProductModal;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.markOrderDelivered = markOrderDelivered;
window.filterProducts = filterProducts;
window.filterUsers = filterUsers;
window.filterOrders = filterOrders;
window.openTrackingModal = openTrackingModal;
window.closeTrackingModal = closeTrackingModal;
window.addEvent = addEvent;
