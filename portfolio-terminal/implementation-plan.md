# Fallout Portfolio Terminal — Implementation Plan

**TL;DR:** Rebuild the Angular `portfolio-terminal` to look, sound, and behave exactly like the Fallout Terminal Hacking game — same monitor images, power button, sounds, hover effects, and typewriter animations — but replace the word-hacking game with a portfolio. A single `Terminal` component drives everything via an internal state machine. A minimal Express API serves portfolio JSON from disk.

---

## Phase 1 — Assets & Backend

**Step 1.** Copy static assets from `Fallout.Terminal-Hacking/robco-industries/` into `public/`:
- `img/` → `bg.png`, `bg-off.png`, `monitorborder.png`, `monitorborder-off.png`
- `sound/` → `k1–k10.ogg`, `kenter.ogg`, `poweron.ogg`, `poweroff.ogg`, `passgood.ogg`, `passbad.ogg`

**Step 2.** Create `src/data/portfolio.json` with the full data shape:
```json
{
  "aboutMe": { "photo": "/img/photo.jpg", "description": "..." },
  "studies": [{"title": "...", "startYear": 2020, "endYear": null, "place": "...", "website": "..." }],
  "projects": [{ "name": "...", "description": "...", "github": "..." }],
  "languages": [{ "name": "TypeScript", "description": "...", "projects": ["..."], "proficiency": "Advanced" }],
  "contact": { "email": "...", "linkedin": "...", "github": "...", "phone": "..." },
  "cvUrl": "https://..."
}
```

**Step 3.** Modify `src/server.ts` — add two API routes:
- `GET /api/portfolio` — reads and returns `portfolio.json`
- `POST /api/contact` — validates input (name, email, phone, message) and appends to `src/data/messages.json`

**Step 4.** Create `src/app/models/portfolio.model.ts` — TypeScript interfaces for all portfolio data.

**Step 5.** Create `src/app/services/portfolio.service.ts` — `HttpClient`-based service with `getPortfolio()` and `sendMessage()`.

**Step 6.** Fix `src/app/app.routes.server.ts` — change `renderMode` from `Prerender` to `Server` to avoid SSR crashes on browser-only APIs (Audio, mouse events). Add `provideHttpClient()` to `app.config.ts`.

---

## Phase 2 — Visual Shell *(depends on Phase 1)*

**Step 7.** Rewrite `terminal.css` — replicate Fallout CSS:
- `#terminal`: 750×460px, absolutely positioned inside bezel, `bg.png` background, `#33dd88` green monospace bold text
- `#terminal-background`: 930×700px monitor bezel image, centered
- `.character-hover`: `background: #33dd88; color: #112211` (green highlight on hover)
- `#powerbutton`: absolutely positioned over the physical button area in the monitor image
- Optional CRT scan-line overlay via `::before` pseudo-element

**Step 8.** Rewrite `terminal.html` — static shell:
- `<div id="terminal-background">` with monitor bezel + off-state overlay image
- `<div id="terminal">` driven by state machine Angular `@switch` blocks
- `<div id="powerbutton">` with `(click)="togglePower()"`
- All `<audio>` elements (poweron, poweroff, kenter, k1–k10, passgood, passbad)

---

## Phase 3 — State Machine *(depends on Phase 2)*

**Step 9.** Rewrite `terminal.ts` — core state machine + shared helpers:
- State signal: `'off' | 'booting' | 'vault-logo' | 'main-menu' | 'about' | 'studies' | 'projects' | 'languages' | 'contact-options' | 'contact-message' | 'downloading'`
- `togglePower()` — plays poweron/poweroff audio, triggers boot sequence → Vault-Tec logo → main menu
- `typewrite(text, speed)` — shared typewriter helper using `interval()`
- `playKeystroke()` — random k1–k10 on hover
- `navigateTo(screen)` — plays kenter, updates state
- Portfolio data loaded on init with `isPlatformBrowser` guard for SSR

**Step 10.** Main menu template section — 6 options with Fallout-style `>` prefix, hover highlights, and keystroke sounds:
```
ROBCO INDUSTRIES TERMALINK
VALENTINO CENICEROS — PORTFOLIO

> ABOUT ME
> STUDIES
> PROJECTS
> LANGUAGES
> CONTACT ME
> DOWNLOAD CV
```

---

## Phase 4 — Portfolio Sections *(depends on Phase 3)*

**Step 11.** About Me — photo + typewriter description + `[ GO BACK ]`

**Step 12.** Studies — list with `[year - year/Currently]`, place name, `> VISIT WEBSITE` links + `[ GO BACK ]`

**Step 13.** Projects — list with name, description, `[ GITHUB ]` link + `[ GO BACK ]`

**Step 14.** Languages — list with name, `[PROFICIENCY]` badge, description, related project links + `[ GO BACK ]`

> Steps 11–14 can be implemented in parallel.

---

## Phase 5 — Contact & CV *(depends on Phase 3)*

**Step 15.** Contact options sub-menu:
```
> SEND A MESSAGE
> OTHER CONTACT METHODS
> [ GO BACK ]
```

**Step 16.** Other contact methods — shows email, LinkedIn, GitHub, phone as formatted lines + `[ GO BACK ]`

**Step 17.** Sequential message input — one input prompt at a time typed in terminal style:
```
> ENTER YOUR NAME: █
```
Advances on Enter through: name → email → phone → message → POST to `/api/contact` → "MESSAGE SENT" → auto-return to main menu after 2s.

**Step 18.** CV Download — "ACCESSING FILE..." typewriter → `window.open(cvUrl)` → auto-back to main menu.

**Step 19.** Email delivery via **nodemailer** — install `nodemailer` + `@types/nodemailer` and wire it into `src/server.ts` (server-only, never runs in the browser):
- Transport configured entirely from environment variables — no hardcoded credentials:
  ```
  MAIL_HOST=smtp.example.com
  MAIL_PORT=587
  MAIL_USER=your@email.com
  MAIL_PASS=yourpassword
  MAIL_TO=your@email.com
  ```
- `.env` file at project root (added to `.gitignore`); loaded via `dotenv` at server startup.
- `POST /api/contact` saves to `messages.json` **and** sends an email with the submitted name, email, phone, and message.
- If `MAIL_HOST` is not set, the email step is silently skipped — the endpoint still works with JSON-only storage.
- A `.env.example` file with placeholder values is committed to the repo so setup is self-documenting.
- Compatible with any standard SMTP provider: Gmail (App Password), Outlook, Resend SMTP, Mailgun SMTP, etc.

---

## Phase 6 — Polish *(depends on Phases 4–5)*

**Step 19.** `(mouseenter)` on every menu item plays a random k1–k10 keystroke sound.

**Step 20.** Decorative hex pointer columns (`0xABCD`) on the main menu screen, mirroring the Fallout layout.

**Step 21.** Optional CRT scan-line effect via CSS `::before` pseudo-element.

---

## Relevant Files

| File | Action |
|---|---|
| `src/app/components/components/terminal/terminal.ts` | Full rewrite — state machine |
| `src/app/components/components/terminal/terminal.html` | Full rewrite — shell + all views |
| `src/app/components/components/terminal/terminal.css` | Full rewrite — Fallout styles |
| `src/app/app.config.ts` | Add `provideHttpClient()` |
| `src/app/app.routes.server.ts` | Change to `Server` render mode |
| `src/server.ts` | Add `/api/portfolio` + `/api/contact` routes |
| `src/data/portfolio.json` | NEW — all portfolio data |
| `src/app/models/portfolio.model.ts` | NEW — TypeScript interfaces |
| `src/app/services/portfolio.service.ts` | NEW — HTTP service |
| `public/img/`, `public/sound/` | Copy from Fallout repo |
| `src/server.ts` | Add nodemailer transport + `dotenv` loading |
| `.env` | NEW — SMTP credentials (gitignored) |
| `.env.example` | NEW — placeholder template committed to repo |

---

## Verification Checklist

- [ ] `npm start` → dark monitor with power button visible
- [ ] Click power button → `poweron.ogg` plays, monitor lights up, Vault-Tec logo types out
- [ ] Main menu: hover plays keystroke + highlights option, click navigates
- [ ] All 6 sections render correctly with `[ GO BACK ]`
- [ ] Contact → Send a Message → sequential inputs → POST `/api/contact` → confirmation message
- [ ] Download CV → file download triggered from external URL
- [ ] `GET /api/portfolio` returns portfolio JSON
- [ ] `POST /api/contact` saves message to `messages.json` and sends email
- [ ] Email silently skipped (no crash) when `MAIL_HOST` env var is absent
- [ ] Power off → `poweroff.ogg` plays, monitor goes dark

---

## Key Decisions

- **Single component, state machine** — no routing between sections (matches the game's feel)
- **Data in JSON files** — no database; Express reads/writes JSON directly
- **Contact form** — saves to JSON **and** sends email via nodemailer; email is opt-in through `.env` (skipped gracefully if unconfigured)
- **Fixed 930×700px layout** — matches the game exactly; no mobile support planned
- **SSR render mode `Server`** — required to avoid crashes from browser-only APIs at prerender time

---

## Open Questions

1. **Your own photo/info** — `portfolio.json` will be created with placeholder data; you'll need to fill in your real info (photo, description, studies, etc.) before or after implementation.
2. **CV URL** — do you have an external URL for your CV already, or should it point to a file served from `public/`?
3. **SMTP provider** — nodemailer is wired up and ready; you just need to fill in `.env`. Compatible providers: Gmail (requires App Password), Outlook, Resend SMTP, Mailgun SMTP, or any standard SMTP relay.
