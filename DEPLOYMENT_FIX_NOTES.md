# Devasya Udyoga — Admin Content Sync Fix

This build fixes the issue where changes saved in the Admin panel were not appearing on the public website.

## What was fixed

- Public `/api/content` now uses a dedicated, minimal database initialization path. Failure in an unrelated HR/PPC table can no longer block public website content.
- Content GET/POST responses are explicitly marked `no-store` to prevent stale browser/CDN/proxy responses.
- The frontend requests `/api/content` with a timestamp and `cache: no-store`.
- Admin publishing now returns the database `updated_at` timestamp and displays it in the Admin panel.
- Public content-load failures now show the actual error and provide a Retry button instead of silently looking like a normal default website.
- Added `/api/health` for production diagnostics.
- Admin publishing requires a valid developer login.
- Added a hard 3.5 MB content-record check at the API layer, matching the Admin UI limit.
- Existing application APIs and functionality are preserved.

## Required Vercel environment variable

Make sure the Production environment contains:

- `DATABASE_URL` — the Neon/Postgres connection string used by the site.
- `ADMIN_USER` — only needed when the initial admin account must be seeded.
- `ADMIN_PASS` — only needed when the initial admin account must be seeded.
- Existing notification/AI variables used by the current application should remain unchanged.

## After deployment

1. Open the production domain.
2. Open `https://YOUR-DOMAIN/api/health`.
3. Confirm the response contains `"ok":true` and `"databaseUrlConfigured":true`.
4. Sign in to the Admin panel.
5. Change a simple field such as the company name.
6. Click **Publish Changes**.
7. Open the public homepage in a new private/incognito window.
8. Confirm the changed value appears.

If `/api/health` reports `DATABASE_URL` is not configured, fix the Vercel Production environment variable and redeploy. The code cannot read the Admin content without access to the same production database.
