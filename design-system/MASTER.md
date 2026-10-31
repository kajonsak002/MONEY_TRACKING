# MoneyMate Design System

Derived using UI UX Pro Max guidance for a personal finance tracker (fintech / personal finance).

## Product direction
- Pattern: financial dashboard with clear balance-first hierarchy and drill-down pages.
- Style: Soft UI Evolution + restrained Organic Biophilic details; playful mascot accents, not mascot-heavy controls.
- Audience/context: personal and household finance, primarily mobile, occasional desktop admin.
- Stack: React + TypeScript + Vite; CSS design tokens; Lucide icons.

## Tokens
- Canvas: #F5F8F2
- Surface: #FFFFFF
- Primary ink: #293B35
- Muted text: #5F7467 (AA-safe for normal body text on white)
- Sage primary: #5B9279; action/deep: #3F765F; soft: #E9F3E9
- Income text: #1D7C54; expense text: #B33E50; soft surfaces: #E6F7EF / #FFF0F2
- Pig accent: soft rose; frog accent: sage green; gold details: #D6A84E
- Border: #E4ECE3
- Cards: 22–30px radius; controls: 13–18px radius
- Shadows: low-opacity sage shadows; avoid heavy elevation
- Typography: IBM Plex Sans Thai; body 14–16px, line-height 1.5–1.7; clear tabular numerals for money.

## Layout rules
- Mobile first: 320/375/390/414px, tablet 768px, desktop 1024/1440px.
- 16–24px mobile page gutters, 24–42px desktop gutters.
- Tap targets >=44px; 8px minimum spacing between adjacent controls.
- Balance first, then income/expense, quick add, recent activity.
- Every page shares header, typography, card surfaces, form controls, badges, and spacing.
- Bottom navigation <=5 items, safe-area aware.
- Admin keeps distinct navigation hierarchy but shares brand colors, mascot assets, and surface language.

## UX/accessibility
- Contrast target >=4.5:1 for body text and button labels; use deep sage for filled actions and darkened semantic text colors; visible 2–4px keyboard focus ring.
- Labels remain visible; errors shown beside the affected field.
- Async buttons show progress and disable while pending.
- Use Lucide SVG icons, not emoji as UI icons.
- Respect prefers-reduced-motion; no hover-only actions.
- Decorative pig/frog images are aria-hidden and must not cover monetary values.
- Reserve image dimensions to avoid layout shift; use lazy loading for below-fold mascots.

## Anti-patterns to avoid
- Applying one-off CSS to only the home card while leaving other routes unchanged.
- Narrow mobile-width app shell on desktop.
- Low-contrast tiny helper text.
- Mascots overlapping amounts, inputs, or buttons.
- Inconsistent page heading/card/form styles between routes.
- Dense admin blue theme that visually disconnects from the MoneyMate brand.

## Pre-delivery checklist
- [ ] Home, Entries, Summary, Budget, Categories, Settings share one coherent design.
- [ ] Admin overview, users, transactions, activity, settings share brand language.
- [ ] Test 320, 375, 390, 414, 768, 1024, 1440 widths.
- [ ] No horizontal overflow; no overlapping mascot art.
- [ ] Keyboard focus visible; labels and errors accessible.
- [ ] Buttons >=44px and loading states preserved.
- [ ] Reduced motion respected.
- [ ] CI typecheck, lint, tests, production build pass.
- [ ] Cloudflare production deployment completes before claiming release.
