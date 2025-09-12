# Glassmorphism Effects Documentation

This document explains the glassmorphism implementation for modals in the CS2 Inspect web application.

## Overview

Glassmorphism is a design trend that creates a frosted glass effect using:
- Semi-transparent backgrounds
- Backdrop blur filters
- Subtle borders and shadows
- Layered depth perception

## Implementation

### Files Modified

1. **`server/utils/themeCustomization.ts`**
   - Updated modal theme overrides with glassmorphism properties
   - Added semi-transparent backgrounds and enhanced shadows

2. **`assets/css/glassmorphism.css`** (New)
   - Main glassmorphism styling implementation
   - Backdrop blur effects and transparency
   - Responsive and theme-aware adjustments

3. **`assets/css/theme-variables.css`**
   - Added CSS variables for glassmorphism effects
   - Support for both dark and light themes

4. **`nuxt.config.ts`**
   - Added glassmorphism.css to the CSS imports

### CSS Variables

The following CSS variables control the glassmorphism effects:

```css
/* Dark Theme */
--glass-bg-primary: rgba(16, 16, 16, 0.85);
--glass-bg-secondary: rgba(36, 36, 36, 0.8);
--glass-border: rgba(255, 255, 255, 0.1);
--glass-border-light: rgba(255, 255, 255, 0.08);
--glass-blur-strong: blur(20px);
--glass-blur-medium: blur(16px);
--glass-blur-light: blur(8px);
--glass-saturation: saturate(180%);

/* Light Theme */
--glass-bg-primary: rgba(255, 255, 255, 0.85);
--glass-bg-secondary: rgba(240, 240, 240, 0.8);
--glass-border: rgba(0, 0, 0, 0.1);
--glass-border-light: rgba(0, 0, 0, 0.08);
```

### Effects Applied

#### Main Modals (1200px width)
- Strong backdrop blur (20px) with saturation boost
- Semi-transparent background with 85% opacity
- Multi-layered shadows for depth
- Subtle border with inner highlight

#### Smaller Modals (600px-700px width)
- Medium backdrop blur (16px)
- Higher opacity background (90%)
- Lighter border effects
- Reduced shadow intensity

#### Skin/Sticker/Keychain Grid Cards
- **Preserves original rarity gradient backgrounds**
- **Maintains selection ring styling (ring-2 ring-[var(--selection-ring)])**
- Light backdrop blur (8px) for subtle glass effect
- Enhanced hover states with smooth animations
- Staggered fade-in animations for grid items
- Original border radius (12px) maintained

#### UI Elements
- **Input fields**: Glassmorphism applied to wrapper, preserving rounded design
- **Buttons**: Original colors preserved with added glass effects and shadows
- **Primary buttons**: Keep yellow theme color with enhanced glassmorphism
- **Pagination**: Glass effects with preserved functionality
- **Scrollbars**: Subtle transparency effects

### Browser Support

The glassmorphism effects use:
- `backdrop-filter` (modern browsers)
- `-webkit-backdrop-filter` (Safari/WebKit)
- Fallback styling for unsupported browsers

### Performance Considerations

- Backdrop filters can impact performance on lower-end devices
- Responsive adjustments reduce blur intensity on mobile
- CSS variables allow easy customization without performance impact

### Customization

To adjust the glassmorphism effects:

1. **Modify CSS variables** in `assets/css/theme-variables.css`
2. **Adjust blur intensity** by changing the `--glass-blur-*` values
3. **Change transparency** by modifying the alpha values in `--glass-bg-*`
4. **Update borders** by adjusting `--glass-border*` variables

### Examples

```css
/* Stronger glassmorphism */
--glass-blur-strong: blur(30px);
--glass-bg-primary: rgba(16, 16, 16, 0.7);

/* Lighter glassmorphism */
--glass-blur-strong: blur(15px);
--glass-bg-primary: rgba(16, 16, 16, 0.95);

/* Different color tint */
--glass-bg-primary: rgba(20, 20, 30, 0.85);
```

## Testing

The glassmorphism effects can be tested by:
1. Opening any modal (weapon skins, stickers, etc.)
2. Checking the backdrop blur and transparency
3. Verifying hover and selection states
4. Testing on different screen sizes
5. Switching between light/dark themes

## Troubleshooting

### Blur Effects Not Working
- Check browser support for `backdrop-filter`
- Ensure CSS is properly loaded
- Verify no conflicting styles

### Performance Issues
- Reduce blur intensity values
- Disable effects on mobile devices
- Use CSS `will-change` property sparingly

### Theme Issues
- Check CSS variable definitions
- Verify light/dark theme overrides
- Ensure proper cascade order

### Fixed Issues

#### Input Field Styling
- **Problem**: Glassmorphism was applied to inner input elements, causing square glass effects inside rounded containers
- **Solution**: Applied effects to wrapper elements (`.n-input`, `.n-input-wrapper`) to preserve rounded design

#### Button Colors
- **Problem**: Original button colors were overridden, making primary buttons lose their yellow theme
- **Solution**: Preserved original Naive UI color handling while adding glassmorphism effects via shadows and borders

#### Grid Card Selection
- **Problem**: Selection rings were not visible and rarity backgrounds were overridden
- **Solution**: Used `outline` instead of `box-shadow` for selection rings and preserved original gradient backgrounds

#### Grid Animations
- **Problem**: Page transitions were not smooth
- **Solution**: Added staggered `gridItemFadeIn` animations with proper delays for each grid item
