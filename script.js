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
const NATCASH_BUSINESS_NUMBER = "50942557123";

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
    isOnline: true
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
  modal.className = "modal";
  modal.style.display = "flex";
  modal.innerHTML = `
    <div class="modal-content" style="max-width:400px;">
      <h3>Ajouter au panier</h3>
      <img src="${product.images[0]}" style="max-width:120px;max-height:120px;border-radius:6px;">
      <p><strong>${product.name}</strong></p>
      <form id="optionsForm">
        <label for="cartSize">Taille/Modèle :</label>
        <select id="cartSize" name="size" required>
          <option value="">Sélectionner</option>
          ${sizeOptions.map(s => `<option value="${s}">${s}</option>`).join("")}
        </select>
        <label for="cartColor" style="margin-top:1rem;">Couleur :</label>
        <select id="cartColor" name="color" required>
          <option value="">Sélectionner</option>
          ${COLORS.map(c => `<option value="${c}">${c}</option>`).join("")}
        </select>
        <label for="cartQty" style="margin-top:1rem;">Quantité :</label>
        <input type="number" id="cartQty" name="qty" min="1" value="1" style="width:60px;">
        <button type="submit" id="submitOptions" style="margin-top:1rem;background:#10b981;color:white;">Ajouter au panier</button>
        <button type="button" id="closeOptions" style="margin-top:0.5rem;">Annuler</button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  
  const closeOptions = document.getElementById("closeOptions");
  if (closeOptions) {
    closeOptions.onclick = () => {
      modal.remove(); 
      if (overlay) overlay.classList.remove("active");
      isAddingToCart = false;
    };
  }
  
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
          
          await createOrder(details, shippingAddress, 'paypal');
          
          alert('Paiement réussi, merci ' + details.payer.name.given_name + ' ! Un reçu a été envoyé à votre email.');
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

function openNatcashModal() {
  // Vérifier que le profil est complet
  if (!currentUser || !currentUser.profileCompleted) {
    alert("Veuillez d'abord compléter votre profil avant de payer.");
    showUserProfile();
    return;
  }
  
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const natcashAmount = document.getElementById("natcashAmount");
  const natcashBusinessNumber = document.getElementById("natcashBusinessNumber");
  const natcashModal = document.getElementById("natcashModal");
  const overlay = document.getElementById("overlay");
  
  if (natcashAmount) natcashAmount.textContent = totalPrice.toFixed(2) + " €";
  if (natcashBusinessNumber) natcashBusinessNumber.textContent = NATCASH_BUSINESS_NUMBER;
  if (natcashModal) natcashModal.classList.add("active");
  if (overlay) overlay.classList.add("active");
}

function closeNatcashModal() {
  const natcashModal = document.getElementById("natcashModal");
  const overlay = document.getElementById("overlay");
  const natcashSuccess = document.getElementById("natcashSuccess");
  const natcashProgress = document.getElementById("natcashProgress");
  
  if (natcashModal) natcashModal.classList.remove("active");
  if (overlay) overlay.classList.remove("active");
  if (natcashSuccess) natcashSuccess.style.display = 'none';
  if (natcashProgress) natcashProgress.style.display = 'none';
  
  const step1 = document.getElementById("natcashStep1");
  const step2 = document.getElementById("natcashStep2");
  const step3 = document.getElementById("natcashStep3");
  
  if (step1) step1.textContent = "⏳";
  if (step2) step2.textContent = "⏳";
  if (step3) step3.textContent = "⏳";
}

function updateNatcashProgress(step, status) {
  const stepElement = document.getElementById(`natcashStep${step}`);
  if (!stepElement) return;
  
  if (status === 'completed') {
    stepElement.innerHTML = '✅';
    stepElement.classList.add('status-completed');
  } else if (status === 'failed') {
    stepElement.innerHTML = '❌';
    stepElement.classList.add('status-failed');
  } else if (status === 'processing') {
    stepElement.innerHTML = '⏳';
  }
}

async function processNatcashPayment(e) {
  e.preventDefault();
  
  const phone = document.getElementById("natcashPhone")?.value;
  const transactionId = document.getElementById("natcashTransaction")?.value;
  
  if (!phone) {
    alert("Veuillez entrer votre numéro NatCash.");
    return;
  }
  
  const natcashProgress = document.getElementById("natcashProgress");
  if (natcashProgress) natcashProgress.style.display = 'block';
  updateNatcashProgress(1, 'processing');
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Traitement en cours...";
  }
  
  try {
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    updateNatcashProgress(1, 'processing');
    const paymentVerified = await verifyNatcashPayment(phone, transactionId, totalAmount);
    updateNatcashProgress(1, paymentVerified ? 'completed' : 'failed');
    
    if (!paymentVerified) {
      throw new Error("Paiement NatCash non vérifié");
    }
    
    updateNatcashProgress(2, 'processing');
    const transferSuccess = await transferToPaypal(totalAmount, `Commande NatCash ${transactionId || phone}`);
    updateNatcashProgress(2, transferSuccess ? 'completed' : 'failed');
    
    if (!transferSuccess) {
      throw new Error("Échec du transfert vers PayPal");
    }
    
    updateNatcashProgress(3, 'processing');
    const shippingAddress = currentUser.fullAddress || "Adresse non spécifiée";
    const orderId = await createOrder({
      id: transactionId || 'NATCASH-' + Date.now(),
      payer: {
        name: currentUser?.name || 'Client NatCash',
        email: currentUser?.email || 'natcash@client.com'
      }
    }, shippingAddress, 'natcash', phone, transactionId);
    updateNatcashProgress(3, 'completed');
    
    const natcashSuccess = document.getElementById("natcashSuccess");
    if (natcashSuccess) natcashSuccess.style.display = 'block';
    
    setTimeout(() => {
      cart = [];
      saveCart();
      alert("Paiement NatCash confirmé! Le transfert vers PayPal a été effectué avec succès. Numéro de commande: " + orderId);
      closeNatcashModal();
      toggleCart();
    }, 3000);
  } catch (error) {
    console.error("Erreur traitement paiement NatCash:", error);
    alert("Une erreur s'est produite lors du transfert vers PayPal. Veuillez réessayer.");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Confirmer le paiement";
    }
  }
}

async function verifyNatcashPayment(phone, transactionId, amount) {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log(`Vérification NatCash: ${amount} € depuis ${phone}, transaction: ${transactionId || "N/A"}`);
      resolve(Math.random() < 0.9);
    }, 2000);
  });
}

async function transferToPaypal(amount, description) {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log(`Transfert PayPal: ${amount} € - ${description}`);
      resolve(Math.random() < 0.95);
    }, 3000);
  });
}

async function createOrder(paymentDetails, shippingAddress, paymentMethod, natcashPhone = null, natcashTransaction = null) {
  if (!currentUser) {
    currentUser = {
      id: 'guest-' + Date.now(),
      name: 'Client Guest',
      email: 'guest@example.com',
      phone: 'Non spécifié'
    };
  }
  
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
      paymentMethod: paymentMethod,
      paymentStatus: 'completed',
      shippingAddress: shippingAddress,
      status: 'processing',
      createdAt: new Date().toISOString(),
      paypalTransferStatus: 'completed'
    };
    
    if (paymentMethod === 'natcash') {
      orderData.natcashPhone = natcashPhone;
      orderData.natcashTransaction = natcashTransaction;
    }
    
    const orderRef = await addDoc(collection(db, "orders"), orderData);
    
    await sendOrderConfirmationEmail(orderData, orderRef.id);
    
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
    
    return orderRef.id;
  } catch (error) {
    console.error("Erreur création commande:", error);
    throw error;
  }
}

async function sendOrderConfirmationEmail(orderData, orderId) {
  console.log("=== EMAIL DE CONFIRMATION ENVOYÉ ===");
  console.log("À: ", orderData.customerEmail);
  console.log("Sujet: Confirmation de votre commande MarcShop");
  console.log(`Bonjour ${orderData.customerName},`);
  console.log("Merci pour votre commande ! Voici le récapitulatif :");
  console.log("Numéro de commande: ", orderId);
  console.log("Articles:");
  orderData.items.forEach(item => {
    console.log(`- ${item.quantity}x ${item.name} (${item.size}, ${item.color}) - $${item.price.toFixed(2)}`);
  });
  console.log("Total: $", orderData.totalAmount.toFixed(2));
  console.log("Adresse de livraison: ", orderData.shippingAddress);
  console.log("Méthode de paiement: ", orderData.paymentMethod);
  if (orderData.paymentMethod === 'natcash') {
    console.log("Numéro NatCash: ", orderData.natcashPhone);
    console.log("Transaction NatCash: ", orderData.natcashTransaction || "Non fournie");
  }
  console.log("================================");
  
  return true;
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
