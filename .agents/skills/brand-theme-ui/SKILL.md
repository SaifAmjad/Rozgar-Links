---
name: brand-theme-ui
description: Use when designing or modifying navigation, footer, Tailwind theme, typography, responsive pages, brand components or accessibility.
---

# brand-theme-ui

## Procedure
1. Read README Design tokens and reproduce all exact hex values as CSS custom properties mapped to Tailwind theme.
2. Build shared layout components (`client/src/components/layout/{Navbar,Footer,PageContainer}.*`), accessible buttons, inputs, cards, badges and skeletons. Avoid one-off token shades.
3. Render supplied `client/public/logo.png` with a graceful text fallback; navy ROZGAR, green LINKS. Show English and Urdu tagline; Noto Nastaliq Urdu font with fallback.
4. Navbar links: Home, Jobs, Apply Now, FAQ/Contact; responsive accessible menu with correct aria-expanded/focus/escape behavior.
5. Footer must show independent-service disclaimer, licence placeholder, verified contact placeholder, legal links, fee/no-job-guarantee language.
6. Use responsive spacing, sensible 44px tap targets, semantic landmarks and heading hierarchy. Use soft shadows, rounded-xl and subtle gradients.
## Conventions
CSS tokens rather than duplicate literals; semantic HTML; WCAG AA contrast; visible keyboard focus; no clickable divs or icon-only controls without labels.
## Verification
- [ ] Header/footer work at 320px and desktop with keyboard only.
- [ ] Palette and words match brand spec; no dark/unreadable text.
- [ ] Automated and manual accessibility checks, reduced-motion support.
- [ ] All new pages show honest sample/legal labels.
