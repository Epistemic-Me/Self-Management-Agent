# Epistemic Me Theme Guide

This theme has been updated to match the [Epistemic Me brand](https://epistemicme.ai/) colors and aesthetic.

## Brand Colors

### Primary Brand Color
- **Epistemic Cyan**: `174 100% 50%` - The signature cyan color used throughout the brand
- **Primary**: Uses the epistemic cyan for buttons, links, and key interactive elements

### Extended Brand Palette
- **Epistemic Cyan Dark**: `174 80% 35%` - Darker shade for hover states and depth
- **Epistemic Cyan Light**: `174 60% 70%` - Lighter shade for subtle accents
- **Epistemic Background**: `216 19% 8%` - Deep dark background matching the website
- **Epistemic Surface**: `216 19% 12%` - Elevated surface color for cards and panels

## Usage in Components

### CSS Custom Properties
All colors are available as CSS custom properties in `globals.css`:
```css
--epistemic-cyan: 174 100% 50%;
--epistemic-cyan-dark: 174 80% 35%;
--epistemic-cyan-light: 174 60% 70%;
--epistemic-background: 216 19% 8%;
--epistemic-surface: 216 19% 12%;
```

### Tailwind Classes
Use the custom Tailwind classes for brand colors:
```javascript
// Text colors
text-epistemic-cyan
text-epistemic-cyan-dark
text-epistemic-cyan-light

// Background colors
bg-epistemic-cyan
bg-epistemic-background
bg-epistemic-surface

// Border colors
border-epistemic-cyan
border-epistemic-cyan/20  // With opacity
```

### Gradients
Brand gradients are used for:
- Logo/brand elements: `from-primary to-epistemic-cyan`
- User message bubbles: `from-primary to-epistemic-cyan`
- Interactive elements: `from-epistemic-cyan to-epistemic-cyan-dark`

## Theme Features

### Dark Mode Default
The application defaults to dark mode (`className="dark"` on html element) to match the Epistemic Me website aesthetic.

### Key Brand Elements
1. **Logo**: Circular gradient background with "E" initial
2. **Chat Bubbles**: User messages use brand gradient, assistant messages have subtle cyan borders
3. **Navigation**: Active states use primary brand color
4. **Headers**: Gradient backgrounds incorporating brand colors
5. **Badges/Tags**: Subtle cyan background with brand color text

## Examples

### Brand Logo Component
```tsx
<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-epistemic-cyan flex items-center justify-center">
  <span className="text-primary-foreground font-bold text-sm">E</span>
</div>
```

### Brand Badge
```tsx
<span className="px-3 py-1 text-xs bg-epistemic-cyan/10 text-epistemic-cyan rounded-full border border-epistemic-cyan/20">
  Belief Modeling
</span>
```

### Gradient Button
```tsx
<Button className="bg-gradient-to-r from-primary to-epistemic-cyan">
  Get Started
</Button>
```

## Development Notes

- All semantic color tokens (primary, secondary, accent, etc.) have been updated to work harmoniously with the brand colors
- The theme maintains accessibility standards while showcasing the distinctive Epistemic Me visual identity
- Components automatically adapt between light and dark modes, though dark mode is the primary experience 