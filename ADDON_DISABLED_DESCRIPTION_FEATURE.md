# Add-on Disabled Description Feature

## Overview
Implemented a new "Disabled Description" field for the shipping protection add-on that displays a different description to customers when they toggle OFF/disable the protection product in the cart.

## Implementation Details

### 1. Database Changes
**Migration:** `add_addon_disabled_description.sql`

- Added `addon_disabled_description` column to the `settings` table
- Default value: "By deselecting shipping protection, we are not liable for lost, damaged, or stolen products."

**SQL:**
```sql
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS addon_disabled_description TEXT DEFAULT 'By deselecting shipping protection, we are not liable for lost, damaged, or stolen products.';
```

### 2. Admin Panel Changes
**File:** `app/(dashboard)/customization/add-ons/page.tsx`

**Changes:**
- Added `disabledDescription` field to the `shippingProtection` state object
- Created new textarea input field labeled "Disabled Description (when disabled)"
- Added helper text explaining when this description is shown
- Updated the label for the existing description field to "Description (when enabled)" for clarity
- Passed `disabledDescription` to the `CartPreview` component

**UI Structure:**
```
- Description (when enabled) [textarea]
  Helper: "This description is shown when the protection toggle is ON."
  
- Disabled Description (when disabled) [textarea]
  Helper: "This description is shown when the protection toggle is OFF. Use this to inform customers about liability."
```

### 3. API Changes

#### Add-ons API (`app/api/addons/route.ts`)
- **GET endpoint:** Returns `disabledDescription` from database
- **POST endpoint:** Saves `disabledDescription` to database as `addon_disabled_description`

#### Settings API (`app/api/settings/route.ts`)
- Added `disabledDescription` field to the `addons` object in all response sections:
  - Token-based authentication responses
  - Fallback shop-based responses
  - Error/default responses
- Default value: "By deselecting shipping protection, we are not liable for lost, damaged, or stolen products."

### 4. Cart UI Changes (Customer-Facing)
**File:** `public/cart.js`

**Changes:**

1. **Default Settings:**
   - Added `disabledDescription` to the `DEFAULT_SETTINGS.addons` object

2. **Helper Function:**
   - Created `updateProtectionDescription(isEnabled)` function
   - Shows enabled description when `isEnabled = true`
   - Shows disabled description when `isEnabled = false`
   - Fallback to default text if setting is missing

3. **Initial Rendering:**
   - Modified `applySettings()` function to set the correct description based on `state.protectionInCart`
   - Shows disabled description if protection is not in cart
   - Shows enabled description if protection is in cart

4. **Toggle Interaction:**
   - Updated protection checkbox event listener in `attachEventListeners()`
   - Calls `updateProtectionDescription()` when toggle state changes
   - Description updates instantly before the API call completes

**Code Example:**
```javascript
// Helper function to update protection description based on toggle state
function updateProtectionDescription(isEnabled) {
  const descEl = document.getElementById('sp-protection-description');
  if (!descEl || !state.settings) return;
  
  // Show enabled description when toggle is ON, disabled description when toggle is OFF
  const description = isEnabled 
    ? (state.settings.addons?.description || state.settings.description)
    : (state.settings.addons?.disabledDescription || 'By deselecting shipping protection, we are not liable for lost, damaged, or stolen products.');
  
  descEl.textContent = description;
}
```

### 5. Cart Preview Component Changes
**File:** `app/(dashboard)/customization/components/CartPreview.tsx`

**Changes:**
- Added `disabledDescription?: string` to the `addons` prop interface
- Added `protectionEnabled` state to track toggle status in preview
- Made the toggle interactive in the preview (not read-only)
- Description dynamically changes when admin toggles the switch in preview
- Updates when `acceptByDefault` prop changes

**Code Example:**
```tsx
const [protectionEnabled, setProtectionEnabled] = React.useState(addons.acceptByDefault);

// In the render:
<p style={styles.protectionDescription}>
  {protectionEnabled 
    ? addons.description 
    : (addons.disabledDescription || 'By deselecting shipping protection, we are not liable for lost, damaged, or stolen products.')
  }
</p>
```

## User Experience Flow

### Admin Experience:
1. Admin navigates to **Customization → Add-ons**
2. Sees two description fields:
   - "Description (when enabled)" - shown when toggle is ON
   - "Disabled Description (when disabled)" - shown when toggle is OFF
3. Fills in both descriptions
4. Preview on the right shows the current description based on toggle state
5. Admin can click the toggle in preview to see both descriptions
6. Clicks "Save Changes"
7. Settings are saved to database and cache is invalidated

### Customer Experience:
1. Customer opens cart
2. **If protection is enabled by default:**
   - Toggle is ON
   - Sees: "Protect your order from damage, loss, or theft during shipping."
3. **Customer clicks toggle OFF:**
   - Description instantly changes
   - Sees: "By deselecting shipping protection, we are not liable for lost, damaged, or stolen products."
4. **Customer clicks toggle ON again:**
   - Description changes back
   - Sees: "Protect your order from damage, loss, or theft during shipping."

## Default Values
- **Enabled Description:** "Protect your order from damage, loss, or theft during shipping."
- **Disabled Description:** "By deselecting shipping protection, we are not liable for lost, damaged, or stolen products."

## Database Schema
```sql
settings table:
  - addon_description TEXT (existing - enabled description)
  - addon_disabled_description TEXT (new - disabled description)
```

## Files Modified/Created

### Created:
1. `supabase/migrations/add_addon_disabled_description.sql` - Database migration
2. `ADDON_DISABLED_DESCRIPTION_FEATURE.md` - This documentation

### Modified:
1. `app/(dashboard)/customization/add-ons/page.tsx` - Admin UI
2. `app/api/addons/route.ts` - Add-ons API
3. `app/api/settings/route.ts` - Settings API
4. `public/cart.js` - Customer cart UI
5. `app/(dashboard)/customization/components/CartPreview.tsx` - Preview component
6. `lib/supabase.ts` - TypeScript Settings interface

## Testing Checklist

✅ Database migration created
✅ Database migration applied successfully
✅ TypeScript Settings interface updated
✅ Admin panel shows both description fields
✅ Save functionality works for both descriptions
✅ Preview toggle is interactive and shows correct description
✅ API endpoints return disabled description
✅ Cart UI shows correct description based on toggle state
✅ Description updates instantly when customer toggles
✅ No linter errors
✅ No TypeScript errors
✅ Ready for deployment

## Technical Notes

1. **Instant Update:** Description changes immediately when toggle is clicked, providing instant feedback to customers
2. **Fallback Values:** If disabled description is not set, system falls back to default text
3. **Cache Invalidation:** Saving settings triggers cache invalidation for instant updates
4. **Preview Interactivity:** Preview toggle is now interactive (not read-only) so admin can test both descriptions before saving

## Future Enhancements (Optional)

1. Add rich text editor for descriptions (bold, italic, links)
2. Add character limit indicators
3. Add A/B testing for different disabled descriptions
4. Add analytics to track how often customers disable protection
5. Add multilingual support for descriptions


