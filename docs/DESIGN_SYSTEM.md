# Design System

## Principles
- Mobile-first, Thai-language UI, minimum 44px interactive targets.
- Light/dark themes are implemented through CSS custom properties.
- Use semantic tokens; feature components must not hardcode colors, spacing, or radii.
- Financial amounts use tabular numerals and will be rendered through the shared AmountText pattern.

## Initial tokens
- Brand: purple (#7166DC), soft brand surface (#EEECFF)
- Income: green (#22A879); expense: red (#E56C78)
- Neutral: cool gray canvas and white surface
- Spacing: 4px base unit
- Card radius: 22px; control radius: 14px
- Motion: short entrance transition; respect prefers-reduced-motion

## Typography
IBM Plex Sans Thai with Noto Sans Thai and sans-serif fallbacks.

## Components
The first milestone establishes the application shell and navigation. Shared primitives and patterns will be added as features require them, with default, focus, disabled, loading, error and empty states documented alongside each component.
