# Announcement Countdown Formatting Feature

## Overview
Added countdown text formatting options and time format selection to the announcements page.

## Features Added

### 1. Countdown Text Formatting
Users can now apply the following formatting to countdown text:
- **Bold** - Makes countdown text bold
- *Italic* - Makes countdown text italic  
- <u>Underline</u> - Underlines countdown text

Multiple formatting options can be combined (e.g., bold + italic).

### 2. Time Format Selection
Users can choose between two time formats:
- **Text Format**: `13m 9s` (minutes and seconds with labels)
- **Numeric Format**: `13:09` (colon-separated format)

For longer countdowns:
- Text format shows: `2h 13m 9s` or `1d 5h 30m`
- Numeric format shows: `02:13:09` (HH:MM:SS)

## Files Modified

### Frontend
1. **app/(dashboard)/customization/announcement/page.tsx**
   - Added 4 new state properties: `countdownBold`, `countdownItalic`, `countdownUnderline`, `countdownTimeFormat`
   - Added UI checkboxes for formatting options
   - Added UI buttons for time format selection
   - Both sections only visible when countdown is enabled

2. **app/(dashboard)/customization/components/CartPreview.tsx**
   - Updated TypeScript interface to include new properties
   - Modified `formatCountdown()` to support both text and numeric formats
   - Updated countdown useEffect to pass timeFormat parameter
   - Modified `renderAnnouncementText()` to apply formatting styles using React inline styles

### Backend
3. **app/api/announcement/route.ts**
   - Added GET endpoint mapping for 4 new database columns
   - Added POST endpoint handling for saving the new settings
   - Database column names:
     - `announcement_countdown_bold`
     - `announcement_countdown_italic`
     - `announcement_countdown_underline`
     - `announcement_countdown_time_format`

### Public Script
4. **public/cart.js**
   - Updated `formatCountdown()` to accept and handle timeFormat parameter
   - Modified `formatAnnouncementText()` to use timeFormat
   - Updated `updateCountdown()` to:
     - Use timeFormat for both fixed and fresh countdown types
     - Apply formatting styles (bold, italic, underline) using inline HTML
     - Use `innerHTML` instead of `textContent` to render formatted countdown
   - Updated `applyStaticSettings()` to apply formatting on initial render

### Database
5. **supabase/migrations/add_announcement_countdown_formatting.sql**
   - Added 4 new columns to settings table:
     - `announcement_countdown_bold` (BOOLEAN, default false)
     - `announcement_countdown_italic` (BOOLEAN, default false)
     - `announcement_countdown_underline` (BOOLEAN, default false)
     - `announcement_countdown_time_format` (TEXT, default 'text')

## Usage

1. Navigate to **Customization → Announcement** in the dashboard
2. Enable announcement and countdown
3. Add `{{ countdown }}` placeholder to announcement text
4. Choose countdown type (Fixed Date or Fresh Timer)
5. Select time format (13m 9s or 13:09)
6. Check any combination of Bold, Italic, or Underline
7. Save changes

The countdown will display in the selected format with the chosen styling in both the cart preview and the actual cart.

## Implementation Details

### Formatting Logic
The formatting is applied by:
1. Detecting the countdown value in the text
2. Wrapping it in a `<span>` tag with inline CSS styles
3. Rendering using `innerHTML` (in cart.js) or React elements (in CartPreview)

### Time Format Logic
- **Text format**: Uses text labels (m, s, h, d) after numbers
- **Numeric format**: Uses colon separators with zero-padding (e.g., 09:05)
- Format is consistent across both fixed and fresh countdown types

### Security Note
Since we're using `innerHTML` in cart.js, the countdown value is always generated programmatically from numbers, preventing any XSS vulnerabilities. The announcement text itself doesn't support HTML to maintain security.

## Testing Checklist
- [x] Formatting checkboxes appear when countdown is enabled
- [x] Time format buttons work correctly
- [x] Settings save to database
- [x] Preview shows formatted countdown correctly
- [x] Actual cart displays formatted countdown
- [x] Both text and numeric formats work
- [x] Multiple formatting options can be combined
- [x] Works with both fixed and fresh countdown types
- [x] Formatting persists after page reload

