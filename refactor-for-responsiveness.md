# Refactor for Responsiveness (Android)

**TL;DR:** Use a JS-computed `--terminal-scale` CSS custom property to shrink the entire 930px monitor frame to fit any screen width. A new `#terminal-scaler` wrapper div collapses to the scaled height so the page layout stays correct. Everything — frame, screen, power button — scales as one unit.

---

## Phase 1 — JS Scale Engine

1. In `terminal.ts`, add a private `updateScale()` method that computes `Math.min(1, window.innerWidth / 930)` and writes it to `document.documentElement.style.setProperty('--terminal-scale', scale)` — guarded with `isPlatformBrowser()`
2. Call `updateScale()` inside `afterNextRender()` (existing init pattern) to run on first paint
3. Add `@HostListener('window:resize')` that calls `updateScale()` so it reacts to orientation changes

---

## Phase 2 — HTML Wrapper

4. Wrap the root `<div id="terminal-background">` in a new `<div id="terminal-scaler">` — no other structural changes to `terminal.html`

---

## Phase 3 — CSS Transform & Scaler

5. In `terminal.css`, add `:root { --terminal-scale: 1; }` at the top
6. Add `#terminal-scaler` rule:
   ```css
   #terminal-scaler {
     display: flex;
     justify-content: center;
     overflow: hidden;
     width: 100%;
     height: calc(700px * var(--terminal-scale));
   }
   ```
7. Add to `#terminal-background`:
   ```css
   transform: scale(var(--terminal-scale));
   transform-origin: top center;
   flex-shrink: 0;
   ```
   The flex parent centers it and the transform scales from the middle horizontally.
8. Enlarge `#powerbutton` tap area:
   ```css
   padding: 28px;
   box-sizing: content-box;
   ```
   At ~0.42× scale the tappable area is ≈46×45px, meeting the 44px touch target minimum.

---

## Phase 4 — Body Overflow Fix

9. In `styles.css`, change `overflow-x: auto` → `overflow-x: hidden` on `body` to prevent horizontal scrolling on mobile.

---

## Files changed

| File | Action |
|---|---|
| `src/app/components/components/terminal/terminal.ts` | Add `updateScale()`, `@HostListener('window:resize')`, call in `afterNextRender()` |
| `src/app/components/components/terminal/terminal.html` | Wrap root div in `<div id="terminal-scaler">` |
| `src/app/components/components/terminal/terminal.css` | Add `--terminal-scale` custom property, `#terminal-scaler` rule, transform on `#terminal-background`, power button padding |
| `src/css/styles.css` | Change `overflow-x: auto` → `overflow-x: hidden` on `body` |

---

## Verification

1. Run `ng serve`, open DevTools → Pixel 5 (393px) — confirm the full monitor fits without a horizontal scrollbar
2. Confirm power button is tappable via DevTools touch simulation
3. Resize browser from 930px down to 360px and verify no horizontal overflow at any width
4. Confirm desktop (≥930px) is unchanged (scale = 1)
5. Test power on/off and screen navigation at mobile size

---

## Further Considerations

- **Text readability:** At 360px the scale is ~0.39×, making 12pt font render at ~5pt CSS (~10–14pt physical on high-DPI). If content becomes too hard to read after testing, a follow-up step could add `font-size: calc(12pt / var(--terminal-scale))` inside `#terminal` to keep text at a fixed visual size.
- **Hover effects on touch:** `(mouseenter)` doesn't fire on Android. Navigation still works (tap fires click), but the green highlight on buttons won't appear. A follow-up can add `(touchstart)` listeners if desired.
