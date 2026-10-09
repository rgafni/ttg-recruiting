# TTG Recruiting (front end)

Phone-first recruiting app for Together They Grow. **Code only.** No data, names or tokens live in this repo.

- Real mode: open the personal link (`?k=…`). The token is saved on the device and removed from the address bar. Every call goes to a private Apps Script API that is bound to a private Google Sheet.
- Demo: `?demo=1` uses made-up data that stays in this browser only.
- Nothing here sends email, texts or calls. It prepares text you post or send yourself, or it queues a request the assistant turns into a **Gmail draft**. Calls wait for explicit approval.
- Applicants are shown as facts and must-have checklists, never as a score (NYC Local Law 144).
