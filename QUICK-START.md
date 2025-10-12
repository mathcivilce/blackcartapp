# 🚀 Quick Start - Test Week 3 Now!

## Option 1: Test Locally (Recommended)

### Step 1: Open Test Page
1. Navigate to `test/shopify-test.html`
2. Double-click to open in browser
3. You'll see a mock Shopify store

### Step 2: Test Protection Toggle
1. Click "Add to Cart" on any product
2. Cart opens automatically
3. Scroll down to see:
   ```
   ☐ Protect my order
   Coverage for loss, damage, and theft
   +$2.99
   ```
4. **Check the box** → Subtotal increases
5. **Uncheck the box** → Subtotal decreases

### Step 3: Test Settings (Optional)
1. Make sure dev server is running: `npm run dev`
2. Visit: `http://localhost:3000/settings`
3. Change the color to blue: `#0066cc`
4. Change text to: "Add shipping insurance"
5. Click "Save Settings"
6. Reload test page and open cart
7. See your changes! 🎉

---

## Option 2: With Dev Server

### Start Server
```bash
npm run dev
```

### Visit Pages
- **Home**: http://localhost:3000
- **Settings**: http://localhost:3000/settings
- **Cart Script**: http://localhost:3000/cart.js
- **Settings API**: http://localhost:3000/api/settings?shop=test.myshopify.com

### Test Cart
1. Open `test/shopify-test.html` 
2. Cart will load from `http://localhost:3000/cart.js`
3. Test protection toggle

---

## 🎨 Try These Customizations

### Modern Blue
```
Color: #0066cc
Text: "Shipping Protection Available"
Description: "Protect your order for just $2.99"
```

### Vibrant Green
```
Color: #22c55e
Text: "Add Protection"
Description: "Coverage for loss, damage, and theft"
```

### Bold Red
```
Color: #ef4444
Text: "Insure Your Order"
Description: "Full replacement guarantee"
```

---

## 📱 Test on Mobile

1. Open test page in browser
2. Press F12 (DevTools)
3. Click device toolbar icon (phone icon)
4. Select "iPhone 12 Pro" or "Pixel 5"
5. Test cart and toggle
6. Should be fully functional!

---

## ✅ What to Look For

### Cart Behavior
- [ ] Opens smoothly with slide animation
- [ ] Shows all products with images
- [ ] Quantity +/- buttons work
- [ ] Remove buttons work
- [ ] Subtotal updates correctly

### Protection Toggle
- [ ] Appears above subtotal
- [ ] Checkbox is clickable
- [ ] Price displays correctly
- [ ] Description is readable
- [ ] Checking adds $2.99 to total
- [ ] Unchecking removes $2.99

### Settings Page
- [ ] All fields editable
- [ ] Color picker works
- [ ] Preview updates instantly
- [ ] Save button works
- [ ] Success message appears

---

## 🐛 Common Issues

### "Protection toggle doesn't appear"
**Solution**: Settings API needs protection product ID. For testing, it's auto-set to `99999999`.

### "Toggle doesn't add/remove"
**Solution**: Check browser console for errors. Make sure test page mock fetch is working.

### "Settings don't save"
**Solution**: Dev server must be running (`npm run dev`) for settings API to work.

### "Changes don't appear in cart"
**Solution**: Close and reopen test page after changing settings.

---

## 🎥 Video Walkthrough (5 min)

1. **0:00** - Open test page, add products
2. **1:00** - Toggle protection on/off
3. **2:00** - Visit settings page
4. **3:00** - Customize color and text
5. **4:00** - Save and test in cart
6. **5:00** - Test on mobile view

---

## 📞 Need Help?

Check these files:
- `TESTING.md` - Detailed testing scenarios
- `WEEK3-SUMMARY.md` - Complete feature breakdown
- `README.md` - Technical documentation

---

## 🎉 You're Ready!

Once you've tested and everything works, you can:

1. ✅ Deploy to Vercel
2. ✅ Add real Shopify store
3. ✅ Configure actual protection product
4. ✅ Start testing with real customers

Or continue to **Week 4: Sales Tracking** to make it generate revenue! 💰

