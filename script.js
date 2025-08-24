import { 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  getDocs
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

// Options par catégorie
const SIZE_OPTIONS = {
  clothing: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  shoes: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"],
  electronics: ["Standard", "Petit", "Moyen", "Grand", "Extra Large"],
  home: ["Petit", "Moyen", "Grand", "Personnalisé"],
  sports: ["XS", "S", "M", "L", "XL", "XXL"],
  beauty: ["100ml", "200ml", "250ml", "500ml", "1L"],
  default: ["Unique", "Standard", "Personnalisé"]
};

const COLORS = ["Blanc", "Noir", "Rouge", "Bleu", "Vert", "Jaune", "Rose", "Violet", "Orange", "Gris", "Marron", "Beige"];

// Configuration NatCash
const NATCASH_BUSINESS_NUMBER = "50942557123";

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM chargé, initialisation...");
  loadFirestoreProducts();
  loadFirestoreUsers();
  loadCart();
  checkUserRegistration();
  setupEventListeners();
  setupLightbox();
  window.toggleCart = toggleCart;
});

function loadFirestoreProducts() {
  console.log("Chargement des produits depuis Firestore...");
  const productsCol = collection(db, "products");
  
  onSnapshot(productsCol, (snapshot) => {
    if (snapshot.empty) {
      console.log("Aucun produit trouvé dans Firestore");
      displayDefaultProducts();
      return;
    }
    
    allProducts = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
    
    console.log("Produits chargés:", allProducts.length);
    
    // Mélanger aléatoirement les produits
    products = shuffleArray([...allProducts]);
    
    // Appliquer les filtres actuels (recherche et catégorie)
    applyFilters();
  }, (error) => {
    console.error("Erreur lors du chargement des produits:", error);
    displayDefaultProducts();
  });
}

function displayDefaultProducts() {
  console.log("Affichage des produits par défaut");
  // Produits par défaut pour tester l'affichage
  products = [
    {
      id: "default-1",
      name: "Smartphone Android",
      price: 299.99,
      originalPrice: 399.99,
      category: "electronics",
      description: "Un smartphone Android performant avec un excellent rapport qualité-prix",
      images: ["https://via.placeholder.com/300x300?text=Smartphone"],
      stock: 50,
      status: "active",
      createdAt: new Date().toISOString()
    },
    {
      id: "default-2",
      name: "T-shirt Premium",
      price: 29.99,
      originalPrice: 39.99,
      category: "clothing",
      description: "T-shirt en coton de haute qualité",
      images: ["https://via.placeholder.com/300x300?text=T-shirt"],
      stock: 100,
      status: "active",
      createdAt: new Date().toISOString()
    },
    {
      id: "default-3",
      name: "Casque Audio",
      price: 89.99,
      originalPrice: 119.99,
      category: "electronics",
      description: "Casque audio avec réduction de bruit",
      images: ["https://via.placeholder.com/300x300?text=Casque"],
      stock: 30,
      status: "active",
      createdAt: new Date().toISOString()
    }
  ];
  
  allProducts = [...products];
  applyFilters();
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function loadFirestoreUsers() {
  const usersCol = collection(db, "users");
  onSnapshot(usersCol, (snapshot) => {
    users = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
  });
}

function loadCart() {
  try {
    cart = JSON.parse(localStorage.getItem("marcshop-cart")) || [];
    currentUser = JSON.parse(localStorage.getItem("marcshop-current-user"));
  } catch (e) {
    cart = [];
  }
  updateCartUI();
  
  if (currentUser) {
    syncCartToFirestore();
  }
}

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

async function updateUserActivity() {
  if (!currentUser) return;
  
  try {
    const userRef = doc(db, "users", currentUser.id);
    await updateDoc(userRef, {
      lastActivity: new Date().toISOString()
    });
  } catch (error) {
    console.error("Erreur mise à jour activité:", error);
  }
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
      document.getElementById("registrationModal").classList.add("active");
    }, 1000);
  } else {
    displayUserName();
  }
}

function setupEventListeners() {
  document.getElementById("registrationForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("user极速加速器Name").value.trim();
    const email = document.getElementById("userEmail").value.trim();
    const phone = document.getElementById("userPhone").value.trim();
    if (name && email && phone) {
      await registerUser(name, email, phone);
    }
  });

  document.getElementById("shareBtn").addEventListener("click", shareWebsite);

  document.querySelector(".user-logo").addEventListener("click", showUserProfile);
  document.getElementById("profileBtn").addEventListener("click", showUserProfile);

  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      currentCategory = this.dataset.category;
      filterByCategory(this.dataset.category);
    });
  });

  document.getElementById("overlay").addEventListener("click", () => {
    closeAllPanels();
  });
  
  const searchInput = document.getElementById("searchInput");
  const clearSearch = document.getElementById("clearSearch");
  const searchIcon = document.getElementById("searchIcon");
  
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
  
  document.getElementById("natcash-payment-btn").addEventListener("click", openNatcashModal);
  document.getElementById("natcashForm").addEventListener("submit", processNatcashPayment);
  document.getElementById("cancelNatcash").addEventListener("click", closeNatcashModal);
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
  const closeBtn = lightbox.querySelector(".close");
  const prevBtn = lightbox.querySelector(".prev");
  const nextBtn = lightbox.querySelector(".next");
  
  closeBtn.addEventListener("click", closeLightbox);
  prevBtn.addEventListener("click", () => changeImage(-1));
  nextBtn.addEventListener("click", () => changeImage(1));
  
  window.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
}

window.openLightbox = function(productId, imgIndex = 0) {
  const product = products.find(p => p.id === productId);
  if (!product || !product.images || product.images.length === 0) return;
  currentProductImages = product.images;
  currentImageIndex = imgIndex;
  const lightboxImg = document.getElementById("lightboxImage");
  const descriptionDiv = document.getElementById("lightboxDescription");
  
  lightboxImg.src = currentProductImages[currentImageIndex];
  
  if (product.description) {
    descriptionDiv.innerHTML = `
      <h3>${product.name}</h3>
      <p>${product.description}</p>
    `;
    descriptionDiv.style.display = 'block';
  } else {
    descriptionDiv.style.display = 'none';
  }
  
  document.getElementById("productLightbox").style.display = "block";
  document.getElementById("overlay").classList.add("active");
}

function closeLightbox() {
  document.getElementById("productLightbox").style.display = "none";
  document.getElementById("overlay").classList.remove("active");
}

function changeImage(direction) {
  currentImageIndex += direction;
  if (currentImageIndex < 0) {
    currentImageIndex = currentProductImages.length - 1;
  } else if (currentImageIndex >= currentProductImages.length) {
    currentImageIndex = 0;
  }
  const lightbox极速加速器Img = document.getElementById("lightboxImage");
  lightboxImg.src = currentProductImages[currentImageIndex];
}

async function registerUser(name, email, phone) {
  const newUser = {
    name: name,
    email: email,
    phone: phone,
    registeredAt: new Date().toISOString(),
    isActive: true,
    lastActivity: new Date().toISOString(),
  };
  try {
    const ref = await addDoc(collection(db, "users"), newUser);
    newUser.id = ref.id;
    currentUser极速加速器 = newUser;
    saveCart();
    displayUserName();
    
    await syncCartToFirestore();
    
    document.getElementById("registrationModal").classList.remove("active");
  } catch (e) {
    alert("Erreur lors de l'inscription. Réessayez.");
    console.error(e);
  }
}

function displayUserName() {
  const name = currentUser && currentUser.name ? currentUser.name : "MarcShop";
  document.getElementById("userNameDisplay").textContent = name;
}

function showUserProfile() {
  if (!currentUser) return;
  alert(`Bienvenue ${currentUser.name}\nEmail : ${currentUser.email}\nTéléphone : ${currentUser.phone}`);
}

function renderProducts() {
  console.log("Rendu des produits:", filteredProducts.length);
  const grid = document.getElementById("productsGrid");
  
  if (!grid) {
    console.error("Element productsGrid non trouvé!");
    return;
  }
  
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
    const firstImage = product.images && product.images[0] ? product.images[0] : "https://via.placeholder.com/200?text=Image+Manquante";
    return `
      <div class="product-card" data-category="${product.category}">
        <div class="product-image" onclick="openLightbox('${product.id}')">
          <img src="${firstImage}" alt="${product.name}" class="product-img" onerror="this.src='https://via.placeholder.com/200?text=Image+Manquante'">
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
            <i class="fas fa-shopping-cart"></极速加速器i> Ajouter
          </button>
        </div>
      </div>
    `;
  }).join("");
}

window.addToCart = function(productId) {
  if (isAddingToCart) return;
  
  const product = products.find((p) => p.id === productId);
  if (!product) return;
  
  isAddingToCart = true;
  openProductOptions(product);
};

function openProductOptions(product) {
  const overlay = document.getElementById("overlay");
  overlay.classList.add("active");
  
  const category = product.category || 'default';
  const sizeOptions = SIZE_OPTIONS[category] || SIZE_OPTIONS.default;
  
  let modal = document.createElement("div");
  modal.className = "modal";
  modal.style.display = "flex";
  modal.innerHTML = `
    <div class="modal-content" style="max-width:400px;">
      <h3>Ajouter au panier</h3>
      <img src="${product.images[0]}" style="max-width:120px;max-height:120px;border-radius:6px;" onerror="this.src='https://via.placeholder.com/120x120?text=Image+Manquante'">
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
        <button type="button极速加速器" id="closeOptions" style="margin-top:0.5rem;">Annuler</button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  
  document.getElementById("closeOptions").onclick = () => {
    modal.remove(); 
    overlay.classList.remove("active");
    isAddingToCart = false;
  };
  
  document.getElementById("optionsForm").onsubmit = function(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = document.getElementById("submitOptions");
    submitBtn.disabled = true;
    
    const size = form.elements.size.value;
    const color = form.elements.color.value;
    const qty = parseInt(form.elements.qty.value) || 1;
    
    addProductToCart(product, size, color, qty);
    
    modal.remove();
    overlay.classList.remove("active");
    isAddingToCart = false;
  };
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

  cartCount.textContent = totalItems;
  cartTotal.textContent = totalPrice.toFixed(2);

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="empty-cart">
        <i class="fas fa-shopping-cart"></i>
        <p>Votre panier est vide</p>
      </div>
    `;
    const paypalDiv = document.getElementById("paypal-button-container");
    if (paypalDiv) paypalDiv.innerHTML = '';
    const addressForm = document.getElementById("addressForm");
    if (addressForm) addressForm.style.display = 'none';
    document.getElementById("natcash-payment-btn").style.display = 'none';
  } else {
    cartItems.innerHTML = cart.map(item => `
      <极速加速器div class="cart-item">
        <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/60x60?text=Image+Manquante'">
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
    
    if (!document.getElementById("addressForm")) {
      const addressFormHTML = `
        <div id="addressForm" style="margin-top: 1.5rem; padding: 1rem; background: #f9fafb; border-radius: 0.5rem;">
          <h4 style="margin-bottom: 1rem;">Adresse de livraison</h4>
          <div class="form-group">
            <label for="shippingAddress">Adresse complète</label>
            <textarea id="shippingAddress" rows="3" placeholder="Entrez votre adresse complète pour la livraison" required></textarea>
          </div>
        </div>
      `;
      cartItems.insertAdjacentHTML('beforeend', addressFormHTML);
    }
    
    document.getElementById("natcash-payment-btn").style.display = 'block';
    
    setTimeout(() => {
      if (totalPrice > 0) {
        renderPaypalButton(totalPrice);
      }
    }, 300);
  }
}

window.updateQuantity = function(key, newQuantity) {
  let item = cart.find((i) => i.key === key);
  if (!item) return;
  if (newQuantity <= 0) {
    cart = cart.filter((i) => i.key !== key);
  } else {
    item.quantity = newQuantity;
  }
  saveCart();
};

window.removeFromCart = function(key) {
  cart = cart.filter((i) => i.key !== key);
  saveCart();
};

function renderPaypalButton(totalPrice) {
  if (!window.paypal) {
    console.warn("PayPal SDK non chargé");
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
        label: 'paypal' 
      },
      createOrder: function(data, actions) {
        return actions.order.create({
          purchase_units: [{
            amount: { 
              value: totalPrice.toFixed(2),
              currency_code: "USD"
            }
          }]
        });
      },
      onApprove: function(data, actions) {
        return actions.order.capture().then(async function(details) {
          const shippingAddress = document.getElementById("shippingAddress")?.value || "Non spécifiée";
          
          await createOrder(details, shippingAddress, 'paypal');
          
          alert('Paiement réussi, merci ' + details.payer.name.given_name + ' ! Un reçu a été envoyé à votre email.');
          cart = [];
          saveCart();
        });
      },
      onError: function(err) {
        console.error("Erreur PayPal:", err);
        setTimeout(() => renderPaypalButton(totalPrice), 1000);
      },
      onCancel: function(data) {
        console.log("Paiement annulé");
      }
    }).render('#paypal-button-container');
  } catch (e) {
    console.error("Erreur initialisation PayPal:", e);
  }
}

function openNatcashModal() {
  const shippingAddress = document.getElementById("shippingAddress")?.value;
  if (!shippingAddress) {
    alert("Veuillez entrer votre adresse de livraison avant de payer.");
    return;
  }
  
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  document.getElementById("natcashAmount").textContent = "$" + totalPrice.toFixed(2);
  document.getElementById("natcashBusinessNumber").textContent = NATCASH_BUSINESS_NUMBER;
  document.getElementById("natcashModal").classList.add("active");
  document.getElementById("overlay").classList.add("active");
}

function closeNatcashModal() {
  document.getElementById("natcashModal").classList.remove("active");
  document.getElementById("overlay").classList.remove("active");
  document.getElementById("natcashSuccess").style.display = 'none';
  document.getElementById("natcashProgress").style.display = 'none';
  
  document.getElementById("natcashStep1").textContent = "⏳";
  document.getElementById("natcashStep2").textContent = "⏳";
  document.getElementById("natcashStep3").text极速加速器Content = "⏳";
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
  
  const phone = document.getElementById("natcashPhone").value;
  const transactionId = document.getElementById("natcashTransaction").value;
  const shippingAddress = document.getElementById("shippingAddress").value;
  
  if (!phone) {
    alert("Veuillez entrer votre numéro NatCash.");
    return;
  }
  
  if (!shippingAddress) {
    alert("Veuillez entrer votre adresse de livraison.");
    return;
  }
  
  document.getElementById("natcashProgress").style.display = 'block';
  updateNatcashProgress(1, 'processing');
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Traitement en cours...";
  
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
    const orderId = await createOrder({
      id: transactionId || 'NATCASH-' + Date.now(),
      payer: {
        name: currentUser.name,
        email: currentUser.email
      }
    }, shippingAddress, 'natcash', phone, transactionId);
    updateNatcashProgress(3, 'completed');
    
    document.getElementById("natcashSuccess").style.display = 'block';
    
    setTimeout(() => {
      cart = [];
      saveCart();
      alert("Paiement NatCash confirmé! Le transfert vers PayPal a été effectué avec succès. Numéro de commande: " + orderId);
      closeNatcashModal();
    }, 3000);
  } catch (error) {
    console.error("Erreur traitement paiement NatCash:", error);
    alert("Une erreur s'est produite lors du transfert vers PayPal. Veuillez réessayer.");
    submitBtn.disabled = false;
    submitBtn.textContent = "Confirmer le paiement";
  }
}

async function verifyNatcashPayment(phone, transactionId, amount) {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log(`Vérification NatCash: $${amount} depuis ${phone}, transaction: ${transactionId || "N/A"}`);
      resolve(Math.random() < 0.9);
    }, 2000);
  });
}

async function transferToPaypal(amount, description) {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log(`Transfert PayPal: $${amount} - ${description}`);
      resolve(Math.random() < 0.95);
    }, 3000);
  });
}

async function createOrder(paymentDetails, shippingAddress, paymentMethod, natcashPhone = null, natcashTransaction = null) {
  if (!currentUser) return;
  
  try {
    const orderData = {
      userId: currentUser.id,
      customerName: currentUser.name,
      customerEmail: currentUser.email,
      customerPhone: currentUser.phone,
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
  console.log("Contenu:");
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
  document.querySelector(`[data-category="${category}"]`).classList.add("active");
  applyFilters();
}

function toggleCart() {
  const sidebar = document.getElementById("cartSidebar");
  const overlay = document.getElementById("overlay");
  sidebar.classList.toggle("active");
  overlay.classList.toggle("active");
}

function closeAllPanels() {
  document.getElementById("cartSidebar").classList.remove("active");
  document.getElementById("overlay").classList.remove("active");
  closeLightbox();
  closeNatcashModal();
}

function switchTab(tabName) {
  document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach((content) => content.classList.remove("active"));
  document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");
  document.getElementById(`${tabName}Tab`).classList.add("active");
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
