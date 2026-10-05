<?php

/**
 * Copy this file to config.local.php and fill in the database values.
 *
 * cPanel
 * 1. cPanel → MySQL Databases: create a database and a user, then add the user to the database.
 * 2. Copy this file to config.local.php. Host is usually "localhost".
 *    The database name and user look like "cpaneluser_muru".
 * 3. cPanel → phpMyAdmin: open that database, then Import backend/sql/schema.sql.
 * 4. Upload this whole backend folder into public_html.
 *    The shop API is then https://your-domain.com/backend/api/products
 * 5. In frontend, run npm run build and upload the dist folder into public_html.
 * 6. Add your live site to cors_origins, for example https://your-domain.com
 */

return [
    'db' => [
        'host' => 'localhost',
        'name' => 'muru_shop',
        'user' => 'cpaneluser_muru',
        'pass' => 'change-me',
        'charset' => 'utf8mb4',
    ],
    'currency' => 'THB',
    'r2' => [
        'enabled' => false,
        'account_id' => getenv('R2_ACCOUNT_ID') ?: '',
        'access_key_id' => getenv('R2_ACCESS_KEY_ID') ?: '',
        'secret_access_key' => getenv('R2_SECRET_ACCESS_KEY') ?: '',
        'bucket' => getenv('R2_BUCKET') ?: 'muru-images',
        'public_url' => getenv('R2_PUBLIC_URL') ?: '',
    ],
    'cors_origins' => [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ],
];
