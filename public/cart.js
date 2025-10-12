(function() {
  'use strict';

  // Configuration - will be fetched from API in production
  const CONFIG = {
    appUrl: (window.location.hostname === 'localhost' || window.location.protocol === 'file:')
      ? 'http://localhost:3001' 
      : 'https://blackcartapp.netlify.app',
    shopDomain: window.Shopify?.shop || 'example-store.myshopify.com'
  };

  // State management
  const state = {
    isOpen: false,
    cart: null,
    settings: null,
    isLoading: false,
    protectionEnabled: false,
    protectionInCart: false
  };

  // ============================================
  // CART SIDEBAR HTML & CSS
  // ============================================
  
  function createCartHTML() {
    return `
      <div id="sp-cart-overlay" class="sp-cart-overlay">
        <div id="sp-cart-sidebar" class="sp-cart-sidebar">
          <!-- Header -->
          <div class="sp-cart-header">
            <h2>Your Cart</h2>
            <button id="sp-cart-close" class="sp-cart-close" aria-label="Close cart">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Cart Content -->
          <div id="sp-cart-content" class="sp-cart-content">
            <div class="sp-cart-loading">Loading...</div>
          </div>

          <!-- Footer -->
          <div class="sp-cart-footer">
            <!-- Protection Toggle -->
            <div id="sp-protection-container" class="sp-protection-container" style="display: none;">
              <div class="sp-protection-toggle">
                <div class="sp-protection-icon">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="24" cy="24" r="24" fill="#E3F2FD"/>
                    <path d="M24 12L16 16V22C16 27.55 19.84 32.74 25 34C30.16 32.74 34 27.55 34 22V16L24 12Z" fill="#2196F3"/>
                    <path d="M21 24L23 26L27 22" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div class="sp-protection-info">
                  <h3 class="sp-protection-title" id="sp-protection-title">Shipping Protection</h3>
                  <p class="sp-protection-description" id="sp-protection-description">
                    Protect your order from damage, loss, or theft during shipping.
                  </p>
                </div>
                <div class="sp-protection-right">
                  <span class="sp-protection-price" id="sp-protection-price">$2.99</span>
                  <label class="sp-toggle-switch">
                    <input 
                      type="checkbox" 
                      id="sp-protection-checkbox" 
                      class="sp-protection-checkbox"
                    />
                    <span class="sp-toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            <button id="sp-cart-checkout" class="sp-cart-checkout-btn">
              Proceed to Checkout • <span id="sp-checkout-total">$0.00</span>
            </button>
            <p class="sp-cart-note">Or continue shopping</p>
          </div>
        </div>
      </div>
    `;
  }

  function injectCSS() {
    const css = `
      /* Hide native Shopify cart drawer/popup */
      cart-drawer,
      cart-notification,
      .cart-drawer,
      .cart-popup,
      .mini-cart,
      #cart-drawer,
      #mini-cart,
      [id*="cart-drawer"],
      [class*="cart-drawer"],
      [id*="CartDrawer"],
      [class*="CartDrawer"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }

      /* Overlay */
      .sp-cart-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }

      .sp-cart-overlay.sp-open {
        opacity: 1;
        visibility: visible;
      }

      /* Sidebar */
      .sp-cart-sidebar {
        position: fixed;
        top: 0;
        right: 0;
        width: 100%;
        max-width: 420px;
        height: 100%;
        background: #ffffff;
        box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        transform: translateX(100%);
        transition: transform 0.3s ease;
      }

      .sp-cart-overlay.sp-open .sp-cart-sidebar {
        transform: translateX(0);
      }

      /* Header */
      .sp-cart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #e5e5e5;
      }

      .sp-cart-header h2 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        color: #000;
      }

      .sp-cart-close {
        background: none;
        border: none;
        cursor: pointer;
        padding: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.2s;
      }

      .sp-cart-close:hover {
        opacity: 0.6;
      }

      /* Content */
      .sp-cart-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
      }

      .sp-cart-loading {
        text-align: center;
        padding: 40px 20px;
        color: #666;
      }

      .sp-cart-empty {
        text-align: center;
        padding: 40px 20px;
        color: #666;
      }

      .sp-cart-empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      /* Cart Items */
      .sp-cart-items {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .sp-cart-item {
        display: flex;
        gap: 16px;
        padding-bottom: 20px;
        border-bottom: 1px solid #e5e5e5;
      }

      .sp-cart-item:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      .sp-cart-item-image {
        width: 100px;
        height: 100px;
        object-fit: cover;
        border-radius: 8px;
        background: #f5f5f5;
      }

      .sp-cart-item-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .sp-cart-item-title {
        font-size: 16px;
        font-weight: 500;
        color: #000;
        margin: 0;
        line-height: 1.4;
      }

      .sp-cart-item-variant {
        font-size: 14px;
        color: #666;
        margin: 0;
      }

      .sp-cart-item-price {
        font-size: 16px;
        font-weight: 600;
        color: #000;
        margin: 0;
      }

      .sp-cart-item-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: auto;
      }

      /* Quantity Controls */
      .sp-quantity-controls {
        display: flex;
        align-items: center;
        gap: 12px;
        border: 1px solid #e5e5e5;
        border-radius: 4px;
        padding: 4px;
      }

      .sp-quantity-btn {
        background: none;
        border: none;
        cursor: pointer;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        color: #000;
        transition: opacity 0.2s;
      }

      .sp-quantity-btn:hover {
        opacity: 0.6;
      }

      .sp-quantity-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .sp-quantity-value {
        min-width: 30px;
        text-align: center;
        font-size: 14px;
        font-weight: 500;
      }

      .sp-remove-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: #666;
        font-size: 14px;
        text-decoration: underline;
        padding: 4px;
        transition: color 0.2s;
      }

      .sp-remove-btn:hover {
        color: #000;
      }

      /* Footer */
      .sp-cart-footer {
        padding: 20px;
        border-top: 1px solid #e5e5e5;
        background: #fafafa;
      }

      .sp-cart-subtotal {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        font-size: 18px;
        font-weight: 600;
      }

      .sp-cart-checkout-btn {
        width: 100%;
        background: #1e88e5;
        color: #fff;
        border: none;
        padding: 16px;
        font-size: 16px;
        font-weight: 700;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .sp-cart-checkout-btn:hover {
        background: #1976d2;
      }

      .sp-cart-checkout-btn:disabled {
        background: #ccc;
        cursor: not-allowed;
      }

      .sp-cart-note {
        text-align: center;
        color: #666;
        font-size: 14px;
        margin: 12px 0 0;
      }

      /* Protection Toggle */
      .sp-protection-container {
        background: #f8f9fa;
        padding: 16px;
        margin-bottom: 20px;
        border-radius: 8px;
      }

      .sp-protection-toggle {
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .sp-protection-icon {
        flex-shrink: 0;
      }

      .sp-protection-icon svg {
        display: block;
      }

      .sp-protection-info {
        flex: 1;
      }

      .sp-protection-title {
        font-size: 16px;
        font-weight: 700;
        color: #000;
        margin: 0 0 4px 0;
      }

      .sp-protection-description {
        font-size: 13px;
        color: #666;
        margin: 0;
        line-height: 1.4;
      }

      .sp-protection-right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
        flex-shrink: 0;
      }

      .sp-protection-price {
        font-size: 16px;
        font-weight: 700;
        color: #000;
        margin: 0;
      }

      /* Toggle Switch */
      .sp-toggle-switch {
        position: relative;
        display: inline-block;
        width: 51px;
        height: 31px;
      }

      .sp-toggle-switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .sp-toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: 0.3s;
        border-radius: 31px;
      }

      .sp-toggle-slider:before {
        position: absolute;
        content: "";
        height: 23px;
        width: 23px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: 0.3s;
        border-radius: 50%;
      }

      .sp-protection-checkbox:checked + .sp-toggle-slider {
        background-color: var(--sp-toggle-color, #2196F3);
      }

      .sp-protection-checkbox:checked + .sp-toggle-slider:before {
        transform: translateX(20px);
      }

      .sp-toggle-slider:hover {
        box-shadow: 0 0 1px var(--sp-toggle-color, #2196F3);
      }

      /* Mobile Responsive */
      @media (max-width: 768px) {
        .sp-cart-sidebar {
          max-width: 100%;
        }

        .sp-cart-item-image {
          width: 80px;
          height: 80px;
        }

        .sp-cart-header h2 {
          font-size: 20px;
        }
      }

      /* Smooth transitions for updates */
      .sp-updating {
        opacity: 0.6;
        pointer-events: none;
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = css;
    document.head.appendChild(styleSheet);
  }

  // ============================================
  // SHOPIFY CART API FUNCTIONS
  // ============================================

  async function fetchCart() {
    try {
      const response = await fetch('/cart.js');
      const cart = await response.json();
      state.cart = cart;
      checkProtectionInCart();
      return cart;
    } catch (error) {
      console.error('Error fetching cart:', error);
      return null;
    }
  }

  async function fetchSettings() {
    try {
      console.log('Fetching settings from:', `${CONFIG.appUrl}/api/settings?shop=${CONFIG.shopDomain}`);
      const response = await fetch(`${CONFIG.appUrl}/api/settings?shop=${CONFIG.shopDomain}`);
      const settings = await response.json();
      console.log('Settings loaded:', settings);
      state.settings = settings;
      applySettings();
      return settings;
    } catch (error) {
      console.error('Error fetching settings:', error);
      return null;
    }
  }

  function applySettings() {
    if (!state.settings) {
      console.log('No settings available');
      return;
    }

    console.log('Applying settings:', state.settings);

    const container = document.getElementById('sp-protection-container');
    if (container && state.settings.enabled && state.settings.protectionProductId) {
      console.log('Showing protection container');
      container.style.display = 'block';
    } else {
      console.log('Protection container hidden. Enabled:', state.settings.enabled, 'ProductId:', state.settings.protectionProductId);
    }

    // Apply custom color
    if (state.settings.toggleColor) {
      document.documentElement.style.setProperty('--sp-toggle-color', state.settings.toggleColor);
    }

    // Apply custom text
    const titleEl = document.getElementById('sp-protection-title');
    if (titleEl && state.settings.toggleText) {
      titleEl.textContent = state.settings.toggleText;
    }

    const descEl = document.getElementById('sp-protection-description');
    if (descEl && state.settings.description) {
      descEl.textContent = state.settings.description;
    }

    const priceEl = document.getElementById('sp-protection-price');
    if (priceEl && state.settings.price) {
      priceEl.textContent = formatMoney(state.settings.price);
    }
  }

  function checkProtectionInCart() {
    if (!state.cart || !state.settings) return;

    const protectionItem = state.cart.items.find(item => 
      item.variant_id === state.settings.protectionProductId ||
      item.id === state.settings.protectionProductId
    );

    state.protectionInCart = !!protectionItem;
    
    // Update checkbox state
    const checkbox = document.getElementById('sp-protection-checkbox');
    if (checkbox) {
      checkbox.checked = state.protectionInCart;
    }
  }

  async function addProtectionToCart() {
    if (!state.settings || !state.settings.protectionProductId) {
      console.error('Protection product not configured');
      return;
    }

    try {
      state.isLoading = true;
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: state.settings.protectionProductId,
          quantity: 1
        })
      });

      if (response.ok) {
        await fetchCart();
        renderCart();
      }
      state.isLoading = false;
    } catch (error) {
      console.error('Error adding protection:', error);
      state.isLoading = false;
    }
  }

  async function removeProtectionFromCart() {
    if (!state.cart || !state.settings) return;

    const protectionItem = state.cart.items.find(item => 
      item.variant_id === state.settings.protectionProductId ||
      item.id === state.settings.protectionProductId
    );

    if (!protectionItem) return;

    const lineNumber = state.cart.items.indexOf(protectionItem) + 1;

    try {
      state.isLoading = true;
      await updateCartItem(lineNumber, 0);
      renderCart();
      state.isLoading = false;
    } catch (error) {
      console.error('Error removing protection:', error);
      state.isLoading = false;
    }
  }

  async function updateCartItem(lineIndex, quantity) {
    try {
      state.isLoading = true;
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line: lineIndex,
          quantity: quantity
        })
      });
      const cart = await response.json();
      state.cart = cart;
      state.isLoading = false;
      return cart;
    } catch (error) {
      console.error('Error updating cart:', error);
      state.isLoading = false;
      return null;
    }
  }

  async function removeCartItem(lineIndex) {
    return await updateCartItem(lineIndex, 0);
  }

  function formatMoney(cents) {
    return '$' + (cents / 100).toFixed(2);
  }

  // ============================================
  // RENDER FUNCTIONS
  // ============================================

  function renderCart() {
    const contentEl = document.getElementById('sp-cart-content');
    if (!contentEl) return;

    if (!state.cart || state.cart.item_count === 0) {
      contentEl.innerHTML = `
        <div class="sp-cart-empty">
          <div class="sp-cart-empty-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Add some products to get started!</p>
        </div>
      `;
      updateSubtotal(0);
      return;
    }

    // Filter out protection product from display
    const visibleItems = state.cart.items.filter(item => {
      if (!state.settings || !state.settings.protectionProductId) return true;
      return item.variant_id !== state.settings.protectionProductId && 
             item.id !== state.settings.protectionProductId;
    });

    const itemsHTML = visibleItems.map((item) => {
      const lineNumber = state.cart.items.indexOf(item) + 1;
      
      return `
        <div class="sp-cart-item" data-line="${lineNumber}">
          <img 
            src="${item.image || item.featured_image?.url || ''}" 
            alt="${item.title}"
            class="sp-cart-item-image"
          />
          <div class="sp-cart-item-details">
            <h3 class="sp-cart-item-title">${item.product_title}</h3>
            ${item.variant_title ? `<p class="sp-cart-item-variant">${item.variant_title}</p>` : ''}
            <p class="sp-cart-item-price">${formatMoney(item.final_line_price)}</p>
            <div class="sp-cart-item-controls">
              <div class="sp-quantity-controls">
                <button 
                  class="sp-quantity-btn sp-quantity-decrease" 
                  data-line="${lineNumber}"
                  ${item.quantity <= 1 ? 'disabled' : ''}
                >
                  −
                </button>
                <span class="sp-quantity-value">${item.quantity}</span>
                <button 
                  class="sp-quantity-btn sp-quantity-increase" 
                  data-line="${lineNumber}"
                >
                  +
                </button>
              </div>
              <button class="sp-remove-btn" data-line="${lineNumber}">
                Remove
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    contentEl.innerHTML = `<div class="sp-cart-items">${itemsHTML}</div>`;
    
    updateSubtotal(state.cart.total_price);
    attachCartItemListeners();
  }

  function updateSubtotal(cents) {
    const checkoutTotal = document.getElementById('sp-checkout-total');
    if (checkoutTotal) {
      checkoutTotal.textContent = formatMoney(cents);
    }

    const checkoutBtn = document.getElementById('sp-cart-checkout');
    if (checkoutBtn) {
      checkoutBtn.disabled = cents === 0;
    }
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  function attachCartItemListeners() {
    // Quantity increase
    document.querySelectorAll('.sp-quantity-increase').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const lineNumber = parseInt(e.target.dataset.line);
        const item = state.cart.items[lineNumber - 1];
        
        const itemEl = e.target.closest('.sp-cart-item');
        itemEl.classList.add('sp-updating');
        
        await updateCartItem(lineNumber, item.quantity + 1);
        renderCart();
      });
    });

    // Quantity decrease
    document.querySelectorAll('.sp-quantity-decrease').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const lineNumber = parseInt(e.target.dataset.line);
        const item = state.cart.items[lineNumber - 1];
        
        if (item.quantity > 1) {
          const itemEl = e.target.closest('.sp-cart-item');
          itemEl.classList.add('sp-updating');
          
          await updateCartItem(lineNumber, item.quantity - 1);
          renderCart();
        }
      });
    });

    // Remove item
    document.querySelectorAll('.sp-remove-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const lineNumber = parseInt(e.target.dataset.line);
        
        const itemEl = e.target.closest('.sp-cart-item');
        itemEl.classList.add('sp-updating');
        
        await removeCartItem(lineNumber);
        renderCart();
      });
    });
  }

  async function openCart() {
    const overlay = document.getElementById('sp-cart-overlay');
    if (overlay) {
      state.isOpen = true;
      overlay.classList.add('sp-open');
      document.body.style.overflow = 'hidden';
      
      // Fetch latest cart data and settings
      await fetchSettings();
      await fetchCart();
      renderCart();
    }
  }

  function closeCart() {
    const overlay = document.getElementById('sp-cart-overlay');
    if (overlay) {
      state.isOpen = false;
      overlay.classList.remove('sp-open');
      document.body.style.overflow = '';
    }
  }

  function attachEventListeners() {
    // Close button
    const closeBtn = document.getElementById('sp-cart-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeCart);
    }

    // Overlay click (close when clicking outside)
    const overlay = document.getElementById('sp-cart-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          closeCart();
        }
      });
    }

    // Checkout button
    const checkoutBtn = document.getElementById('sp-cart-checkout');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        window.location.href = '/checkout';
      });
    }

    // Protection toggle
    const protectionCheckbox = document.getElementById('sp-protection-checkbox');
    if (protectionCheckbox) {
      protectionCheckbox.addEventListener('change', async (e) => {
        const isChecked = e.target.checked;
        
        if (isChecked) {
          await addProtectionToCart();
        } else {
          await removeProtectionFromCart();
        }
      });
    }

    // Intercept cart icon clicks
    interceptCartLinks();

    // Listen for Add to Cart events
    interceptAddToCart();
  }

  function interceptCartLinks() {
    // Common cart selectors
    const cartSelectors = [
      'a[href="/cart"]',
      'a[href*="/cart"]',
      '.cart-link',
      '.header-cart',
      '[data-cart-icon]',
      '[href="#cart"]',
      '.cart-icon',
      '#cart-icon',
      '.header__icon--cart',
      'cart-icon-bubble',
      '[id*="cart"]',
      '[class*="cart"]'
    ];

    // Use event delegation on document for dynamically loaded elements
    document.addEventListener('click', (e) => {
      const target = e.target.closest(cartSelectors.join(','));
      if (target) {
        // Check if it's a cart link (not other cart-related elements)
        const href = target.getAttribute('href');
        if (href && (href === '/cart' || href.includes('/cart') || href === '#cart')) {
          e.preventDefault();
          e.stopPropagation();
          openCart();
        }
      }
    }, true); // Use capture phase to intercept early
  }

  function interceptAddToCart() {
    // Intercept form submissions
    document.addEventListener('submit', (e) => {
      const form = e.target;
      if (form.getAttribute('action')?.includes('/cart/add')) {
        e.preventDefault();
        e.stopPropagation();
        
        const formData = new FormData(form);
        
        fetch('/cart/add.js', {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          // Successfully added to cart
          openCart();
        })
        .catch(error => {
          console.error('Error adding to cart:', error);
        });
      }
    });

    // Intercept "Add to Cart" button clicks
    document.addEventListener('click', (e) => {
      const target = e.target;
      const button = target.closest('button[name="add"], button[type="submit"]');
      
      if (button) {
        const form = button.closest('form[action*="/cart/add"]');
        if (form) {
          e.preventDefault();
          e.stopPropagation();
          
          const formData = new FormData(form);
          
          fetch('/cart/add.js', {
            method: 'POST',
            body: formData
          })
          .then(response => response.json())
          .then(data => {
            // Successfully added to cart
            openCart();
          })
          .catch(error => {
            console.error('Error adding to cart:', error);
          });
        }
      }
    }, true); // Use capture phase

    // Listen for Shopify's cart events
    document.addEventListener('cart:updated', () => {
      openCart();
    });

    document.addEventListener('product:added-to-cart', () => {
      openCart();
    });
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  async function init() {
    console.log('🛒 Shipping Protection Cart initialized');

    // Inject CSS
    injectCSS();

    // Create cart HTML
    const cartContainer = document.createElement('div');
    cartContainer.innerHTML = createCartHTML();
    document.body.appendChild(cartContainer.firstElementChild);

    // Attach event listeners
    attachEventListeners();

    // Fetch settings and initial cart
    await fetchSettings();
    await fetchCart();

    // Expose global function to open cart
    window.openShippingProtectionCart = openCart;
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

