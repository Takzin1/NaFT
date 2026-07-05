# GitHub Copilot Instructions — NaFT

This repository is a **legal-review-pending PoC** of a citizen-participation GX (green transformation) protocol. It is a single-file vanilla-JS SPA (`naft-app.html`) with zero runtime dependencies and zero network calls.

## Hard rules (never violate)

- Never add real payment, remittance, cash-out, or token-exchange features, or any payment/exchange SDK.
- Never add buying/selling/retiring of real carbon credits. "購入予約" stays a non-binding intent record.
- Never make points or tickets redeemable for money or transferable between users.
- Never remove or weaken the `DISCLAIMER` constant or its display (footer, LP, register page).
- Never automate approval decisions. `reviewAction()` must only be triggered by explicit human UI action (see docs/human-in-the-loop.md).
- Never add external API calls, analytics, or secrets (API keys, private keys, tokens). The only allowed external resource is the existing qrcodejs CDN script.
- Avoid financial-benefit wording in ja/en copy: 儲かる, 利回り, 投資, 換金, guaranteed returns, etc.

## Code conventions

- Vanilla JS, `var` + `function` declarations, string-concatenated HTML templates. No build step, no ES modules, no frameworks, no TypeScript in `naft-app.html`.
- Page functions `pg*()` return HTML strings and must stay side-effect free. Mutations live in use-case functions (`exec*`, `save*`, `do*`, `reviewAction`).
- Escape all user-derived values with `esc()` before embedding into HTML. Only alphanumeric IDs may be interpolated into `onclick` attributes.
- Every balance/points/ticket mutation must go through `addTx()`; every admin/review action must call `audit()`; persist with `await saveDB()`.
- Adding a route = branch in `route()` + nav link in the role's `*Shell()` + a `pg*()` function.
- Do not use localStorage/sessionStorage/IndexedDB. Persistence goes through the `store` adapter (window.storage with in-memory fallback).

## Verification for every change

```bash
bash tests/run.sh   # extracts JS, runs node --check, then 46 smoke assertions — all must pass
```

Add at least one assertion in `tests/smoke.test.js` for any new feature. See AGENTS.md and .github/ISSUES_BACKLOG.md for tasks.
