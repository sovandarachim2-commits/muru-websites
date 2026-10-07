<?php

declare(strict_types=1);

function cms_content_pdo(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;

    $directory = getenv('MURU_CMS_DATA_DIR');
    if (is_string($directory) && $directory !== '') {
        $pdo = new PDO('sqlite:' . $directory . '/cms-content.sqlite');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $pdo->exec('CREATE TABLE IF NOT EXISTS cms_meta (id INTEGER PRIMARY KEY, revision INTEGER NOT NULL)');
        $pdo->exec('CREATE TABLE IF NOT EXISTS cms_categories (position INTEGER PRIMARY KEY, title TEXT NOT NULL, text TEXT NOT NULL, variant TEXT NOT NULL, tone TEXT NOT NULL, image TEXT NOT NULL)');
        $pdo->exec('CREATE TABLE IF NOT EXISTS cms_products (id TEXT PRIMARY KEY, position INTEGER NOT NULL, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, category TEXT NOT NULL, benefit TEXT NOT NULL, type TEXT NOT NULL, size TEXT NOT NULL, skin_type TEXT NOT NULL, ingredients TEXT NOT NULL, how_to_use TEXT NOT NULL, story TEXT NOT NULL, updated_at TEXT NOT NULL, updated_by TEXT NOT NULL, price REAL NOT NULL, image TEXT NOT NULL, images TEXT NOT NULL DEFAULT "[]", variant TEXT NOT NULL, tone TEXT NOT NULL, status TEXT NOT NULL, is_new INTEGER NOT NULL, best_seller INTEGER NOT NULL)');
        $pdo->exec('CREATE TABLE IF NOT EXISTS cms_settings (setting_key TEXT NOT NULL, lang TEXT NOT NULL DEFAULT "", setting_value TEXT NOT NULL, PRIMARY KEY (setting_key, lang))');
        $pdo->exec('CREATE TABLE IF NOT EXISTS cms_social (network TEXT PRIMARY KEY, url TEXT NOT NULL)');
        $pdo->exec('CREATE TABLE IF NOT EXISTS admin_roles (id TEXT PRIMARY KEY, name TEXT NOT NULL, permissions TEXT NOT NULL)');
        $pdo->exec('CREATE TABLE IF NOT EXISTS admin_login_attempts (ip_hash TEXT PRIMARY KEY, attempt_count INTEGER NOT NULL, until_time INTEGER NOT NULL)');
        cms_content_ensure_product_images($pdo);
        return $pdo;
    }

    $pdo = Database::connection(load_config());
    $pdo->exec('CREATE TABLE IF NOT EXISTS cms_meta (id TINYINT NOT NULL, revision INT NOT NULL, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
    $pdo->exec('CREATE TABLE IF NOT EXISTS cms_categories (position INT NOT NULL, title VARCHAR(80) NOT NULL, text TEXT NOT NULL, variant VARCHAR(20) NOT NULL, tone VARCHAR(20) NOT NULL, image MEDIUMTEXT NOT NULL, PRIMARY KEY (position)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
    $pdo->exec('CREATE TABLE IF NOT EXISTS cms_products (id VARCHAR(160) NOT NULL, position INT NOT NULL, slug VARCHAR(160) NOT NULL, title VARCHAR(160) NOT NULL, category VARCHAR(80) NOT NULL, benefit TEXT NOT NULL, type VARCHAR(160) NOT NULL, size TEXT NOT NULL, skin_type TEXT NOT NULL, ingredients TEXT NOT NULL, how_to_use TEXT NOT NULL, story TEXT NOT NULL, updated_at VARCHAR(40) NOT NULL, updated_by VARCHAR(160) NOT NULL, price DECIMAL(10,2) NOT NULL, image MEDIUMTEXT NOT NULL, images MEDIUMTEXT NOT NULL DEFAULT "[]", variant VARCHAR(20) NOT NULL, tone VARCHAR(20) NOT NULL, status VARCHAR(20) NOT NULL, is_new TINYINT(1) NOT NULL, best_seller TINYINT(1) NOT NULL, PRIMARY KEY (id), UNIQUE KEY cms_products_slug (slug)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
    $pdo->exec('CREATE TABLE IF NOT EXISTS cms_settings (setting_key VARCHAR(64) NOT NULL, lang VARCHAR(2) NOT NULL DEFAULT "", setting_value MEDIUMTEXT NOT NULL, PRIMARY KEY (setting_key, lang)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
    $pdo->exec('CREATE TABLE IF NOT EXISTS cms_social (network VARCHAR(20) NOT NULL, url VARCHAR(2048) NOT NULL, PRIMARY KEY (network)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
    $pdo->exec('CREATE TABLE IF NOT EXISTS admin_roles (id VARCHAR(80) NOT NULL, name VARCHAR(80) NOT NULL, permissions TEXT NOT NULL, PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
    $pdo->exec('CREATE TABLE IF NOT EXISTS admin_login_attempts (ip_hash CHAR(64) NOT NULL, attempt_count INT NOT NULL, until_time INT NOT NULL, PRIMARY KEY (ip_hash)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
    cms_content_ensure_product_images($pdo);
    return $pdo;
}

function cms_content_ensure_product_images(PDO $pdo): void
{
    if ($pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite') {
        $columns = $pdo->query('PRAGMA table_info(cms_products)')->fetchAll();
        foreach ($columns as $column) if (($column['name'] ?? '') === 'images') return;
        $pdo->exec('ALTER TABLE cms_products ADD COLUMN images TEXT NOT NULL DEFAULT "[]"');
        return;
    }
    $column = $pdo->query("SHOW COLUMNS FROM cms_products LIKE 'images'")->fetchColumn();
    if ($column === false) $pdo->exec('ALTER TABLE cms_products ADD COLUMN images MEDIUMTEXT NOT NULL DEFAULT "[]" AFTER image');
}

function cms_content_store(callable $callback, bool $write = false): mixed
{
    $handle = fopen(cms_file() . '.lock', 'c+');
    if (!$handle || !flock($handle, LOCK_EX)) throw new RuntimeException('Could not lock content storage.');
    $pdo = cms_content_pdo();
    try {
        cms_content_bootstrap($pdo);
        if ($write) $pdo->beginTransaction();
        $data = cms_content_load($pdo);
        $result = $callback($data);
        if ($write) {
            cms_content_save($pdo, $data);
            $pdo->commit();
        }
        return $result;
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    } finally {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}

function cms_content_bootstrap(PDO $pdo): void
{
    if ($pdo->query('SELECT id FROM cms_meta WHERE id = 1')->fetchColumn() !== false) return;

    $document = ['revision' => 0];
    $path = cms_file();
    if (is_file($path)) {
        $raw = file_get_contents($path);
        if ($raw === false) throw new RuntimeException('Could not read content.');
        if ($raw !== '') {
            $decoded = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
            if (is_array($decoded)) $document = $decoded;
        }
    }
    if (isset($document['account']['email']) && admin_user_count(admin_users_pdo()) === 0) {
        admin_users_import(admin_users_pdo(), $document);
    }
    cms_content_save($pdo, $document);
}

function cms_content_load(PDO $pdo): array
{
    $revision = $pdo->query('SELECT revision FROM cms_meta WHERE id = 1')->fetchColumn();
    $data = ['revision' => (int) $revision, 'roles' => [], 'attempts' => []];

    $roles = $pdo->query('SELECT id, name, permissions FROM admin_roles')->fetchAll();
    foreach ($roles as $role) {
        $permissions = json_decode((string) $role['permissions'], true);
        $data['roles'][$role['id']] = ['name' => (string) $role['name'], 'permissions' => is_array($permissions) ? array_values($permissions) : []];
    }

    $attempts = $pdo->query('SELECT ip_hash, attempt_count, until_time FROM admin_login_attempts')->fetchAll();
    foreach ($attempts as $attempt) {
        $data['attempts'][$attempt['ip_hash']] = ['count' => (int) $attempt['attempt_count'], 'until' => (int) $attempt['until_time']];
    }

    $settings = $pdo->query('SELECT setting_key, lang, setting_value FROM cms_settings')->fetchAll();
    $social = $pdo->query('SELECT network, url FROM cms_social')->fetchAll();
    $categories = $pdo->query('SELECT title, text, variant, tone, image FROM cms_categories ORDER BY position')->fetchAll();
    $products = $pdo->query('SELECT id, slug, title, category, benefit, type, size, skin_type, ingredients, how_to_use, story, updated_at, updated_by, price, image, images, variant, tone, status, is_new, best_seller FROM cms_products ORDER BY position')->fetchAll();
    if ($settings === [] && $social === [] && $categories === [] && $products === []) return $data;

    $textKeys = ['brand', 'tagline', 'heroEyebrow', 'heroTitle', 'heroAccent', 'heroDescription', 'heroButton', 'catalogTitle', 'catalogDescription', 'storyTitle', 'storyDescription', 'ingredientEyebrow', 'ingredientTitle', 'ingredientDescription', 'ingredientButton', 'ingredientPoint1Title', 'ingredientPoint1Text', 'ingredientPoint2Title', 'ingredientPoint2Text', 'ingredientPoint3Title', 'ingredientPoint3Text', 'promotionTitle', 'promotionDescription', 'contactTitle', 'contactDescription'];
    $stored = [];
    $km = [];
    foreach ($settings as $row) {
        if ($row['lang'] === 'km') $km[$row['setting_key']] = (string) $row['setting_value'];
        else $stored[$row['setting_key']] = (string) $row['setting_value'];
    }
    $cleanSettings = [];
    foreach ($textKeys as $key) if (array_key_exists($key, $stored)) $cleanSettings[$key] = $stored[$key];
    if ($km !== []) {
        $cleanKm = [];
        foreach ($textKeys as $key) if (array_key_exists($key, $km)) $cleanKm[$key] = $km[$key];
        $cleanSettings['km'] = $cleanKm;
    }
    foreach (['heroImage', 'storyImage', 'ingredientImage', 'promotionImage', 'logo', 'favicon', 'accentColor', 'bodyFont'] as $key) {
        if (array_key_exists($key, $stored)) $cleanSettings[$key] = $stored[$key];
    }
    foreach (['showPromotion', 'showReviews'] as $key) {
        if (array_key_exists($key, $stored)) $cleanSettings[$key] = $stored[$key] === '1';
    }

    $cleanSocial = [];
    foreach ($social as $row) $cleanSocial[$row['network']] = (string) $row['url'];
    $orderedSocial = [];
    foreach (['facebook', 'instagram', 'tiktok', 'telegram', 'telegramContact', 'phone', 'email', 'address'] as $key) {
        if (array_key_exists($key, $cleanSocial)) $orderedSocial[$key] = $cleanSocial[$key];
    }

    $cleanProducts = [];
    foreach ($products as $product) {
        $gallery = json_decode((string) ($product['images'] ?? '[]'), true);
        $cleanProducts[] = [
            'id' => (string) $product['id'],
            'slug' => (string) $product['slug'],
            'title' => (string) $product['title'],
            'category' => (string) $product['category'],
            'benefit' => (string) $product['benefit'],
            'type' => (string) $product['type'],
            'size' => (string) $product['size'],
            'skinType' => (string) $product['skin_type'],
            'ingredients' => (string) $product['ingredients'],
            'howToUse' => (string) $product['how_to_use'],
            'story' => (string) $product['story'],
            'updatedAt' => (string) $product['updated_at'],
            'price' => (float) $product['price'],
            'image' => (string) $product['image'],
            'images' => is_array($gallery) ? array_values(array_filter($gallery, 'is_string')) : [],
            'variant' => (string) $product['variant'],
            'tone' => (string) $product['tone'],
            'status' => (string) $product['status'],
            'isNew' => ((int) $product['is_new']) === 1,
            'bestSeller' => ((int) $product['best_seller']) === 1,
            'updatedBy' => (string) $product['updated_by'],
        ];
    }

    $data['state'] = [
        'products' => $cleanProducts,
        'categories' => array_map(fn(array $category): array => [
            'title' => (string) $category['title'],
            'text' => (string) $category['text'],
            'variant' => (string) $category['variant'],
            'tone' => (string) $category['tone'],
            'image' => (string) $category['image'],
        ], $categories),
        'social' => $orderedSocial,
        'settings' => $cleanSettings,
    ];
    if (isset($stored['productOptions'])) {
        $options = json_decode($stored['productOptions'], true);
        if (is_array($options)) $data['state']['productOptions'] = $options;
    }
    return $data;
}

function cms_content_save(PDO $pdo, array $data): void
{
    $started = !$pdo->inTransaction();
    if ($started) $pdo->beginTransaction();
    try {
        foreach (['cms_categories', 'cms_products', 'cms_settings', 'cms_social', 'admin_roles', 'admin_login_attempts'] as $table) {
            $pdo->exec('DELETE FROM ' . $table);
        }
        $revision = (int) ($data['revision'] ?? 0);
        if ($pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite') {
            $pdo->prepare('INSERT INTO cms_meta (id, revision) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET revision = excluded.revision')->execute([$revision]);
        } else {
            $pdo->prepare('INSERT INTO cms_meta (id, revision) VALUES (1, ?) ON DUPLICATE KEY UPDATE revision = VALUES(revision)')->execute([$revision]);
        }

        if (isset($data['state']) && is_array($data['state'])) {
            $categoryInsert = $pdo->prepare('INSERT INTO cms_categories (position, title, text, variant, tone, image) VALUES (?, ?, ?, ?, ?, ?)');
            foreach (array_values($data['state']['categories'] ?? []) as $position => $category) {
                $categoryInsert->execute([$position, (string) ($category['title'] ?? ''), (string) ($category['text'] ?? ''), (string) ($category['variant'] ?? ''), (string) ($category['tone'] ?? ''), (string) ($category['image'] ?? '')]);
            }
            $productInsert = $pdo->prepare('INSERT INTO cms_products (id, position, slug, title, category, benefit, type, size, skin_type, ingredients, how_to_use, story, updated_at, updated_by, price, image, images, variant, tone, status, is_new, best_seller) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            foreach (array_values($data['state']['products'] ?? []) as $position => $product) {
                $productInsert->execute([
                    (string) ($product['id'] ?? ''),
                    $position,
                    (string) ($product['slug'] ?? ''),
                    (string) ($product['title'] ?? ''),
                    (string) ($product['category'] ?? ''),
                    (string) ($product['benefit'] ?? ''),
                    (string) ($product['type'] ?? ''),
                    (string) ($product['size'] ?? ''),
                    (string) ($product['skinType'] ?? ''),
                    (string) ($product['ingredients'] ?? ''),
                    (string) ($product['howToUse'] ?? ''),
                    (string) ($product['story'] ?? ''),
                    (string) ($product['updatedAt'] ?? ''),
                    (string) ($product['updatedBy'] ?? ''),
                    round((float) ($product['price'] ?? 0), 2),
                    (string) ($product['image'] ?? ''),
                    json_encode(array_values(array_filter(is_array($product['images'] ?? null) ? $product['images'] : [], 'is_string')), JSON_UNESCAPED_SLASHES),
                    (string) ($product['variant'] ?? 'pump'),
                    (string) ($product['tone'] ?? 'pink'),
                    (string) ($product['status'] ?? 'published'),
                    !empty($product['isNew']) ? 1 : 0,
                    !empty($product['bestSeller']) ? 1 : 0,
                ]);
            }
            $settingInsert = $pdo->prepare('INSERT INTO cms_settings (setting_key, lang, setting_value) VALUES (?, ?, ?)');
            if (isset($data['state']['productOptions'])) $settingInsert->execute(['productOptions', '', json_encode($data['state']['productOptions'], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)]);
            $settings = is_array($data['state']['settings'] ?? null) ? $data['state']['settings'] : [];
            foreach ($settings as $key => $value) {
                if ($key === 'km' || !is_string($key)) continue;
                if (is_bool($value)) $value = $value ? '1' : '0';
                if (!is_scalar($value)) continue;
                $settingInsert->execute([$key, '', (string) $value]);
            }
            if (is_array($settings['km'] ?? null)) {
                foreach ($settings['km'] as $key => $value) {
                    if (is_string($key) && is_scalar($value)) $settingInsert->execute([$key, 'km', (string) $value]);
                }
            }
            $socialInsert = $pdo->prepare('INSERT INTO cms_social (network, url) VALUES (?, ?)');
            foreach (['facebook', 'instagram', 'tiktok', 'telegram', 'telegramContact', 'phone', 'email', 'address'] as $network) {
                if (!is_array($data['state']['social'] ?? null) || !array_key_exists($network, $data['state']['social'])) continue;
                $socialInsert->execute([$network, (string) $data['state']['social'][$network]]);
            }
        }

        $roleInsert = $pdo->prepare('INSERT INTO admin_roles (id, name, permissions) VALUES (?, ?, ?)');
        foreach ($data['roles'] ?? [] as $id => $role) {
            if (!is_string($id) || !is_array($role)) continue;
            $roleInsert->execute([$id, (string) ($role['name'] ?? ''), json_encode(array_values($role['permissions'] ?? []), JSON_UNESCAPED_SLASHES)]);
        }
        $attemptInsert = $pdo->prepare('INSERT INTO admin_login_attempts (ip_hash, attempt_count, until_time) VALUES (?, ?, ?)');
        foreach ($data['attempts'] ?? [] as $hash => $attempt) {
            if (!is_string($hash) || !is_array($attempt)) continue;
            $attemptInsert->execute([$hash, (int) ($attempt['count'] ?? 0), (int) ($attempt['until'] ?? 0)]);
        }
        if ($started) $pdo->commit();
    } catch (Throwable $error) {
        if ($started && $pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
}
