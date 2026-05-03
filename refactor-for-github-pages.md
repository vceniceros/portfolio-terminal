# Refactor for GitHub Pages

**TL;DR:** Strip the Angular SSR/Express layer entirely, switch to a pure CSR static build, load portfolio data from a bundled JSON asset, replace the nodemailer contact endpoint with a direct Formspree POST, and wire up a GitHub Actions workflow for automated deployment to `https://vceniceros.github.io/portfolio-terminal/`.

---

## Phase 1 — Remove SSR Infrastructure

1. **Delete** `src/server.ts`, `src/main.server.ts`, `src/app/app.config.server.ts`, `src/app/app.routes.server.ts` — entire Express + Angular Universal layer is gone
2. **Update `angular.json`** — remove the `"server"`, `"ssr"`, and `"outputMode"` keys from build options; static CSR build outputs only to `dist/portfolio-terminal/browser/`
3. **Update `src/app/app.config.ts`** — remove `provideClientHydration(withEventReplay())` and its import (hydration is SSR-only); keep `provideHttpClient()`, add `withFetch()` for better static compatibility
4. **Update `tsconfig.app.json`** — remove `"types": ["node"]` (no more Node.js APIs)
5. **Update `package.json`** — remove `express`, `nodemailer`, `dotenv`, `@angular/platform-server`, `@angular/ssr` from `dependencies`; remove `@types/express`, `@types/nodemailer` from `devDependencies`; remove the `serve:ssr:portfolio-terminal` script

---

## Phase 2 — Static Data Loading

6. **Move** `src/data/portfolio.json` → `public/data/portfolio.json` so Angular's build pipeline copies it verbatim into the output root *(parallel with step 7)*
7. **Update `portfolio.json`** — change `aboutMe.photo` from `/img/foto-portafolio.jpeg` → `img/foto-portafolio.jpeg` (relative, no leading slash) *(parallel with step 6)*
8. **Update `portfolio.service.ts` `getPortfolio()`** — change URL from `/api/portfolio` to `data/portfolio.json` (relative, no leading slash; XHR resolves relative to the current document URL, so it correctly hits `/portfolio-terminal/data/portfolio.json`)
9. **Update `terminal.html`** — change all static asset paths from absolute to relative: `src="/img/..."` → `src="img/..."` and `src="/sound/..."` → `src="sound/..."`. This is critical because absolute paths ignore `<base href>` and would 404 under a sub-path deployment

---

## Phase 3 — Formspree Integration

10. **Update `portfolio.service.ts` `sendMessage()`** — replace `this.http.post('/api/contact', payload)` with a POST to `https://formspree.io/f/xeenekpw` with `headers: { Accept: 'application/json' }`
11. **Update `portfolio.model.ts` `ContactMessageResponse`** — Formspree returns `{ ok: boolean, next?: string }` on success and `{ errors: Array<{field, code, message}> }` on validation failure; update the interface accordingly. The terminal component's `next()`/`error()` handlers remain unchanged since they only check success/failure

---

## Phase 4 — GitHub Pages Deployment Setup

12. **Create `public/.nojekyll`** — empty file, prevents GitHub's Jekyll processor from mangling Angular's `_` prefixed files
13. **Create `.github/workflows/deploy.yml`** — workflow triggered on push to `main`:
    - Checkout → setup Node.js → `npm ci`
    - `ng build --base-href /portfolio-terminal/` (injects correct `<base href>` into the built `index.html`)
    - Copy `dist/.../browser/index.html` → `dist/.../browser/404.html` (GitHub Pages SPA fallback — catches any stale/bookmarked URLs)
    - Upload artifact via `actions/upload-pages-artifact`, deploy via `actions/deploy-pages`
    - Requires enabling GitHub Pages via **Settings → Pages → Source: GitHub Actions**

---

## Files changed

| File | Action |
|---|---|
| `src/server.ts` | Delete |
| `src/main.server.ts` | Delete |
| `src/app/app.config.server.ts` | Delete |
| `src/app/app.routes.server.ts` | Delete |
| `src/app/app.config.ts` | Remove hydration provider |
| `src/app/services/portfolio.service.ts` | Rewrite both methods |
| `src/app/models/portfolio.model.ts` | Update `ContactMessageResponse` |
| `src/app/components/components/terminal/terminal.html` | Relativize all `/img/`, `/sound/` paths |
| `angular.json` | Strip server build entries |
| `tsconfig.app.json` | Remove node types |
| `package.json` | Remove server dependencies |
| `src/data/portfolio.json` | Move to `public/data/portfolio.json` |
| `public/.nojekyll` | Create (empty) |
| `.github/workflows/deploy.yml` | Create |

---

## Verification

1. Run `ng build --base-href /portfolio-terminal/` locally — confirms build succeeds with no TypeScript errors
2. Serve the output with `npx serve -s dist/portfolio-terminal/browser` and verify portfolio data loads, audio plays, and the contact form submits to Formspree (check Formspree dashboard for the received submission)
3. Confirm no console 404 errors for assets under `/portfolio-terminal/`
4. After deployment: open `https://vceniceros.github.io/portfolio-terminal/` and perform a full smoke test (power on, all sections, send message, download CV)

---

## Further Considerations

- **Custom domain**: If you later point a custom domain (e.g., `ceniceros.dev`) at this GitHub Pages, change `--base-href /` in the workflow. Relative asset paths still work correctly at the root.
- **Formspree spam protection**: The free tier includes reCAPTCHA. You may also add a hidden `_gotcha` honeypot field inside the contact flow in `terminal.ts` for extra bot filtering.
- **`messages.json`**: No longer needed at runtime (Formspree handles delivery). The file can be kept in `src/data/` as a historical record but is excluded from the build.
