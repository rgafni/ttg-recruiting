# TTG Recruiting (front end)

Phone-first recruiting app for Together They Grow. **Code only.** No data, names or tokens live in this repo.

- **Real mode:** open the personal link (`#k=…`). The token is saved on the device and removed from the address bar. A URL fragment is never sent to the server. Every call goes to a private Apps Script API that is bound to a private Google Sheet.
- **Demo:** `?demo=1` uses made-up data that stays in this browser only.
- **Installable PWA:** manifest, icons, and a service worker that caches the app shell only. API traffic is never cached.
- **Strict CSP:** self plus the Apps Script API origins only. No third-party scripts or fonts (Manrope is self-hosted under the OFL, see `fonts/OFL.txt`). Referrer policy: no-referrer.
- **Nothing sends by itself:** the app prepares text you post or send yourself, or it queues a request that becomes a Gmail **draft**.
- **Facts, not scores:** applicants are shown as facts and must-have checklists, never as a score (NYC Local Law 144).
