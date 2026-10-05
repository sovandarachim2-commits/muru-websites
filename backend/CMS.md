# MURU Administration

Open `/admin` to create the first administrator locally. Choose your own email
and a password of at least 12 characters. Existing browser-saved products and
contact links are included in the first setup. There are no default credentials.

## Local Development

From the repository root:

```powershell
New-Item -ItemType Directory -Force backend/tmp | Out-Null
C:/xampp/php/php.exe -d display_errors=0 -d display_startup_errors=0 -d html_errors=0 -d upload_tmp_dir=backend/tmp -S 127.0.0.1:8002 backend/router.php
```

In `frontend`, run `npm run dev`. Vite proxies `/api` to port 8002.
Use the port printed by Vite, then visit `/admin`.

## Content Storage

The CMS saves centrally to `backend/data/cms.json`, separately from the existing
shop database. The data folder contains the password hash, catalog, site settings
and private PHP sessions. Keep this folder backed up and writable by PHP. Do not
upload it to a public storage service. Backend `.htaccess` blocks web access.

Only published products appear publicly. Category renames update assigned products.
Categories with assigned products must be emptied before removal. Photos support
JPG, PNG and WebP up to 2 MB each, or HTTPS URLs. The complete saved catalog has
a 30 MB request limit. Photos are embedded in the content file.

Saves use an exclusive lock and atomic file replacement. If another admin session
saves first, the stale save is rejected: reload before editing again.

## Deployment

Build the frontend and place the contents of `frontend/dist` in the website root.
Place `backend` beside `index.html`. The bundled frontend `.htaccess` routes API
requests and frontend pages on Apache with mod_rewrite enabled. Create the admin
account locally before deployment, then transfer the protected `backend/data`
folder along with the backend. Serve the deployed site over HTTPS. Other servers
must explicitly deny access to backend `config`, `src`, `sql`, `tests` and `data`,
and route `/api` to `backend/public/index.php`.

The public site shows its bundled catalog if the CMS cannot be reached. Admin
saves report failures instead of silently falling back to browser storage.

## Verification

```powershell
node backend/tests/cms.integration.mjs
```

The integration test starts an isolated PHP server with temporary content storage.
It does not create or modify your real administrator account or catalog.
