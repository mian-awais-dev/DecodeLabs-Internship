# DecodeLabs Project 1 - Responsive Frontend Interface

> **Batch:** 2026 | **Level:** Intermediate | **Platform:** Antigravity AI Code Generation  
> **Standard:** Pure HTML5 • CSS3 (Grid + Flexbox) • Vanilla JavaScript (ES6+) • Zero Frameworks

---

## 🌟 Project Overview

**DecodeLabs Project 1** is a high-performance, portfolio-ready web application frontend engineered with pure modern web standards. It demonstrates mastery of mobile-first responsive architecture, semantic HTML5 structure, modular CSS3 layouts (Grid & Flexbox), and accessible vanilla JavaScript interactions without third-party frameworks or runtime dependencies (no Bootstrap, Tailwind, React, Vue, or jQuery).

---

## 🎨 2025 Aesthetic Design System

### Color Palette
- **Primary:** `#A6856F` (*Mocha Mousse*) — Grounding, architectural warmth & stability
- **Secondary:** `#A0D4E0` (*Ethereal Blue*) — Technical clarity, trust & precision
- **Accent:** `#F2F0EA` (*Moonlit Grey*) — Neutral refinement & visual balance
- **Dark Text:** `#2C2C2C` — High-contrast readability (passes WCAG AAA &gt; 12.5:1)
- **Light Background:** `#F9F8F6` / `#FFFFFF` — Clean, modern canvas
- **Border Color:** `#E0DDD8` — Crisp component division

### Typography Stack
- **Headlines:** `Montserrat` (700 Bold / 800 ExtraBold), Fallback: `sans-serif`
  - Line Height: `1.2`
  - Letter Spacing: `0.5px`
- **Body Text:** `Roboto` (400 Regular / 500 Medium), Fallback: `sans-serif`
  - Line Height: `1.6`
- **Constraint:** Strictly limited to 2 font families and 3 weights total.

### 8px Spacing Grid System
- `xs`: `4px` (micro gaps & badge padding)
- `sm`: `8px` (small gaps & compact margins)
- `md`: `16px` (standard card padding & rhythm)
- `lg`: `24px` (component spacing & grid gaps)
- `xl`: `32px` (section gaps & layout margins)
- `xxl`: `48px` (major section separations)
- `3xl` / `4xl`: `64px` / `80px` (hero & macro block padding)

---

## 📱 Responsive Breakpoints & Strategy

Engineered with a **mobile-first progressive enhancement** approach:
- **Mobile:** `320px - 767px` (Default layout, full-screen animated hamburger drawer, single-column cards, touch targets $\ge 44 \times 44\text{px}$)
- **Tablet:** `768px - 1023px` (Horizontal inline navigation, 2-column service & portfolio grids, 2-column footer)
- **Desktop:** `1024px - 1439px` (4-column service grid, sticky architectural sidebar, 4-column footer)
- **Extra Large:** `1440px and above` (Max-width container containment, balanced padding)

---

## 📁 Project Architecture & File Hierarchy

```
Full_Stack_project_1/
├── index.html                 # Semantic HTML5 document
├── css/
│   ├── reset.css              # Modern CSS reset, normalizer & reduced motion rules
│   ├── variables.css          # Design tokens (colors, 8px grid, typography, shadows)
│   ├── style.css              # Base typography, skip-links, focus-visible outlines
│   ├── layout.css             # Header, hero, CSS Grid systems, sidebar, footer
│   ├── components.css         # Buttons, cards, form inputs, badges, alerts
│   └── responsive.css         # Media queries for 768px, 1024px, and 1440px
├── js/
│   ├── utils.js               # Debounce/throttle, RFC email validator, DOM & focus helpers
│   ├── navigation.js          # Hamburger animation, outside click, ESC key, ScrollSpy
│   ├── form-validation.js     # Accessible real-time validation, ARIA states, form reset
│   └── main.js                # App init, smooth scroll offset, animated counters
├── images/
│   ├── logo.svg               # Vector brand logo with Mocha & Ethereal accents
│   ├── hero/
│   │   └── hero-illustration.svg # Responsive multi-device graphic illustration
│   ├── icons/
│   │   ├── icon-code.svg      # UI & engineering icons
│   │   ├── icon-design.svg
│   │   ├── icon-mobile.svg
│   │   ├── icon-speed.svg
│   │   ├── icon-shield.svg
│   │   ├── icon-cloud.svg
│   │   ├── icon-email.svg
│   │   ├── icon-phone.svg
│   │   └── icon-location.svg
│   └── content/
│       ├── project-1.svg      # Analytics dashboard mockup
│       ├── project-2.svg      # E-commerce platform mockup
│       ├── project-3.svg      # AI workflow automator mockup
│       ├── project-4.svg      # Design system UI kit mockup
│       └── about-team.svg     # Engineering architecture illustration
├── README.md                  # Comprehensive project documentation
└── .gitignore                 # Standard web ignore rules
```

---

## ⚡ Core Features & Implementation Details

1. **Responsive Navigation & Mobile Drawer:**
   - Smooth 3-bar hamburger icon morphing into an 'X'.
   - Keyboard accessible: Trap focus within drawer when open, press `Escape` to close.
   - Click outside to dismiss.
   - Auto-closes upon selecting an anchor destination.
2. **IntersectionObserver ScrollSpy:**
   - Dynamically highlights active navigation links as sections enter viewport.
3. **Smooth Scroll with Header Offset:**
   - Overcomes fixed/sticky header overlaps by calculating exact header offset dynamically.
4. **Accessible Contact Form with Real-Time Feedback:**
   - Native HTML5 validation complemented by client-side JS regex.
   - Real-time `blur` and `input` events clear errors as users type.
   - Accessible ARIA attributes (`aria-invalid="true/false"` and `aria-describedby` error bindings).
   - Async loading state on submit button and automatic form reset with success banner.
5. **Interactive Cards & Micro-interactions:**
   - 300ms ease transitions on button hover, elevation lift, and border glows.
   - Touch targets designed to exceed $44 \times 44\text{px}$.
6. **Animated Performance Metric Counters:**
   - Cubic ease-out calculation triggering once when the hero section scrolls into view.
7. **Collapsible Architecture Sidebar:**
   - Toggles on mobile and collapses gracefully; fixed/sticky on desktop viewports.

---

## ♿ Accessibility Checklist (WCAG AA Compliant)

- [x] **Semantic HTML5:** `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`.
- [x] **Skip Navigation Link:** First focusable element allows bypassing repeated navigation.
- [x] **Focus Visible:** Distinct, high-contrast 3px outline indicators (`:focus-visible`).
- [x] **Color Contrast:** All text meets or exceeds WCAG AA $4.5:1$ contrast ratio.
- [x] **Keyboard Navigable:** Tab order follows logical DOM structure; menus close with `Escape`.
- [x] **ARIA Roles & Descriptions:** Dynamic `aria-expanded`, `aria-controls`, `aria-describedby`, and `aria-invalid`.
- [x] **Touch Targets:** All buttons, links, and form fields $\ge 44\text{px}$ minimum height.
- [x] **Reduced Motion Support:** Respects `prefers-reduced-motion: reduce` system preference.

---

## 🚀 How to Run Locally

Because this project uses 100% pure standard web technologies, no build step or package installation is required:

### Option 1: Direct File Opening
Simply open `index.html` in any modern web browser (Google Chrome, Mozilla Firefox, Microsoft Edge, or Apple Safari).

### Option 2: Local HTTP Server (Recommended)
Using Python (pre-installed on most systems):
```bash
# Python 3
python -m http.server 8000
```
Or using Node.js:
```bash
npx serve .
```
Then visit: `http://localhost:8000`

---

## 📬 DecodeLabs Contact Information

- **Organization:** DecodeLabs
- **Email:** [decodelabs.tech@gmail.com](mailto:decodelabs.tech@gmail.com)
- **Phone:** [+91 89330 06408](tel:+918933006408)
- **Portal:** [www.decodelabs.tech](https://www.decodelabs.tech)
- **Location:** Greater Lucknow, India

---

&copy; 2026 DecodeLabs. Licensed under MIT.
