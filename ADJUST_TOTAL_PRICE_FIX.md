# Adjust Total Price Feature Fix

## Problem
The `addon_adjust_total_price` setting was stored in the database but NOT being passed to cart.js, so when users deactivated "Adjust Total Price Automatically", the protection product price was still included in the cart total on the "Proceed to Checkout" button.

## Solution

### 1. ✅ Added `adjustTotalPrice` to Settings API Response
**File: `app/api/settings/route.ts`**

Added `adjustTotalPrice` to the `addons` object in all 4 places where settings are returned:

```typescript
addons: {
  enabled: settings?.addons_enabled ?? true,
  title: settings?.addon_title || 'Shipping Protection',
  description: settings?.addon_description || 'Protect your order from damage, loss, or theft during shipping.',
  price: settings?.addon_price || 4.90,
  productHandle: settings?.addon_product_id || null,
  acceptByDefault: settings?.addon_accept_by_default ?? false,
  adjustTotalPrice: settings?.addon_adjust_total_price ?? true,  // ✅ NEW
}
```

### 2. ✅ Modified cart.js to Respect `adjustTotalPrice` Setting
**File: `public/cart.js`**

Updated the `updateSubtotal()` function to:
- Check if `adjustTotalPrice` is `false`
- Check if protection is currently in the cart
- If both conditions are true, subtract the protection price from the **displayed** total

```javascript
function updateSubtotal(cents) {
  // ... existing code ...
  
  // Calculate displayed total
  let displayTotal = cents;
  
  // If adjustTotalPrice is false, subtract protection price from displayed total
  if (state.protectionInCart && state.settings?.addons?.adjustTotalPrice === false) {
    const protectionPrice = Math.round((state.settings?.addons?.price || 0) * 100);
    displayTotal = Math.max(0, cents - protectionPrice);
  }

  // Show the adjusted total on button
  if (checkoutTotal) {
    checkoutTotal.textContent = formatMoney(displayTotal);
  }
  
  // ... existing code ...
}
```

## How It Works

### When `adjustTotalPrice` is `true` (Default)
- Protection product price **IS** included in the checkout button total
- Example: Cart = $50, Protection = $4.90 → **Button shows "$54.90"**

### When `adjustTotalPrice` is `false` 
- Protection product price **IS NOT** included in the checkout button total
- Example: Cart = $50, Protection = $4.90 → **Button shows "$50.00"**
- Protection item still exists in cart (will be purchased)
- Only the displayed total on the button is adjusted

## Important Notes

1. **Protection Item Still Added to Cart**
   - The protection product is still added to the Shopify cart
   - It will still be purchased at checkout
   - Only the displayed total on the button is affected

2. **Cart Subtotal Unchanged**
   - Shopify's `cart.total_price` includes the protection
   - We only adjust the displayed value on the checkout button
   - The actual cart data remains accurate

3. **Database Field**
   - Database field: `addon_adjust_total_price` (boolean)
   - API field: `adjustTotalPrice` (camelCase)
   - Default value: `true`

## Testing

To test this feature:

1. **Enable Adjust Total Price** (default):
   - Add product to cart
   - Enable shipping protection
   - Check that button total = cart items + protection price

2. **Disable Adjust Total Price**:
   - Go to Add-ons settings
   - Uncheck "Adjust Total Price Automatically"
   - Save settings
   - Add product to cart  
   - Enable shipping protection
   - Check that button total = cart items ONLY (protection price NOT shown in total)

## Files Modified
- ✅ `app/api/settings/route.ts` - Added `adjustTotalPrice` to API response (4 locations)
- ✅ `public/cart.js` - Modified `updateSubtotal()` function to respect setting

## No Breaking Changes
- Default value is `true` (existing behavior)
- Backward compatible with existing stores
- No database migration needed (field already exists)

