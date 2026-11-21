# Enable Google sign-in on Vercel and Render

## Update after merging the social-login work

The current login page uses the incoming redirect-based OAuth buttons for Google, GitHub, and LinkedIn. For that visible Google button, set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and an explicit `GOOGLE_CALLBACK_URL` on the Render API. When using the Vercel API proxy, the callback should be `https://YOUR-APP.vercel.app/api/v1/auth/callback/google`; register that exact URL under Google's Authorized redirect URIs. Keep `WEB_ORIGIN` equal to the frontend origin. The callback must return through the same host where sign-in started so the OAuth state cookie is available.

GitHub and LinkedIn use `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` / `GITHUB_CALLBACK_URL` and `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` / `LINKEDIN_CALLBACK_URL`, respectively, with callback paths `/api/v1/auth/callback/github` and `/api/v1/auth/callback/linkedin`. Provider secrets belong only on Render.

The earlier popup implementation and its tests remain in the repository, but its component is not mounted by the current login page. The no-client-secret instructions below describe that earlier popup implementation, not the current redirect buttons. Live provider sign-in still requires separate verification.

Google sign-in is implemented in this workspace. It is not live until these changes are pushed, both services deploy, and the following configuration is supplied. No OAuth client secret is needed for the implemented Google Identity Services popup/ID-token flow.

## 1. Create a Google OAuth client

Open https://console.cloud.google.com/ and create/select your project. Open Google Auth Platform (or APIs & Services → OAuth consent screen), then configure Branding and Audience. Use External if students outside your own Google Workspace must sign in. Fill in the app name and support/developer email. Add test users if the console offers testing mode.

Open Clients → Create client → Web application. Give it a name such as `HiPlacement Web`.

Under Authorized JavaScript origins, add each frontend origin you actually use, one entry per line. Replace the first line with your real production URL:

```text
https://YOUR-APP.vercel.app
http://localhost
http://localhost:5173
```

An origin has no path or trailing slash. Add your custom domain separately if used. Do not add `/login`, `/api/v1/auth/google`, or the Render API URL as the frontend origin. Leave Authorized redirect URIs empty for this popup callback implementation. Request only basic identity information; Gmail/Drive scopes are unnecessary.

Create the client and copy its Client ID, ending in `.apps.googleusercontent.com`.

## 2. Configure Render API

Render → your Express API service → Environment. Add/update the following values with your actual Client ID and production frontend origin:

```dotenv
GOOGLE_CLIENT_ID=YOUR-CLIENT-ID.apps.googleusercontent.com
WEB_ORIGIN=https://YOUR-APP.vercel.app
NODE_ENV=production
```

Keep existing database, JWT, Redis and storage variables. Do not regenerate JWT secrets as part of this setup. Google sign-in does not need changes to the Python service. The worker does not use the Google client ID.

## 3. Configure Vercel

Vercel → Project → Settings → Environment Variables. Set these for Production (and for Development if desired):

```dotenv
VITE_GOOGLE_CLIENT_ID=YOUR-CLIENT-ID.apps.googleusercontent.com
VITE_API_URL=/api/v1
```

The two Google client IDs must be identical. This is a public client ID, not a secret. Frontend environment values are embedded at build time, so a redeploy is required.

## 4. Keep authentication requests on the frontend origin

The app's nonce and refresh cookies use SameSite=Lax. When using unrelated `vercel.app` and `onrender.com` domains, proxy API calls through Vercel instead of calling Render directly from the browser.

At your configured Vercel project root, create or merge `vercel.json`. If Vercel's Root Directory is `Frontend`, use `Frontend/vercel.json`; if the root is the repository root, use the root `vercel.json`. Replace the API hostname:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://YOUR-API.onrender.com/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Preserve any existing rules your deployment needs. The API rule must precede the SPA fallback. Do not cache authentication endpoints. If you already deploy on same-site custom domains or have a working API proxy, adapt the existing configuration rather than adding conflicting routes.

If your frontend deployment explicitly sets `Cross-Origin-Opener-Policy: same-origin`, adjust it to `same-origin-allow-popups` for GIS popup compatibility when FedCM is unavailable. If you configured a Content Security Policy, allow Google Identity Services according to Google's setup guide.

## 5. Deploy and create the provider-identity index

From the repository root:

```powershell
npm ci
npm run verify
git status
```

Review and commit the Google changes, dependency lockfile, shared configuration, frontend component, tests, and your deployment configuration. Push to the branch connected to Render/Vercel. Existing unrelated local/staged changes should be reviewed before including them.

Wait for the API build to finish. Before enabling public Google sign-in, run the index script against the production database using the new build. In Render's Shell, choose the command matching its working directory:

```bash
# Native Node service with repository-root working directory:
node Backend/dist/scripts/create-indexes.js
```

```bash
# Repository Backend Docker image, whose working directory is /app/Backend:
node dist/scripts/create-indexes.js
```

The new sparse unique `googleSubject` index preserves existing password users without a Google subject and prevents duplicate provider identities. The script creates indexes, does not delete records, and must finish successfully. If Shell is unavailable on your plan, run the command in an available one-off/pre-deploy environment or locally with the intended production database environment securely configured. Do not paste database credentials into chat.

Then deploy/redeploy the frontend after its environment variables are set. Ensure both platforms deploy the same intended commit.

## 6. Verify in the browser

1. Open `https://YOUR-APP.vercel.app/api/v1/health`. It should return API JSON, not the React HTML page.
2. Open `/login`. A Google button should appear under the email/password form.
3. Use a Google account whose email is not already registered with a password in this app. Select it and finish Google's consent prompt.
4. Confirm navigation to your dashboard and correct name in the profile.
5. Sign out and sign in again with the same Google account. The same account and data must be retained.
6. Confirm password-based login still works for existing users.
7. Confirm refresh works after the short-lived access token expires.

Existing password accounts are deliberately not auto-linked by matching email. They receive: `This email already has an account. Sign in using your existing password.` A separate explicit account-linking workflow is not included in this implementation.

When ready for public use, review Audience/publishing status in Google Auth Platform. Complete any verification Google requires for your branding, domains or requested scopes.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| No Google button | Vercel `VITE_GOOGLE_CLIENT_ID` is set for the deployed environment and the frontend was rebuilt |
| Google reports origin/client error | Exact browser origin is listed on the correct Web client; no path/trailing slash |
| `Google sign-in is not configured yet` | API `GOOGLE_CLIENT_ID` missing, or old API deployment |
| `Google sign-in must start from the configured website` | `WEB_ORIGIN` differs from the browser origin; previews need separate configuration |
| `Google sign-in expired` | Missing/expired nonce cookie; verify same-origin proxy, wait until deploy completes and reload login |
| `Google sign-in could not be verified` | Frontend/backend client IDs differ, invalid token or nonce; reload and retry |
| Google library cannot load | Browser blocking or restrictive CSP; network access to accounts.google.com |
| JSON request receives HTML/404 | Vercel rewrite order, backend URL, or an old API build |
| Email already has an account | Use the existing password; this flow does not silently merge accounts |

## References

- https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid
- https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
- https://developers.google.com/identity/gsi/web/reference/js-reference
- https://vercel.com/docs/routing/rewrites
