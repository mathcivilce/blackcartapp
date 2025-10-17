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
    })(),
    // Cache settings -
    cacheKey: 'sp_cart_settings',
    cacheTTL: 1000 * 60 * 60 * 6  // 6 hours
  };

  // Helper function get shop domain (may need to wait for Shopify object)
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
    protectionVariantId: null,  // Cache variant ID for removal
    staticSettingsApplied: false,  // Track if static settings have been applied
    countdownStartTime: null,  // Track when fresh countdown started
    freeGiftsVariants: {},  // Track which free gifts are in cart: { tier1: variantId, tier2: variantId, tier3: variantId }
    freeGiftsUnlocked: { tier1: false, tier2: false, tier3: false },  // Track which tiers are unlocked
    processingFreeGifts: false  // Prevent concurrent free gift operations
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
            <img id="sp-cart-image" src="" alt="Cart" style="display: none;" />
            <button id="sp-cart-close" class="sp-cart-close" aria-label="Close cart">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Announcement Banner (Top) -->
          <div id="sp-announcement-top" class="sp-announcement-banner sp-announcement-top" style="display: none;"></div>

          <!-- Cart Content -->
          <div id="sp-cart-content" class="sp-cart-content">
            <div class="sp-cart-loading">Loading...</div>
          </div>

          <!-- Free Gifts Progress Bar -->
          <!-- Free Gifts Progress Bar (Top Position) -->
          <div id="sp-free-gifts-progress-top" class="sp-free-gifts-progress" style="display: none;">
            <div class="sp-free-gifts-headline"></div>
            <div class="sp-free-gifts-bar-wrapper">
              <div class="sp-free-gifts-bar-container"></div>
            </div>
            <div class="sp-free-gifts-message"></div>
          </div>

          <!-- Announcement Banner (Bottom) -->
          <div id="sp-announcement-bottom" class="sp-announcement-banner sp-announcement-bottom" style="display: none;"></div>

          <!-- Free Gifts Progress Bar (Bottom Position) -->
          <div id="sp-free-gifts-progress-bottom" class="sp-free-gifts-progress" style="display: none;">
            <div class="sp-free-gifts-headline"></div>
            <div class="sp-free-gifts-bar-wrapper">
              <div class="sp-free-gifts-bar-container"></div>
            </div>
            <div class="sp-free-gifts-message"></div>
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
            
            <!-- Payment Icons -->
            <div id="sp-payment-icons" class="sp-payment-icons" style="display: none;"></div>
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

      .sp-cart-header img {
        max-width: 100%;
        object-fit: contain;
      }

      /* Announcement Banner */
      .sp-announcement-banner {
        padding: 12px 20px;
        text-align: center;
        font-size: 14px;
        font-weight: 600;
        line-height: 1.4;
      }

      .sp-announcement-top {
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      }

      .sp-announcement-bottom {
        border-top: 1px solid rgba(0, 0, 0, 0.1);
      }

      /* Free Gifts Progress Bar */
      .sp-free-gifts-progress {
        padding: 16px 20px;
        border-top: 1px solid rgba(0, 0, 0, 0.1);
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      }

      .sp-free-gifts-headline {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        text-align: center;
        color: #000;
      }

      .sp-free-gifts-bar-wrapper {
        position: relative;
        height: 50px;
        margin-bottom: 12px;
      }

      .sp-free-gifts-bar-container {
        position: relative;
        height: 20px;
        display: flex;
        margin-top: 30px;
      }

      .sp-free-gifts-segment {
        position: relative;
        height: 100%;
      }

      .sp-free-gifts-segment-bar {
        height: 8px;
        background: #E5E7EB;
        margin-top: 6px;
        transition: all 0.3s ease;
      }

      .sp-free-gifts-segment-bar.unlocked {
        background: #4CAF50;
      }

      .sp-free-gifts-milestone-marker {
        position: absolute;
        right: -12px;
        top: 0px;
        display: flex;
        flex-direction: column;
        align-items: center;
        z-index: 1;
      }

      .sp-free-gifts-milestone-icon {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #E5E7EB;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        transition: all 0.3s ease;
        border: 2px solid #fff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .sp-free-gifts-milestone-icon.unlocked {
        background: #4CAF50;
      }

      .sp-free-gifts-milestone-text {
        margin-top: 28px;
        font-size: 10px;
        font-weight: 600;
        color: #666;
        text-align: center;
        white-space: nowrap;
        max-width: 80px;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .sp-free-gifts-milestone-text.unlocked {
        color: #4CAF50;
      }

      .sp-free-gifts-message {
        margin: 8px 0 0 0;
        font-size: 12px;
        color: #4CAF50;
        text-align: center;
        font-weight: 600;
      }

      .sp-free-gifts-message.complete {
        color: #4CAF50;
        font-weight: 600;
      }

      .sp-free-gift-item {
        border: 2px dashed #4CAF50 !important;
      }

      .sp-free-gift-badge {
        background: #4CAF50;
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        display: inline-block;
        margin-left: 8px;
      }

      .sp-free-gift-price {
        text-decoration: line-through;
        opacity: 0.5;
        margin-right: 8px;
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
        text-transform: none;
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

      /* Payment Icons */
      .sp-payment-icons {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        margin-top: 16px;
        flex-wrap: wrap;
      }

      .sp-payment-icon {
        height: 24px;
        width: auto;
        object-fit: contain;
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
        text-transform: none;
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

        .sp-cart-header img.sp-mobile-size {
          height: var(--sp-cart-image-mobile-size, 100px);
        }
      }

      @media (min-width: 769px) {
        .sp-cart-header img.sp-desktop-size {
          height: var(--sp-cart-image-desktop-size, 120px);
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
  // LOCALSTORAGE CACHE FUNCTIONS (Enhanced with error handling)
  // ============================================

  function isLocalStorageAvailable() {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  function getCachedSettings() {
    // Skip localStorage if not available
    if (!isLocalStorageAvailable()) {
      console.warn('[Cart.js] localStorage not available, skipping cache');
      return null;
    }
    
    try {
      const cached = localStorage.getItem(CONFIG.cacheKey);
      if (!cached) return null;
      
      const parsed = JSON.parse(cached);
      
      // Validate structure
      if (!parsed || !parsed.data || !parsed.timestamp) {
        localStorage.removeItem(CONFIG.cacheKey);
        return null;
      }
      
      const { data, timestamp } = parsed;
      
      // Check if expired
      if (Date.now() - timestamp > CONFIG.cacheTTL) {
        localStorage.removeItem(CONFIG.cacheKey);
        return null;
      }
      
      return data;
    } catch (error) {
      console.warn('[Cart.js] Cache read failed:', error.message);
      // If localStorage fails or cache is corrupted, remove and fail gracefully
      try {
        localStorage.removeItem(CONFIG.cacheKey);
      } catch (e) {
        // Can't even remove, localStorage fully blocked
      }
      return null;
    }
  }

  function setCachedSettings(settings) {
    // Skip localStorage if not available
    if (!isLocalStorageAvailable()) {
      return; // Silently skip caching
    }
    
    try {
      localStorage.setItem(CONFIG.cacheKey, JSON.stringify({
        data: settings,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('[Cart.js] Cache write failed:', error.message);
      // If localStorage fails (quota exceeded, etc.), silently fail
      // Cart still works without caching
    }
  }

  // ============================================
  // SHOPIFY CART API FUNCTIONS
  // ============================================

  async function fetchCart() {
    try {
      const response = await fetch('/cart.js');
      const cart = await response.json();
      
      // Enrich cart items with compare_at_price from variant data
      await enrichCartItemsWithComparePrice(cart);
      
      state.cart = cart;
      checkProtectionInCart();
      return cart;
    } catch (error) {
      return null;
    }
  }
  
  // Fetch compare_at_price for all cart items (Shopify cart API doesn't include it)
  async function enrichCartItemsWithComparePrice(cart) {
    if (!cart || !cart.items) return;
    
    // Fetch variant data for all items in parallel
    const variantPromises = cart.items.map(async (item) => {
      try {
        // Skip if already has compare_at_price (shouldn't happen, but just in case)
        if (item.compare_at_price) return;
        
        // Fetch variant data using product handle
        const response = await fetch(`/products/${item.handle}.js`);
        if (!response.ok) return;
        
        const productData = await response.json();
        
        // Find the matching variant
        const variant = productData.variants.find(v => v.id === item.variant_id);
        
        if (variant && variant.compare_at_price) {
          // Add compare_at_price to the cart item (in cents)
          item.compare_at_price = variant.compare_at_price;
          console.log('[Cart.js] Enriched item with compare_at_price:', item.product_title, variant.compare_at_price);
        }
      } catch (error) {
        console.warn('[Cart.js] Failed to fetch variant data for:', item.product_title, error);
        // Continue with other items even if one fails
      }
    });
    
    // Wait for all enrichments to complete
    await Promise.all(variantPromises);
  }

  async function fetchSettings(useCache = true) {
    try {
      // Get shop domain at fetch time (not at script load time)
      const shopDomain = getShopDomain();
      
      // Validate shop domain is available
      if (!shopDomain) {
        console.error('[Cart.js] Cannot fetch settings - shop domain not available');
        return null;
      }
      
      console.log('[Cart.js] Fetching settings for shop:', shopDomain);
      
      // Try to load from cache first (instant!)
      if (useCache) {
        const cached = getCachedSettings();
        if (cached) {
          state.settings = cached;
          
          // Debug: Log adjustTotalPrice from cache
          console.log('[Cart.js] Settings loaded from cache', {
            adjustTotalPrice: cached?.addons?.adjustTotalPrice,
            hasAddons: !!cached?.addons,
            cart_active: cached?.cart_active
          });
          
          // Check if cart is active
          if (cached.cart_active === false) {
            console.warn('[Cart.js] Cart is disabled in cached settings');
            return null;
          }
          
          // Apply cached settings only if cart HTML exists (during init, HTML is created after)
          const cartSidebar = document.getElementById('sp-cart-sidebar');
          if (cartSidebar) {
            applySettings();
          }
          
          // Fetch fresh settings in background (non-blocking)
          fetchSettingsFromAPI(shopDomain).then(fresh => {
            if (fresh && JSON.stringify(fresh) !== JSON.stringify(cached)) {
              // Settings changed, update
              state.settings = fresh;
              setCachedSettings(fresh);
              
              // Debug: Log adjustTotalPrice from fresh API
              console.log('[Cart.js] Settings refreshed from API (background)', {
                adjustTotalPrice: fresh?.addons?.adjustTotalPrice,
                hasAddons: !!fresh?.addons
              });
              
              // Reset static settings flag so they get re-applied
              state.staticSettingsApplied = false;
              // Only apply if cart exists
              if (document.getElementById('sp-cart-sidebar')) {
                applySettings();
              }
            }
          }).catch((err) => {
            console.warn('[Cart.js] Background settings refresh failed:', err.message);
            // Silently fail background refresh, cached settings still work
          });
          
          return cached;
        }
      }
      
      console.log('[Cart.js] No cache available, fetching from API...');
      
      // No cache, fetch fresh
      const fresh = await fetchSettingsFromAPI(shopDomain);
      if (!fresh) {
        console.error('[Cart.js] Failed to fetch settings from API');
        return null;
      }
      
      state.settings = fresh;
      
      // Debug: Log adjustTotalPrice from fresh API
      console.log('[Cart.js] Settings loaded from API', {
        adjustTotalPrice: fresh?.addons?.adjustTotalPrice,
        hasAddons: !!fresh?.addons,
        cart_active: fresh?.cart_active
      });
      
      // Check if cart is active
      if (fresh.cart_active === false) {
        console.warn('[Cart.js] Cart is disabled in settings');
        return null;
      }
      
      // Save to cache
      setCachedSettings(fresh);
      
      // Apply settings only if cart HTML exists (during init, HTML is created after)
      const cartSidebar = document.getElementById('sp-cart-sidebar');
      if (cartSidebar) {
        applySettings();
      }
      
      return fresh;
    } catch (error) {
      console.error('[Cart.js] Error in fetchSettings():', error);
      return null;
    }
  }

  async function fetchSettingsFromAPI(shopDomain) {
    try {
      // Use token-based authentication if available
      // SECURITY: Always send shop domain for domain binding validation
      const url = CONFIG.token 
        ? `${CONFIG.appUrl}/api/settings?token=${CONFIG.token}&shop=${shopDomain}`
        : `${CONFIG.appUrl}/api/settings?shop=${shopDomain}`;
      
      console.log('[Cart.js] Fetching settings from:', url.replace(CONFIG.token, 'TOKEN_HIDDEN'));
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('[Cart.js] Settings API error:', response.status, response.statusText);
        
        // Try to get error details
        try {
          const errorData = await response.json();
          console.error('[Cart.js] API error details:', errorData);
        } catch (e) {
          console.error('[Cart.js] Could not parse error response');
        }
        
        return null;
      }
      
      const settings = await response.json();
      console.log('[Cart.js] Settings API response received successfully');
      return settings;
    } catch (error) {
      console.error('[Cart.js] Network error fetching settings:', error.message);
      return null;
    }
  }

  // ============================================
  // COUNTDOWN HELPERS
  // ============================================

  let countdownInterval = null;

  function formatCountdown(endTime, timeFormat) {
    timeFormat = timeFormat || 'text';
    if (!endTime) return timeFormat === 'numeric' ? '00:00' : '0m 0s';
    
    const end = new Date(endTime).getTime();
    const now = new Date().getTime();
    const distance = end - now;

    if (distance < 0) return 'EXPIRED';

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (timeFormat === 'numeric') {
      // Numeric format: HH:MM:SS or MM:SS
      if (days > 0 || hours > 0) {
        const totalHours = days * 24 + hours;
        return String(totalHours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
      } else {
        return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
      }
    } else {
      // Text format: 13m 9s
      if (days > 0) {
        return days + 'd ' + hours + 'h ' + minutes + 'm';
      } else if (hours > 0) {
        return hours + 'h ' + minutes + 'm ' + seconds + 's';
      } else {
        return minutes + 'm ' + seconds + 's';
      }
    }
  }

  function formatAnnouncementText(announcement) {
    if (!announcement || !announcement.text) return '';
    
    if (announcement.countdownEnabled && announcement.text.includes('{{ countdown }}')) {
      let countdown = '';
      const timeFormat = announcement.countdownTimeFormat || 'text';
      
      if (announcement.countdownType === 'fresh' && announcement.countdownDuration) {
        // Fresh timer: Show full duration initially
        const mins = Math.floor(announcement.countdownDuration / 60);
        const secs = announcement.countdownDuration % 60;
        if (timeFormat === 'numeric') {
          countdown = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
        } else {
          countdown = mins + 'm ' + secs + 's';
        }
      } else if (announcement.countdownType === 'fixed' && announcement.countdownEnd) {
        // Fixed timer: Calculate from end date
        countdown = formatCountdown(announcement.countdownEnd, timeFormat);
      }
      
      return announcement.text.replace('{{ countdown }}', countdown);
    }
    
    return announcement.text;
  }

  function updateCountdown() {
    if (!state.settings?.announcement?.enabled || !state.settings.announcement.countdownEnabled) {
      return;
    }

    const announcement = state.settings.announcement;
    const topBanner = document.getElementById('sp-announcement-top');
    const bottomBanner = document.getElementById('sp-announcement-bottom');
    const activeBanner = announcement.position === 'top' ? topBanner : bottomBanner;

    if (activeBanner && activeBanner.style.display !== 'none') {
      let countdown = '';
      const timeFormat = announcement.countdownTimeFormat || 'text';
      
      if (announcement.countdownType === 'fresh' && announcement.countdownDuration) {
        // Fresh timer: Calculate countdown from duration
        if (!state.countdownStartTime) {
          state.countdownStartTime = Date.now();
        }
        const elapsed = Date.now() - state.countdownStartTime;
        const remaining = Math.max(0, (announcement.countdownDuration * 1000) - elapsed);
        const seconds = Math.floor(remaining / 1000);
        
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        
        if (remaining > 0) {
          if (timeFormat === 'numeric') {
            countdown = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
          } else {
            countdown = mins + 'm ' + secs + 's';
          }
        } else {
          countdown = 'EXPIRED';
        }
      } else if (announcement.countdownType === 'fixed' && announcement.countdownEnd) {
        // Fixed timer: Use existing formatCountdown function
        countdown = formatCountdown(announcement.countdownEnd, timeFormat);
      }
      
      // Apply formatting styles to countdown (always wrap in span to isolate from parent styles)
      const countdownBold = announcement.countdownBold || false;
      const countdownItalic = announcement.countdownItalic || false;
      const countdownUnderline = announcement.countdownUnderline || false;
      
      // Always wrap countdown with explicit styles to prevent inheritance from parent
      const styles = [];
      styles.push('font-weight: ' + (countdownBold ? 'bold' : 'normal'));
      styles.push('font-style: ' + (countdownItalic ? 'italic' : 'normal'));
      styles.push('text-decoration: ' + (countdownUnderline ? 'underline' : 'none'));
      const formattedCountdown = '<span style="' + styles.join('; ') + '">' + countdown + '</span>';
      
      // Replace {{ countdown }} placeholder with formatted countdown
      const text = announcement.text.replace('{{ countdown }}', formattedCountdown);
      activeBanner.innerHTML = text;
    }
  }

  function startCountdownInterval() {
    // Clear any existing interval
    stopCountdownInterval();
    
    // Update every second
    countdownInterval = setInterval(updateCountdown, 1000);
  }

  function stopCountdownInterval() {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }

  // Apply static settings that don't change between renders (only once)
  function applyStaticSettings() {
    if (!state.settings) {
      return;
    }

    const container = document.getElementById('sp-protection-container');
    const addonsEnabled = state.settings.addons?.enabled ?? state.settings.enabled ?? true;
    if (container && addonsEnabled) {
      container.style.display = 'block';
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

    // Apply custom image settings
    const protectionIconEl = document.querySelector('.sp-protection-icon img');
    if (protectionIconEl && state.settings.addons) {
      const useCustomImage = state.settings.addons.useCustomImage || false;
      const customImageUrl = state.settings.addons.customImageUrl || '';
      const customImageSize = state.settings.addons.customImageSize || 48;
      
      if (useCustomImage && customImageUrl) {
        protectionIconEl.src = customImageUrl;
        protectionIconEl.width = customImageSize;
        protectionIconEl.height = customImageSize;
      } else {
        // Use default image
        protectionIconEl.src = 'https://www.cartbase.app/add-on.png';
        protectionIconEl.width = 48;
        protectionIconEl.height = 48;
      }
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

      // Apply cart header (title or image)
      const titleEl = document.getElementById('sp-cart-title');
      const imageEl = document.getElementById('sp-cart-image');
      const headerEl = document.querySelector('.sp-cart-header');
      
      if (design.useCartImage && design.cartImageUrl) {
        // Use image instead of title
        if (titleEl) titleEl.style.display = 'none';
        if (imageEl) {
          imageEl.src = design.cartImageUrl;
          imageEl.style.display = 'block';
          imageEl.className = 'sp-mobile-size sp-desktop-size';
          
          // Set CSS variables for responsive sizing
          if (design.cartImageMobileSize) {
            document.documentElement.style.setProperty('--sp-cart-image-mobile-size', `${design.cartImageMobileSize}px`);
          }
          if (design.cartImageDesktopSize) {
            document.documentElement.style.setProperty('--sp-cart-image-desktop-size', `${design.cartImageDesktopSize}px`);
          }
        }
        
        // Apply image position
        if (headerEl && design.cartImagePosition) {
          if (design.cartImagePosition === 'center') {
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
      } else {
        // Use text title
        if (imageEl) imageEl.style.display = 'none';
        if (titleEl) {
          titleEl.style.display = 'block';
          if (design.cartTitle) {
            titleEl.textContent = design.cartTitle;
          }
          titleEl.style.color = design.cartTextColor;
        }
        
        // Apply title alignment
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
      
      // Apply payment icons
      const paymentIconsContainer = document.getElementById('sp-payment-icons');
      if (paymentIconsContainer && design.showPaymentIcons) {
        const icons = [];
        const appUrl = (window.location.hostname === 'localhost' || window.location.protocol === 'file:')
          ? 'http://localhost:3001'
          : 'https://www.cartbase.app';
        
        if (design.paymentIconVisa) {
          icons.push('<img src="' + appUrl + '/visa.svg" alt="Visa" class="sp-payment-icon" />');
        }
        if (design.paymentIconMastercard) {
          icons.push('<img src="' + appUrl + '/mastercard.svg" alt="Mastercard" class="sp-payment-icon" />');
        }
        if (design.paymentIconAmex) {
          icons.push('<img src="' + appUrl + '/amex.svg" alt="American Express" class="sp-payment-icon" />');
        }
        if (design.paymentIconPaypal) {
          icons.push('<img src="' + appUrl + '/paypal.svg" alt="PayPal" class="sp-payment-icon" />');
        }
        if (design.paymentIconApplePay) {
          icons.push('<img src="' + appUrl + '/applepay.svg" alt="Apple Pay" class="sp-payment-icon" />');
        }
        if (design.paymentIconGooglePay) {
          icons.push('<img src="' + appUrl + '/googlepay.svg" alt="Google Pay" class="sp-payment-icon" />');
        }
        if (design.paymentIconShopPay) {
          icons.push('<img src="' + appUrl + '/shoppay.svg" alt="Shop Pay" class="sp-payment-icon" />');
        }
        
        if (icons.length > 0) {
          paymentIconsContainer.innerHTML = icons.join('');
          paymentIconsContainer.style.display = 'flex';
        } else {
          paymentIconsContainer.style.display = 'none';
        }
      } else if (paymentIconsContainer) {
        paymentIconsContainer.style.display = 'none';
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
    }

    // Apply announcement settings
    if (state.settings.announcement) {
      const announcement = state.settings.announcement;
      const topBanner = document.getElementById('sp-announcement-top');
      const bottomBanner = document.getElementById('sp-announcement-bottom');
      
      if (announcement.enabled) {
        const activeBanner = announcement.position === 'top' ? topBanner : bottomBanner;
        const inactiveBanner = announcement.position === 'top' ? bottomBanner : topBanner;
        
        if (activeBanner) {
          // Apply text (with countdown replacement if enabled)
          let text = formatAnnouncementText(announcement);
          
          // Apply formatting to countdown if present (always wrap in span to isolate from parent styles)
          if (announcement.countdownEnabled && announcement.text.includes('{{ countdown }}')) {
            const countdownBold = announcement.countdownBold || false;
            const countdownItalic = announcement.countdownItalic || false;
            const countdownUnderline = announcement.countdownUnderline || false;
            
            // Find the countdown in the text and wrap it with styled span (always, to prevent inheritance)
            const placeholder = text.match(/\d+[mhds:\s]+\d*[mhds]?/);
            if (placeholder) {
              const styles = [];
              // Always set explicit styles to prevent inheritance from parent
              styles.push('font-weight: ' + (countdownBold ? 'bold' : 'normal'));
              styles.push('font-style: ' + (countdownItalic ? 'italic' : 'normal'));
              styles.push('text-decoration: ' + (countdownUnderline ? 'underline' : 'none'));
              text = text.replace(placeholder[0], '<span style="' + styles.join('; ') + '">' + placeholder[0] + '</span>');
            }
          }
          
          activeBanner.innerHTML = text;
          
          // Apply styling
          activeBanner.style.backgroundColor = announcement.backgroundColor || '#000000';
          activeBanner.style.color = announcement.textColor || '#FFFFFF';
          activeBanner.style.fontSize = (announcement.fontSize || 14) + 'px';
          activeBanner.style.fontWeight = announcement.textBold ? 'bold' : 'normal';
          activeBanner.style.fontStyle = announcement.textItalic ? 'italic' : 'normal';
          activeBanner.style.textDecoration = announcement.textUnderline ? 'underline' : 'none';
          
          // Apply border
          if (announcement.showBorder === false) {
            activeBanner.style.borderTop = 'none';
            activeBanner.style.borderBottom = 'none';
          } else {
            // Restore default borders
            if (announcement.position === 'top') {
              activeBanner.style.borderBottom = '1px solid rgba(0, 0, 0, 0.1)';
            } else {
              activeBanner.style.borderTop = '1px solid rgba(0, 0, 0, 0.1)';
            }
          }
          
          activeBanner.style.display = 'block';
          
          // Start countdown interval if countdown is enabled (for both fixed and fresh modes)
          if (announcement.countdownEnabled) {
            if ((announcement.countdownType === 'fixed' && announcement.countdownEnd) || 
                (announcement.countdownType === 'fresh' && announcement.countdownDuration)) {
              startCountdownInterval();
            }
          }
        }
        
        if (inactiveBanner) {
          inactiveBanner.style.display = 'none';
        }
      } else {
        // Hide both banners if announcement is disabled
        if (topBanner) topBanner.style.display = 'none';
        if (bottomBanner) bottomBanner.style.display = 'none';
        
        // Stop countdown if running
        stopCountdownInterval();
      }
    }
    
    state.staticSettingsApplied = true;
  }

  // Apply dynamic settings that change with cart items (on every render)
  function applyDynamicSettings() {
    if (!state.settings?.design) {
      return;
    }

    const design = state.settings.design;
    
    // Apply text colors to cart items (changes when items added/removed)
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
  }

  // Backwards compatibility - for initial settings load
  function applySettings() {
    applyStaticSettings();
  }

  function checkProtectionInCart() {
    if (!state.cart || !state.settings) return;
    
    let protectionItem;
    
    // First try: Check using cached variant ID (fastest)
    if (state.protectionVariantId) {
      protectionItem = state.cart.items.find(item => 
        item.variant_id === state.protectionVariantId ||
        item.id === state.protectionVariantId
      );
    }
    
    // Second try: If not found by variant ID, search by product handle
    if (!protectionItem) {
      const productHandle = state.settings?.addons?.productHandle || state.settings?.protectionProductHandle;
      
      if (productHandle) {
        protectionItem = state.cart.items.find(item => {
          // Check if item handle matches protection handle
          if (item.handle === productHandle) return true;
          
          // Check if product_title or title contains protection keywords
          const title = (item.product_title || item.title || '').toLowerCase();
          const protectionKeywords = ['shipping protection', 'shipping insurance', 'package protection'];
          
          return protectionKeywords.some(keyword => title.includes(keyword));
        });
      }
    }

    state.protectionInCart = !!protectionItem;
    
    // Cache the variant ID if we found the protection item
    if (protectionItem && !state.protectionVariantId) {
      state.protectionVariantId = protectionItem.id || protectionItem.variant_id;
      console.log('[Cart.js] Protection found in cart, cached variant ID:', state.protectionVariantId);
    }
    
    // Ensure protection product quantity is always 1 (fix if > 1)
    if (protectionItem && protectionItem.quantity > 1) {
      const lineNumber = state.cart.items.indexOf(protectionItem) + 1;
      updateCartItem(lineNumber, 1);
    }
    
    // Update checkbox state to match cart contents
    const checkbox = document.getElementById('sp-protection-checkbox');
    if (checkbox) {
      checkbox.checked = state.protectionInCart;
      console.log('[Cart.js] Checkbox synced with cart state:', {
        protectionInCart: state.protectionInCart,
        checkboxChecked: checkbox.checked
      });
    }
  }

  // Pre-fetch protection product variant ID (non-blocking, for optimization)
  async function prefetchProtectionVariant(productHandle) {
    if (!productHandle) return;
    
    try {
      const productResponse = await fetch(`/products/${productHandle}.js`);
      if (!productResponse.ok) return;
      
      const productData = await productResponse.json();
      
      // Cache variant ID for later use
      if (productData.variants && productData.variants.length > 0) {
        state.protectionVariantId = productData.variants[0].id;
      }
    } catch (error) {
      // Silently fail, will fetch on-demand if needed
    }
  }

  // Helper to check if protection will be auto-added (for optimization)
  function willAutoAddProtection() {
    return state.settings?.addons?.acceptByDefault && 
           !state.protectionInCart && 
           state.settings?.addons?.productHandle;
  }

  // Helper function to check if protection should be auto-added
  async function maybeAutoAddProtection() {
    // Only auto-add if acceptByDefault is enabled and protection is not already in cart
    if (willAutoAddProtection()) {
      // Optimization: Skip render since openCart() will render immediately after
      await addProtectionToCart(true, true); // silent mode + skip render
    }
  }

  async function addProtectionToCart(silentMode = false, skipRender = false) {
    const productHandle = state.settings?.addons?.productHandle || state.settings?.protectionProductHandle;
    
    if (!state.settings || !productHandle) {
      if (!silentMode) {
        alert('Shipping protection is not configured. Please contact store admin.');
      }
      return;
    }

    // Check if protection is already in cart - prevent duplicates
    if (state.protectionInCart) {
      return;
    }

    try {
      state.isLoading = true;
      
      let variantId = state.protectionVariantId;
      
      // Optimization: Use cached variant ID if available (skips 150ms fetch!)
      if (!variantId) {
        // Variant not cached, fetch product data from Shopify
        const productResponse = await fetch(`/products/${productHandle}.js`);

        if (!productResponse.ok) {
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
          if (!silentMode) {
            alert('Protection product has no variants. Please contact store admin.');
          }
          
          const checkbox = document.getElementById('sp-protection-checkbox');
          if (checkbox) checkbox.checked = false;
          state.isLoading = false;
          return;
        }

        variantId = productData.variants[0].id;
        // Cache for future use
        state.protectionVariantId = variantId;
      }

      // Now add to cart using the variant ID
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: variantId,
          quantity: 1
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Cache the variant ID for later removal
        state.protectionVariantId = variantId;
        state.protectionInCart = true; // Update state
        
        await fetchCart();
        
        // Optimization: Skip render if caller will render (avoids duplicate render)
        if (!skipRender) {
          renderCart();
        }
      } else {
        if (!silentMode) {
          alert('Failed to add shipping protection. Please try again.');
        }
        
        // Uncheck the checkbox
        const checkbox = document.getElementById('sp-protection-checkbox');
        if (checkbox) checkbox.checked = false;
      }
      state.isLoading = false;
    } catch (error) {
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
    
    // Use the cached variant ID to find the protection item
    if (!state.protectionVariantId) {
      return;
    }
    
    const protectionItem = state.cart.items.find(item => 
      item.variant_id === state.protectionVariantId ||
      item.id === state.protectionVariantId
    );

    if (!protectionItem) {
      return;
    }

    const lineNumber = state.cart.items.indexOf(protectionItem) + 1;

    try {
      state.isLoading = true;
      await updateCartItem(lineNumber, 0);
      state.protectionInCart = false; // Update state
      // Keep protectionVariantId cached so we can re-add it later
      renderCart();
      state.isLoading = false;
    } catch (error) {
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
      
      // Enrich cart items with compare_at_price after update
      await enrichCartItemsWithComparePrice(cart);
      
      state.cart = cart;
      state.isLoading = false;
      return cart;
    } catch (error) {
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
  // FREE GIFTS FUNCTIONS
  // ============================================

  function calculateCartValue() {
    if (!state.cart || !state.settings?.freeGifts?.enabled) return 0;

    const freeGifts = state.settings.freeGifts;
    const conditionType = freeGifts.conditionType || 'quantity';

    // Get all free gift variant IDs to exclude them
    const freeGiftVariantIds = Object.values(state.freeGiftsVariants).filter(Boolean);
    
    // Get protection product handle to exclude it
    const protectionHandle = state.settings?.addons?.productHandle || state.settings?.protectionProductHandle;

    if (conditionType === 'quantity') {
      // Count non-free-gift and non-protection items
      return state.cart.items.filter(item => {
        // Exclude free gifts
        if (freeGiftVariantIds.includes(String(item.id || item.variant_id))) return false;
        // Exclude protection products
        if (protectionHandle && item.handle === protectionHandle) return false;
        return true;
      }).reduce((sum, item) => sum + (item.quantity || 1), 0);
    } else {
      // Sum non-free-gift and non-protection item prices (in dollars)
      return state.cart.items.filter(item => {
        // Exclude free gifts
        if (freeGiftVariantIds.includes(String(item.id || item.variant_id))) return false;
        // Exclude protection products
        if (protectionHandle && item.handle === protectionHandle) return false;
        return true;
      }).reduce((sum, item) => sum + ((item.final_line_price || item.line_price || 0) / 100), 0);
    }
  }

  function updateFreeGiftsProgress() {
    // Get both progress bar elements
    const progressTopEl = document.getElementById('sp-free-gifts-progress-top');
    const progressBottomEl = document.getElementById('sp-free-gifts-progress-bottom');
    
    if (!state.settings?.freeGifts?.enabled) {
      if (progressTopEl) progressTopEl.style.display = 'none';
      if (progressBottomEl) progressBottomEl.style.display = 'none';
      return;
    }

    const freeGifts = state.settings.freeGifts;
    const position = freeGifts.position || 'bottom';
    const currentValue = calculateCartValue();
    const conditionType = freeGifts.conditionType || 'quantity';
    const progressColor = freeGifts.progressColor || '#4CAF50';

    // Show/hide based on position
    const progressEl = position === 'top' ? progressTopEl : progressBottomEl;
    const otherProgressEl = position === 'top' ? progressBottomEl : progressTopEl;
    
    if (otherProgressEl) otherProgressEl.style.display = 'none';
    if (!progressEl) return;

    // Get enabled tiers
    const enabledTiers = [];
    if (freeGifts.tier1?.enabled) enabledTiers.push({ ...freeGifts.tier1, key: 'tier1' });
    if (freeGifts.tier2?.enabled) enabledTiers.push({ ...freeGifts.tier2, key: 'tier2' });
    if (freeGifts.tier3?.enabled) enabledTiers.push({ ...freeGifts.tier3, key: 'tier3' });

    if (enabledTiers.length === 0) {
      progressEl.style.display = 'none';
      return;
    }

    // Sort by threshold
    enabledTiers.sort((a, b) => a.threshold - b.threshold);

    // Update headline
    const headlineEl = progressEl.querySelector('.sp-free-gifts-headline');
    if (headlineEl && freeGifts.headline) {
      headlineEl.textContent = freeGifts.headline;
      headlineEl.style.display = 'block';
    }

    // Create segmented progress bar
    const barContainerEl = progressEl.querySelector('.sp-free-gifts-bar-container');
    if (barContainerEl) {
      const segmentWidth = 100 / enabledTiers.length;
      
      barContainerEl.innerHTML = enabledTiers.map((tier, index) => {
        const isUnlocked = currentValue >= tier.threshold;
        const isFirst = index === 0;
        const isLast = index === enabledTiers.length - 1;
        
        let borderRadius = '0';
        if (isFirst) borderRadius = '4px 0 0 4px';
        if (isLast) borderRadius = '0 4px 4px 0';
        
        return `
          <div class="sp-free-gifts-segment" style="width: ${segmentWidth}%;">
            <div class="sp-free-gifts-segment-bar ${isUnlocked ? 'unlocked' : ''}" 
                 style="border-radius: ${borderRadius}; ${isUnlocked ? `background: ${progressColor};` : ''}">
            </div>
            <div class="sp-free-gifts-milestone-marker">
              <div class="sp-free-gifts-milestone-icon ${isUnlocked ? 'unlocked' : ''}" 
                   style="${isUnlocked ? `background: ${progressColor};` : ''}">
                ${isUnlocked ? '✓' : (tier.icon || '🎁')}
              </div>
              <div class="sp-free-gifts-milestone-text ${isUnlocked ? 'unlocked' : ''}" 
                   style="${isUnlocked ? `color: ${progressColor};` : ''}">
                ${tier.rewardText || 'Free Gift'}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Update message with custom unlocked messages
    const messageEl = progressEl.querySelector('.sp-free-gifts-message');
    if (messageEl) {
      // Find the latest unlocked tier with showUnlockedMessage enabled
      const unlockedTiers = enabledTiers.filter(tier => 
        currentValue >= tier.threshold && tier.showUnlockedMessage !== false
      );
      
      if (unlockedTiers.length > 0) {
        // Show the message from the highest unlocked tier
        const latestUnlockedTier = unlockedTiers[unlockedTiers.length - 1];
        messageEl.textContent = latestUnlockedTier.unlockedMessage || '🎉 Free Gift Unlocked!';
        messageEl.style.color = progressColor;
        messageEl.style.display = 'block';
      } else {
        messageEl.style.display = 'none';
      }
    }

    progressEl.style.display = 'block';
  }

  async function getFreeGiftProduct(tier) {
    if (!tier.productHandle && !tier.variantId) {
      console.error('[Free Gifts] No product handle or variant ID provided');
      return null;
    }

    try {
      // If variant ID is provided, use it directly
      if (tier.variantId) {
        // Fetch product by variant to get details
        const response = await fetch(`/products.json`);
        const data = await response.json();
        
        for (const product of data.products) {
          const variant = product.variants.find(v => String(v.id) === String(tier.variantId));
          if (variant) {
            return {
              variantId: variant.id,
              productId: product.id,
              title: product.title,
              variantTitle: variant.title !== 'Default Title' ? variant.title : '',
              price: variant.price,
              image: product.images[0]?.src || product.image?.src
            };
          }
        }
      }

      // Otherwise, fetch by product handle
      if (tier.productHandle) {
        const response = await fetch(`/products/${tier.productHandle}.js`);
        if (!response.ok) {
          console.error(`[Free Gifts] Product not found: ${tier.productHandle}`);
          return null;
        }
        
        const product = await response.json();
        const variant = product.variants[0]; // Use first variant if no specific variant ID

        return {
          variantId: variant.id,
          productId: product.id,
          title: product.title,
          variantTitle: variant.title !== 'Default Title' ? variant.title : '',
          price: variant.price,
          image: product.images[0]?.src || product.image?.src
        };
      }

      return null;
    } catch (error) {
      console.error('[Free Gifts] Error fetching product:', error);
      return null;
    }
  }

  async function manageFreeGifts() {
    if (!state.settings?.freeGifts?.enabled || state.processingFreeGifts) return;

    state.processingFreeGifts = true;

    try {
      const freeGifts = state.settings.freeGifts;
      const currentValue = calculateCartValue();

      // Check each tier
      for (const tierKey of ['tier1', 'tier2', 'tier3']) {
        const tier = freeGifts[tierKey];
        if (!tier?.enabled) continue;

        const shouldBeUnlocked = currentValue >= tier.threshold;
        const isUnlocked = state.freeGiftsUnlocked[tierKey];
        const isInCart = !!state.freeGiftsVariants[tierKey];

        // If tier should be unlocked but isn't in cart, add it
        if (shouldBeUnlocked && !isInCart) {
          console.log(`[Free Gifts] Unlocking ${tierKey}`);
          const product = await getFreeGiftProduct(tier);
          
          if (product) {
            // Add to cart
            const formData = {
              items: [{
                id: product.variantId,
                quantity: 1,
                properties: {
                  '_free_gift': 'true',
                  '_free_gift_tier': tierKey
                }
              }]
            };

            const response = await fetch('/cart/add.js', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData)
            });

            if (response.ok) {
              state.freeGiftsVariants[tierKey] = String(product.variantId);
              state.freeGiftsUnlocked[tierKey] = true;
            }
          }
        }
        // If tier should not be unlocked but is in cart, remove it
        else if (!shouldBeUnlocked && isInCart) {
          console.log(`[Free Gifts] Removing ${tierKey}`);
          const variantId = state.freeGiftsVariants[tierKey];
          
          if (variantId) {
            // Find the line item key for this variant
            const lineItem = state.cart.items.find(item => 
              String(item.id || item.variant_id) === variantId &&
              item.properties?._free_gift === 'true'
            );

            if (lineItem) {
              const lineNumber = state.cart.items.indexOf(lineItem) + 1;
              
              await fetch('/cart/change.js', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  line: lineNumber,
                  quantity: 0
                })
              });

              delete state.freeGiftsVariants[tierKey];
              state.freeGiftsUnlocked[tierKey] = false;
            }
          }
        }
      }

      // Refresh cart after changes
      await fetchCart();
    } finally {
      state.processingFreeGifts = false;
    }
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
      
      // Check if this is a free gift
      const isFreeGift = item.properties?._free_gift === 'true' || item.properties?._free_gift === true;
      
      // Calculate compare-at-price and savings
      const showSavings = state.settings?.design?.showSavings !== false;
      const displayCompareAtPrice = state.settings?.design?.displayCompareAtPrice !== false;
      let compareAtPriceHTML = '';
      let savingsHTML = '';
      
      // Check for compare_at_price (compare per-item prices)
      // item.compare_at_price = compare-at price per item
      // item.final_price = actual price per item after discounts
      // item.price = original price per item before discounts
      const itemFinalPrice = item.final_price || item.price || 0;
      
      if (item.compare_at_price && item.compare_at_price > itemFinalPrice) {
        // Calculate line-level prices for display
        const compareAtLinePrice = item.compare_at_price * item.quantity;
        const savingsPerItem = item.compare_at_price - itemFinalPrice;
        const savingsLineTotal = savingsPerItem * item.quantity;
        
        if (displayCompareAtPrice) {
          compareAtPriceHTML = `<span style="font-size: 13px; color: #999; text-decoration: line-through; margin-right: 0px;">${formatMoney(compareAtLinePrice)}</span>`;
        }
        if (showSavings) {
          const savingsColor = state.settings?.design?.savingsTextColor || '#2ea818';
          const savingsText = state.settings?.design?.savingsText || 'Save';
          savingsHTML = `<p class="sp-cart-item-savings" style="color: ${savingsColor};">${savingsText} ${formatMoney(savingsLineTotal)}</p>`;
        }
      }
      
      return `
        <div class="sp-cart-item${isFreeGift ? ' sp-free-gift-item' : ''}" data-line="${lineNumber}">
          <img 
            src="${item.image || item.featured_image?.url || ''}" 
            alt="${item.title}"
            class="sp-cart-item-image"
          />
          <div class="sp-cart-item-details">
            <div class="sp-cart-item-header">
              <h3 class="sp-cart-item-title">${item.product_title}${isFreeGift ? '<span class="sp-free-gift-badge">FREE</span>' : ''}</h3>
              <button class="sp-remove-btn" data-line="${lineNumber}" title="Remove item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
            ${item.variant_title ? `
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 4px;">
                <p class="sp-cart-item-variant" style="margin: 0;">${item.variant_title}</p>
                ${compareAtPriceHTML || savingsHTML ? `
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end;">
                    ${savingsHTML ? savingsHTML.replace('<p class="sp-cart-item-savings"', '<span class="sp-cart-item-savings" style="margin: 0; white-space: nowrap; font-size: 11px;"').replace('</p>', '</span>') : ''}
                    ${compareAtPriceHTML}
                  </div>
                ` : ''}
              </div>
            ` : ''}
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
              <p class="sp-cart-item-price" style="margin: 0;">
                ${isFreeGift ? 
                  `<span class="sp-free-gift-price">${formatMoney(item.original_line_price || item.final_line_price)}</span><span style="color: #4CAF50; font-weight: 600;">FREE</span>` 
                  : 
                  formatMoney(item.final_line_price)
                }
              </p>
            </div>
          </div>
        </div>
      `;
    }).join('');

    contentEl.innerHTML = `<div class="sp-cart-items">${itemsHTML}</div>`;
    
    updateSubtotal(state.cart.total_price);
    attachCartItemListeners();
    
    // Optimization: Apply static settings only once, dynamic settings every render
    if (!state.staticSettingsApplied && state.settings) {
      applyStaticSettings();
    }
    
    // Always apply dynamic settings (item-specific styles)
    applyDynamicSettings();
    
    // Update free gifts progress bar
    updateFreeGiftsProgress();
    
    // Manage free gifts (add/remove based on cart value)
    if (state.settings?.freeGifts?.enabled) {
      manageFreeGifts();
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

    // Calculate displayed total
    let displayTotal = cents;
    
    // Check if we should adjust the total price
    // Default to true if not set (include protection price in total)
    const adjustTotalPrice = state.settings?.addons?.adjustTotalPrice !== false;
    
    // If adjustTotalPrice is explicitly false, subtract protection price from displayed total
    if (state.protectionInCart && !adjustTotalPrice) {
      const protectionPrice = Math.round((state.settings?.addons?.price || 0) * 100);
      displayTotal = Math.max(0, cents - protectionPrice);
      
      // Debug logging
      console.log('[Cart.js] Adjust Total Price is OFF - subtracting protection from display', {
        cartTotal: cents,
        protectionPrice: protectionPrice,
        displayTotal: displayTotal,
        adjustTotalPrice: adjustTotalPrice
      });
    } else if (state.protectionInCart) {
      // Debug logging when adjustment is ON or undefined
      console.log('[Cart.js] Adjust Total Price is ON - showing full total', {
        cartTotal: cents,
        adjustTotalPrice: state.settings?.addons?.adjustTotalPrice,
        protectionInCart: state.protectionInCart
      });
    }

    // Show/hide total on button based on design settings
    if (state.settings?.design?.showTotalOnButton) {
      if (checkoutTotal) {
        checkoutTotal.textContent = formatMoney(displayTotal);
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
    console.log('[Cart.js] openCart() called');
    
    const overlay = document.getElementById('sp-cart-overlay');
    if (!overlay) {
      console.error('[Cart.js] Cannot open cart - overlay not found!');
      return;
    }
    
    console.log('[Cart.js] Overlay found, proceeding to open cart');
    
    // Reset countdown start time for fresh timer (so it restarts fresh each time)
    state.countdownStartTime = null;
    
    try {
      // Optimization #3: Fetch settings and cart in parallel (only fetch cart if not already loaded)
      // Optimization #1: Skip cart fetch if cart was already fetched before calling openCart
      const needsCartFetch = !state.cart;
      const needsSettingsFetch = !state.settings;
      
      console.log('[Cart.js] Needs cart fetch:', needsCartFetch, 'Needs settings fetch:', needsSettingsFetch);
      
      // Fetch in parallel if both are needed (Optimization #3)
      if (needsCartFetch && needsSettingsFetch) {
        const [settings, cart] = await Promise.all([
          fetchSettings(),
          fetchCart()
        ]);
        
        if (!settings) {
          console.warn('[Cart.js] Settings not available, aborting cart open');
          return;
        }
      } else if (needsSettingsFetch) {
        const settings = await fetchSettings();
        if (!settings) {
          console.warn('[Cart.js] Settings not available, aborting cart open');
          return;
        }
      } else if (needsCartFetch) {
        await fetchCart();
      }
      
      // Check if cart is active (in case settings were just fetched)
      if (state.settings?.cart_active === false) {
        console.warn('[Cart.js] Cart is disabled in settings');
        return;
      }
      
      console.log('[Cart.js] About to auto-add protection...');
      
      // OPTIMIZATION: Auto-add protection when cart opens (if enabled)
      // Variant ID is already prefetched, so this is instant (no delay)
      await maybeAutoAddProtection();
      
      console.log('[Cart.js] Opening cart UI...');
      
      // Open the cart UI
      state.isOpen = true;
      overlay.classList.add('sp-open');
      document.body.style.overflow = 'hidden';
      
      console.log('[Cart.js] Overlay class added, overflow hidden, state.isOpen:', state.isOpen);
      console.log('[Cart.js] Overlay classes:', overlay.className);
      console.log('[Cart.js] Overlay computed styles:', {
        display: window.getComputedStyle(overlay).display,
        visibility: window.getComputedStyle(overlay).visibility,
        opacity: window.getComputedStyle(overlay).opacity,
        zIndex: window.getComputedStyle(overlay).zIndex
      });
      
      // Render cart (Optimization #1: cart data already available, no refetch needed)
      console.log('[Cart.js] Rendering cart...');
      renderCart();
      console.log('[Cart.js] Cart render complete');
    } catch (error) {
      console.error('[Cart.js] Error in openCart():', error);
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
      
      // Stop countdown interval when cart is closed (prevent memory leak)
      stopCountdownInterval();
      
      // Reset countdown start time for fresh timer (so it restarts next time)
      state.countdownStartTime = null;
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
    console.log('[Cart.js] Setting up cart icon/link interception...');
    
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
        console.log('[Cart.js] Cart icon/link clicked:', target);
        
        // Check the target itself and its parents for href
        let href = target.getAttribute('href');
        
        // If the clicked element (like SVG) doesn't have href, check parent
        if (!href) {
          const parentLink = target.closest('a[href*="/cart"], a[href="#cart"]');
          if (parentLink) {
            href = parentLink.getAttribute('href');
          }
        }
        
        // If we found a cart-related href, intercept it
        if (href && (href === '/cart' || href.includes('/cart') || href === '#cart')) {
          console.log('[Cart.js] Intercepting cart link, opening custom cart');
          e.preventDefault();
          e.stopPropagation();
          openCart();
        }
      }
    }, true); // Use capture phase to intercept early
  }

  function interceptAddToCart() {
    console.log('[Cart.js] Setting up Add to Cart interception...');
    
    // Intercept form submissions
    document.addEventListener('submit', (e) => {
      const form = e.target;
      console.log('[Cart.js] Form submit detected:', form.getAttribute('action'));
      
      if (form.getAttribute('action')?.includes('/cart/add')) {
        console.log('[Cart.js] Intercepting Add to Cart form submission');
        e.preventDefault();
        e.stopPropagation();
        
        const formData = new FormData(form);
        
        fetch('/cart/add.js', {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(async (data) => {
          console.log('[Cart.js] Product added to cart successfully');
          // Successfully added to cart
          // OPTIMIZATION: Skip duplicate fetchCart if protection will be added
          // (addProtectionToCart will fetch cart after adding protection)
          if (!willAutoAddProtection()) {
            await fetchCart();
          }
          await maybeAutoAddProtection(); // Auto-add protection if enabled
          openCart();
        })
        .catch(error => {
          console.error('[Cart.js] Error adding to cart:', error);
        });
      }
    }, true); // Use capture phase

    // Intercept "Add to Cart" button clicks
    document.addEventListener('click', (e) => {
      const target = e.target;
      const button = target.closest('button[name="add"], button[type="submit"]');
      
      if (button) {
        console.log('[Cart.js] Add to Cart button clicked');
        const form = button.closest('form[action*="/cart/add"]');
        if (form) {
          console.log('[Cart.js] Intercepting Add to Cart button click');
          e.preventDefault();
          e.stopPropagation();
          
          const formData = new FormData(form);
          
          fetch('/cart/add.js', {
            method: 'POST',
            body: formData
          })
          .then(response => response.json())
          .then(async (data) => {
            console.log('[Cart.js] Product added via button click');
            // Successfully added to cart
            // OPTIMIZATION: Skip duplicate fetchCart if protection will be added
            // (addProtectionToCart will fetch cart after adding protection)
            if (!willAutoAddProtection()) {
              await fetchCart();
            }
            await maybeAutoAddProtection(); // Auto-add protection if enabled
            openCart();
          })
          .catch(error => {
            console.error('[Cart.js] Error adding to cart via button:', error);
          });
        } else {
          console.log('[Cart.js] Button clicked but no cart form found');
        }
      }
    }, true); // Use capture phase

    // Listen for Shopify's cart events
    document.addEventListener('cart:updated', async () => {
      // OPTIMIZATION: Skip duplicate fetchCart if protection will be added
      // (addProtectionToCart will fetch cart after adding protection)
      if (!willAutoAddProtection()) {
        await fetchCart();
      }
      await maybeAutoAddProtection(); // Auto-add protection if enabled
      openCart();
    });

    document.addEventListener('product:added-to-cart', async () => {
      // OPTIMIZATION: Skip duplicate fetchCart if protection will be added
      // (addProtectionToCart will fetch cart after adding protection)
      if (!willAutoAddProtection()) {
        await fetchCart();
      }
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
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
  }

  async function init() {
    // Wait for Shopify object to be available
    const shopifyAvailable = await waitForShopify();
    if (!shopifyAvailable) {
      console.warn('[Cart.js] Shopify object not available, cart will not initialize');
      return;
    }

    // Wait for document.body to be available
    if (!document.body) {
      console.warn('[Cart.js] document.body not ready, waiting...');
      await new Promise(resolve => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', resolve);
        } else {
          resolve();
        }
      });
    }

    console.log('[Cart.js] Initializing cart...');

    // Inject CSS immediately (non-blocking)
    injectCSS();

    // Create cart HTML immediately (non-blocking)
    try {
      const cartContainer = document.createElement('div');
      cartContainer.innerHTML = createCartHTML();
      const cartElement = cartContainer.firstElementChild;
      
      if (!cartElement) {
        console.error('[Cart.js] Failed to create cart HTML element');
        return;
      }
      
      document.body.appendChild(cartElement);
      console.log('[Cart.js] Cart HTML injected successfully');
      
      // Verify injection immediately
      setTimeout(() => {
        const overlay = document.getElementById('sp-cart-overlay');
        if (!overlay) {
          console.warn('[Cart.js] Cart overlay disappeared after injection! Re-injecting...');
          
          // Try re-injection
          const cartContainer2 = document.createElement('div');
          cartContainer2.innerHTML = createCartHTML();
          const cartElement2 = cartContainer2.firstElementChild;
          
          if (cartElement2) {
            document.body.appendChild(cartElement2);
            console.log('[Cart.js] Cart HTML re-injected');
            
            // Set up mutation observer to prevent removal
            setupRemovalProtection();
          }
        } else {
          console.log('[Cart.js] Cart overlay verified present');
          // Set up mutation observer to prevent removal
          setupRemovalProtection();
        }
      }, 100);
      
    } catch (error) {
      console.error('[Cart.js] Error injecting cart HTML:', error);
      return;
    }
    
    // Function to protect cart from removal
    function setupRemovalProtection() {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.removedNodes.forEach((node) => {
            if (node.id === 'sp-cart-overlay' || (node.querySelector && node.querySelector('#sp-cart-overlay'))) {
              console.warn('[Cart.js] Cart HTML was removed by theme/app! Re-injecting...');
              console.log('[Cart.js] Removed by element:', mutation.target);
              
              // Re-inject immediately
              setTimeout(() => {
                if (!document.getElementById('sp-cart-overlay')) {
                  const cartContainer = document.createElement('div');
                  cartContainer.innerHTML = createCartHTML();
                  const cartElement = cartContainer.firstElementChild;
                  
                  if (cartElement) {
                    document.body.appendChild(cartElement);
                    console.log('[Cart.js] Cart HTML restored after removal');
                    // Re-attach event listeners after re-injection
                    attachEventListeners();
                  }
                }
              }, 10);
            }
          });
        });
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
      console.log('[Cart.js] Removal protection enabled');
    }

    // Expose global function to open cart immediately (before attaching listeners)
    window.openShippingProtectionCart = openCart;
    
    // Attach event listeners immediately (non-blocking)
    attachEventListeners();

    // PRE-LOAD OPTIMIZATION: Fetch settings and cart in background (non-blocking!)
    // This makes cart opening nearly instant (uses cache on return visits)
    Promise.all([
      fetchSettings(),
      fetchCart()
    ]).then(([settings, cart]) => {
      if (settings === null) {
        // Cart is not active, hide cart functionality
        const overlay = document.getElementById('sp-cart-overlay');
        if (overlay) {
          overlay.remove();
        }
        return;
      }
      
      // Settings loaded, apply them
      applySettings();
      
      // OPTIMIZATION: Pre-fetch protection variant ID if auto-add is enabled
      // This caches the variant ID for instant adding later (no cart modification)
      if (settings.addons?.acceptByDefault && settings.addons?.productHandle) {
        prefetchProtectionVariant(settings.addons.productHandle).catch(() => {
          // Silently fail, will fetch on-demand if needed
        });
      }
    }).catch(() => {
      // Silently fail if settings/cart can't load
      // Cart will still work with default behavior
    });
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

