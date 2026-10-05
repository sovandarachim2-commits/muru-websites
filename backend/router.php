<?php
declare(strict_types=1);

// The development server exposes only API routes, never private backend files.
if (!str_starts_with(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/', '/api/')) {
    http_response_code(404);
    exit;
}
require __DIR__ . '/public/index.php';
