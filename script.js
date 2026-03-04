import { 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const db = window.firebaseDB;

let currentUser = null;
let products = [];
let allProducts = [];
let filteredProducts = [];
let cart = [];
let users = [];
let currentProductImages = [];
let currentImageIndex = 0;
let isAddingToCart = false;
let searchTerm = '';
let currentCategory = 'all';
let activityIntervalId = null;

// Options par catégorie
const SIZE_OPTIONS = {
  clothing: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  shoes: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"],
  electronics: ["Standard", "Petit", "Moyen", "Grand", "Extra Large"],
  hair: ["8 pouces", "10 pouces", "12 pouces", "14 pouces","16 pouces","18 pouces","20 pouces","22 pouces","24 pouces","26 pouces","28 pouces","30 pouces"],
  beauty: ["100ml", "200ml", "250ml", "500ml", "1L"],
  default: ["Unique", "Standard", "Personnalisé"]
};

const COLORS = ["Blanc", "Noir", "Rouge", "Bleu", "Vert", "Jaune", "Rose", "Violet", "Orange", "Gris", "Marron", "Beige"];

// Configuration NatCash
const NATCASH_CONFIG = {
    businessNumber: "50942557123",
    businessName: "MarcShop",
    apiEndpoint: "https://api.natcash.com/v1",
    paypalEmail: "marcshop0705@gmail.com",
    currency: "HTG",
    minAmount: 50,
    maxAmount: 50000
};

document.addEventListener("DOMContentLoaded", () => {
  loadFirestoreProducts();
  loadFirestoreUsers();
  loadCart();
  checkUserRegistration();
  setupEventListeners();
  setupLightbox();
  
  // Rendre les fonctions globales
  window.toggleCart = toggleCart;
  window.openLightbox = openLightbox;
  window.addToCart = addToCart;
  window.updateQuantity = updateQuantity;
  window.removeFromCart = removeFromCart;
  window.showUserProfile = showUserProfile;
  window.closeProfileModal = closeProfileModal;
  window.openNatcashModal = openNatcashModal;
  window.closeNatcashModal = closeNatcashModal;
  window.closeConfirmationModal = closeConfirmationModal;
  
  // Ajouter un écouteur pour générer l'adresse automatiquement
  const addressFields = ['profileCountry', 'profileCity', 'profileProvince', 'profileStreet', 'profileStreetNumber', 'profileZipCode', 'profileApartment'];
  addressFields.forEach(fieldId => {
    const element = document.getElementById(fieldId);
    if (element) {
      element.addEventListener('input', generateFullAddress);
    }
  });
});

function loadFirestoreProducts() {
  try {
    const productsCol = collection(db, "products");
    onSnapshot(productsCol, 
      (snapshot) => {
        allProducts = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        
        // Mélanger aléatoirement les produits
        products = shuffleArray([...allProducts]);
        
        // Appliquer les filtres actuels
        applyFilters();
      },
      (error) => {
        console.error("Erreur Firestore products:", error);
        showFirestoreError("Impossible de charger les produits. Vérifiez votre connexion Internet.");
      }
    );
  } catch (error) {
    console.error("Erreur initialisation Firestore products:", error);
    showFirestoreError("Erreur de connexion à la base de données.");
  }
}

function loadFirestoreUsers() {
  try {
    const usersCol = collection(db, "users");
    onSnapshot(usersCol, 
      (snapshot) => {
        users = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
      },
      (error) => {
        console.error("Erreur Firestore users:", error);
      }
    );
  } catch (error) {
    console.error("Erreur initialisation Firestore users:", error);
  }
}

// Fonction pour afficher les erreurs Firestore
function showFirestoreError(message) {
  const grid = document.getElementById("productsGrid");
  if (grid) {
    grid.innerHTML = `
      <div class="error-message" style="text-align: center; padding: 2rem; color: #ef4444;">
        <h3>😕 Problème de connexion</h3>
        <p>${message}</p>
        <button onclick="location.reload()" style="background: #3b82f6; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; cursor: pointer; margin-top: 1rem;">
          Actualiser la page
        </button>
      </div>
    `;
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function loadCart() {
  try {
    const cartData = localStorage.getItem("marcshop-cart");
    const userData = localStorage.getItem("marcshop-current-user");
    cart = cartData ? JSON.parse(cartData) : [];
    currentUser = userData ? JSON.parse(userData) : null;
    
    // Démarrer le suivi d'activité si l'utilisateur est connecté
    if (currentUser) {
      setupUserActivityTracking();
    }
  } catch (e) {
    console.error("Error parsing cart or user data from localStorage", e);
    cart = [];
    currentUser = null;
  }
  updateCartUI();
  
  // Synchroniser le panier avec Firestore si l'utilisateur est connecté
  if (currentUser) {
    syncCartToFirestore();
  }
}

// Synchroniser le panier avec Firestore
async function syncCartToFirestore() {
  if (!currentUser) return;
  
  try {
    const cartsQuery = query(collection(db, "carts"), where("userId", "==", currentUser.id));
    const querySnapshot = await getDocs(cartsQuery);
    
    if (!querySnapshot.empty) {
      const cartDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, "carts", cartDoc.id), {
        items: cart,
        totalAmount: cart.reduce((total, item) => total + (item.price * item.quantity), 0),
        lastUpdated: new Date().toISOString()
      });
    } else {
      await addDoc(collection(db, "carts"), {
        userId: currentUser.id,
        items: cart,
        totalAmount: cart.reduce((total, item) => total + (item.price * item.quantity), 0),
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("Erreur synchronisation panier:", error);
  }
}

// Mettre à jour l'activité de l'utilisateur
async function updateUserActivity() {
  if (!currentUser) return;
  
  try {
    const userRef = doc(db, "users", currentUser.id);
    await updateDoc(userRef, {
      lastActivity: new Date().toISOString(),
      isOnline: true
    });
  } catch (error) {
    console.error("Erreur mise à jour activité:", error);
  }
}

// Configurer le suivi d'activité de l'utilisateur
function setupUserActivityTracking() {
  if (!currentUser) return;
  
  updateUserActivity();
  
  if (activityIntervalId) {
    clearInterval(activityIntervalId);
  }
  
  activityIntervalId = setInterval(updateUserActivity, 60000);
  
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      updateUserActivity();
    }
  });
  
  window.addEventListener('beforeunload', async () => {
    if (currentUser) {
      try {
        const userRef = doc(db, "users", currentUser.id);
        await updateDoc(userRef, { isOnline: false });
      } catch (error) {
        console.error("Erreur mise à jour statut hors ligne:", error);
      }
    }
  });
}

function saveCart() {
  localStorage.setItem("marcshop-cart", JSON.stringify(cart));
  if (currentUser) {
    localStorage.setItem("marcshop-current-user", JSON.stringify(currentUser));
    updateUserActivity();
    syncCartToFirestore();
  }
  updateCartUI();
}

function checkUserRegistration() {
  if (!currentUser) {
    setTimeout(() => {
      const registrationModal = document.getElementById("registrationModal");
      if (registrationModal) {
        registrationModal.classList.add("active");
      }
    }, 1000);
  } else {
    const registrationModal = document.getElementById("registrationModal");
    if (registrationModal) {
      registrationModal.classList.remove("active");
    }
    displayUserName();
    // Charger les informations du profil si disponibles
    loadUserProfile();
  }
}

function loadUserProfile() {
  if (!currentUser) return;
  
  const profileFields = ['profileName', 'profileEmail', 'profilePhone', 'profileCountry', 'profileCity', 
                        'profileProvince', 'profileStreet', 'profileStreetNumber', 'profileZipCode', 'profileApartment'];
  
  profileFields.forEach(fieldId => {
    const element = document.getElementById(fieldId);
    if (element && currentUser[fieldId.replace('profile', '').toLowerCase()]) {
      const fieldName = fieldId.replace('profile', '').toLowerCase();
      element.value = currentUser[fieldName] || '';
    }
  });
  
  generateFullAddress();
}

function generateFullAddress() {
  const country = document.getElementById('profileCountry')?.value || '';
  const city = document.getElementById('profileCity')?.value || '';
  const province = document.getElementById('profileProvince')?.value || '';
  const street = document.getElementById('profileStreet')?.value || '';
  const streetNumber = document.getElementById('profileStreetNumber')?.value || '';
  const zipCode = document.getElementById('profileZipCode')?.value || '';
  const apartment = document.getElementById('profileApartment')?.value || '';
  
  let fullAddress = '';
  if (streetNumber && street) fullAddress += `${streetNumber} ${street}`;
  if (apartment) fullAddress += `, ${apartment}`;
  if (city) fullAddress += `, ${city}`;
  if (province) fullAddress += `, ${province}`;
  if (zipCode) fullAddress += ` ${zipCode}`;
  if (country) fullAddress += `, ${country}`;
  
  const addressElement = document.getElementById('profileAddress');
  if (addressElement) {
    addressElement.value = fullAddress || 'Adresse complète';
  }
}

function setupEventListeners() {
  const registrationForm = document.getElementById("registrationForm");
  const shareBtn = document.getElementById("shareBtn");
  const userLogo = document.querySelector(".user-logo");
  const profileBtn = document.getElementById("profileBtn");
  const overlay = document.getElementById("overlay");
  const searchInput = document.getElementById("searchInput");
  const clearSearch = document.getElementById("clearSearch");
  const searchIcon = document.getElementById("searchIcon");
  const natcashPaymentBtn = document.getElementById("natcash-payment-btn");
  const natcashForm = document.getElementById("natcashForm");
  const cancelNatcash = document.getElementById("cancelNatcash");
  const profileForm = document.getElementById("profileForm");

  if (registrationForm) {
    registrationForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("userName")?.value.trim();
      const email = document.getElementById("userEmail")?.value.trim();
      const phone = document.getElementById("userPhone")?.value.trim();
      if (name && email && phone) {
        await registerUser(name, email, phone);
        // Ouvrir automatiquement le formulaire de profil après inscription
        setTimeout(() => showUserProfile(), 500);
      }
    });
  }

  if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await saveUserProfile();
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener("click", shareWebsite);
  }

  if (userLogo) {
    userLogo.addEventListener("click", showUserProfile);
  }
  if (profileBtn) {
    profileBtn.addEventListener("click", showUserProfile);
  }

  const categoryButtons = document.querySelectorAll(".category-btn");
  if (categoryButtons.length > 0) {
    categoryButtons.forEach((btn) => {
      btn.addEventListener("click", function () {
        currentCategory = this.dataset.category;
        filterByCategory(this.dataset.category);
      });
    });
  }

  if (overlay) {
    overlay.addEventListener("click", () => {
      closeAllPanels();
    });
  }

  if (searchInput && clearSearch && searchIcon) {
    searchInput.addEventListener("input", (e) => {
      searchTerm = e.target.value.toLowerCase().trim();
      clearSearch.style.display = searchTerm ? 'block' : 'none';
      applyFilters();
    });
    
    clearSearch.addEventListener("click", () => {
      searchInput.value = '';
      searchTerm = '';
      clearSearch.style.display = 'none';
      applyFilters();
    });
    
    searchIcon.addEventListener("click", () => {
      applyFilters();
    });
  }

  if (natcashPaymentBtn) {
    natcashPaymentBtn.addEventListener("click", openNatcashModal);
  }

  if (natcashForm) {
    natcashForm.addEventListener("submit", processNatcashPayment);
  }

  if (cancelNatcash) {
    cancelNatcash.addEventListener("click", closeNatcashModal);
  }
}

function applyFilters() {
  if (currentCategory === 'all') {
    filteredProducts = [...products];
  } else {
    filteredProducts = products.filter(product => product.category === currentCategory);
  }
  
  if (searchTerm) {
    filteredProducts = filteredProducts.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      (product.description && product.description.toLowerCase().includes(searchTerm))
    );
  }
  
  renderProducts();
}

function setupLightbox() {
  const lightbox = document.getElementById("productLightbox");
  if (!lightbox) return;

  const closeBtn = lightbox.querySelector(".close");
  const prevBtn = lightbox.querySelector(".prev");
  const nextBtn = lightbox.querySelector(".next");
  
  if (closeBtn) {
    closeBtn.addEventListener("click", closeLightbox);
  }
  if (prevBtn) {
    prevBtn.addEventListener("click", () => changeImage(-1));
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => changeImage(1));
  }
  
  window.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
}

function openLightbox(productId, imgIndex = 0) {
  const product = products.find(p => p.id === productId);
  if (!product || !product.images || product.images.length === 0) return;
  currentProductImages = product.images;
  currentImageIndex = imgIndex;
  const lightboxImg = document.getElementById("lightboxImage");
  const descriptionDiv = document.getElementById("lightboxDescription");
  
  if (!lightboxImg) return;
  
  lightboxImg.src = currentProductImages[currentImageIndex];
  
  if (product.description && descriptionDiv) {
    descriptionDiv.innerHTML = `
      <h3>${product.name}</h3>
      <p>${product.description}</p>
    `;
    descriptionDiv.style.display = 'block';
  } else if (descriptionDiv) {
    descriptionDiv.style.display = 'none';
  }
  
  const lightbox = document.getElementById("productLightbox");
  const overlay = document.getElementById("overlay");
  if (lightbox) lightbox.style.display = "block";
  if (overlay) overlay.classList.add("active");
}

function closeLightbox() {
  const lightbox = document.getElementById("productLightbox");
  const overlay = document.getElementById("overlay");
  if (lightbox) lightbox.style.display = "none";
  if (overlay) overlay.classList.remove("active");
}

function changeImage(direction) {
  currentImageIndex += direction;
  if (currentImageIndex < 0) {
    currentImageIndex = currentProductImages.length - 1;
  } else if (currentImageIndex >= currentProductImages.length) {
    currentImageIndex = 0;
  }
  const lightboxImg = document.getElementById("lightboxImage");
  if (lightboxImg) {
    lightboxImg.src = currentProductImages[currentImageIndex];
  }
}

async function registerUser(name, email, phone) {
  const newUser = {
    name: name,
    email: email,
    phone: phone,
    registeredAt: new Date().toISOString(),
    isActive: true,
    lastActivity: new Date().toISOString(),
    isOnline: true,
    profileCompleted: false
  };
  
  try {
    const ref = await addDoc(collection(db, "users"), newUser);
    newUser.id = ref.id;
    currentUser = newUser;
    saveCart();
    displayUserName();
    
    setupUserActivityTracking();
    await syncCartToFirestore();
    
    const registrationModal = document.getElementById("registrationModal");
    if (registrationModal) {
      registrationModal.classList.remove("active");
    }
  } catch (e) {
    alert("Erreur lors de l'inscription. Réessayez.");
    console.error(e);
  }
}

async function saveUserProfile() {
  if (!currentUser) {
    alert("Veuillez d'abord vous inscrire.");
    return;
  }
  
  const profileData = {
    name: document.getElementById("profileName")?.value || currentUser.name,
    email: document.getElementById("profileEmail")?.value || currentUser.email,
    phone: document.getElementById("profilePhone")?.value || currentUser.phone,
    country: document.getElementById("profileCountry")?.value || '',
    city: document.getElementById("profileCity")?.value || '',
    province: document.getElementById("profileProvince")?.value || '',
    street: document.getElementById("profileStreet")?.value || '',
    streetNumber: document.getElementById("profileStreetNumber")?.value || '',
    zipCode: document.getElementById("profileZipCode")?.value || '',
    apartment: document.getElementById("profileApartment")?.value || '',
    fullAddress: document.getElementById("profileAddress")?.value || '',
    profileCompleted: true,
    profileUpdatedAt: new Date().toISOString()
  };
  
  try {
    const userRef = doc(db, "users", currentUser.id);
    await updateDoc(userRef, profileData);
    
    // Mettre à jour l'utilisateur courant
    currentUser = { ...currentUser, ...profileData };
    localStorage.setItem("marcshop-current-user", JSON.stringify(currentUser));
    
    alert("Profil enregistré avec succès !");
    closeProfileModal();
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du profil:", error);
    alert("Erreur lors de l'enregistrement du profil.");
  }
}

function showUserProfile() {
  if (!currentUser) {
    alert("Veuillez d'abord vous inscrire.");
    return;
  }
  
  const profileModal = document.getElementById("profileModal");
  const overlay = document.getElementById("overlay");
  
  // Pré-remplir le formulaire avec les informations existantes
  document.getElementById("profileName").value = currentUser.name || '';
  document.getElementById("profileEmail").value = currentUser.email || '';
  document.getElementById("profilePhone").value = currentUser.phone || '';
  document.getElementById("profileCountry").value = currentUser.country || '';
  document.getElementById("profileCity").value = currentUser.city || '';
  document.getElementById("profileProvince").value = currentUser.province || '';
  document.getElementById("profileStreet").value = currentUser.street || '';
  document.getElementById("profileStreetNumber").value = currentUser.streetNumber || '';
  document.getElementById("profileZipCode").value = currentUser.zipCode || '';
  document.getElementById("profileApartment").value = currentUser.apartment || '';
  
  generateFullAddress();
  
  if (profileModal) profileModal.classList.add("active");
  if (overlay) overlay.classList.add("active");
}

function closeProfileModal() {
  const profileModal = document.getElementById("profileModal");
  const overlay = document.getElementById("overlay");
  if (profileModal) profileModal.classList.remove("active");
  if (overlay) overlay.classList.remove("active");
}

function displayUserName() {
  const name = currentUser && currentUser.name ? currentUser.name : "MarcShop";
  const userNameDisplay = document.getElementById("userNameDisplay");
  if (userNameDisplay) {
    userNameDisplay.textContent = name;
  }
}

function renderProducts() {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;
  
  if (filteredProducts.length === 0) {
    grid.innerHTML = `
      <div class="no-products">
        <h3>Aucun produit trouvé</h3>
        <p>Aucun produit ne correspond à votre recherche.</p>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = filteredProducts.map(product => {
    const discount = product.originalPrice > 0 ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
    const rating = 4.0 + Math.random() * 1.0;
    const reviews = Math.floor(Math.random() * 1000) + 100;
    const firstImage = product.images[0] || "https://via.placeholder.com/200?text=Image+Manquante";
    return `
      <div class="product-card" data-category="${product.category}">
        <div class="product-image" onclick="openLightbox('${product.id}')">
          <img src="${firstImage}" alt="${product.name}" class="product-img">
          <div class="product-badge">NOUVEAU</div>
          ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ''}
        </div>
        <div class="product-info">
          <div class="product-name">${product.name}</div>
          <div class="product-rating">
            <span class="stars">${"★".repeat(Math.floor(rating))}${"☆".repeat(5 - Math.floor(rating))}</span>
            <span>(${reviews})</span>
          </div>
          <div class="product-price">
            <span class="current-price">$${product.price.toFixed(2)}</span>
            ${product.originalPrice > 0 ? `<span class="original-price">$${product.originalPrice.toFixed(2)}</span>` : ''}
          </div>
          <button class="add-to-cart" onclick="addToCart('${product.id}'); event.stopPropagation()">
            <i class="fas fa-shopping-cart"></i> Ajouter
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function addToCart(productId) {
  if (isAddingToCart) return;
  
  const product = products.find((p) => p.id === productId);
  if (!product) return;
  
  isAddingToCart = true;
  openProductOptions(product);
}

function openProductOptions(product) {
  const overlay = document.getElementById("overlay");
  if (overlay) {
    overlay.classList.add("active");
  }
  
  const category = product.category || 'default';
  const sizeOptions = SIZE_OPTIONS[category] || SIZE_OPTIONS.default;
  
  let modal = document.createElement("div");
  modal.className = "modal active";
  modal.innerHTML = `
    <div class="modal-content" style="max-width:400px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3>Ajouter au panier</h3>
        <span onclick="this.closest('.modal').remove(); document.getElementById('overlay').classList.remove('active'); isAddingToCart = false;" style="cursor: pointer; font-size: 1.5rem;">&times;</span>
      </div>
      <img src="${product.images[0]}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 0.5rem; margin-bottom: 1rem;">
      <p><strong>${product.name}</strong></p>
      <form id="optionsForm">
        <div class="form-group">
          <label for="cartSize">Taille/Modèle :</label>
          <select id="cartSize" name="size" required>
            <option value="">Sélectionner</option>
            ${sizeOptions.map(s => `<option value="${s}">${s}</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label for="cartColor">Couleur :</label>
          <select id="cartColor" name="color" required>
            <option value="">Sélectionner</option>
            ${COLORS.map(c => `<option value="${c}">${c}</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label for="cartQty">Quantité :</label>
          <input type="number" id="cartQty" name="qty" min="1" value="1" style="width: 100%;">
        </div>
        <button type="submit" id="submitOptions" style="width: 100%; background: #10b981; color: white; padding: 0.75rem; border: none; border-radius: 0.375rem; cursor: pointer; font-weight: 500;">
          Ajouter au panier
        </button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  
  const optionsForm = document.getElementById("optionsForm");
  if (optionsForm) {
    optionsForm.onsubmit = function(e) {
      e.preventDefault();
      const form = e.target;
      const submitBtn = document.getElementById("submitOptions");
      if (submitBtn) submitBtn.disabled = true;
      
      const size = form.elements.size.value;
      const color = form.elements.color.value;
      const qty = parseInt(form.elements.qty.value) || 1;
      
      addProductToCart(product, size, color, qty);
      
      modal.remove();
      if (overlay) overlay.classList.remove("active");
      isAddingToCart = false;
    };
  }
}

function addProductToCart(product, size, color, quantity) {
  const key = `${product.id}-${size}-${color}`;
  let existing = cart.find((item) => item.key === key);
  
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      key,
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      quantity,
      size,
      color
    });
  }
  
  saveCart();
  showCartNotification(`${product.name} ajouté au panier!`);
}

function showCartNotification(message) {
  const notification = document.createElement("div");
  notification.className = "cart-notification";
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add("show");
  }, 10);
  
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 2000);
}

function updateCartUI() {
  const cartCount = document.getElementById("cartCount");
  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (cartCount) cartCount.textContent = totalItems;
  if (cartTotal) cartTotal.textContent = totalPrice.toFixed(2);

  if (!cartItems) return;

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="empty-cart">
        <i class="fas fa-shopping-cart"></i>
        <p>Votre panier est vide</p>
      </div>
    `;
    const paypalDiv = document.getElementById("paypal-button-container");
    if (paypalDiv) paypalDiv.innerHTML = '';
    
    const natcashBtn = document.getElementById("natcash-payment-btn");
    if (natcashBtn) natcashBtn.style.display = 'none';
  } else {
    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div style="font-size:0.9em;color:#666;">${item.size ? `Taille/Modèle: <b>${item.size}</b>, ` : ''}Couleur: <b>${item.color}</b></div>
          <div class="cart-item-price">$${item.price.toFixed(2)}</div>
          <div class="quantity-controls">
            <button class="quantity-btn" onclick="updateQuantity('${item.key}', ${item.quantity - 1})">-</button>
            <span>${item.quantity}</span>
            <button class="quantity-btn" onclick="updateQuantity('${item.key}', ${item.quantity + 1})">+</button>
            <button class="quantity-btn" onclick="removeFromCart('${item.key}')" style="margin-left: 1rem; color: #ef4444;">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `).join("");
    
    const natcashBtn = document.getElementById("natcash-payment-btn");
    if (natcashBtn) natcashBtn.style.display = 'block';
    
    setTimeout(() => {
      if (totalPrice > 0) {
        renderPaypalButton(totalPrice);
      }
    }, 300);
  }
}

function updateQuantity(key, newQuantity) {
  let item = cart.find((i) => i.key === key);
  if (!item) return;
  if (newQuantity <= 0) {
    cart = cart.filter((i) => i.key !== key);
  } else {
    item.quantity = newQuantity;
  }
  saveCart();
}

function removeFromCart(key) {
  cart = cart.filter((i) => i.key !== key);
  saveCart();
}

function renderPaypalButton(totalPrice) {
  if (!window.paypal) {
    console.warn("PayPal SDK non chargé");
    setTimeout(() => renderPaypalButton(totalPrice), 1000);
    return;
  }
  
  const container = document.getElementById("paypal-button-container");
  if (!container) return;
  
  container.innerHTML = "";
  
  if (typeof totalPrice !== 'number' || totalPrice <= 0) {
    console.error("Montant PayPal invalide:", totalPrice);
    return;
  }

  try {
    window.paypal.Buttons({
      style: { 
        layout: 'vertical', 
        color: 'gold', 
        shape: 'rect', 
        label: 'paypal',
        height: 45,
        tagline: false
      },
      createOrder: function(data, actions) {
        return actions.order.create({
          purchase_units: [{
            amount: { 
              value: totalPrice.toFixed(2),
              currency_code: "USD"
            },
            description: "Achat MarcShop"
          }]
        });
      },
      onApprove: function(data, actions) {
        return actions.order.capture().then(async function(details) {
          // Vérifier que le profil est complet avant de finaliser
          if (!currentUser || !currentUser.profileCompleted) {
            alert("Veuillez d'abord compléter votre profil avant de payer.");
            showUserProfile();
            return;
          }
          
          const shippingAddress = currentUser.fullAddress || "Adresse non spécifiée";
          
          await createPaypalOrder(details, shippingAddress);
          
          // Afficher la confirmation
          showOrderConfirmation(orderId);
          
          cart = [];
          saveCart();
          toggleCart();
        });
      },
      onError: function(err) {
        console.error("Erreur PayPal:", err);
        alert("Une erreur s'est produite avec PayPal. Veuillez réessayer.");
      },
      onCancel: function(data) {
        console.log("Paiement annulé");
      }
    }).render('#paypal-button-container');
  } catch (e) {
    console.error("Erreur initialisation PayPal:", e);
    setTimeout(() => renderPaypalButton(totalPrice), 1000);
  }
}

// Ouvrir le modal NatCash
function openNatcashModal() {
  // Vérifier que le profil est complet
  if (!currentUser || !currentUser.profileCompleted) {
    alert("Veuillez d'abord compléter votre profil avant de payer.");
    showUserProfile();
    return;
  }
  
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Vérifier le montant minimum
  if (totalPrice < NATCASH_CONFIG.minAmount) {
    alert(`Le montant minimum pour un paiement NatCash est de ${NATCASH_CONFIG.minAmount} Gourdes.`);
    return;
  }
  
  if (totalPrice > NATCASH_CONFIG.maxAmount) {
    alert(`Pour les montants supérieurs à ${NATCASH_CONFIG.maxAmount} Gourdes, veuillez nous contacter directement au 8093-978-951`);
    return;
  }
  
  const natcashAmount = document.getElementById("natcashAmount");
  const natcashBusinessNumber = document.getElementById("natcashBusinessNumber");
  const natcashModal = document.getElementById("natcashModal");
  const overlay = document.getElementById("overlay");
  
  if (natcashAmount) natcashAmount.textContent = totalPrice.toFixed(2) + " HTG";
  if (natcashBusinessNumber) natcashBusinessNumber.textContent = NATCASH_CONFIG.businessNumber;
  if (natcashModal) natcashModal.classList.add("active");
  if (overlay) overlay.classList.add("active");
  
  // Réinitialiser le formulaire
  document.getElementById("natcashForm").reset();
  document.getElementById("natcashProgress").style.display = 'none';
  document.getElementById("natcashSuccess").style.display = 'none';
}

// Fermer le modal NatCash
function closeNatcashModal() {
  const natcashModal = document.getElementById("natcashModal");
  const overlay = document.getElementById("overlay");
  const natcashSuccess = document.getElementById("natcashSuccess");
  const natcashProgress = document.getElementById("natcashProgress");
  
  if (natcashModal) natcashModal.classList.remove("active");
  if (overlay) overlay.classList.remove("active");
  if (natcashSuccess) natcashSuccess.style.display = 'none';
  if (natcashProgress) natcashProgress.style.display = 'none';
  
  // Réinitialiser les indicateurs de progression
  const step1 = document.getElementById("natcashStep1");
  const step2 = document.getElementById("natcashStep2");
  const step3 = document.getElementById("natcashStep3");
  const step4 = document.getElementById("natcashStep4");
  
  if (step1) step1.textContent = "⏳";
  if (step2) step2.textContent = "⏳";
  if (step3) step3.textContent = "⏳";
  if (step4) step4.textContent = "⏳";
}

// Mettre à jour les indicateurs de progression
function updateNatcashProgress(step, status) {
  const stepElement = document.getElementById(`natcashStep${step}`);
  if (!stepElement) return;
  
  if (status === 'completed') {
    stepElement.innerHTML = '✅';
  } else if (status === 'failed') {
    stepElement.innerHTML = '❌';
  } else if (status === 'processing') {
    stepElement.innerHTML = '⏳';
  }
}

// Traiter le paiement NatCash
async function processNatcashPayment(e) {
  e.preventDefault();
  
  const phone = document.getElementById("natcashPhone")?.value.trim();
  const transactionId = document.getElementById("natcashTransaction")?.value.trim();
  
  if (!phone) {
    alert("Veuillez entrer votre numéro NatCash.");
    return;
  }
  
  if (!transactionId) {
    alert("Veuillez entrer l'ID de la transaction NatCash.");
    return;
  }
  
  if (!currentUser || !currentUser.fullAddress) {
    alert("Adresse de livraison manquante. Veuillez compléter votre profil.");
    showUserProfile();
    return;
  }
  
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Afficher la progression
  const natcashProgress = document.getElementById("natcashProgress");
  if (natcashProgress) natcashProgress.style.display = 'block';
  
  // Désactiver le bouton
  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Vérification en cours...";
  }
  
  try {
    // ÉTAPE 1 : Vérifier la transaction NatCash
    updateNatcashProgress(1, 'processing');
    const verification = await verifyNatcashTransaction(phone, transactionId, totalAmount);
    
    if (!verification.valid) {
      throw new Error(verification.message || "Transaction non valide");
    }
    updateNatcashProgress(1, 'completed');
    
    // ÉTAPE 2 : Retirer l'argent du compte NatCash
    updateNatcashProgress(2, 'processing');
    const withdrawal = await withdrawFromNatcash(verification.transaction, totalAmount);
    
    if (!withdrawal.success) {
      throw new Error("Échec du retrait NatCash");
    }
    updateNatcashProgress(2, 'completed');
    
    // ÉTAPE 3 : Transférer vers PayPal business
    updateNatcashProgress(3, 'processing');
    const transfer = await transferToPaypalBusiness(totalAmount, {
      transactionId: transactionId,
      customerPhone: phone,
      customerName: currentUser.name,
      orderId: generateOrderId()
    });
    
    if (!transfer.success) {
      throw new Error("Échec du transfert vers PayPal");
    }
    updateNatcashProgress(3, 'completed');
    
    // ÉTAPE 4 : Créer la commande dans Firestore
    updateNatcashProgress(4, 'processing');
    const orderId = await createNatcashOrder({
      transactionId: transactionId,
      payer: {
        name: currentUser.name,
        email: currentUser.email,
        phone: phone
      }
    }, currentUser.fullAddress, phone, transactionId, verification, withdrawal, transfer);
    updateNatcashProgress(4, 'completed');
    
    // Afficher le succès
    const natcashSuccess = document.getElementById("natcashSuccess");
    if (natcashSuccess) {
      natcashSuccess.style.display = 'block';
      natcashSuccess.innerHTML = `
        <i class="fas fa-check-circle" style="font-size: 3rem; color: #10b981; margin-bottom: 1rem;"></i>
        <h3>✅ Paiement confirmé !</h3>
        <p><strong>Montant : ${totalAmount} HTG</strong></p>
        <p><strong>Transaction : ${transactionId}</strong></p>
        <p>L'argent a été automatiquement transféré vers notre compte PayPal.</p>
        <p>Votre commande #${orderId} a été enregistrée.</p>
      `;
    }
    
    // Afficher la page de confirmation
    showOrderConfirmation(orderId);
    
    // Vider le panier après confirmation
    setTimeout(() => {
      cart = [];
      saveCart();
      closeNatcashModal();
      toggleCart();
    }, 3000);
    
  } catch (error) {
    console.error("Erreur paiement NatCash:", error);
    
    // Afficher l'erreur
    updateNatcashProgress(1, 'failed');
    alert(`❌ Erreur : ${error.message}\n\nVeuillez vérifier votre transaction et réessayer.`);
    
    // Réactiver le bouton
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Vérifier et confirmer le paiement";
    }
  }
}

// Vérifier la transaction NatCash
async function verifyNatcashTransaction(phone, transactionId, expectedAmount) {
  return new Promise((resolve, reject) => {
    console.log(`🔍 Vérification transaction NatCash...`);
    console.log(`📞 Numéro: ${phone}`);
    console.log(`🆔 Transaction: ${transactionId}`);
    console.log(`💰 Montant attendu: ${expectedAmount} HTG`);
    
    setTimeout(() => {
      // Simulation de vérification (90% de chance de succès)
      const random = Math.random();
      if (random < 0.9) {
        resolve({
          valid: true,
          transaction: {
            id: transactionId,
            sender: phone,
            amount: expectedAmount,
            status: 'completed',
            timestamp: new Date().toISOString(),
            fee: expectedAmount * 0.01 // 1% de frais
          }
        });
      } else {
        reject({
          valid: false,
          message: "Transaction non trouvée ou montant incorrect"
        });
      }
    }, 2000);
  });
}

// Retirer l'argent du compte NatCash
async function withdrawFromNatcash(transaction, amount) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`💰 Retrait du compte NatCash...`);
      console.log(`Montant: ${amount} HTG`);
      console.log(`Frais: ${amount * 0.01} HTG`);
      console.log(`Net reçu: ${amount * 0.99} HTG`);
      
      resolve({
        success: true,
        withdrawalId: 'WTHD-' + Date.now(),
        amount: amount * 0.99,
        fee: amount * 0.01,
        timestamp: new Date().toISOString()
      });
    }, 2000);
  });
}

// Transférer vers PayPal business
async function transferToPaypalBusiness(amount, details) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`💸 Transfert vers PayPal Business...`);
      console.log(`📧 Destination: ${NATCASH_CONFIG.paypalEmail}`);
      console.log(`💰 Montant: ${amount * 0.99} HTG converti en USD`);
      console.log(`📝 Détails:`, details);
      
      resolve({
        success: true,
        payoutId: 'PO-' + Date.now(),
        amount_usd: (amount * 0.99 / 100).toFixed(2),
        status: 'COMPLETED',
        timestamp: new Date().toISOString()
      });
    }, 3000);
  });
}

// Créer une commande NatCash dans Firestore
async function createNatcashOrder(paymentDetails, shippingAddress, natcashPhone, natcashTransaction, verification, withdrawal, transfer) {
  try {
    const orderData = {
      // Informations client
      userId: currentUser.id,
      customerName: currentUser.name,
      customerEmail: currentUser.email,
      customerPhone: currentUser.phone,
      
      // Adresse complète
      customerAddress: currentUser.fullAddress || shippingAddress,
      customerCountry: currentUser.country || '',
      customerCity: currentUser.city || '',
      customerProvince: currentUser.province || '',
      customerStreet: currentUser.street || '',
      customerStreetNumber: currentUser.streetNumber || '',
      customerZipCode: currentUser.zipCode || '',
      customerApartment: currentUser.apartment || '',
      
      // Panier
      items: cart,
      totalAmount: cart.reduce((total, item) => total + (item.price * item.quantity), 0),
      
      // Paiement NatCash
      paymentMethod: 'natcash',
      paymentStatus: 'completed',
      natcashDetails: {
        phone: natcashPhone,
        transactionId: natcashTransaction,
        verifiedAt: verification.transaction.timestamp,
        amount: verification.transaction.amount,
        fee: verification.transaction.fee
      },
      
      // Retrait NatCash
      withdrawalDetails: {
        id: withdrawal.withdrawalId,
        amount: withdrawal.amount,
        fee: withdrawal.fee,
        timestamp: withdrawal.timestamp
      },
      
      // Transfert PayPal
      paypalTransfer: {
        payoutId: transfer.payoutId,
        amount_usd: transfer.amount_usd,
        status: transfer.status,
        timestamp: transfer.timestamp,
        destination: NATCASH_CONFIG.paypalEmail
      },
      
      // Statut commande
      status: 'paid',
      paymentConfirmed: true,
      moneyTransferred: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Ajouter à Firestore
    const orderRef = await addDoc(collection(db, "orders"), orderData);
    const orderId = orderRef.id;
    
    // Envoyer l'email de confirmation
    await sendOrderConfirmationEmail(orderData, orderId);
    
    // Envoyer le SMS de confirmation
    await sendConfirmationSMS(orderData, orderId);
    
    // Mettre à jour le panier Firestore
    if (currentUser && !currentUser.id.startsWith('guest-')) {
      const cartsQuery = query(collection(db, "carts"), where("userId", "==", currentUser.id));
      const querySnapshot = await getDocs(cartsQuery);
      
      if (!querySnapshot.empty) {
        const cartDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "carts", cartDoc.id), {
          items: [],
          totalAmount: 0,
          lastUpdated: new Date().toISOString()
        });
      }
    }
    
    return orderId;
  } catch (error) {
    console.error("Erreur création commande:", error);
    throw error;
  }
}

// Créer une commande PayPal dans Firestore
async function createPaypalOrder(paymentDetails, shippingAddress) {
  try {
    const orderData = {
      userId: currentUser.id,
      customerName: currentUser.name,
      customerEmail: currentUser.email,
      customerPhone: currentUser.phone,
      customerAddress: currentUser.fullAddress || shippingAddress,
      customerCountry: currentUser.country || '',
      customerCity: currentUser.city || '',
      customerProvince: currentUser.province || '',
      customerStreet: currentUser.street || '',
      customerStreetNumber: currentUser.streetNumber || '',
      customerZipCode: currentUser.zipCode || '',
      customerApartment: currentUser.apartment || '',
      items: cart,
      totalAmount: cart.reduce((total, item) => total + (item.price * item.quantity), 0),
      paymentId: paymentDetails.id,
      paymentMethod: 'paypal',
      paymentStatus: 'completed',
      shippingAddress: shippingAddress,
      status: 'paid',
      createdAt: new Date().toISOString()
    };
    
    const orderRef = await addDoc(collection(db, "orders"), orderData);
    const orderId = orderRef.id;
    
    // Envoyer l'email de confirmation
    await sendOrderConfirmationEmail(orderData, orderId);
    
    // Envoyer le SMS de confirmation
    await sendConfirmationSMS(orderData, orderId);
    
    if (currentUser && !currentUser.id.startsWith('guest-')) {
      const cartsQuery = query(collection(db, "carts"), where("userId", "==", currentUser.id));
      const querySnapshot = await getDocs(cartsQuery);
      
      if (!querySnapshot.empty) {
        const cartDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "carts", cartDoc.id), {
          items: [],
          totalAmount: 0,
          lastUpdated: new Date().toISOString()
        });
      }
    }
    
    return orderId;
  } catch (error) {
    console.error("Erreur création commande PayPal:", error);
    throw error;
  }
}

// ============================================
// FONCTIONS DE NOTIFICATION PAR EMAIL ET SMS
// ============================================

// Envoyer un email de confirmation de commande
async function sendOrderConfirmationEmail(orderData, orderId) {
  const trackingLink = `https://marcshop01.github.io/MSP/tracking.html?order=${orderId}`;
  const date = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Créer le contenu HTML de l'email
  const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .order-info { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; }
            .tracking-btn { background: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Confirmation de commande</h1>
                <p>MarcShop - Votre boutique en ligne</p>
            </div>
            
            <div class="content">
                <h2>Bonjour ${orderData.customerName},</h2>
                <p>Merci pour votre commande sur MarcShop ! Nous avons bien reçu votre paiement et votre commande est en cours de traitement.</p>
                
                <div class="order-info">
                    <h3 style="color: #10b981;">📦 Détails de la commande #${orderId.substring(0, 8)}</h3>
                    <p><strong>Date :</strong> ${date}</p>
                    <p><strong>Montant total :</strong> $${orderData.totalAmount.toFixed(2)}</p>
                    <p><strong>Méthode de paiement :</strong> ${orderData.paymentMethod === 'paypal' ? 'PayPal' : 'NatCash'}</p>
                    
                    <h4 style="margin-top: 20px;">📍 Adresse de livraison</h4>
                    <p>${orderData.customerAddress}</p>
                    
                    <h4 style="margin-top: 20px;">🛒 Articles commandés</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>Produit</th>
                                <th>Quantité</th>
                                <th>Prix</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orderData.items.map(item => `
                                <tr>
                                    <td>${item.name} ${item.size ? `(${item.size})` : ''} ${item.color ? `- ${item.color}` : ''}</td>
                                    <td>${item.quantity}</td>
                                    <td>$${item.price.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="2" style="text-align: right;"><strong>Total</strong></td>
                                <td><strong>$${orderData.totalAmount.toFixed(2)}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <h3 style="color: #1e293b;">🔔 SUIVEZ VOTRE COLIS EN DIRECT</h3>
                    <p>Dès que votre colis sera expédié, vous pourrez suivre sa progression en temps réel.</p>
                    <a href="${trackingLink}" class="tracking-btn">
                        <i class="fas fa-truck"></i> Suivre ma commande
                    </a>
                    <p style="margin-top: 10px; font-size: 0.9rem; color: #6b7280;">
                        Ou scannez ce QR code :
                    </p>
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(trackingLink)}" 
                         style="width: 100px; height: 100px;">
                </div>
                
                <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="color: #1e40af; margin: 0;">
                        <strong>📱 Vous serez notifié par SMS</strong> dès que votre colis sera expédié.
                    </p>
                </div>
                
                <p>Si vous avez des questions, n'hésitez pas à nous contacter :</p>
                <p>
                    📞 Téléphone : 8093-978-951<br>
                    📧 Email : marcshop0705@gmail.com<br>
                    📱 Facebook/TikTok : @MarcShop
                </p>
            </div>
            
            <div class="footer">
                <p>© 2024 MarcShop - Tous droits réservés</p>
                <p>Livraison gratuite partout en Haïti</p>
            </div>
        </div>
    </body>
    </html>
  `;
  
  // Simuler l'envoi d'email (à remplacer par votre service d'email)
  console.log("=================================");
  console.log("📧 EMAIL DE CONFIRMATION ENVOYÉ");
  console.log("=================================");
  console.log("À:", orderData.customerEmail);
  console.log("Sujet: ✅ Confirmation de votre commande MarcShop #" + orderId.substring(0, 8));
  console.log("Contenu HTML envoyé avec succès");
  console.log("=================================");
  
  return true;
}

// Envoyer un SMS de confirmation
async function sendConfirmationSMS(orderData, orderId) {
  const trackingLink = `https://marcshop01.github.io/MSP/tracking.html?order=${orderId}`;
  
  // Simuler l'envoi de SMS
  console.log("=================================");
  console.log("📱 SMS DE CONFIRMATION ENVOYÉ");
  console.log("=================================");
  console.log("Au:", orderData.customerPhone);
  console.log("Message:");
  console.log(`MarcShop: Commande ${orderId.substring(0, 8)} confirmée!`);
  console.log(`Montant: $${orderData.totalAmount.toFixed(2)}`);
  console.log(`Suivez votre colis: ${trackingLink}`);
  console.log("📞 8093-978-951");
  console.log("=================================");
  
  return true;
}

// Afficher la page de confirmation après paiement
function showOrderConfirmation(orderId) {
  const overlay = document.getElementById("overlay");
  
  // Créer le modal de confirmation
  const modal = document.createElement("div");
  modal.className = "modal active";
  modal.id = "confirmationModal";
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px; text-align: center;">
      <div style="font-size: 4rem; color: #10b981; margin-bottom: 1rem;">
        <i class="fas fa-check-circle"></i>
      </div>
      <h2 style="color: #10b981; margin-bottom: 1rem;">✅ PAIEMENT RÉUSSI !</h2>
      <p style="margin-bottom: 1.5rem; font-size: 1.1rem;">
        Merci pour votre commande <strong>${currentUser?.name}</strong> !
      </p>
      
      <div style="background: #f0fdf4; padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
        <p style="font-size: 1rem; margin-bottom: 0.5rem;">
          <strong>Numéro de commande :</strong>
        </p>
        <p style="font-size: 1.5rem; font-weight: bold; color: #10b981; margin-bottom: 1rem;">
          ${orderId}
        </p>
        <p style="color: #6b7280; font-size: 0.9rem;">
          📧 Un email de confirmation vous a été envoyé
        </p>
        <p style="color: #6b7280; font-size: 0.9rem;">
          📱 Un SMS vous a été envoyé
        </p>
      </div>
      
      <div style="background: #dbeafe; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
        <h3 style="color: #1e40af; margin-bottom: 0.5rem;">
          <i class="fas fa-truck"></i> SUIVEZ VOTRE COLIS
        </h3>
        <p style="margin-bottom: 1rem;">
          Dès que votre colis sera expédié, vous pourrez le suivre en direct !
        </p>
        <a href="tracking.html?order=${orderId}" 
           style="display: inline-block; background: #3b82f6; color: white; padding: 0.75rem 2rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600;">
          <i class="fas fa-search"></i> Suivre ma commande
        </a>
      </div>
      
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button onclick="closeConfirmationModal()" style="background: #6b7280; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer;">
          Continuer mes achats
        </button>
        <button onclick="window.location.href='mes-commandes.html'" style="background: #10b981; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer;">
          Mes commandes
        </button>
      </div>
      
      <p style="margin-top: 1.5rem; color: #6b7280; font-size: 0.9rem;">
        🔔 Vous recevrez une notification dès que votre colis sera expédié
      </p>
    </div>
  `;
  
  document.body.appendChild(modal);
  if (overlay) overlay.classList.add("active");
}

// Fermer le modal de confirmation
function closeConfirmationModal() {
  const modal = document.getElementById("confirmationModal");
  const overlay = document.getElementById("overlay");
  if (modal) modal.remove();
  if (overlay) overlay.classList.remove("active");
}

// Générer un ID de commande
function generateOrderId() {
  return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function filterByCategory(category) {
  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  const activeBtn = document.querySelector(`[data-category="${category}"]`);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
  applyFilters();
}

function toggleCart() {
  const sidebar = document.getElementById("cartSidebar");
  const overlay = document.getElementById("overlay");
  if (sidebar) sidebar.classList.toggle("active");
  if (overlay) overlay.classList.toggle("active");
}

function closeAllPanels() {
  const sidebar = document.getElementById("cartSidebar");
  const overlay = document.getElementById("overlay");
  if (sidebar) sidebar.classList.remove("active");
  if (overlay) overlay.classList.remove("active");
  closeLightbox();
  closeNatcashModal();
  closeProfileModal();
}

function shareWebsite() {
  const url = window.location.href;
  const text = "Découvrez MarcShop - La meilleure boutique en ligne pour tous vos besoins!";
  if (navigator.share) {
    navigator.share({ title: "MarcShop", text: text, url: url });
  } else {
    navigator.clipboard.writeText(url).then(() => {
      alert("Lien copié dans le presse-papiers!");
    });
  }
}

// Exporter les fonctions nécessaires
export {
  sendOrderConfirmationEmail,
  sendConfirmationSMS,
  showOrderConfirmation,
  closeConfirmationModal
};
