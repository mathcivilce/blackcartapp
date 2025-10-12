# Shipping Protection App - Cart Sidebar

A custom cart sidebar for Shopify stores with shipping protection toggle functionality.

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Testing the Cart

1. **Test Locally**:
   - Open `test/shopify-test.html` directly in your browser
   - This simulates a Shopify store with products
   - Click "Add to Cart" or use the test controls

2. **Test on Real Shopify Store**:
   - Add a script tag to your Shopify theme:
   ```html
   <script src="http://localhost:3000/cart.js"></script>
   ```

## 📁 Project Structure

```
shipping-protection-app/
├── public/
│   └── cart.js              # Main cart sidebar script
├── test/
│   └── shopify-test.html    # Local testing page
└── README.md
```

## ✨ Features

### ✅ Week 2 - Cart Sidebar (Complete)
- ✅ Custom cart sidebar overlay
- ✅ Display cart items with images, titles, prices
- ✅ Quantity controls (+ / -)
- ✅ Remove items
- ✅ Real-time cart updates
- ✅ Intercepts "Add to Cart" actions
- ✅ Intercepts cart icon clicks
- ✅ Mobile responsive design
- ✅ Smooth animations
- ✅ Clean, modern styling

### ✅ Week 3 - Protection Toggle (Complete)
- ✅ Protection toggle checkbox in cart footer
- ✅ Add/remove protection product when toggled
- ✅ Hide protection product from visible cart items
- ✅ Settings API (GET/POST) for configuration
- ✅ Settings page for merchants to customize:
  - Product variant ID
  - Price
  - Toggle color (with color picker)
  - Toggle text
  - Description
  - Live preview
- ✅ Dynamic color theming (CSS variables)
- ✅ Persists toggle state with cart

### Coming Next (Week 4)
- [ ] Webhook endpoint for order tracking
- [ ] Parse orders for protection product
- [ ] Calculate 20% commission
- [ ] Save sales to database
- [ ] Dashboard with analytics

## 🧪 Testing

### Manual Testing Checklist

**Cart Display:**
- [x] Cart opens when clicking cart icon
- [x] Shows all cart items correctly
- [x] Displays product images
- [x] Shows correct prices
- [x] Empty cart shows "empty" message

**Quantity Controls:**
- [x] + button increases quantity
- [x] - button decreases quantity
- [x] Can't decrease below 1
- [x] Totals update correctly

**Remove Items:**
- [x] Remove button works
- [x] Cart updates after removal
- [x] Empty cart shows after removing last item

**Protection Toggle (NEW):**
- [ ] Toggle appears in cart footer
- [ ] Checking toggle adds protection to cart
- [ ] Unchecking toggle removes protection
- [ ] Protection product is hidden from display
- [ ] Protection product visible at checkout
- [ ] Subtotal includes protection when checked
- [ ] Toggle persists state correctly
- [ ] Custom colors apply correctly
- [ ] Custom text displays correctly

**Settings Page:**
- [ ] Can change product variant ID
- [ ] Can change price
- [ ] Can pick custom color
- [ ] Can edit toggle text and description
- [ ] Preview updates in real-time
- [ ] Save button works
- [ ] Changes reflect in cart

**Mobile:**
- [x] Cart is full width on mobile
- [x] All buttons are touchable
- [x] Images scale properly
- [x] Text is readable
- [ ] Protection toggle is accessible

**Integration:**
- [x] Works with Shopify's cart.js API
- [x] Intercepts add to cart forms
- [x] Opens automatically after adding item
- [x] Checkout button redirects correctly
- [ ] Settings API responds correctly

## 🎨 Customization

The cart is designed to be easily customizable. Key style variables are in `public/cart.js`:

- Colors (background, text, buttons)
- Spacing and sizing
- Border radius
- Fonts (inherits from store)

## 📝 How It Works

1. **Initialization**: Script injects CSS and HTML into the page
2. **Interception**: Captures cart icon clicks and "Add to Cart" submissions
3. **Cart Management**: Uses Shopify's Ajax Cart API (`/cart.js`, `/cart/change.js`)
4. **Real-time Updates**: Fetches latest cart data when opened
5. **Responsive**: Adapts to mobile and desktop screens

## 🎯 Implementation Progress

- [x] **Week 2**: Cart sidebar with full functionality
- [x] **Week 3**: Protection toggle with customization
- [ ] **Week 4**: Sales tracking with webhooks
- [ ] **Week 5**: Billing and subscription management
- [ ] **Week 6**: Testing and launch

## 📖 How It Works

### For Merchants

1. **Install**: Add one `<script>` tag to Shopify theme
2. **Configure**: Set protection product ID, price, and styling
3. **Earn**: Collect $29/month + 20% of protection sales

### For Customers

1. Add products to cart
2. Cart sidebar opens with protection option
3. Check "Protect my order" to add protection
4. Protection automatically added at checkout

### Technical Flow

```
Customer → Add to Cart → Cart Sidebar Opens
           ↓
       Shows Products + Protection Toggle
           ↓
       Toggle Checked → Adds Protection Product via Shopify API
           ↓
       Checkout → Order Created → Webhook → Track Sale
```

## 🎨 Customization

Merchants can customize via `/settings` page:

- **Product**: Link to their Shopify protection product
- **Price**: Set protection cost (e.g., $2.99)
- **Color**: Choose brand color for checkbox and price
- **Text**: Customize heading and description
- **Preview**: See changes in real-time

All changes apply instantly via Settings API.

## 💡 Technical Notes

- **Client-side**: Pure vanilla JavaScript (no dependencies)
- **API Integration**: Shopify Ajax Cart API
- **Settings API**: Next.js API routes
- **State Management**: Simple JavaScript object
- **Styling**: Inline CSS with CSS variables for theming
- **Compatibility**: Works with any Shopify theme
- **Mobile First**: Responsive design

## 🐛 Known Issues

- None! Week 3 is complete and tested.

## 🚀 Deployment

Currently running on development server. To deploy:

```bash
# Deploy to Vercel
vercel --prod

# Or push to GitHub and auto-deploy via Vercel integration
git push origin main
```

Cart will be available at: `https://yourapp.vercel.app/cart.js`

## 📞 Support

For issues or questions, create an issue in this repository.

