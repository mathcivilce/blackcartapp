# Testing Guide - Week 3: Protection Toggle

## Quick Start Testing

### 1. Open Test Page
Open `test/shopify-test.html` in your browser (double-click the file)

### 2. Add Products to Cart
- Click any "Add to Cart" button on a product
- Cart will automatically open
- You'll see your products displayed

### 3. Test Protection Toggle
Look for the protection section at the bottom of the cart (above the subtotal):

```
☐ Protect my order
Coverage for loss, damage, and theft
+$2.99
```

**Check the box:**
- Protection product is added to cart
- Subtotal increases by $2.99
- Product is hidden from view (but added to Shopify cart)

**Uncheck the box:**
- Protection product is removed
- Subtotal decreases
- Returns to original total

### 4. Test Settings Page

**Visit**: `http://localhost:3000/settings`

**Try changing:**
- **Color**: Pick a new color (e.g., blue #0066cc)
- **Text**: Change to "Add shipping insurance"
- **Description**: Change to "Protect against shipping issues"
- **Price**: Change to 3.99

**Click "Save Settings"**

**Test in cart:**
- Close and reopen the test page
- Open cart
- Your changes should appear!

---

## Detailed Test Scenarios

### Scenario 1: Basic Protection Toggle
1. Open test page
2. Add 2-3 products to cart
3. Open cart (cart icon or test controls)
4. Check protection toggle
5. **Expected**: Subtotal increases by $2.99
6. Uncheck protection toggle
7. **Expected**: Subtotal decreases by $2.99

### Scenario 2: Protection Persists
1. Add products to cart
2. Check protection toggle
3. Close cart
4. Change a product quantity
5. **Expected**: Protection still checked and included

### Scenario 3: Empty Cart
1. Clear cart (test controls)
2. Open cart
3. **Expected**: Empty cart message, no protection toggle visible

### Scenario 4: Color Customization
1. Go to settings page
2. Change toggle color to red (#ff0000)
3. Save
4. Open test page
5. Add product and open cart
6. **Expected**: Checkbox and "+$2.99" text are red

### Scenario 5: Text Customization
1. Go to settings
2. Change text to "Add shipping insurance"
3. Change description to "Coverage for damaged items"
4. Save
5. Open test page and cart
6. **Expected**: New text appears in cart

### Scenario 6: Mobile View
1. Open test page
2. Resize browser to mobile width (< 768px)
3. Add products and open cart
4. **Expected**: 
   - Cart is full width
   - Protection toggle is accessible
   - Text is readable
   - Checkbox is tappable

---

## What Gets Hidden

The protection product is **hidden from cart display** but:
- ✅ Still added to Shopify cart
- ✅ Included in subtotal
- ✅ Visible at checkout
- ✅ Customers can modify at checkout

**Why?** This keeps the cart UI clean while ensuring the product goes through to checkout.

---

## Test Checklist

Before moving to Week 4, verify:

- [ ] Cart opens and displays products
- [ ] Protection toggle appears in cart footer
- [ ] Checking toggle adds protection ($2.99)
- [ ] Unchecking toggle removes protection
- [ ] Protection is hidden from cart items list
- [ ] Subtotal updates correctly
- [ ] Settings page loads
- [ ] Can change color in settings
- [ ] Can change text in settings
- [ ] Can change price in settings
- [ ] Preview shows changes
- [ ] Save button works
- [ ] Changes reflect in cart
- [ ] Works on mobile width
- [ ] Toggle is accessible/tappable
- [ ] Console has no errors

---

## Troubleshooting

### Protection toggle doesn't appear
- Check console for errors
- Verify `http://localhost:3000` is running
- Check settings API returns valid data
- Try refreshing the page

### Toggle doesn't add/remove protection
- Check browser console for errors
- Verify mock fetch is intercepting `/cart/add.js`
- Check that `protectionProductId` matches (99999999)

### Settings don't save
- Check network tab in browser DevTools
- Verify POST request to `/api/settings` succeeds
- Check response status is 200

### Changes don't appear in cart
- Close and reopen test page after saving settings
- Clear browser cache if needed
- Check that settings API returns updated values

---

## Console Commands (DevTools)

Open browser console and try:

```javascript
// Check current cart state
console.log(window.mockCart);

// Open cart programmatically
openShippingProtectionCart();

// Check settings
fetch('http://localhost:3000/api/settings?shop=example-store.myshopify.com')
  .then(r => r.json())
  .then(console.log);
```

---

## Next: Week 4

Once all tests pass, we'll add:
- Webhook endpoint to receive orders
- Parse orders for protection product
- Calculate 20% commission
- Save to database
- Display stats on dashboard

Ready to continue? ✅

