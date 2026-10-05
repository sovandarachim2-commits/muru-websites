<?php

declare(strict_types=1);

function admin_users_pdo(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $directory = getenv('MURU_CMS_DATA_DIR');
    if (is_string($directory) && $directory !== '') {
        $pdo = new PDO('sqlite:' . $directory . '/admin-users.sqlite');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS admin_users (
                email TEXT PRIMARY KEY,
                username TEXT UNIQUE,
                name TEXT NOT NULL DEFAULT "",
                role TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                image TEXT NOT NULL DEFAULT "",
                active INTEGER NOT NULL DEFAULT 1,
                is_owner INTEGER NOT NULL DEFAULT 0,
                generation TEXT NOT NULL
            )'
        );
        return $pdo;
    }

    $pdo = Database::connection(load_config());
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS admin_users (
            email VARCHAR(180) NOT NULL,
            username VARCHAR(40) NULL,
            name VARCHAR(80) NOT NULL DEFAULT "",
            role VARCHAR(40) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            image VARCHAR(500) NOT NULL DEFAULT "",
            active TINYINT(1) NOT NULL DEFAULT 1,
            is_owner TINYINT(1) NOT NULL DEFAULT 0,
            generation CHAR(32) NOT NULL,
            PRIMARY KEY (email),
            UNIQUE KEY admin_users_username (username)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );
    return $pdo;
}

function admin_user_row(array $row): array
{
    return [
        'email' => (string) $row['email'],
        'username' => (string) ($row['username'] ?? ''),
        'name' => (string) ($row['name'] ?? ''),
        'role' => (string) $row['role'],
        'active' => ((int) $row['active']) === 1,
        'hash' => (string) $row['hash'],
        'image' => (string) ($row['image'] ?? ''),
        'generation' => (string) $row['generation'],
        'is_owner' => ((int) $row['is_owner']) === 1,
    ];
}

function admin_user_find(PDO $pdo, string $email): ?array
{
    $statement = $pdo->prepare('SELECT email, username, name, role, password_hash AS hash, image, active, is_owner, generation FROM admin_users WHERE email = ?');
    $statement->execute([$email]);
    $row = $statement->fetch();
    return is_array($row) ? admin_user_row($row) : null;
}

function admin_user_owner(PDO $pdo): ?array
{
    $statement = $pdo->query('SELECT email, username, name, role, password_hash AS hash, image, active, is_owner, generation FROM admin_users WHERE is_owner = 1 LIMIT 1');
    $row = $statement->fetch();
    return is_array($row) ? admin_user_row($row) : null;
}

function admin_user_count(PDO $pdo): int
{
    return (int) $pdo->query('SELECT COUNT(*) FROM admin_users')->fetchColumn();
}

function admin_email_for_username(PDO $pdo, string $username): ?string
{
    $statement = $pdo->prepare('SELECT email FROM admin_users WHERE username = ?');
    $statement->execute([$username]);
    $email = $statement->fetchColumn();
    return is_string($email) && $email !== '' ? $email : null;
}

function admin_username_taken(PDO $pdo, string $username, string $email): bool
{
    $statement = $pdo->prepare('SELECT email FROM admin_users WHERE username = ? AND email <> ?');
    $statement->execute([$username, $email]);
    return (bool) $statement->fetchColumn();
}

function admin_users_list(PDO $pdo): array
{
    $statement = $pdo->query('SELECT email, username, name, role, password_hash AS hash, image, active, is_owner, generation FROM admin_users ORDER BY is_owner DESC, email');
    return array_map('admin_user_row', $statement->fetchAll());
}

function admin_users_role_assigned(PDO $pdo, string $role): bool
{
    $statement = $pdo->prepare('SELECT email FROM admin_users WHERE role = ? AND is_owner = 0 LIMIT 1');
    $statement->execute([$role]);
    return (bool) $statement->fetchColumn();
}

function admin_user_put(PDO $pdo, array $user): void
{
    $username = strtolower(trim((string) ($user['username'] ?? '')));
    $params = [
        $username === '' ? null : $username,
        (string) ($user['name'] ?? ''),
        (string) $user['role'],
        (string) $user['hash'],
        (string) ($user['image'] ?? ''),
        !empty($user['active']) ? 1 : 0,
        !empty($user['is_owner']) ? 1 : 0,
        (string) $user['generation'],
        (string) $user['email'],
    ];
    $sql = admin_user_find($pdo, $user['email'])
        ? 'UPDATE admin_users SET username = ?, name = ?, role = ?, password_hash = ?, image = ?, active = ?, is_owner = ?, generation = ? WHERE email = ?'
        : 'INSERT INTO admin_users (username, name, role, password_hash, image, active, is_owner, generation, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    $pdo->prepare($sql)->execute($params);
}

function admin_user_delete(PDO $pdo, string $email): void
{
    $statement = $pdo->prepare('DELETE FROM admin_users WHERE email = ? AND is_owner = 0');
    $statement->execute([$email]);
}

function admin_users_import(PDO $pdo, array &$data): void
{
    if (admin_user_count($pdo) > 0 || !isset($data['account']['email'], $data['account']['hash'])) {
        return;
    }

    $account = $data['account'];
    $started = !$pdo->inTransaction();
    if ($started) $pdo->beginTransaction();
    try {
        admin_user_put($pdo, [
            'email' => strtolower((string) $account['email']),
            'username' => (string) ($account['username'] ?? ''),
            'name' => (string) ($account['name'] ?? ''),
            'role' => 'owner',
            'hash' => (string) $account['hash'],
            'image' => (string) ($account['image'] ?? ''),
            'active' => true,
            'is_owner' => true,
            'generation' => (string) ($account['generation'] ?? bin2hex(random_bytes(16))),
        ]);
        foreach ($data['users'] ?? [] as $entry) {
            if (!is_array($entry) || !isset($entry['email'], $entry['hash'])) continue;
            if (strtolower((string) $entry['email']) === strtolower((string) $account['email'])) continue;
            admin_user_put($pdo, [
                'email' => strtolower((string) $entry['email']),
                'username' => (string) ($entry['username'] ?? ''),
                'name' => (string) ($entry['name'] ?? ''),
                'role' => (string) ($entry['role'] ?? 'staff'),
                'hash' => (string) $entry['hash'],
                'image' => (string) ($entry['image'] ?? ''),
                'active' => (bool) ($entry['active'] ?? true),
                'is_owner' => false,
                'generation' => (string) ($entry['generation'] ?? bin2hex(random_bytes(16))),
            ]);
        }
        if ($started) $pdo->commit();
    } catch (Throwable $error) {
        if ($started && $pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
    unset($data['account'], $data['users']);
}
