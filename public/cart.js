(function() {
  'use strict';

  // Configuration - will be fetched from API in production
  const CONFIG = {
    appUrl: (window.location.hostname === 'localhost' || window.location.protocol === 'file:')
      ? 'http://localhost:3001' 
      : 'https://www.cartbase.app',
    // Extract token from script src URL: <script src="cart.js?token=xxx"></script>
    token: (() => {
      const scripts = document.getElementsByTagName('script');
      for (let i = 0; i < scripts.length; i++) {
        const src = scripts[i].src;
        if (src && src.includes('cart.js')) {
          const urlParams = new URLSearchParams(src.split('?')[1]);
          return urlParams.get('token');
        }
      }
      return null;
    })()
  };

  // Helper function to get shop domain (may need to wait for Shopify object)
  function getShopDomain() {
    return window.Shopify?.shop || '';
  }

  // State management
  const state = {
    isOpen: false,
    cart: null,
    settings: null,
    isLoading: false,
    protectionEnabled: false,
    protectionInCart: false,
    protectionVariantId: null  // Cache variant ID for removal
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
            <h2 id="sp-cart-title">Your Cart</h2>
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
                  <img src="https://www.cartbase.app/add-on.png" alt="Add-on" width="48" height="48" style="display: block;" />
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
              <span id="sp-checkout-text">Proceed to Checkout</span><span id="sp-checkout-total-separator" style="display: none;"> • </span><span id="sp-checkout-total"></span>
            </button>
            <p class="sp-cart-note" id="sp-continue-shopping" style="cursor: pointer;">Or continue shopping</p>
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
        z-index: 2147483647; /* Maximum z-index value */
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
        isolation: isolate; /* Create new stacking context */
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
        z-index: 2147483647; /* Maximum z-index value */
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
        font-size: 13px;
        font-weight: 500;
        color: #000;
        margin: 0;
        line-height: 1.4;
        flex: 1;
      }
      
      .sp-cart-item-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 2px;
      }

      .sp-cart-item-variant {
        font-size: 12px;
        color: #999999;
        margin: 0;
      }

      .sp-cart-item-price {
        font-size: 16px;
        font-weight: 400;
        color: #000;
        margin: 0;
      }

      .sp-cart-item-savings {
        font-size: 12px;
        font-weight: 500;
        margin: 4px 0 0 0;
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
        gap: 8px;
        border: 1px solid #e5e5e5;
        border-radius: 4px;
        padding: 2px;
      }

      .sp-quantity-btn {
        background: none;
        border: none;
        cursor: pointer;
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
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
        min-width: 24px;
        text-align: center;
        font-size: 13px;
        font-weight: 500;
      }

      .sp-remove-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: #999;
        padding: 4px;
        transition: color 0.2s;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .sp-remove-btn:hover {
        color: #e74c3c;
      }
      
      .sp-remove-btn svg {
        width: 16px;
        height: 16px;
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
        padding: 0;
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
        font-weight: 400;
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
        font-weight: 400;
        color: #000;
        margin: 0;
      }

      /* Toggle Switch */
      .sp-toggle-switch {
        position: relative;
        display: inline-block;
        width: 42px;
        height: 24px;
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
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: 0.3s;
        border-radius: 50%;
      }

      .sp-protection-checkbox:checked + .sp-toggle-slider {
        background-color: var(--sp-toggle-color, #2196F3);
      }

      .sp-protection-checkbox:checked + .sp-toggle-slider:before {
        transform: translateX(18px);
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
      // Get shop domain at fetch time (not at script load time)
      const shopDomain = getShopDomain();
      
      // Validate shop domain is available
      if (!shopDomain) {
        console.error('❌ Shop domain not available. Make sure this script runs on a Shopify store.');
        console.error('   window.Shopify.shop:', window.Shopify?.shop);
        return null;
      }
      
      // Use token-based authentication if available
      // SECURITY: Always send shop domain for domain binding validation
      const url = CONFIG.token 
        ? `${CONFIG.appUrl}/api/settings?token=${CONFIG.token}&shop=${shopDomain}`
        : `${CONFIG.appUrl}/api/settings?shop=${shopDomain}`;
      
      console.log('🔑 Token extracted:', CONFIG.token ? 'YES (***' + CONFIG.token.substr(-4) + ')' : 'NO');
      console.log('🏪 Shop Domain:', shopDomain);
      console.log('🌐 Fetching settings from:', url.replace(CONFIG.token || '', '***'));
      
      const response = await fetch(url);
      
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        console.error('❌ Failed to fetch settings:', response.status, response.statusText);
        
        try {
          const errorData = await response.json();
          
          if (response.status === 400 && errorData.error === 'Shop domain required') {
            console.error('🚫 Security: Shop domain is required but was not detected.');
            console.error('   This is a security feature to prevent token sharing.');
            console.error('   window.Shopify.shop:', window.Shopify?.shop);
          } else if (response.status === 401) {
            console.error('🔒 Invalid or missing access token. Token used:', CONFIG.token ? 'YES' : 'NO');
          } else if (response.status === 403) {
            if (errorData.error === 'Domain mismatch') {
              console.error('🚫 Security: Token is registered to a different store domain.');
              console.error('   Token belongs to:', errorData.registered_domain);
              console.error('   Current domain:', errorData.requesting_domain);
            } else {
              console.error('🚫 Subscription not active. Cart is disabled.');
            }
          }
          
          console.error('Error details:', errorData);
        } catch (parseError) {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error('Error details:', errorText);
        }
        
        return null;
      }
      
      const settings = await response.json();
      console.log('✅ Settings loaded successfully');
      console.log('📦 Full settings object:', JSON.stringify(settings, null, 2));
      console.log('🎚️ Cart Active:', settings.cart_active);
      console.log('🎨 Button Text:', settings.design?.buttonText);
      state.settings = settings;
      
      // Check if cart is active
      if (settings.cart_active === false) {
        console.log('Cart app is deactivated. Using native Shopify cart.');
        return null; // Signal to not initialize the cart
      }
      
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

    console.log('🎨 Applying settings:', state.settings);
    console.log('🎨 Design settings:', state.settings.design);
    console.log('🧩 Add-ons settings:', state.settings.addons);

    const container = document.getElementById('sp-protection-container');
    const addonsEnabled = state.settings.addons?.enabled ?? state.settings.enabled ?? true;
    if (container && addonsEnabled) {
      console.log('Showing protection container');
      container.style.display = 'block';
      
      // If no product ID is set, show a note to merchant
      const productId = state.settings.addons?.productId || state.settings.protectionProductId;
      if (!productId) {
        console.warn('Protection enabled but no product ID set. Please configure in settings.');
      }
    } else {
      console.log('Protection container hidden. Enabled:', addonsEnabled);
    }

    // Apply protection toggle settings
    if (state.settings.toggleColor) {
      document.documentElement.style.setProperty('--sp-toggle-color', state.settings.toggleColor);
    }

    const titleEl = document.getElementById('sp-protection-title');
    const addonTitle = state.settings.addons?.title || state.settings.toggleText;
    if (titleEl && addonTitle) {
      titleEl.textContent = addonTitle;
    }

    const descEl = document.getElementById('sp-protection-description');
    const addonDesc = state.settings.addons?.description || state.settings.description;
    if (descEl && addonDesc) {
      descEl.textContent = addonDesc;
    }

    const priceEl = document.getElementById('sp-protection-price');
    const addonPrice = state.settings.addons?.price ? Math.round(state.settings.addons.price * 100) : state.settings.price;
    if (priceEl && addonPrice) {
      priceEl.textContent = formatMoney(addonPrice);
    }

    // Apply design settings
    if (state.settings.design) {
      const design = state.settings.design;
      
      // Apply to cart sidebar
      const sidebar = document.getElementById('sp-cart-sidebar');
      if (sidebar) {
        sidebar.style.background = design.backgroundColor;
        sidebar.style.color = design.cartTextColor;
      }

      // Apply cart title and alignment
      const titleEl = document.getElementById('sp-cart-title');
      const headerEl = document.querySelector('.sp-cart-header');
      if (titleEl && design.cartTitle) {
        titleEl.textContent = design.cartTitle;
        titleEl.style.color = design.cartTextColor;
      }
      if (headerEl && design.cartTitleAlignment) {
        if (design.cartTitleAlignment === 'center') {
          headerEl.style.justifyContent = 'center';
          headerEl.style.position = 'relative';
          const closeBtn = document.querySelector('.sp-cart-close');
          if (closeBtn) {
            closeBtn.style.position = 'absolute';
            closeBtn.style.right = '20px';
          }
        } else {
          headerEl.style.justifyContent = 'space-between';
          headerEl.style.position = 'static';
          const closeBtn = document.querySelector('.sp-cart-close');
          if (closeBtn) {
            closeBtn.style.position = 'static';
            closeBtn.style.right = 'auto';
          }
        }
      }

      const closeBtn = document.querySelector('.sp-cart-close');
      if (closeBtn) {
        closeBtn.style.color = design.closeButtonColor || design.cartTextColor;
        
        // Apply size
        const sizeMap = { small: '20px', medium: '24px', large: '32px' };
        closeBtn.style.fontSize = sizeMap[design.closeButtonSize] || '24px';
        
        // Apply border
        if (design.closeButtonBorder && design.closeButtonBorder !== 'none') {
          const borderWidth = design.closeButtonBorder === 'thin' ? '1px' : 
                              design.closeButtonBorder === 'normal' ? '2px' : '3px';
          closeBtn.style.border = `${borderWidth} solid ${design.closeButtonBorderColor || '#000'}`;
          closeBtn.style.borderRadius = '4px';
          closeBtn.style.padding = '4px 8px';
        } else {
          closeBtn.style.border = 'none';
          closeBtn.style.borderRadius = '0';
          closeBtn.style.padding = '0';
        }
      }

      // Apply to checkout button
      const checkoutBtn = document.getElementById('sp-cart-checkout');
      const checkoutText = document.getElementById('sp-checkout-text');
      if (checkoutBtn) {
        checkoutBtn.style.background = design.buttonColor;
        checkoutBtn.style.color = design.buttonTextColor;
        checkoutBtn.style.borderRadius = `${design.cornerRadius}px`;
      }
      
      // Apply button text
      if (checkoutText && design.buttonText) {
        checkoutText.textContent = design.buttonText;
      }

      // Apply continue shopping note
      const noteEl = document.querySelector('.sp-cart-note');
      if (noteEl) {
        noteEl.style.display = design.showContinueShopping ? 'block' : 'none';
        noteEl.style.color = design.cartTextColor;
      }
      
      // Apply cart accent color (to footer and protection container)
      const footer = document.querySelector('.sp-cart-footer');
      if (footer && design.cartAccentColor) {
        footer.style.background = design.cartAccentColor;
      }
      
      const protectionContainer = document.getElementById('sp-protection-container');
      if (protectionContainer && design.cartAccentColor) {
        protectionContainer.style.background = design.cartAccentColor;
      }
      
      // Apply text colors to all cart text elements
      const allTextElements = document.querySelectorAll('.sp-cart-item-title, .sp-cart-item-variant, .sp-cart-item-price');
      allTextElements.forEach(el => {
        if (design.cartTextColor) {
          el.style.color = design.cartTextColor;
        }
      });
      
      // Apply savings text color
      const savingsElements = document.querySelectorAll('.sp-cart-item-savings');
      savingsElements.forEach(el => {
        if (design.savingsTextColor) {
          el.style.color = design.savingsTextColor;
        }
      });
      
      // Apply border radius to images if cornerRadius is set
      const images = document.querySelectorAll('.sp-cart-item-image');
      images.forEach(img => {
        if (design.cornerRadius) {
          img.style.borderRadius = `${design.cornerRadius}px`;
        }
      });
      
      console.log('✅ All design settings applied successfully');
    }
  }

  function checkProtectionInCart() {
    if (!state.cart || !state.settings) return;
    
    // Check using cached variant ID only (since we fetch it dynamically now)
    let protectionItem;
    if (state.protectionVariantId) {
      protectionItem = state.cart.items.find(item => 
        item.variant_id === state.protectionVariantId ||
        item.id === state.protectionVariantId
      );
    }

    state.protectionInCart = !!protectionItem;
    
    // Cache the variant ID if we found the protection item
    if (protectionItem && !state.protectionVariantId) {
      state.protectionVariantId = protectionItem.id || protectionItem.variant_id;
      console.log('🔍 Cached protection variant ID:', state.protectionVariantId);
    }
    
    // Ensure protection product quantity is always 1 (fix if > 1)
    if (protectionItem && protectionItem.quantity > 1) {
      console.log('⚠️ Protection product quantity is > 1, fixing to 1');
      const lineNumber = state.cart.items.indexOf(protectionItem) + 1;
      updateCartItem(lineNumber, 1);
    }
    
    // Update checkbox state
    const checkbox = document.getElementById('sp-protection-checkbox');
    if (checkbox) {
      checkbox.checked = state.protectionInCart;
    }
  }

  // Helper function to check if protection should be auto-added
  async function maybeAutoAddProtection() {
    // Only auto-add if acceptByDefault is enabled and protection is not already in cart
    if (state.settings?.addons?.acceptByDefault && !state.protectionInCart && state.settings?.addons?.productHandle) {
      console.log('🛡️ Auto-adding protection (acceptByDefault is enabled)');
      await addProtectionToCart(true); // silent mode
    }
  }

  async function addProtectionToCart(silentMode = false) {
    const productHandle = state.settings?.addons?.productHandle || state.settings?.protectionProductHandle;
    
    if (!state.settings || !productHandle) {
      console.error('❌ Protection product not configured. Please add a Product Handle in settings.');
      if (!silentMode) {
        alert('Shipping protection is not configured. Please contact store admin.');
      }
      return;
    }

    // Check if protection is already in cart - prevent duplicates
    if (state.protectionInCart) {
      console.log('ℹ️ Protection already in cart, skipping add');
      return;
    }

    console.log('🛡️ Adding protection to cart with Product Handle:', productHandle);

    try {
      state.isLoading = true;
      
      // Fetch product data from Shopify's public endpoint
      console.log('📡 Fetching product data from Shopify...');
      const productResponse = await fetch(`/products/${productHandle}.js`);

      if (!productResponse.ok) {
        console.error('❌ Failed to fetch product. Handle may be incorrect:', productHandle);
        if (!silentMode) {
          alert('Failed to load protection product. Please check the Product Handle in settings.');
        }
        
        const checkbox = document.getElementById('sp-protection-checkbox');
        if (checkbox) checkbox.checked = false;
        state.isLoading = false;
        return;
      }

      const productData = await productResponse.json();
      
      // Get the first available variant
      if (!productData.variants || productData.variants.length === 0) {
        console.error('❌ No variants found for product:', productHandle);
        if (!silentMode) {
          alert('Protection product has no variants. Please contact store admin.');
        }
        
        const checkbox = document.getElementById('sp-protection-checkbox');
        if (checkbox) checkbox.checked = false;
        state.isLoading = false;
        return;
      }

      const variantId = productData.variants[0].id;
      
      console.log('✅ Got Variant ID:', variantId, 'for product:', productData.title);

      // Now add to cart using the variant ID
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: variantId,
          quantity: 1
        })
      });

      console.log('📡 Add to cart response:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Protection added successfully:', data);
        
        // Cache the variant ID for later removal
        state.protectionVariantId = variantId;
        state.protectionInCart = true; // Update state
        
        await fetchCart();
        renderCart();
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to add protection to cart:', response.status, errorText);
        if (!silentMode) {
          alert('Failed to add shipping protection. Please try again.');
        }
        
        // Uncheck the checkbox
        const checkbox = document.getElementById('sp-protection-checkbox');
        if (checkbox) checkbox.checked = false;
      }
      state.isLoading = false;
    } catch (error) {
      console.error('❌ Error adding protection:', error);
      if (!silentMode) {
        alert('Network error. Please check your connection and try again.');
      }
      
      // Uncheck the checkbox
      const checkbox = document.getElementById('sp-protection-checkbox');
      if (checkbox) checkbox.checked = false;
      
      state.isLoading = false;
    }
  }

  async function removeProtectionFromCart() {
    if (!state.cart || !state.settings) return;
    
    console.log('🗑️ Removing protection. Cached Variant ID:', state.protectionVariantId);
    
    // Use the cached variant ID to find the protection item
    if (!state.protectionVariantId) {
      console.log('⚠️ No cached variant ID. Cannot remove protection.');
      return;
    }
    
    const protectionItem = state.cart.items.find(item => 
      item.variant_id === state.protectionVariantId ||
      item.id === state.protectionVariantId
    );

    if (!protectionItem) {
      console.log('❌ Protection item not found in cart');
      return;
    }
    
    console.log('✅ Found protection item:', protectionItem.title);

    const lineNumber = state.cart.items.indexOf(protectionItem) + 1;
    console.log('Removing line:', lineNumber);

    try {
      state.isLoading = true;
      await updateCartItem(lineNumber, 0);
      state.protectionInCart = false; // Update state
      // Keep protectionVariantId cached so we can re-add it later
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
      const emptyText = state.settings?.design?.emptyCartText || 'Your cart is empty';
      contentEl.innerHTML = `
        <div class="sp-cart-empty">
          <div class="sp-cart-empty-icon">🛒</div>
          <h3>${emptyText}</h3>
          <p>Add some products to get started!</p>
        </div>
      `;
      updateSubtotal(0);
      return;
    }

    // Filter out protection product from display
    const visibleItems = state.cart.items.filter(item => {
      // If we have a cached protection variant ID, filter it out
      if (state.protectionVariantId) {
        return item.id !== state.protectionVariantId && item.variant_id !== state.protectionVariantId;
      }
      return true;
    });

    const itemsHTML = visibleItems.map((item) => {
      const lineNumber = state.cart.items.indexOf(item) + 1;
      
      // Calculate compare-at-price and savings
      const showSavings = state.settings?.design?.showSavings !== false;
      const displayCompareAtPrice = state.settings?.design?.displayCompareAtPrice !== false;
      let compareAtPriceHTML = '';
      let savingsHTML = '';
      
      // Check for compare_at_price
      if (item.compare_at_price && item.compare_at_price > item.final_line_price) {
        if (displayCompareAtPrice) {
          compareAtPriceHTML = `<span style="font-size: 13px; color: #999; text-decoration: line-through; margin-right: 8px;">${formatMoney(item.compare_at_price)}</span>`;
        }
        if (showSavings) {
          const savings = item.compare_at_price - item.final_line_price;
          const savingsColor = state.settings?.design?.savingsTextColor || '#2ea818';
          const savingsText = state.settings?.design?.savingsText || 'Save';
          savingsHTML = `<p class="sp-cart-item-savings" style="color: ${savingsColor};">${savingsText} ${formatMoney(savings)}</p>`;
        }
      }
      
      return `
        <div class="sp-cart-item" data-line="${lineNumber}">
          <img 
            src="${item.image || item.featured_image?.url || ''}" 
            alt="${item.title}"
            class="sp-cart-item-image"
          />
          <div class="sp-cart-item-details">
            <div class="sp-cart-item-header">
              <h3 class="sp-cart-item-title">${item.product_title}</h3>
              <button class="sp-remove-btn" data-line="${lineNumber}" title="Remove item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
            ${item.variant_title ? `<p class="sp-cart-item-variant">${item.variant_title}</p>` : ''}
            ${compareAtPriceHTML || item.compare_at_price ? `<div style="margin-top: 4px;">${compareAtPriceHTML}<span style="font-size: 14px; font-weight: 400;">${formatMoney(item.final_line_price)}</span></div>` : ''}
            ${savingsHTML}
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
              <p class="sp-cart-item-price">${formatMoney(item.final_line_price)}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');

    contentEl.innerHTML = `<div class="sp-cart-items">${itemsHTML}</div>`;
    
    updateSubtotal(state.cart.total_price);
    attachCartItemListeners();
    
    // Reapply design settings to newly rendered items
    if (state.settings?.design) {
      applySettings();
    }
  }

  function updateSubtotal(cents) {
    const checkoutTotal = document.getElementById('sp-checkout-total');
    const checkoutSeparator = document.getElementById('sp-checkout-total-separator');
    const checkoutText = document.getElementById('sp-checkout-text');
    
    // Update button text from design settings
    if (checkoutText && state.settings?.design?.buttonText) {
      checkoutText.textContent = state.settings.design.buttonText;
    }

    // Show/hide total on button based on design settings
    if (state.settings?.design?.showTotalOnButton) {
      if (checkoutTotal) {
        checkoutTotal.textContent = formatMoney(cents);
      }
      if (checkoutSeparator) {
        checkoutSeparator.style.display = 'inline';
      }
    } else {
      if (checkoutTotal) {
        checkoutTotal.textContent = '';
      }
      if (checkoutSeparator) {
        checkoutSeparator.style.display = 'none';
      }
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
        
        // Prevent increasing protection product quantity beyond 1
        if (state.protectionVariantId && 
            (item.id === state.protectionVariantId || item.variant_id === state.protectionVariantId)) {
          console.log('⚠️ Protection product quantity is limited to 1');
          return;
        }
        
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
        const button = e.currentTarget;
        const lineNumber = parseInt(button.dataset.line);
        
        const itemEl = button.closest('.sp-cart-item');
        itemEl.classList.add('sp-updating');
        
        await removeCartItem(lineNumber);
        renderCart();
      });
    });
  }

  async function openCart() {
    console.log('🛒 Opening cart...');
    const overlay = document.getElementById('sp-cart-overlay');
    if (!overlay) {
      console.error('❌ Cart overlay not found!');
      return;
    }
    
    try {
      // Optimization #3: Fetch settings and cart in parallel (only fetch cart if not already loaded)
      // Optimization #1: Skip cart fetch if cart was already fetched before calling openCart
      const needsCartFetch = !state.cart;
      const needsSettingsFetch = !state.settings;
      
      console.log('📡 Fetching data...', { needsCartFetch, needsSettingsFetch });
      
      // Fetch in parallel if both are needed (Optimization #3)
      if (needsCartFetch && needsSettingsFetch) {
        const [settings, cart] = await Promise.all([
          fetchSettings(),
          fetchCart()
        ]);
        
        if (!settings) {
          console.log('⚠️ Settings not available or cart disabled');
          return;
        }
      } else if (needsSettingsFetch) {
        const settings = await fetchSettings();
        if (!settings) {
          console.log('⚠️ Settings not available or cart disabled');
          return;
        }
      } else if (needsCartFetch) {
        await fetchCart();
      }
      
      // Check if cart is active (in case settings were just fetched)
      if (state.settings?.cart_active === false) {
        console.log('⚠️ Cart is disabled');
        return;
      }
      
      console.log('✅ Data loaded, opening cart UI');
      
      // Open the cart UI
      state.isOpen = true;
      overlay.classList.add('sp-open');
      document.body.style.overflow = 'hidden';
      
      // Render cart (Optimization #1: cart data already available, no refetch needed)
      renderCart();
      
      console.log('✅ Cart opened successfully');
    } catch (error) {
      console.error('❌ Error opening cart:', error);
      // Make sure we don't leave the page in a broken state
      if (overlay.classList.contains('sp-open')) {
        closeCart();
      }
      // Also restore scroll if body overflow was set
      document.body.style.overflow = '';
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

    // Continue shopping
    const continueShopping = document.getElementById('sp-continue-shopping');
    if (continueShopping) {
      continueShopping.addEventListener('click', () => {
        closeCart();
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
        console.log('🖱️ Cart element clicked:', target);
        
        // Check the target itself and its parents for href
        let href = target.getAttribute('href');
        
        // If the clicked element (like SVG) doesn't have href, check parent
        if (!href) {
          const parentLink = target.closest('a[href*="/cart"], a[href="#cart"]');
          if (parentLink) {
            href = parentLink.getAttribute('href');
            console.log('🔗 Parent link href:', href);
          }
        } else {
          console.log('🔗 Link href:', href);
        }
        
        // If we found a cart-related href, intercept it
        if (href && (href === '/cart' || href.includes('/cart') || href === '#cart')) {
          console.log('✅ Intercepting cart link click');
          e.preventDefault();
          e.stopPropagation();
          openCart();
        } else {
          console.log('⚠️ Cart element clicked but no valid href found');
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
        .then(async (data) => {
          // Successfully added to cart
          // Fetch cart once here (Optimization #2 - will skip duplicate fetch in openCart)
          await fetchCart();
          await maybeAutoAddProtection(); // Auto-add protection if enabled
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
          .then(async (data) => {
            // Successfully added to cart
            // Fetch cart once here (Optimization #2 - will skip duplicate fetch in openCart)
            await fetchCart();
            await maybeAutoAddProtection(); // Auto-add protection if enabled
            openCart();
          })
          .catch(error => {
            console.error('Error adding to cart:', error);
          });
        }
      }
    }, true); // Use capture phase

    // Listen for Shopify's cart events
    document.addEventListener('cart:updated', async () => {
      // Fetch cart once here (Optimization #2 - will skip duplicate fetch in openCart)
      await fetchCart();
      await maybeAutoAddProtection(); // Auto-add protection if enabled
      openCart();
    });

    document.addEventListener('product:added-to-cart', async () => {
      // Fetch cart once here (Optimization #2 - will skip duplicate fetch in openCart)
      await fetchCart();
      await maybeAutoAddProtection(); // Auto-add protection if enabled
      openCart();
    });
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  // Wait for Shopify object to be available
  async function waitForShopify(maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      if (window.Shopify?.shop) {
        console.log('✅ Shopify object detected:', window.Shopify.shop);
        return true;
      }
      console.log(`⏳ Waiting for Shopify object... (attempt ${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.error('❌ Shopify object not found after', maxAttempts, 'attempts');
    return false;
  }

  async function init() {
    console.log('🛒 Shipping Protection Cart initializing...');

    // Wait for Shopify object to be available
    const shopifyAvailable = await waitForShopify();
    if (!shopifyAvailable) {
      console.error('❌ Cannot initialize cart without Shopify object');
      return;
    }

    // Fetch settings first to check if cart is active
    const settings = await fetchSettings();
    
    // If cart is not active, don't initialize
    if (settings === null) {
      console.log('🛒 Cart app is deactivated. Exiting initialization.');
      return;
    }

    console.log('🛒 Shipping Protection Cart initialized with settings');

    // Inject CSS
    injectCSS();

    // Create cart HTML
    const cartContainer = document.createElement('div');
    cartContainer.innerHTML = createCartHTML();
    document.body.appendChild(cartContainer.firstElementChild);

    // Apply initial settings to the cart UI
    applySettings();

    // Attach event listeners
    attachEventListeners();

    // Fetch initial cart
    await fetchCart();

    // Expose global function to open cart
    window.openShippingProtectionCart = openCart;
    
    console.log('✅ Cart fully initialized and ready');
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

