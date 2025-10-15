# Cart Image Feature Implementation

## Overview
Added the ability for users to replace the text "Cart" on the top header with a custom image that they can upload. Users can also customize the image size for mobile and desktop separately, and choose the positioning (left or center).

## Features Implemented

### 1. Database Migration
**File:** `supabase/migrations/add_cart_image_settings.sql`

Added the following columns to the `settings` table:
- `use_cart_image` (BOOLEAN, default: false) - Toggle to use image instead of text
- `cart_image_url` (TEXT) - URL of the cart header image
- `cart_image_mobile_size` (INTEGER, default: 100) - Image height in pixels for mobile devices
- `cart_image_desktop_size` (INTEGER, default: 120) - Image height in pixels for desktop devices
- `cart_image_position` (TEXT, default: 'left') - Image position (left or center)

**Status:** ✅ Migration successfully applied to Supabase project

### 2. API Updates
**File:** `app/api/design/route.ts`

**GET Endpoint:**
- Added new fields to the response: `useCartImage`, `cartImageUrl`, `cartImageMobileSize`, `cartImageDesktopSize`, `cartImagePosition`
- Maps database columns to camelCase format for the frontend

**POST Endpoint:**
- Added support for saving the new cart image settings
- Converts camelCase from frontend to snake_case for database storage

### 3. Design Page UI
**File:** `app/(dashboard)/customization/design/page.tsx`

Added a new "Cart Header" section with:
- **Checkbox:** "Use custom image instead of text" - toggles between text and image mode
- **When image mode is enabled:**
  - Image URL input field with placeholder
  - Image position buttons (Left/Center)
  - Mobile image height slider (30px - 150px)
  - Desktop image height slider (30px - 200px)
- **When text mode is enabled:**
  - Cart Title text input
  - Cart Title Alignment buttons (Left/Center)

The UI dynamically shows/hides the relevant controls based on whether image mode is enabled.

### 4. Cart Preview Component
**File:** `app/(dashboard)/customization/components/CartPreview.tsx`

Updated the preview to:
- Show either the cart image or cart title based on `useCartImage` setting
- Display the image at the correct size using `cartImageDesktopSize`
- Position the image according to `cartImagePosition`
- Properly position the close button based on the alignment/position

### 5. Customer-Facing Cart (cart.js)
**File:** `public/cart.js`

Updated the cart sidebar to:
- Added `<img id="sp-cart-image">` element in the cart header
- Added responsive CSS rules for mobile and desktop image sizes using CSS variables
- Updated `applyStaticSettings()` function to:
  - Show/hide image vs text based on `design.useCartImage`
  - Set the image URL from `design.cartImageUrl`
  - Apply mobile size using CSS variable `--sp-cart-image-mobile-size`
  - Apply desktop size using CSS variable `--sp-cart-image-desktop-size`
  - Position the image left or center based on `design.cartImagePosition`
  - Adjust close button positioning accordingly

## How It Works

1. **User enables image mode:** Users check "Use custom image instead of text" on the Design page
2. **User enters image URL:** Users paste the URL of their logo/image (e.g., from their CDN or image host)
3. **User adjusts size:** Users use sliders to set the perfect height for mobile (30-150px) and desktop (30-200px)
4. **User sets position:** Users choose whether the image appears on the left or center of the header
5. **Settings are saved:** All settings are saved to the database
6. **Real-time preview:** The CartPreview component shows exactly how it will look
7. **Customer sees it:** When customers visit the store and open the cart, they see the custom image

## Responsive Behavior

### Mobile (≤768px)
- Image height is controlled by `cartImageMobileSize` setting
- Default: 100px
- Range: 30px - 150px

### Desktop (>768px)
- Image height is controlled by `cartImageDesktopSize` setting
- Default: 120px
- Range: 30px - 200px

## Image Requirements

- **Format:** Any web-compatible image format (PNG, JPG, SVG, WebP, etc.)
- **Hosting:** Image must be hosted on a publicly accessible URL
- **Sizing:** Image should be high-resolution for best quality
- **Recommendation:** Use a transparent PNG or SVG for best results
- **Width:** Image width is automatically scaled to maintain aspect ratio (max-width: 100%)

## User Flow

1. Navigate to **Dashboard > Customization > Design**
2. Scroll to the **Cart Header** section
3. Check **"Use custom image instead of text"**
4. Enter the image URL in the **Image URL** field
5. Select **Left** or **Center** for image position
6. Adjust the **Mobile image height** slider
7. Adjust the **Desktop image height** slider
8. Preview the changes in real-time on the right side
9. Click **Save Changes**

## Files Modified

1. ✅ `supabase/migrations/add_cart_image_settings.sql` - New migration file
2. ✅ `app/api/design/route.ts` - API endpoint updates
3. ✅ `app/(dashboard)/customization/design/page.tsx` - Design page UI
4. ✅ `app/(dashboard)/customization/components/CartPreview.tsx` - Preview component
5. ✅ `public/cart.js` - Customer-facing cart sidebar

## Testing Checklist

- [ ] Image displays correctly when URL is provided
- [ ] Image toggles properly when checkbox is checked/unchecked
- [ ] Mobile size slider adjusts image height on mobile preview
- [ ] Desktop size slider adjusts image height on desktop preview
- [ ] Left position aligns image to the left with close button on the right
- [ ] Center position centers the image with close button absolutely positioned
- [ ] Settings persist after saving
- [ ] Settings load correctly on page refresh
- [ ] Customer-facing cart shows the image correctly
- [ ] Responsive behavior works on actual mobile devices
- [ ] No console errors or warnings

## Notes

- The image URL must be publicly accessible
- Users should ensure their image has good contrast with the background color
- For best results, use a transparent background image
- The aspect ratio is maintained automatically
- Images are loaded using `object-fit: contain` to prevent distortion

