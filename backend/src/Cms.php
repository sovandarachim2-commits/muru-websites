<?php
declare(strict_types=1);

require_once __DIR__ . '/AdminUsers.php';
require_once __DIR__ . '/CmsStore.php';

function cms_file(): string
{
    $directory = getenv('MURU_CMS_DATA_DIR') ?: dirname(__DIR__) . '/data';
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
        throw new RuntimeException('Could not create content storage.');
    }
    return $directory . '/cms.json';
}

function cms_store(callable $callback, bool $write = false): mixed
{
    return cms_content_store($callback, $write);
}

function cms_image(mixed $value): string
{
    if (!is_string($value)) throw new InvalidArgumentException('Invalid image.');
    if ($value === '' || preg_match('#^/images/[a-zA-Z0-9._/-]+$#D', $value) && !str_contains($value, '..')) return $value;
    if (strlen($value) < 2048 && filter_var($value, FILTER_VALIDATE_URL) && str_starts_with($value, 'https://')) return $value;
    if (preg_match('#^data:image/(jpeg|png|webp);base64,([a-zA-Z0-9+/=]+)$#D', $value, $matches)) {
        $bytes = base64_decode($matches[2], true);
        $info = $bytes === false ? false : @getimagesizefromstring($bytes);
        if ($info && strlen($bytes) <= 2 * 1024 * 1024 && $info['mime'] === 'image/' . $matches[1]) return $value;
    }
    throw new InvalidArgumentException('Use a JPG, PNG or WebP image under 2 MB, or an HTTPS image URL.');
}

function cms_images(mixed $value): array
{
    if ($value === null || $value === '') return [];
    if (!is_array($value) || !array_is_list($value) || count($value) > 12) throw new InvalidArgumentException('Invalid product images.');
    $images = [];
    foreach ($value as $image) {
        $clean = cms_image($image);
        if ($clean !== '' && !in_array($clean, $images, true)) $images[] = $clean;
    }
    return $images;
}

function cms_text(array $data, string $key, int $limit = 600, bool $required = false): string
{
    $value = $data[$key] ?? '';
    if (!is_string($value) || mb_strlen($value) > $limit || $required && trim($value) === '') {
        throw new InvalidArgumentException('Invalid ' . $key . '.');
    }
    return trim($value);
}

function cms_validate(array $body): array
{
    $products = $body['products'] ?? null;
    $categories = $body['categories'] ?? null;
    if (!is_array($products) || !array_is_list($products) || count($products) > 500 || !is_array($categories) || !array_is_list($categories) || count($categories) > 40) {
        throw new InvalidArgumentException('Invalid catalog.');
    }
    $names = [];
    $cleanCategories = [];
    foreach ($categories as $category) {
        if (!is_array($category)) throw new InvalidArgumentException('Invalid category.');
        $title = cms_text($category, 'title', 80, true);
        if (in_array(mb_strtolower($title), $names, true) || in_array($title, ['All Products', 'New Arrivals'], true)) throw new InvalidArgumentException('Category names must be unique.');
        $names[] = mb_strtolower($title);
        $cleanCategories[] = ['title' => $title, 'text' => cms_text($category, 'text'), 'variant' => cms_text($category, 'variant', 20), 'tone' => cms_text($category, 'tone', 20), 'image' => cms_image($category['image'] ?? '')];
    }
    $optionDefaults = ['packaging' => ['pump', 'jar', 'dropper', 'compact', 'tube', 'bottle'], 'colors' => ['pink', 'blue', 'rose', 'cream']];
    $productOptions = null;
    if (isset($body['productOptions'])) {
        if (!is_array($body['productOptions'])) throw new InvalidArgumentException('Invalid product options.');
        $productOptions = [];
        foreach ($optionDefaults as $group => $defaults) {
            $entries = $body['productOptions'][$group] ?? null;
            if (!is_array($entries) || !array_is_list($entries) || count($entries) > 40) throw new InvalidArgumentException('Invalid product options.');
            $values = [];
            $productOptions[$group] = [];
            foreach ($entries as $entry) {
                if (!is_array($entry)) throw new InvalidArgumentException('Invalid product option.');
                $value = cms_text($entry, 'value', 20, true);
                if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D', $value) || in_array($value, $values, true)) throw new InvalidArgumentException('Option values must be unique lowercase words.');
                $values[] = $value;
                $productOptions[$group][] = ['value' => $value, 'en' => cms_text($entry, 'en', 80, true), 'km' => cms_text($entry, 'km', 80, true)];
            }
        }
    }
    $slugs = []; $ids = []; $cleanProducts = [];
    foreach ($products as $product) {
        if (!is_array($product)) throw new InvalidArgumentException('Invalid product.');
        $clean = [];
        foreach (['id', 'slug', 'title', 'category', 'benefit'] as $key) $clean[$key] = cms_text($product, $key, $key === 'benefit' ? 2000 : 160, true);
        $clean['type'] = cms_text($product, 'type', 160);
        if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D', $clean['slug']) || in_array($clean['slug'], $slugs, true) || in_array($clean['id'], $ids, true)) throw new InvalidArgumentException('Product URLs and IDs must be unique.');
        if (!in_array(mb_strtolower($clean['category']), $names, true)) throw new InvalidArgumentException('Choose an existing category for every product.');
        $slugs[] = $clean['slug']; $ids[] = $clean['id'];
        foreach (['size', 'skinType', 'ingredients', 'howToUse', 'story', 'updatedAt'] as $key) $clean[$key] = cms_text($product, $key, 4000);
        $price = $product['price'] ?? null;
        if (!is_numeric($price) || (float) $price < 0 || (float) $price > 1000000) throw new InvalidArgumentException('Each product needs a valid price.');
        $clean['price'] = round((float) $price, 2);
        $clean['image'] = cms_image($product['image'] ?? '');
        $clean['images'] = cms_images($product['images'] ?? []);
        foreach (['variant' => 'packaging', 'tone' => 'colors'] as $field => $group) {
            $allowed = $productOptions === null ? $optionDefaults[$group] : array_column($productOptions[$group], 'value');
            $value = $product[$field] ?? $optionDefaults[$group][0];
            if (!in_array($value, $allowed, true)) throw new InvalidArgumentException('Choose an existing packaging and color for every product.');
            $clean[$field] = $value;
        }
        $clean['status'] = ($product['status'] ?? '') === 'draft' ? 'draft' : 'published';
        $clean['isNew'] = (bool) ($product['isNew'] ?? false);
        $clean['bestSeller'] = (bool) ($product['bestSeller'] ?? false);
        $cleanProducts[] = $clean;
    }
    $socialSource = is_array($body['social'] ?? null) ? $body['social'] : [];
    $social = [];
    foreach (['facebook', 'instagram', 'tiktok', 'telegram', 'telegramContact'] as $key) {
        $url = cms_text($socialSource, $key, 2048);
        if ($url !== '' && (!filter_var($url, FILTER_VALIDATE_URL) || !str_starts_with($url, 'https://'))) throw new InvalidArgumentException('Social links must use HTTPS.');
        $social[$key] = $url;
    }
    if (array_key_exists('phone', $socialSource)) {
        $phone = cms_text($socialSource, 'phone', 40);
        if ($phone !== '' && !preg_match('/^[+0-9][0-9\s().-]{5,39}$/u', $phone)) throw new InvalidArgumentException('Enter a valid phone number.');
        $social['phone'] = $phone;
    }
    if (array_key_exists('email', $socialSource)) {
        $email = cms_text($socialSource, 'email', 180);
        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) throw new InvalidArgumentException('Enter a valid email address.');
        $social['email'] = $email;
    }
    if (array_key_exists('address', $socialSource)) $social['address'] = cms_text($socialSource, 'address', 200);
    $settings = [];
    $textKeys = ['brand', 'tagline', 'heroEyebrow', 'heroTitle', 'heroAccent', 'heroDescription', 'heroButton', 'catalogTitle', 'catalogDescription', 'storyTitle', 'storyDescription', 'ingredientEyebrow', 'ingredientTitle', 'ingredientDescription', 'ingredientButton', 'ingredientPoint1Title', 'ingredientPoint1Text', 'ingredientPoint2Title', 'ingredientPoint2Text', 'ingredientPoint3Title', 'ingredientPoint3Text', 'promotionTitle', 'promotionDescription', 'contactTitle', 'contactDescription'];
    foreach ($textKeys as $key) {
        $settings[$key] = cms_text($body['settings'] ?? [], $key, 2000);
    }
    $kmSource = $body['settings']['km'] ?? [];
    if (!is_array($kmSource)) throw new InvalidArgumentException('Invalid Khmer text.');
    $km = [];
    foreach ($textKeys as $key) $km[$key] = cms_text($kmSource, $key, 2000);
    $settings['km'] = $km;
    foreach (['heroImage', 'storyImage', 'ingredientImage', 'promotionImage', 'logo', 'favicon'] as $key) $settings[$key] = cms_image($body['settings'][$key] ?? '');
    $settings['accentColor'] = cms_text($body['settings'] ?? [], 'accentColor', 7);
    if (!preg_match('/^#[a-fA-F0-9]{6}$/D', $settings['accentColor'])) throw new InvalidArgumentException('Invalid accent color.');
    $settings['bodyFont'] = in_array($body['settings']['bodyFont'] ?? '', ['DM Sans', 'Manrope', 'system-ui'], true) ? $body['settings']['bodyFont'] : 'DM Sans';
    $settings['showPromotion'] = (bool) ($body['settings']['showPromotion'] ?? true);
    $settings['showReviews'] = (bool) ($body['settings']['showReviews'] ?? true);
    $state = ['products' => $cleanProducts, 'categories' => $cleanCategories, 'social' => $social, 'settings' => $settings];
    if ($productOptions !== null) $state['productOptions'] = $productOptions;
    return $state;
}

function cms_private_host(?string $host): bool
{
    if (!$host) return false;
    $host = trim($host, '[]');
    if (in_array($host, ['localhost', '127.0.0.1', '::1'], true)) return true;
    if (!filter_var($host, FILTER_VALIDATE_IP)) return false;
    return !filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE);
}

function cms_setup_allowed(): bool
{
    $host = parse_url('http://' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST);
    $remote = $_SERVER['REMOTE_ADDR'] ?? '';
    return cms_private_host($host) && cms_private_host($remote);
}

function cms_permissions(): array
{
    return ['products', 'categories', 'website', 'settings', 'users', 'roles'];
}

function cms_identity(string $email): ?array
{
    if ($email === '') return null;
    return admin_user_find(admin_users_pdo(), $email);
}

function cms_display_name(array $user): string
{
    $name = trim((string) ($user['name'] ?? ''));
    if ($name !== '') return $name;
    if (($user['role'] ?? '') === 'owner') return 'Owner';
    $username = trim((string) ($user['username'] ?? ''));
    return $username !== '' ? $username : (string) ($user['email'] ?? 'Admin');
}

function cms_product_stamp(array $product): string
{
    unset($product['updatedAt'], $product['updatedBy']);
    ksort($product);
    return json_encode($product, JSON_UNESCAPED_SLASHES);
}

function cms_audit_products(array $products, array $previous, string $actor): array
{
    $prior = [];
    foreach ($previous as $product) {
        if (is_array($product) && isset($product['id'])) $prior[$product['id']] = $product;
    }
    $now = gmdate('Y-m-d\TH:i:s\Z');
    foreach ($products as &$product) {
        $old = $prior[$product['id']] ?? null;
        if ($old && cms_product_stamp($old) === cms_product_stamp($product)) {
            $product['updatedAt'] = is_string($old['updatedAt'] ?? null) ? $old['updatedAt'] : '';
            $product['updatedBy'] = is_string($old['updatedBy'] ?? null) ? $old['updatedBy'] : '';
        } else {
            $product['updatedAt'] = $now;
            $product['updatedBy'] = $actor;
        }
    }
    unset($product);
    return $products;
}

function cms_access(array $data, ?array $user): array
{
    if (!$user || !($user['active'] ?? false)) return [];
    return $user['role'] === 'owner' ? cms_permissions() : ($data['roles'][$user['role']]['permissions'] ?? []);
}

function cms_login_email(string $login): string
{
    if (str_contains($login, '@')) return $login;
    return admin_email_for_username(admin_users_pdo(), strtolower($login)) ?? '';
}

function cms_username(array $body, string $email): string
{
    $username = strtolower(cms_text($body, 'username', 40, true));
    if (!preg_match('/^[a-z0-9][a-z0-9._-]{2,39}$/D', $username)) throw new InvalidArgumentException('Use 3 to 40 letters, numbers, dots, underscores or hyphens for the username.');
    if (admin_username_taken(admin_users_pdo(), $username, $email)) throw new InvalidArgumentException('That username is already in use.');
    return $username;
}

function cms_route(): never
{
    header('Cache-Control: no-store');
    $sessions = dirname(cms_file()) . '/sessions';
    if (!is_dir($sessions)) mkdir($sessions, 0700, true);
    session_save_path($sessions);
    session_name('MURU_ADMIN');
    session_set_cookie_params(['httponly' => true, 'samesite' => 'Strict', 'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', 'path' => '/']);
    session_start();
    $path = route_path();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    try {
        if ($method === 'POST') {
            $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
            $expected = ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://') . ($_SERVER['HTTP_HOST'] ?? '');
            if ($origin !== '' && $origin !== $expected) Response::error('Request origin is not allowed.', 403);
        }
        $import = cms_store(fn(array $data): bool => isset($data['account']['email']) && admin_user_count(admin_users_pdo()) === 0);
        if ($import) cms_store(function (array &$data) { admin_users_import(admin_users_pdo(), $data); }, true);
        $data = cms_store(fn(array $data) => $data);
        $user = cms_identity($_SESSION['admin'] ?? '');
        $loggedIn = $user && ($user['active'] ?? false) && ($_SESSION['expires'] ?? 0) > time() && ($_SESSION['generation'] ?? '') === ($user['generation'] ?? '');
        $permissions = $loggedIn ? cms_access($data, $user) : [];
        $setupAllowed = cms_setup_allowed();
        if ($method === 'GET' && $path === '/api/cms/session') Response::json(['ok' => true, 'authenticated' => (bool) $loggedIn, 'permissions' => $permissions, 'role' => $loggedIn ? $user['role'] : null, 'setupRequired' => admin_user_owner(admin_users_pdo()) === null, 'setupAllowed' => $setupAllowed, 'email' => $loggedIn ? $_SESSION['admin'] : null, 'username' => $loggedIn ? ($user['username'] ?? '') : null, 'name' => $loggedIn ? cms_display_name($user) : null, 'image' => $loggedIn ? (string) ($user['image'] ?? '') : null, 'csrf' => $loggedIn ? $_SESSION['csrf'] : null]);
        if ($method === 'GET' && $path === '/api/cms/catalog') {
            $state = $data['state'] ?? null;
            if ($state) {
                $state['products'] = array_values(array_filter($state['products'], fn($product) => $product['status'] === 'published'));
                foreach ($state['products'] as &$product) unset($product['updatedBy']);
                unset($product);
            }
            Response::json(['ok' => true, 'state' => $state]);
        }
        if ($method === 'POST' && in_array($path, ['/api/cms/setup', '/api/cms/login'], true)) {
            $body = read_json();
            $email = strtolower(cms_text($body, 'email', 180, true));
            if ($path === '/api/cms/login') $email = cms_login_email($email);
            $password = $body['password'] ?? '';
            if (($path === '/api/cms/setup' && !filter_var($email, FILTER_VALIDATE_EMAIL)) || !is_string($password) || strlen($password) > 256) Response::error('Enter a valid email and password.', 422);
            if ($path === '/api/cms/setup') {
                if (!$setupAllowed) Response::error('Create the first administrator on the local server.', 403);
                if (strlen($password) < 8) Response::error('Use a password with at least 8 characters.', 422);
                $state = cms_validate($body['state'] ?? []);
                $data = cms_store(function (array &$data) use ($email, $password, $state, $body) {
                    $pdo = admin_users_pdo();
                    if (admin_user_owner($pdo)) throw new LogicException('An administrator already exists.');
                    $data = ['revision' => 1, 'state' => $state];
                    admin_user_put($pdo, [
                        'email' => $email,
                        'username' => isset($body['username']) ? cms_username($body, $email) : '',
                        'name' => '',
                        'role' => 'owner',
                        'hash' => password_hash($password, PASSWORD_DEFAULT),
                        'image' => '',
                        'active' => true,
                        'is_owner' => true,
                        'generation' => bin2hex(random_bytes(16)),
                    ]);
                    return $data;
                }, true);
            } else {
                $attempts = cms_store(function (array &$data) use ($email, $password) {
                    $key = hash('sha256', $_SERVER['REMOTE_ADDR'] ?? '');
                    $now = time();
                    $data['attempts'] = array_filter($data['attempts'] ?? [], fn($attempt) => $attempt['until'] > $now);
                    $attempt = $data['attempts'][$key] ?? ['count' => 0, 'until' => $now + 900];
                    if ($attempt['count'] >= 10) return 'locked';
                    $identity = cms_identity($email);
                    $valid = $identity && $identity['active'] && password_verify($password, $identity['hash']);
                    if (!$valid) { $attempt['count']++; $data['attempts'][$key] = $attempt; return 'invalid'; }
                    unset($data['attempts'][$key]);
                    return 'ok';
                }, true);
                if ($attempts !== 'ok') Response::error($attempts === 'locked' ? 'Too many attempts. Try again in 15 minutes.' : 'Email or password is incorrect.', $attempts === 'locked' ? 429 : 401);
            }
            session_regenerate_id(true);
            $data = cms_store(fn(array $data) => $data);
            $_SESSION = ['admin' => $email, 'csrf' => bin2hex(random_bytes(32)), 'expires' => time() + 28800, 'generation' => cms_identity($email)['generation']];
            Response::json(['ok' => true, 'csrf' => $_SESSION['csrf']]);
        }
        if (!$loggedIn) Response::error('Sign in to continue.', 401);
        if ($method === 'POST' && !hash_equals($_SESSION['csrf'], $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '')) Response::error('Session verification failed. Sign in again.', 403);
        if ($method === 'GET' && $path === '/api/cms/admin') Response::json(['ok' => true, 'state' => $data['state'], 'revision' => $data['revision']]);
        if ($method === 'POST' && $path === '/api/cms/upload') {
            if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 3 * 1024 * 1024) Response::error('Image is too large.', 413);
            $body = read_json();
            if (!is_string($body['image'] ?? null)) throw new InvalidArgumentException('Invalid image.');
            $folder = $body['folder'] ?? 'images';
            if (!is_string($folder) || !in_array($folder, ['images', 'products', 'categories', 'website', 'profiles'], true)) throw new InvalidArgumentException('Invalid image folder.');
            if ($folder !== 'profiles' && !array_intersect(['products', 'categories', 'website'], $permissions)) Response::error('Permission denied.', 403);
            if (!in_array($folder, ['images', 'profiles'], true) && !in_array($folder, $permissions, true)) Response::error('Permission denied.', 403);
            require_once __DIR__ . '/R2.php';
            Response::json(['ok' => true, 'url' => r2_upload($body['image'], $folder)]);
        }
        if ($path === '/api/cms/access') {
            if ($method === 'GET') {
                if (!array_intersect(['users', 'roles'], $permissions)) Response::error('Permission denied.', 403);
                $users = array_map(fn(array $entry): array => ['email' => $entry['email'], 'username' => $entry['username'], 'name' => cms_display_name($entry), 'role' => $entry['role'], 'active' => $entry['active']], admin_users_list(admin_users_pdo()));
                Response::json(['ok' => true, 'users' => $users, 'roles' => $data['roles'] ?? new stdClass(), 'permissions' => cms_permissions()]);
            }
            if ($method === 'POST') {
                $body = read_json();
                $kind = $body['kind'] ?? '';
                if (!in_array($kind, ['users', 'roles'], true) || !in_array($kind, $permissions, true)) Response::error('Permission denied.', 403);
                cms_store(function (array &$data) use ($body, $kind) {
                    $pdo = admin_users_pdo();
                    $actor = cms_identity($_SESSION['admin']);
                    if (!in_array($kind, cms_access($data, $actor), true)) Response::error('Permission denied.', 403);
                    if ($kind === 'roles') {
                        $id = cms_text($body, 'id', 80, true);
                        if ($id === 'owner') throw new InvalidArgumentException('The owner role cannot be changed.');
                        if (($body['delete'] ?? false)) {
                            if (admin_users_role_assigned($pdo, $id)) throw new InvalidArgumentException('Reassign users before deleting this role.');
                            unset($data['roles'][$id]);
                        } else {
                            $grants = $body['permissions'] ?? [];
                            if (!is_array($grants) || !array_is_list($grants) || array_diff($grants, cms_permissions())) throw new InvalidArgumentException('Invalid permissions.');
                            $data['roles'][$id] = ['name' => cms_text($body, 'name', 80, true), 'permissions' => array_values(array_unique($grants))];
                        }
                    } else {
                        $email = strtolower(cms_text($body, 'email', 180, true));
                        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) throw new InvalidArgumentException('Invalid email.');
                        $owner = admin_user_owner($pdo);
                        if (($owner && $email === $owner['email']) || $email === $_SESSION['admin']) throw new InvalidArgumentException('This account cannot be changed here.');
                        if ($body['delete'] ?? false) { admin_user_delete($pdo, $email); return; }
                        $role = cms_text($body, 'role', 80, true);
                        if (!isset($data['roles'][$role])) throw new InvalidArgumentException('Choose an existing role.');
                        $entry = admin_user_find($pdo, $email) ?? ['email' => $email, 'image' => '', 'is_owner' => false];
                        $entry['username'] = cms_username($body, $email);
                        $password = $body['password'] ?? '';
                        if (!is_string($password) || ($password !== '' && (strlen($password) < 8 || strlen($password) > 256)) || (!isset($entry['hash']) && $password === '')) throw new InvalidArgumentException('Use a password with 8 to 256 characters.');
                        if ($password !== '') $entry['hash'] = password_hash($password, PASSWORD_DEFAULT);
                        admin_user_put($pdo, array_merge($entry, ['email' => $email, 'name' => cms_text($body, 'name', 80, true), 'role' => $role, 'active' => (bool) ($body['active'] ?? true), 'is_owner' => false, 'generation' => bin2hex(random_bytes(16))]));
                    }
                }, true);
                Response::json(['ok' => true]);
            }
        }
        if ($method === 'POST' && $path === '/api/cms/save') {
            if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 30 * 1024 * 1024) Response::error('Content is too large. Use smaller images.', 413);
            $body = read_json();
            $state = cms_validate($body['state'] ?? []);
            $saved = cms_store(function (array &$data) use ($body, $state) {
                $actor = cms_identity($_SESSION['admin']);
                $grants = cms_access($data, $actor);
                foreach (['products' => 'products', 'productOptions' => 'products', 'categories' => 'categories', 'settings' => 'website', 'social' => 'settings'] as $key => $permission) {
                    if (($state[$key] ?? null) !== ($data['state'][$key] ?? null) && !in_array($permission, $grants, true)) Response::error('Permission denied for ' . $permission . '.', 403);
                }
                if (($body['revision'] ?? -1) !== $data['revision']) throw new LogicException('Content changed in another session. Reload before saving.');
                $previousSocial = is_array($data['state']['social'] ?? null) ? $data['state']['social'] : [];
                foreach (['phone', 'email', 'address'] as $key) {
                    if (!array_key_exists($key, $state['social']) && array_key_exists($key, $previousSocial)) $state['social'][$key] = $previousSocial[$key];
                }
                $state['products'] = cms_audit_products($state['products'], $data['state']['products'] ?? [], cms_display_name($actor));
                $data['state'] = $state;
                $data['revision']++;
                return ['revision' => $data['revision'], 'state' => $data['state']];
            }, true);
            Response::json(['ok' => true, 'revision' => $saved['revision'], 'state' => $saved['state']]);
        }
        if ($method === 'POST' && $path === '/api/cms/password') {
            $body = read_json();
            $password = $body['password'] ?? '';
            if (!is_string($password) || strlen($password) < 8 || strlen($password) > 256) Response::error('Use a password with 8 to 256 characters.', 422);
            $entry = cms_identity($_SESSION['admin']);
            if (!$entry || !password_verify((string) ($body['currentPassword'] ?? ''), $entry['hash'])) throw new InvalidArgumentException('Current password is incorrect.');
            $entry['hash'] = password_hash($password, PASSWORD_DEFAULT);
            $entry['generation'] = bin2hex(random_bytes(16));
            admin_user_put(admin_users_pdo(), $entry);
            $generation = $entry['generation'];
            $_SESSION['generation'] = $generation;
            Response::json(['ok' => true]);
        }
        if ($method === 'POST' && $path === '/api/cms/profile') {
            $body = read_json();
            $email = $_SESSION['admin'];
            $entry = cms_identity($email);
            if (!$entry) throw new InvalidArgumentException('Sign in to continue.');
            $entry['name'] = cms_text($body, 'name', 80);
            $entry['username'] = cms_username($body, $email);
            $entry['image'] = cms_image($body['image'] ?? '');
            admin_user_put(admin_users_pdo(), $entry);
            Response::json(['ok' => true]);
        }
        if ($method === 'POST' && $path === '/api/cms/logout') { $_SESSION = []; session_destroy(); Response::json(['ok' => true]); }
        Response::error('Route not found.', 404);
    } catch (InvalidArgumentException $error) { Response::error($error->getMessage(), 422);
    } catch (LogicException $error) { Response::error($error->getMessage(), 409);
    } catch (PDOException $error) { error_log($error->getMessage()); Response::error('The user database is unavailable. Check the MySQL settings.', 500);
    } catch (Throwable $error) { error_log($error->getMessage()); Response::error('Content storage is unavailable. Check backend data folder permissions.', 500); }
}
