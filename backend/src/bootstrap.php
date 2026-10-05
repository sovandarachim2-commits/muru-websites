<?php

declare(strict_types=1);

require __DIR__ . '/Response.php';
require __DIR__ . '/Database.php';

function load_config(): array
{
    $path = dirname(__DIR__) . '/config/config.local.php';
    if (!is_file($path)) {
        Response::error(
            'Missing config/config.local.php. Copy config.example.php and add the cPanel database name, user, and password.',
            500
        );
    }

    $config = require $path;
    if (!is_array($config) || !isset($config['db'])) {
        Response::error('config/config.local.php must return a database config array.', 500);
    }

    return $config;
}

function send_cors(array $config): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = $config['cors_origins'] ?? [];

    if ($origin !== '' && in_array($origin, $allowed, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    }

    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Accept');
    header('Access-Control-Max-Age: 86400');
}

function route_path(): string
{
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    if (!is_string($path) || $path === '') {
        return '/';
    }

    $marker = strpos($path, '/api');
    if ($marker === false) {
        return '/';
    }

    $route = substr($path, $marker);
    $route = rtrim($route, '/');

    return $route === '' ? '/' : $route;
}

function read_json(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        Response::error('Request body must be JSON.', 400);
    }

    return $data;
}

function text_field(array $body, string $key, int $max): string
{
    $value = trim((string) ($body[$key] ?? ''));
    if ($value === '') {
        Response::error(ucfirst(str_replace('_', ' ', $key)) . ' is required.', 422);
    }
    if (mb_strlen($value) > $max) {
        Response::error(ucfirst(str_replace('_', ' ', $key)) . ' is too long.', 422);
    }

    return $value;
}
