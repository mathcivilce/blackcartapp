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
    // Cache settings
    enableCache: true,  // ✅ ENABLED: Cache settings for better performance
    cacheKey: 'sp_cart_settings',
    cartCacheKey: 'sp_cart_data',  // ✅ NEW: Cache cart data for instant opening
    cacheTTL: 1000 * 60 * 10  // 10 minutes (optimal balance between freshness and performance)
  };

  // Helper function get shop domain (may need to wait for Shopify object)
  function getShopDomain() {
    return window.Shopify?.shop || '';
  }

  // Default settings (used before API fetch for lazy loading)
  const DEFAULT_SETTINGS = {
    enabled: true,
    cart_active: true,  // Assume active by default
    design: {
      backgroundColor: '#FFFFFF',
      cartAccentColor: '#f6f6f7',
      cartTextColor: '#000000',
      savingsTextColor: '#2ea818',
      cornerRadius: 21,
      buttonText: 'Proceed to Checkout',
      buttonColor: '#1c8cd9',
      buttonTextColor: '#FFFFFF',
      buttonTextHoverColor: '#e9e9e9',
      showSavings: true,
      showContinueShopping: true,
      showTotalOnButton: true,
      cartTitle: 'Cart',
      cartTitleAlignment: 'left',
      emptyCartText: 'Your cart is empty',
      savingsText: 'Save',
      displayCompareAtPrice: true,
      closeButtonSize: 'medium',
      closeButtonColor: '#637381',
      closeButtonBorder: 'none',
      closeButtonBorderColor: '#000000',
      useCartImage: false,
      cartImageUrl: '',
      cartImageMobileSize: 100,
      cartImageDesktopSize: 120,
      cartImagePosition: 'left',
      showPaymentIcons: false,
      paymentIconAmex: false,
      paymentIconApplePay: false,
      paymentIconGooglePay: false,
      paymentIconMastercard: false,
      paymentIconPaypal: false,
      paymentIconShopPay: false,
      paymentIconVisa: false,
    },
    announcement: {
      enabled: false,
      text: '',
      textColor: '#FFFFFF',
      backgroundColor: '#000000',
      position: 'top',
      countdownEnabled: false,
      countdownType: 'fixed',
      countdownEnd: null,
      countdownDuration: 300,
      fontSize: 14,
      showBorder: true,
      textBold: false,
      textItalic: false,
      textUnderline: false,
      countdownBold: false,
      countdownItalic: false,
      countdownUnderline: false,
      countdownTimeFormat: 'text',
    },
    addons: {
      enabled: false,
      title: 'Shipping Protection',
      description: 'Protect your order from damage, loss, or theft during shipping.',
      price: 4.90,
      productHandle: null,
      acceptByDefault: false,
      adjustTotalPrice: true,
      useCustomImage: false,
      customImageUrl: '',
      customImageSize: 48,
    },
    freeGifts: {
      enabled: false,
      conditionType: 'quantity',
      headline: 'Unlock Your Free Gifts!',
      progressColor: '#4CAF50',
      position: 'bottom',
      tier1: { enabled: false, threshold: 1, productHandle: '', variantId: '', rewardText: 'Free Gift', unlockedMessage: '🎉 Free Gift Unlocked!', showUnlockedMessage: true, icon: '🎁' },
      tier2: { enabled: false, threshold: 2, productHandle: '', variantId: '', rewardText: 'Free Gift', unlockedMessage: '🎉 Free Gift Unlocked!', showUnlockedMessage: true, icon: '🎁' },
      tier3: { enabled: false, threshold: 3, productHandle: '', variantId: '', rewardText: 'Free Gift', unlockedMessage: '🎉 Free Gift Unlocked!', showUnlockedMessage: true, icon: '🎁' },
    }
  };

  // State management
  const state = {
    isOpen: false,
    cart: null,
    settings: null,
    settingsLoaded: false,  // Track if settings have been fetched from API (for lazy loading)
    isFirstCartOpen: true,  // Track if this is the first cart open in session (for skeleton UI)
    isLoading: false,
    protectionEnabled: false,
    protectionInCart: false,
    protectionVariantId: null,  // Cache variant ID for removal
    staticSettingsApplied: false,  // Track if static settings have been applied
    countdownStartTime: null,  // Track when fresh countdown started
    freeGiftsVariants: {},  // Track which free gifts are in cart: { tier1: variantId, tier2: variantId, tier3: variantId }
    freeGiftsUnlocked: { tier1: false, tier2: false, tier3: false },  // Track which tiers are unlocked
    processingFreeGifts: false,  // Prevent concurrent free gift operations
    fixingProtectionQuantity: false  // ⚡ Prevent concurrent protection quantity fixes
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
      /* Hide native Shopify cart drawer/popup (ONLY the drawer itself, not buttons/icons) */
      
      /* Hide custom element drawers */
      cart-drawer > dialog,
      cart-drawer > aside,
      cart-drawer > .drawer,
      cart-notification,
      
      /* Hide drawer dialogs and panels */
      dialog.cart-drawer__dialog,
      dialog[class*="cart-drawer"],
      aside.cart-drawer,
      aside[class*="cart-drawer"],
      div.cart-drawer[role="dialog"],
      div.cart-popup,
      div.mini-cart,
      
      /* Hide specific IDs (exact matches only) */
      #cart-drawer.drawer,
      #mini-cart.drawer,
      #CartDrawer[role="dialog"],
      
      /* Hide drawer containers that are NOT custom elements */
      div.cart-drawer:not(.header *),
      div.cart-popup:not(.header *),
      div[id="cart-drawer"]:not(.header *),
      div[id="CartDrawer"]:not(.header *) {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
      
      /* Explicitly ensure cart buttons/icons/links stay visible */
      button[class*="cart"],
      a[class*="cart"],
      cart-icon,
      .cart-icon,
      .header [class*="cart"],
      .header [id*="cart"],
      [class*="cart-trigger"],
      [class*="cart-button"],
      [aria-label*="cart" i] button,
      [aria-label*="cart" i] a {
        display: revert !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
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
        transition: opacity 0.3s ease-in-out; /* Smooth fade for skeleton->content transition */
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

      /* ============================================ */
      /* SKELETON UI (First Load Only) */
      /* ============================================ */
      
      .sp-cart-skeleton {
        padding: 20px !important;
        animation: sp-skeleton-fadein 0.3s ease-in !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: relative !important;
        z-index: 1 !important;
      }

      @keyframes sp-skeleton-fadein {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .sp-skeleton-item {
        display: flex !important;
        gap: 12px !important;
        padding: 16px 0 !important;
        border-bottom: 1px solid #f0f0f0 !important;
        visibility: visible !important;
        opacity: 1 !important;
      }

      .sp-skeleton-item:last-child {
        border-bottom: none !important;
      }

      .sp-skeleton-image {
        width: 80px !important;
        height: 80px !important;
        border-radius: 8px !important;
        flex-shrink: 0 !important;
        display: block !important;
        visibility: visible !important;
      }

      .sp-skeleton-details {
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
        justify-content: center !important;
        visibility: visible !important;
      }

      .sp-skeleton-line {
        height: 16px !important;
        border-radius: 4px !important;
        display: block !important;
        visibility: visible !important;
      }

      .sp-skeleton-title {
        width: 70% !important;
        height: 18px !important;
      }

      .sp-skeleton-price {
        width: 40% !important;
        height: 16px !important;
      }

      .sp-skeleton-quantity {
        width: 30% !important;
        height: 14px !important;
      }

      /* Footer skeleton */
      .sp-skeleton-footer {
        padding: 20px !important;
        border-top: 1px solid #e5e5e5 !important;
        background: #fafafa !important;
        animation: sp-skeleton-fadein 0.3s ease-in !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: relative !important;
        z-index: 1 !important;
      }

      .sp-skeleton-button {
        height: 52px !important;
        border-radius: 8px !important;
        margin-bottom: 12px !important;
        display: block !important;
        visibility: visible !important;
      }

      .sp-skeleton-text {
        height: 14px !important;
        width: 50% !important;
        margin: 0 auto !important;
        display: block !important;
        visibility: visible !important;
      }

      /* Base tone used across skeletons */
      :root {
        --sp-skel-base: #e9ecef;
        --sp-skel-mid: #f3f4f6;
      }

      /* Animated shimmer effect - Production-style sweep */
      .sp-skeleton-image,
      .sp-skeleton-line,
      .sp-skeleton-button,
      .sp-skeleton-text {
        position: relative !important;
        overflow: hidden !important;
        background-color: #e9ecef !important;
        background-image: linear-gradient(
          90deg,
          transparent 0%,
          transparent 25%,
          rgba(255, 255, 255, 0.3) 50%,
          transparent 75%,
          transparent 100%
        ) !important;
        background-size: 200% 100% !important;
        background-repeat: no-repeat !important;
        animation-name: sp-skeleton-shimmer !important;
        animation-duration: 1.2s !important;
        animation-timing-function: linear !important;
        animation-iteration-count: infinite !important;
        border-radius: 8px !important;
        will-change: background-position !important;
      }

      /* Tighter, continuous sweep */
      @keyframes sp-skeleton-shimmer {
        0% { 
          background-position: -100% 0 !important;
        }
        100% { 
          background-position: 100% 0 !important;
        }
      }

      /* Optional: respect reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .sp-skeleton-image,
        .sp-skeleton-line,
        .sp-skeleton-button,
        .sp-skeleton-text {
          animation: none !important;
          background: var(--sp-skel-base) !important;
        }
      }

      /* Smooth fade transition when skeleton is replaced */
      .sp-cart-content {
        transition: opacity 0.3s ease-in-out;
      }

      .sp-cart-content.sp-transitioning {
        opacity: 0;
      }
      
      /* Hide real footer when skeleton footer is shown */
      .sp-cart-footer.sp-hidden {
        display: none !important;
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
    // Check if caching is enabled
    if (!CONFIG.enableCache) {
      return null; // Skip cache when disabled
    }
    
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
    // Check if caching is enabled
    if (!CONFIG.enableCache) {
      return; // Skip caching when disabled
    }
    
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
  // CART DATA CACHING (for instant cart opening)
  // ============================================
  // 
  // BEHAVIOR:
  // - Cart data is cached in localStorage (5-minute TTL)
  // - On page load, cached cart is loaded into state.cart
  // - When cart opens, if cache exists, show instantly (no skeleton!)
  // - Fresh data is fetched in background and updates cache
  // - Cache is validated by shop domain (security)
  // - Cache auto-expires after 5 minutes (prevents stale data)
  //
  // RESULT: Instant cart opening across ALL pages! 🚀

  function getCachedCart() {
    // Check if caching is enabled
    if (!CONFIG.enableCache) {
      return null;
    }
    
    // Skip localStorage if not available
    if (!isLocalStorageAvailable()) {
      return null;
    }
    
    try {
      const cached = localStorage.getItem(CONFIG.cartCacheKey);
      if (!cached) {
        return null;
      }
      
      const parsed = JSON.parse(cached);
      
      // Validate structure
      if (!parsed || typeof parsed !== 'object' || !parsed.data || !parsed.timestamp || !parsed.shop) {
        console.warn('[Cart.js] Invalid cart cache structure, removing...');
        localStorage.removeItem(CONFIG.cartCacheKey);
        return null;
      }
      
      const { data, timestamp, shop } = parsed;
      
      // Validate shop domain (security - don't show cart from different shop)
      const currentShop = getShopDomain();
      if (shop !== currentShop) {
        console.log('[Cart.js] Cart cache invalid: different shop (cached:', shop, ', current:', currentShop, ')');
        localStorage.removeItem(CONFIG.cartCacheKey);
        return null;
      }
      
      // Check if expired (5 minutes for cart data - shorter than settings)
      const CART_CACHE_TTL = 1000 * 60 * 5; // 5 minutes
      if (Date.now() - timestamp > CART_CACHE_TTL) {
        console.log('[Cart.js] Cart cache expired');
        localStorage.removeItem(CONFIG.cartCacheKey);
        return null;
      }
      
      console.log('[Cart.js] ✅ Cart loaded from cache:', data.item_count, 'items');
      return data;
    } catch (error) {
      console.warn('[Cart.js] Cart cache read failed:', error.message);
      // If localStorage fails or cache is corrupted, remove and fail gracefully
      try {
        localStorage.removeItem(CONFIG.cartCacheKey);
      } catch (e) {
        // Can't even remove, localStorage fully blocked
      }
      return null;
    }
  }

  function setCachedCart(cart) {
    // Check if caching is enabled
    if (!CONFIG.enableCache) {
      return; // Skip caching when disabled
    }
    
    // Skip localStorage if not available
    if (!isLocalStorageAvailable()) {
      return; // Silently skip caching
    }
    
    try {
      const currentShop = getShopDomain();
      localStorage.setItem(CONFIG.cartCacheKey, JSON.stringify({
        data: cart,
        timestamp: Date.now(),
        shop: currentShop // Store shop domain for validation
      }));
      console.log('[Cart.js] ✅ Cart cached successfully:', cart.item_count, 'items');
    } catch (error) {
      console.warn('[Cart.js] Cart cache write failed:', error.message);
      // If localStorage fails (quota exceeded, etc.), silently fail
      // Cart still works without caching
    }
  }

  function clearCartCache() {
    // Clear cart cache (useful when user logs out or cart is cleared)
    try {
      localStorage.removeItem(CONFIG.cartCacheKey);
      console.log('[Cart.js] Cart cache cleared');
    } catch (error) {
      console.warn('[Cart.js] Failed to clear cart cache:', error.message);
    }
  }

  // ============================================
  // SHOPIFY CART API FUNCTIONS
  // ============================================

  async function fetchCart(retries = 2, shouldEnrich = true) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Create abort controller for timeout (3 seconds per attempt)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        console.log(`[Cart.js] Fetching cart data${attempt > 1 ? ` (attempt ${attempt}/${retries})` : ''}...`);
        
        const response = await fetch('/cart.js', { 
          signal: controller.signal,
          keepalive: true // Improve reliability
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Cart API returned status ${response.status}`);
        }
        
        const cart = await response.json();
        console.log('[Cart.js] Cart data fetched successfully' + (attempt > 1 ? ` (attempt ${attempt})` : ''), `(${cart.item_count} items)`);
        
        // Conditionally enrich cart items with compare_at_price from variant data
        // Only if feature is enabled (optimization)
        if (shouldEnrich && shouldEnrichWithComparePrice()) {
          console.log('[Cart.js] Enriching cart with compare prices...');
          await enrichCartItemsWithComparePrice(cart);
        } else if (!shouldEnrich) {
          console.log('[Cart.js] Skipping enrichment (will be done lazily)');
        } else {
          console.log('[Cart.js] Compare price feature disabled - skipping enrichment');
        }
        
        state.cart = cart;
        
        // ✅ NEW: Cache cart data for instant opening on next page
        setCachedCart(cart);
        
        checkProtectionInCart();
        return cart;
        
      } catch (error) {
        const isTimeout = error.name === 'AbortError';
        const errorType = isTimeout ? 'timeout' : error.message;
        
        console.warn(`[Cart.js] Cart fetch failed on attempt ${attempt}/${retries}:`, errorType);
        
        // If this was the last attempt, give up
        if (attempt === retries) {
          console.error('[Cart.js] All cart fetch attempts exhausted. Cart data unavailable.');
          return null;
        }
        
        // Exponential backoff: 500ms, 1000ms
        const delay = 500 * attempt;
        console.log(`[Cart.js] Retrying cart fetch in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return null;
  }
  
  // Helper function: Check if we should enrich with compare prices
  function shouldEnrichWithComparePrice() {
    // Check if either compare price display or savings display is enabled
    const displayCompareAtPrice = state.settings?.design?.displayCompareAtPrice !== false;
    const showSavings = state.settings?.design?.showSavings !== false;
    
    return displayCompareAtPrice || showSavings;
  }
  
  // Helper function: Enrich cart lazily in background (non-blocking)
  async function enrichCartLazily() {
    if (!state.cart || !shouldEnrichWithComparePrice()) {
      return;
    }
    
    console.log('[Cart.js] Starting lazy enrichment in background...');
    
    try {
      await enrichCartItemsWithComparePrice(state.cart);
      
      // Re-render cart with compare prices if cart is still open
      if (state.isOpen) {
        console.log('[Cart.js] Lazy enrichment complete - updating cart display');
        renderCart();
      }
    } catch (error) {
      console.warn('[Cart.js] Lazy enrichment failed:', error);
      // Silently fail - cart still works without compare prices
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
      
      // Check if caching is enabled globally
      if (!CONFIG.enableCache) {
        console.log('[Cart.js] Cache disabled - fetching fresh settings from API...');
        useCache = false;
      }
      
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

  async function fetchSettingsFromAPI(shopDomain, retries = 3) {
    // Use token-based authentication if available
    // SECURITY: Always send shop domain for domain binding validation
    const url = CONFIG.token 
      ? `${CONFIG.appUrl}/api/settings?token=${CONFIG.token}&shop=${shopDomain}`
      : `${CONFIG.appUrl}/api/settings?shop=${shopDomain}`;
    
    console.log('[Cart.js] Fetching settings from:', url.replace(CONFIG.token || '', 'TOKEN_HIDDEN'));
    
    // Retry loop with exponential backoff
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(url, { 
          signal: controller.signal,
          keepalive: true // Improve reliability
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const settings = await response.json();
          console.log('[Cart.js] Settings API response received successfully' + (attempt > 1 ? ` (attempt ${attempt})` : ''));
          return settings;
        }
        
        // Server or client error
        console.error(`[Cart.js] Settings API error (attempt ${attempt}/${retries}):`, response.status, response.statusText);
        
        // Try to get error details
        try {
          const errorData = await response.json();
          console.error('[Cart.js] API error details:', errorData);
        } catch (e) {
          console.error('[Cart.js] Could not parse error response');
        }
        
        // Don't retry on permanent errors
        if (response.status === 401 || response.status === 403) {
          console.error('[Cart.js] Authentication error - not retrying');
          return null;
        }
        
        if (response.status === 404) {
          console.error('[Cart.js] Settings not found - not retrying');
          return null;
        }
        
        // Retry on temporary errors (500, 502, 503, 504)
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 1s, 2s, 4s (max 5s)
          console.log(`[Cart.js] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
      } catch (error) {
        // Network error or timeout
        if (error.name === 'AbortError') {
          console.error(`[Cart.js] Request timeout (attempt ${attempt}/${retries})`);
        } else {
          console.error(`[Cart.js] Network error (attempt ${attempt}/${retries}):`, error.message);
        }
        
        // Retry on network errors
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 1s, 2s, 4s (max 5s)
          console.log(`[Cart.js] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retry attempts exhausted
    console.error('[Cart.js] All retry attempts failed for settings API');
    return null;
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
    
    // ⚡ FIX: Only run protection logic if the add-on feature is enabled
    // This prevents unnecessary checks and API calls when protection is disabled
    if (!state.settings?.addons?.enabled) {
      return;
    }
    
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
    
    // ⚡ OPTIMIZATION: Ensure protection product quantity is always 1 (fix if > 1)
    // Guard flag prevents concurrent fixes if this function is called multiple times
    if (protectionItem && 
        protectionItem.quantity > 1 && 
        !state.fixingProtectionQuantity) {
      
      state.fixingProtectionQuantity = true;
      console.log('[Cart.js] Protection quantity > 1, fixing to 1...');
      
      const lineNumber = state.cart.items.indexOf(protectionItem) + 1;
      updateCartItem(lineNumber, 1).finally(() => {
        state.fixingProtectionQuantity = false;
        console.log('[Cart.js] Protection quantity fix complete');
      });
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
  
  // Wrapper function: Pre-fetch protection variant ID from current settings
  async function prefetchProtectionVariantId() {
    const productHandle = state.settings?.addons?.productHandle || state.settings?.protectionProductHandle;
    if (!productHandle) {
      throw new Error('No protection product handle configured');
    }
    
    return await prefetchProtectionVariant(productHandle);
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
      console.log('[Cart.js] Auto-adding protection product...');
      // ⚡ OPTIMIZATION: Skip internal fetch since caller will fetch cart after
      // This prevents redundant fetchCart() call and duplicate checkProtectionInCart()
      await addProtectionToCart(true, true, true); // silent mode + skip render + skip fetch
    } else if (state.protectionInCart) {
      console.log('[Cart.js] ✅ Skipping protection add - already in cart (likely batch added)');
    }
  }

  // Helper function for add-to-cart flows - skips internal fetch for performance
  async function maybeAutoAddProtectionWithoutFetch() {
    // Only auto-add if acceptByDefault is enabled and protection is not already in cart
    if (willAutoAddProtection()) {
      // OPTIMIZATION: Skip render AND fetch - caller will handle both
      await addProtectionToCart(true, true, true); // silent mode + skip render + skip fetch
    }
  }

  async function addProtectionToCart(silentMode = false, skipRender = false, skipFetch = false) {
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
        
        // OPTIMIZATION: Skip cart fetch if caller will fetch (avoids duplicate fetch)
        if (!skipFetch) {
          await fetchCart();
        }
        
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
      
      state.cart = cart;
      
      // ✅ FIX: Update cart cache to prevent stale data on page navigation
      // This ensures removed items, quantity changes, etc. are cached immediately
      setCachedCart(cart);
      
      state.isLoading = false;
      
      // ⚡ OPTIMIZATION: Enrich in background if feature is enabled (non-blocking)
      if (shouldEnrichWithComparePrice()) {
        enrichCartItemsWithComparePrice(cart).then(() => {
          if (state.isOpen) renderCart();
        });
      }
      
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

  // Render skeleton UI for first cart open (optimistic UI pattern)
  function renderSkeleton() {
    console.log('[Cart.js] Rendering skeleton UI...');
    
    const contentArea = document.getElementById('sp-cart-content');
    if (!contentArea) {
      console.error('[Cart.js] Cart content area not found');
      return;
    }
    
    // Create skeleton with 2 items in content area
    contentArea.innerHTML = `
      <div class="sp-cart-skeleton">
        <div class="sp-skeleton-item">
          <div class="sp-skeleton-image"></div>
          <div class="sp-skeleton-details">
            <div class="sp-skeleton-line sp-skeleton-title"></div>
            <div class="sp-skeleton-line sp-skeleton-price"></div>
            <div class="sp-skeleton-line sp-skeleton-quantity"></div>
          </div>
        </div>
        <div class="sp-skeleton-item">
          <div class="sp-skeleton-image"></div>
          <div class="sp-skeleton-details">
            <div class="sp-skeleton-line sp-skeleton-title"></div>
            <div class="sp-skeleton-line sp-skeleton-price"></div>
            <div class="sp-skeleton-line sp-skeleton-quantity"></div>
          </div>
        </div>
      </div>
    `;
    
    // Hide real footer and show skeleton footer
    const realFooter = document.querySelector('.sp-cart-footer');
    if (realFooter) {
      realFooter.classList.add('sp-hidden');
    }
    
    // Create skeleton footer and insert it
    const sidebar = document.getElementById('sp-cart-sidebar');
    if (sidebar) {
      // Check if skeleton footer already exists
      let skeletonFooter = sidebar.querySelector('.sp-skeleton-footer');
      
      if (!skeletonFooter) {
        skeletonFooter = document.createElement('div');
        skeletonFooter.className = 'sp-skeleton-footer';
        skeletonFooter.innerHTML = `
          <div class="sp-skeleton-button"></div>
          <div class="sp-skeleton-text"></div>
        `;
        sidebar.appendChild(skeletonFooter);
      }
    }
  }

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
    
    // ✅ FIX: Sync protection checkbox with state (ensures correct toggle state when rendering cached cart)
    const protectionCheckbox = document.getElementById('sp-protection-checkbox');
    if (protectionCheckbox) {
      protectionCheckbox.checked = state.protectionInCart;
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

  // Helper function: Open cart immediately with skeleton (for Add to Cart flows)
  function openCartWithSkeleton() {
    console.log('[Cart.js] openCartWithSkeleton() called');
    
    const overlay = document.getElementById('sp-cart-overlay');
    if (!overlay) {
      console.error('[Cart.js] Cannot open cart - overlay not found!');
      return;
    }
    
    // ✨ INSTANT: Open cart immediately
    state.isOpen = true;
    overlay.classList.add('sp-open');
    document.body.style.overflow = 'hidden';
    
    // ✅ OPTIMIZED: Show skeleton ONLY if we don't have cached data
    // With cart caching, we can show cart instantly even on first load on new pages!
    if (!state.settingsLoaded || !state.cart) {
      console.log('[Cart.js] Showing skeleton UI (settingsLoaded:', state.settingsLoaded, ', hasCart:', !!state.cart, ')');
      renderSkeleton();
    } else {
      console.log('[Cart.js] ✅ Instant cart open - using cached data (settings + cart) 🚀');
      // Show cached cart immediately (will update in background if needed)
      renderCart();
    }
    
    console.log('[Cart.js] Cart opened instantly (Add to Cart optimistic UI)');
  }
  
  // Helper function: Transition from skeleton to real cart content
  async function transitionToRealCart() {
    console.log('[Cart.js] transitionToRealCart() called');
    
    try {
      // ⚡ OPTIMIZATION: Fast path for subsequent Add to Cart (settings already loaded)
      if (state.settingsLoaded) {
        console.log('[Cart.js] Fast path - settings already loaded, skipping fetch');
        
        // Add protection BEFORE fetching cart (so it's included in the cart)
        // Note: If protection was batch added with user's product, this will be skipped
        // automatically (state.protectionInCart is already true from batch add)
        await maybeAutoAddProtection();
        
        // ⚡ OPTIMIZATION: Fetch cart WITHOUT enrichment for speed
        // Note: This will update the cache with fresh data (setCachedCart called in fetchCart)
        await fetchCart(2, false);
        
        checkProtectionInCart();
        
        // Instant render (no skeleton transition needed)
        renderCart();
        
        // ✅ FIX: Clean up skeleton footer (in case it was shown)
        const skeletonFooter = document.querySelector('.sp-skeleton-footer');
        if (skeletonFooter) {
          console.log('[Cart.js] Removing skeleton footer (fast path)');
          skeletonFooter.remove();
        }
        
        // Ensure real footer is visible
        const realFooter = document.querySelector('.sp-cart-footer');
        if (realFooter) {
          realFooter.classList.remove('sp-hidden');
        }
        
        // ⚡ OPTIMIZATION: Enrich with compare prices in background (non-blocking)
        enrichCartLazily();
        
        console.log('[Cart.js] Fast path complete - instant render');
        return;
      }
      
      // 🐌 SLOW PATH: First cart interaction (need to fetch settings)
      console.log('[Cart.js] Slow path - fetching settings for first time');
      
      // ⚡ OPTIMIZATION: Fetch settings and protection variant in parallel (saves 400ms!)
      // This is speculative (variant might not be needed), but the cost is minimal
      console.log('[Cart.js] ⚡ Parallel fetch: settings + protection variant');
      const [settings] = await Promise.all([
        fetchSettings(false),
        prefetchProtectionVariantId().catch(error => {
          // Silently fail - variant will be fetched on-demand if needed
          console.log('[Cart.js] Variant pre-fetch failed (will fetch on-demand if needed):', error.message);
        })
      ]);
      
      if (settings) {
        state.settingsLoaded = true;
        applySettings();
        console.log('[Cart.js] ✅ Settings applied, variant ID:', state.protectionVariantId ? 'cached' : 'not cached');
      }
      
      // Add protection BEFORE fetching cart (so it's included in the cart)
      // Note: If protection was batch added with user's product, this will be skipped
      // automatically (state.protectionInCart is already true from batch add)
      await maybeAutoAddProtection();
      
      // ⚡ OPTIMIZATION: Fetch cart WITHOUT enrichment for speed
      // Note: fetchCart() internally calls checkProtectionInCart() at line 1154,
      // so no need to call it again here (avoids redundant check)
      await fetchCart(2, false);
      
      // Smooth transition: fade out skeleton, fade in real content
      const contentArea = document.getElementById('sp-cart-content');
      if (contentArea) {
        contentArea.classList.add('sp-transitioning');
        
        setTimeout(() => {
          renderCart();
          contentArea.classList.remove('sp-transitioning');
          
          // Remove skeleton footer and show real footer
          const skeletonFooter = document.querySelector('.sp-skeleton-footer');
          if (skeletonFooter) {
            skeletonFooter.remove();
          }
          
          const realFooter = document.querySelector('.sp-cart-footer');
          if (realFooter) {
            realFooter.classList.remove('sp-hidden');
          }
          
          // ⚡ OPTIMIZATION: Enrich with compare prices in background (non-blocking)
          enrichCartLazily();
        }, 75); // ⚡ OPTIMIZATION: Reduced from 150ms to 75ms for faster transition
      } else {
        renderCart();
        
        // Remove skeleton footer and show real footer immediately
        const skeletonFooter = document.querySelector('.sp-skeleton-footer');
        if (skeletonFooter) {
          skeletonFooter.remove();
        }
        
        // ⚡ OPTIMIZATION: Enrich with compare prices in background (non-blocking)
        enrichCartLazily();
        
        const realFooter = document.querySelector('.sp-cart-footer');
        if (realFooter) {
          realFooter.classList.remove('sp-hidden');
        }
      }
      
      console.log('[Cart.js] Slow path complete - skeleton transition done');
    } catch (error) {
      console.error('[Cart.js] Error in transitionToRealCart():', error);
      
      // Show error in cart UI
      showCartError('Failed to load cart. Please try again.');
    }
  }
  
  // Helper function: Show error message in cart
  function showCartError(message) {
    const contentArea = document.getElementById('sp-cart-content');
    if (contentArea) {
      contentArea.innerHTML = `
        <div class="sp-cart-empty">
          <div class="sp-cart-empty-icon">⚠️</div>
          <h3>Oops!</h3>
          <p>${message}</p>
          <button onclick="window.location.reload()" style="
            background: #1c8cd9;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            margin-top: 12px;
          ">Refresh Page</button>
        </div>
      `;
    }
    
    // Remove skeleton footer and show real footer
    const skeletonFooter = document.querySelector('.sp-skeleton-footer');
    if (skeletonFooter) {
      skeletonFooter.remove();
    }
    
    const realFooter = document.querySelector('.sp-cart-footer');
    if (realFooter) {
      realFooter.classList.remove('sp-hidden');
    }
  }
  
  // Helper function: Safely add product to cart with verification and retry
  async function safelyAddToCart(formData, maxRetries = 2) {
    console.log('[Cart.js] safelyAddToCart() called with retry limit:', maxRetries);
    
    // Extract variant ID from form data for verification
    const variantId = formData.get('id');
    if (!variantId) {
      throw new Error('No variant ID found in form data');
    }
    
    console.log('[Cart.js] Adding variant to cart:', variantId);
    
    // ⚡ OPTIMIZATION: Check if we should batch add protection with user's product
    const shouldBatchAddProtection = 
      state.settingsLoaded &&
      state.settings?.addons?.enabled &&
      state.settings?.addons?.acceptByDefault &&
      !state.protectionInCart &&
      state.protectionVariantId;
    
    if (shouldBatchAddProtection) {
      console.log('[Cart.js] ✅ BATCH ADD: Adding product + protection in single API call!');
    }
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Cart.js] Add to cart attempt ${attempt}/${maxRetries}`);
        
        let response;
        
        if (shouldBatchAddProtection) {
          // ⚡ BATCH ADD: Add both product and protection in one call
          const quantity = parseInt(formData.get('quantity') || '1');
          const properties = {};
          
          // Extract any properties from formData
          for (const [key, value] of formData.entries()) {
            if (key.startsWith('properties[')) {
              const propName = key.match(/properties\[(.+)\]/)?.[1];
              if (propName) {
                properties[propName] = value;
              }
            }
          }
          
          const items = [
            {
              id: variantId,
              quantity: quantity,
              ...(Object.keys(properties).length > 0 && { properties })
            },
            {
              id: state.protectionVariantId,
              quantity: 1
            }
          ];
          
          response = await fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items })
          });
          
          // Mark protection as added (optimistic - will be confirmed on cart fetch)
          if (response.ok) {
            state.protectionInCart = true;
            console.log('[Cart.js] ✅ Batch add successful - protection marked as in cart');
          }
        } else {
          // Normal single product add
          response = await fetch('/cart/add.js', {
            method: 'POST',
            body: formData
          });
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Cart.js] Add to cart failed:', response.status, errorText);
          
          // If it's a 422 error, check if item is already in cart
          if (response.status === 422) {
            console.log('[Cart.js] 422 error - checking if item already in cart...');
            
            // Fetch current cart to see if item is already there
            await fetchCart();
            
            const itemInCart = state.cart?.items?.find(item => 
              String(item.id) === String(variantId) || 
              String(item.variant_id) === String(variantId)
            );
            
            if (itemInCart) {
              console.log('[Cart.js] Item already in cart, treating as success');
              return { success: true, alreadyInCart: true, item: itemInCart };
            }
          }
          
          // If not last attempt, retry
          if (attempt < maxRetries) {
            console.log('[Cart.js] Retrying in 500ms...');
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
          
          throw new Error(`Failed to add product to cart (${response.status})`);
        }
        
        // Success! Parse response
        const data = await response.json();
        console.log('[Cart.js] Product added successfully:', data);
        
        // ⚡ OPTIMIZATION: Trust the response, skip verification fetch (saves ~300-500ms)
        // The /cart/add.js response contains the added item, so we know it worked
        console.log('[Cart.js] Product added, skipping verification fetch for speed');
        return { success: true, alreadyInCart: false, item: data };
        
      } catch (error) {
        console.error(`[Cart.js] Attempt ${attempt}/${maxRetries} failed:`, error);
        
        // If not last attempt, retry
        if (attempt < maxRetries) {
          console.log('[Cart.js] Retrying in 500ms...');
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
        
        // Last attempt failed
        throw error;
      }
    }
    
    throw new Error('Failed to add product to cart after all retries');
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
    
    // ✨ OPTIMISTIC UI: Open cart IMMEDIATELY (0ms perceived delay)
    state.isOpen = true;
    overlay.classList.add('sp-open');
    document.body.style.overflow = 'hidden';
    
    console.log('[Cart.js] Cart opened instantly (optimistic UI)');
    
    try {
      // Check if this is the first cart open (show skeleton)
      if (state.isFirstCartOpen && !state.settingsLoaded) {
        console.log('[Cart.js] First cart open - showing skeleton UI');
        
        // Show skeleton immediately (feels instant!)
        renderSkeleton();
        
        // ⚡ OPTIMIZATION: Fetch settings, cart, and protection variant in parallel (faster!)
        // This is speculative (variant might not be needed), but saves 400ms if it is
        console.log('[Cart.js] ⚡ Parallel fetch: settings + cart + protection variant');
        const [settings, cart] = await Promise.all([
          fetchSettings(false), // Fetch fresh from API
          fetchCart(2, false),  // Skip enrichment for speed
          prefetchProtectionVariantId().catch(error => {
            // Silently fail - variant will be fetched on-demand if needed
            console.log('[Cart.js] Variant pre-fetch failed (will fetch on-demand if needed):', error.message);
          })
        ]);
        
        if (!settings) {
          console.error('[Cart.js] Failed to fetch settings from API');
          // Continue with defaults
        } else {
          state.settingsLoaded = true;
          console.log('[Cart.js] Settings fetched successfully from API');
          
          // Check if cart is actually active
          if (settings.cart_active === false) {
            console.warn('[Cart.js] Cart is disabled (cart_active = false)');
            closeCart();
            return;
          }
          
          // Apply fresh settings
          applySettings();
          console.log('[Cart.js] ✅ Settings applied, variant ID:', state.protectionVariantId ? 'cached' : 'not cached');
        }
        
        // Mark first open complete
        state.isFirstCartOpen = false;
        
        // ✅ Auto-add protection BEFORE rendering (prevents toggle flicker)
        // This ensures toggle is already ON when cart appears
        await maybeAutoAddProtection();
        
        // ✅ CRITICAL: Refetch cart to get updated data with protection item (skip enrichment)
        await fetchCart(2, false);
        
        // ✅ Check protection in cart AFTER refetch (to set state.protectionVariantId)
        checkProtectionInCart();
        
        // Smooth transition: fade out skeleton, fade in real content
        const contentArea = document.getElementById('sp-cart-content');
        if (contentArea) {
          contentArea.classList.add('sp-transitioning');
          
          setTimeout(() => {
            renderCart();
            contentArea.classList.remove('sp-transitioning');
            
            // ✅ Remove skeleton footer and show real footer (with correct toggle state)
            const skeletonFooter = document.querySelector('.sp-skeleton-footer');
            if (skeletonFooter) {
              skeletonFooter.remove();
            }
            
            const realFooter = document.querySelector('.sp-cart-footer');
            if (realFooter) {
              realFooter.classList.remove('sp-hidden');
            }
            
            // ⚡ OPTIMIZATION: Enrich with compare prices in background (non-blocking)
            enrichCartLazily();
          }, 150); // Small delay for smooth transition
        } else {
          renderCart();
          
          // Remove skeleton footer and show real footer immediately if no transition
          const skeletonFooter = document.querySelector('.sp-skeleton-footer');
          if (skeletonFooter) {
            skeletonFooter.remove();
          }
          
          const realFooter = document.querySelector('.sp-cart-footer');
          if (realFooter) {
            realFooter.classList.remove('sp-hidden');
          }
          
          // ⚡ OPTIMIZATION: Enrich with compare prices in background (non-blocking)
          enrichCartLazily();
        }
        
      } else {
        // Subsequent opens: settings already in memory
        console.log('[Cart.js] Subsequent cart open - using cached settings');
        
        // Ensure footer is visible for subsequent opens (remove any sp-hidden class)
        const footer = document.querySelector('.sp-cart-footer');
        if (footer) {
          footer.classList.remove('sp-hidden');
        }
        
        // ⚡ OPTIMIZATION: Just fetch cart (fast) - skip enrichment
        if (!state.cart) {
          await fetchCart(2, false);
        }
        
        // ✅ Auto-add protection BEFORE rendering (prevents toggle flicker)
        await maybeAutoAddProtection();
        
        // ✅ CRITICAL: Refetch cart to get updated data with protection item (skip enrichment)
        await fetchCart(2, false);
        
        // ✅ Check protection in cart AFTER refetch (to filter it out correctly)
        checkProtectionInCart();
        
        // Render immediately (no skeleton needed)
        renderCart();
        
        // ⚡ OPTIMIZATION: Enrich with compare prices in background (non-blocking)
        enrichCartLazily();
      }
      
      console.log('[Cart.js] Cart opened successfully');
      
    } catch (error) {
      console.error('[Cart.js] Error in openCart():', error);
      // Make sure we don't leave the page in a broken state
      if (overlay.classList.contains('sp-open')) {
        closeCart();
      }
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
        
        // ✨ OPTIMISTIC UI: Open cart IMMEDIATELY with skeleton
        openCartWithSkeleton();
        
        const formData = new FormData(form);
        
        // Background: Safely add to cart with verification and retry
        safelyAddToCart(formData)
          .then(async (result) => {
            console.log('[Cart.js] Product added to cart successfully:', result);
            
            // Smooth transition from skeleton to real content
            await transitionToRealCart();
          })
          .catch(error => {
            console.error('[Cart.js] Error adding to cart:', error);
            // Show error in cart UI (no page reload)
            showCartError('Failed to add product to cart. Please try again.');
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
          
          // ✨ OPTIMISTIC UI: Open cart IMMEDIATELY with skeleton
          openCartWithSkeleton();
          
          const formData = new FormData(form);
          
          // Background: Safely add to cart with verification and retry
          safelyAddToCart(formData)
            .then(async (result) => {
              console.log('[Cart.js] Product added via button click:', result);
              
              // Smooth transition from skeleton to real content
              await transitionToRealCart();
            })
            .catch(error => {
              console.error('[Cart.js] Error adding to cart via button:', error);
              // Show error in cart UI (no page reload)
              showCartError('Failed to add product to cart. Please try again.');
            });
        } else {
          console.log('[Cart.js] Button clicked but no cart form found');
        }
      }
    }, true); // Use capture phase

    // Listen for Shopify's cart events (for themes with custom Add to Cart implementations)
    document.addEventListener('cart:updated', async () => {
      console.log('[Cart.js] cart:updated event detected');
      
      // ✨ OPTIMISTIC UI: Open cart IMMEDIATELY with skeleton
      openCartWithSkeleton();
      
      // Smooth transition from skeleton to real content
      await transitionToRealCart();
    });

    document.addEventListener('product:added-to-cart', async () => {
      console.log('[Cart.js] product:added-to-cart event detected');
      
      // ✨ OPTIMISTIC UI: Open cart IMMEDIATELY with skeleton
      openCartWithSkeleton();
      
      // Smooth transition from skeleton to real content
      await transitionToRealCart();
    });
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  // Wait for Shopify object to be available with progressive backoff
  async function waitForShopify() {
    // Progressive backoff strategy:
    // Phase 1: Fast checks (100ms × 5 = 0.5s) - catches 95% of themes
    // Phase 2: Normal checks (200ms × 10 = 2.0s) - catches 4% of themes  
    // Phase 3: Slow checks (500ms × 15 = 7.5s) - catches 1% of themes
    // Total: 10 seconds maximum
    
    const phases = [
      { interval: 100, attempts: 5 },   // 0.5s - fast themes
      { interval: 200, attempts: 10 },  // 2.0s - normal themes
      { interval: 500, attempts: 15 }   // 7.5s - slow themes
    ];
    
    let totalAttempts = 0;
    
    for (const phase of phases) {
      for (let i = 0; i < phase.attempts; i++) {
        totalAttempts++;
        
        if (window.Shopify?.shop) {
          console.log(`[Cart.js] Shopify object detected after ${totalAttempts} attempts`);
          return true;
        }
        
        await new Promise(resolve => setTimeout(resolve, phase.interval));
      }
    }
    
    // Timeout after 10 seconds
    console.error('[Cart.js] Shopify object not available after 10 seconds (30 attempts)');
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

    console.log('[Cart.js] Initializing cart with lazy loading...');

    // LAZY LOADING: Use cached or default settings (no API call on page load!)
    const cachedSettings = getCachedSettings();
    state.settings = cachedSettings || DEFAULT_SETTINGS;
    
    // ✅ FIX: If we have cached settings, mark as loaded (no skeleton needed!)
    state.settingsLoaded = !!cachedSettings; // true if cached, false if using defaults
    
    // ✅ NEW: Load cached cart data for instant cart opening
    const cachedCart = getCachedCart();
    if (cachedCart) {
      state.cart = cachedCart;
      console.log('[Cart.js] ✅ Cart data loaded from cache:', cachedCart.item_count, 'items');
      
      // ✅ FIX: Immediately check protection status so it's filtered correctly on first render
      // This sets state.protectionVariantId and state.protectionInCart
      checkProtectionInCart();
    }
    
    console.log('[Cart.js] Using', cachedSettings ? 'cached' : 'default', 'settings for initialization');
    console.log('[Cart.js] settingsLoaded:', state.settingsLoaded, '(cached settings exist:', !!cachedSettings, ')');
    console.log('[Cart.js] Cart cached:', !!cachedCart, '(cart items in cache:', cachedCart?.item_count || 0, ')');
    
    if (!cachedSettings) {
      console.log('[Cart.js] No settings cache - settings will be fetched from API when cart opens (skeleton will show)');
    } else if (!cachedCart) {
      console.log('[Cart.js] Settings cached but no cart cache - cart will be fetched quickly (minimal skeleton)');
    } else {
      console.log('[Cart.js] Both settings and cart cached - instant cart opening on all pages! 🚀');
    }
    
    // ⚡ OPTIMIZATION: Pre-cache protection variant ID for batch add (non-blocking)
    // This runs in background and enables instant batch add when user clicks "Add to Cart"
    if (cachedSettings && cachedSettings.addons?.enabled && cachedSettings.addons?.productHandle) {
      console.log('[Cart.js] Pre-fetching protection variant ID for batch add optimization...');
      prefetchProtectionVariantId().then(() => {
        console.log('[Cart.js] ✅ Protection variant ID cached:', state.protectionVariantId);
      }).catch(error => {
        console.warn('[Cart.js] Failed to pre-fetch protection variant ID:', error);
        // Non-critical: will fetch on-demand if needed
      });
    }

    // STEP 1: Inject CSS with default/cached settings
    injectCSS();

    // STEP 2: Create cart HTML with default/cached settings
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

    // STEP 3: Expose global function to open cart
    window.openShippingProtectionCart = openCart;
    
    // STEP 4: Attach event listeners
    attachEventListeners();

    // STEP 5: Apply default/cached settings (static only - dynamic settings applied on cart open)
    applySettings();
    
    console.log('[Cart.js] Cart initialized with lazy loading! Settings and cart data will be fetched when user opens cart.');
  }

  // Wait for DOM to be readyyyyyyyy
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

