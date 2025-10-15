# Announcement Banner Feature

## Overview
Added a customizable announcement banner feature that allows users to display promotional messages or important notices in their cart sidebar. Users can fully customize the text, colors, and position of the banner.

## Features

### 1. Database Migration
**File:** Applied via Supabase MCP tool

Added the following columns to the `settings` table:
- `announcement_enabled` (BOOLEAN, default: false) - Toggle to enable/disable the announcement
- `announcement_text` (TEXT, default: 'BUY 1 GET 2 FREE') - The announcement message
- `announcement_text_color` (TEXT, default: '#FFFFFF') - Text color for the announcement
- `announcement_background_color` (TEXT, default: '#000000') - Background color for the announcement
- `announcement_position` (TEXT, default: 'top') - Position: 'top' or 'bottom'

**Status:** ✅ Migration successfully applied to Supabase project

### 2. TypeScript Types
**File:** `lib/supabase.ts`

Added announcement fields to the `Settings` interface:
- `announcement_enabled?: boolean`
- `announcement_text?: string`
- `announcement_text_color?: string`
- `announcement_background_color?: string`
- `announcement_position?: string`

### 3. API Endpoints

#### Announcement API
**File:** `app/api/announcement/route.ts`

New dedicated API endpoint for announcement settings:
- **GET:** Fetches announcement settings for a store
- **POST:** Updates announcement settings for a store
- Transforms between database format (snake_case) and API format (camelCase)

#### Settings API Update
**File:** `app/api/settings/route.ts`

Updated to include announcement data in all response scenarios:
- Token-based authentication response
- Fallback shop-based response
- Error fallback response

This ensures the customer-facing cart (cart.js) receives announcement settings.

### 4. Announcement Page
**File:** `app/(dashboard)/customization/announcement/page.tsx`

Complete announcement customization page with:

**Enable/Disable Toggle:**
- Large toggle switch to enable or disable the announcement feature
- Visual feedback when enabled/disabled

**Content Section:**
- Text input for the announcement message
- Placeholder: "e.g., BUY 1 GET 2 FREE"
- Helper text to guide users

**Appearance Section:**
- **Text Color:** Color picker + hex input
- **Background Color:** Color picker + hex input
- Real-time color preview

**Position Section:**
- **Top Button:** Places announcement just below the cart header
- **Bottom Button:** Places announcement above the shipping protection section
- Helper text explaining each position
- Buttons are disabled when announcement is disabled

**Live Preview:**
- Real-time cart preview on the right side
- Shows exactly how the announcement will appear
- Updates instantly as settings change

### 5. Cart Preview Component
**File:** `app/(dashboard)/customization/components/CartPreview.tsx`

Updated to support announcement banner:
- Added optional `announcement` prop to interface
- Renders announcement in top position (below header with border-bottom)
- Renders announcement in bottom position (above shipping protection with border-radius)
- Conditional rendering based on `announcement.enabled` and `announcement.position`

### 6. Design & Add-ons Pages
**Files:** 
- `app/(dashboard)/customization/design/page.tsx`
- `app/(dashboard)/customization/add-ons/page.tsx`

Updated to:
- Fetch announcement settings on load
- Pass announcement data to CartPreview component
- Ensure preview is consistent across all customization pages

### 7. Customer-Facing Cart
**File:** `public/cart.js`

Updated to display announcement banner:

**HTML Structure:**
- Added `sp-announcement-top` div (after header, before cart content)
- Added `sp-announcement-bottom` div (in footer, before shipping protection)

**CSS Styling:**
```css
.sp-announcement-banner {
  padding: 12px 20px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
}
.sp-announcement-top {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}
.sp-announcement-bottom {
  border-radius: 8px;
  margin-bottom: 20px;
}
```

**JavaScript Logic:**
- Fetches announcement settings from `/api/settings`
- Applies in `applyStaticSettings()` function
- Shows only the active banner based on position
- Hides both banners when disabled
- Applies text content, text color, and background color dynamically

## How It Works

### User Flow
1. Navigate to **Dashboard > Customization > Announcement**
2. Toggle **"Enable Announcement"** ON
3. Enter your announcement text (e.g., "BUY 1 GET 2 FREE")
4. Customize colors:
   - Text Color (default: white)
   - Background Color (default: black)
5. Choose position:
   - **Top:** Below cart header (more prominent)
   - **Bottom:** Above shipping protection
6. Preview changes in real-time on the right
7. Click **"Save Changes"**

### Customer Experience

**Top Position:**
```
┌─────────────────────┐
│   Cart       ✕      │ ← Header
├─────────────────────┤
│ BUY 1 GET 2 FREE    │ ← Announcement (full width, border-bottom)
├─────────────────────┤
│ [Product Items]     │
│                     │
└─────────────────────┘
```

**Bottom Position:**
```
┌─────────────────────┐
│   Cart       ✕      │ ← Header
├─────────────────────┤
│ [Product Items]     │
│                     │
├─────────────────────┤
│ ┌─────────────────┐ │
│ │BUY 1 GET 2 FREE │ │ ← Announcement (rounded, above protection)
│ └─────────────────┘ │
│ [Shipping Protect.] │
│ [Checkout Button]   │
└─────────────────────┘
```

## Styling Details

### Top Position
- Full width banner
- Padding: 12px 20px
- Border-bottom for separation
- Appears immediately below header
- No border-radius

### Bottom Position
- Contained banner
- Padding: 12px
- Border-radius: 8px for rounded corners
- Margin-bottom: 20px for spacing
- Appears above shipping protection

### Typography
- Font size: 14px
- Font weight: 600 (semi-bold)
- Text alignment: center
- Line height: 1.4

## Files Modified

1. ✅ Database migration via Supabase MCP
2. ✅ `lib/supabase.ts` - TypeScript types
3. ✅ `app/api/announcement/route.ts` - New API endpoint
4. ✅ `app/api/settings/route.ts` - Include announcement in settings
5. ✅ `app/(dashboard)/customization/announcement/page.tsx` - New announcement page
6. ✅ `app/(dashboard)/customization/components/CartPreview.tsx` - Preview support
7. ✅ `app/(dashboard)/customization/design/page.tsx` - Fetch & pass announcement
8. ✅ `app/(dashboard)/customization/add-ons/page.tsx` - Fetch & pass announcement
9. ✅ `public/cart.js` - Customer-facing banner display

## Testing Checklist

- [ ] Announcement toggle enables/disables the feature
- [ ] Text input updates the announcement message
- [ ] Text color picker changes text color in preview
- [ ] Background color picker changes background color in preview
- [ ] Top position shows banner below header
- [ ] Bottom position shows banner above shipping protection
- [ ] Only one banner is visible at a time
- [ ] Preview updates in real-time
- [ ] Settings save successfully
- [ ] Settings load correctly on page refresh
- [ ] Customer cart shows announcement when enabled
- [ ] Customer cart hides announcement when disabled
- [ ] Colors apply correctly in customer cart
- [ ] Position works correctly in customer cart
- [ ] No console errors

## Use Cases

### Promotional Messages
- "BUY 1 GET 2 FREE"
- "FREE SHIPPING OVER $50"
- "SALE - 30% OFF EVERYTHING"
- "LIMITED TIME OFFER"

### Important Notices
- "Order by Dec 20 for Christmas delivery"
- "New: Express shipping available"
- "Extended returns until Jan 31"

### Holiday/Seasonal
- "BLACK FRIDAY SALE - 50% OFF"
- "CYBER MONDAY SPECIAL"
- "SPRING SALE NOW ON"

## Design Decisions

1. **Separate Toggle:** Large, prominent toggle switch makes it easy to enable/disable
2. **Two Positions:** Top for maximum visibility, Bottom for less intrusive placement
3. **Full Customization:** Colors are fully customizable to match brand
4. **Live Preview:** Real-time preview eliminates guesswork
5. **Simple Interface:** Clear, focused UI with helpful text
6. **Disabled State:** Form fields disable when feature is off to prevent confusion
7. **Consistent Styling:** Matches the design of other customization pages

## Technical Notes

- Announcement data is cached with other settings
- Uses the same authentication flow as other API endpoints
- No additional API calls needed - fetched with design/addon settings
- Responsive design ensures banner looks good on all devices
- Banner text can be as long as needed (will wrap to multiple lines)
- HTML is sanitized (textContent, not innerHTML) for security

## Future Enhancements (Optional)

- [ ] Rich text editor for formatted announcements
- [ ] Multiple announcements with rotation
- [ ] Schedule announcements for specific dates/times
- [ ] Link support (make announcement clickable)
- [ ] Icons/emojis in announcements
- [ ] Animation effects (slide-in, fade, etc.)
- [ ] Mobile-specific text (different text for mobile vs desktop)
- [ ] A/B testing for announcements

