Netlify deployment notes

1) Build settings
- Build command: `npm run build`
- Publish directory: `dist`

2) Functions
- The project includes a Netlify Function at `netlify/functions/proxyWebhook.js` which forwards requests to your n8n webhook. The build config in `netlify.toml` sets `functions = "netlify/functions"`.

3) Environment variables (set these in Netlify Site > Settings > Build & deploy > Environment)
- `N8N_WEBHOOK_URL` = your public ngrok URL (e.g. `https://abcd1234.ngrok.io/webhook/...`) — used by the serverless function to call n8n.
 - Optional: `VITE_N8N_PROXY_URL` = override path to the proxy function (defaults to `/api/proxyWebhook`).

4) How the app avoids CORS
- In production the frontend calls the Netlify Function path (same-origin). The function runs server-side and forwards the request to your ngrok URL; the browser never calls ngrok directly so CORS is not triggered.

5) Quick deploy steps
- Push this repo to a Git host (GitHub, GitLab, Bitbucket).
- Connect the repo to Netlify (New site > Import from Git).
- In Site settings add `N8N_WEBHOOK_URL` (and `VITE_N8N_PROXY_URL` if desired).
- Deploy the site.

6) Local development
- The `.env` file contains `VITE_N8N_WEBHOOK_URL=/api/webhook/chat` which works with the Vite dev proxy in `vite.config.js` (routes starting with `/api` are forwarded to your local n8n or ngrok address while developing).
