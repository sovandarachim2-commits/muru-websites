<?php

declare(strict_types=1);

require __DIR__ . '/../src/bootstrap.php';

if (str_starts_with(route_path(), '/api/cms')) {
    require __DIR__ . '/../src/Cms.php';
    cms_route();
}

$config = load_config();
send_cors($config);

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = route_path();

try {
    if ($method === 'GET' && ($path === '/' || $path === '/api/health')) {
        health($config);
    }

    if ($method === 'GET' && $path === '/api/categories') {
        list_categories($config);
    }

    if ($method === 'GET' && $path === '/api/products') {
        list_products($config);
    }

    if ($method === 'GET' && preg_match('#^/api/products/(\d+)$#', $path, $matches)) {
        show_product($config, (int) $matches[1]);
    }

    if ($method === 'POST' && $path === '/api/orders') {
        create_order($config);
    }

    if ($method === 'POST' && $path === '/api/messages') {
        create_message($config);
    }

    Response::error('Route not found.', 404);
} catch (Throwable $error) {
    error_log($error->getMessage());
    Response::error('The server could not finish that request. Check the database settings and that sql/schema.sql has been imported.', 500);
}

function health(array $config): void
{
    $database = 'disconnected';
    try {
        Database::connection($config)->query('SELECT 1');
        $database = 'connected';
    } catch (Throwable $error) {
        error_log($error->getMessage());
    }

    Response::json([
        'ok' => $database === 'connected',
        'service' => 'Muru cosmetics API',
        'database' => $database,
        'currency' => $config['currency'] ?? 'THB',
    ]);
}

function list_categories(array $config): void
{
    $statement = Database::connection($config)->query(
        'SELECT id, name, slug FROM categories ORDER BY name'
    );

    Response::json(['ok' => true, 'categories' => $statement->fetchAll()]);
}

function list_products(array $config): void
{
    $sql = 'SELECT p.id, p.name, p.slug, p.price, p.compare_price, p.description, p.image, p.stock,
                   c.name AS category, c.slug AS category_slug
            FROM products p
            INNER JOIN categories c ON c.id = p.category_id';
    $params = [];
    $category = trim((string) ($_GET['category'] ?? ''));

    if ($category !== '') {
        $sql .= ' WHERE c.slug = :category';
        $params['category'] = $category;
    }

    $sql .= ' ORDER BY p.id DESC';
    $statement = Database::connection($config)->prepare($sql);
    $statement->execute($params);

    Response::json([
        'ok' => true,
        'currency' => $config['currency'] ?? 'THB',
        'products' => $statement->fetchAll(),
    ]);
}

function show_product(array $config, int $id): void
{
    $statement = Database::connection($config)->prepare(
        'SELECT p.id, p.name, p.slug, p.price, p.compare_price, p.description, p.image, p.stock,
                c.name AS category, c.slug AS category_slug
         FROM products p
         INNER JOIN categories c ON c.id = p.category_id
         WHERE p.id = :id'
    );
    $statement->execute(['id' => $id]);
    $product = $statement->fetch();

    if (!$product) {
        Response::error('Product not found.', 404);
    }

    Response::json([
        'ok' => true,
        'currency' => $config['currency'] ?? 'THB',
        'product' => $product,
    ]);
}

function create_order(array $config): void
{
    $body = read_json();
    $name = text_field($body, 'customer_name', 120);
    $email = text_field($body, 'email', 180);
    $phone = text_field($body, 'phone', 40);
    $address = text_field($body, 'address', 500);
    $notes = trim((string) ($body['notes'] ?? ''));

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        Response::error('Email is not valid.', 422);
    }
    if (mb_strlen($notes) > 500) {
        Response::error('Notes are too long.', 422);
    }
    if (!isset($body['items']) || !is_array($body['items']) || $body['items'] === []) {
        Response::error('Add at least one product.', 422);
    }

    $quantities = [];
    foreach ($body['items'] as $item) {
        if (!is_array($item)) {
            Response::error('Each item needs a product and a quantity.', 422);
        }
        $productId = (int) ($item['product_id'] ?? 0);
        $quantity = (int) ($item['quantity'] ?? 0);
        if ($productId < 1 || $quantity < 1 || $quantity > 20) {
            Response::error('Each item needs a valid product and a quantity from 1 to 20.', 422);
        }
        $quantities[$productId] = ($quantities[$productId] ?? 0) + $quantity;
    }

    $pdo = Database::connection($config);
    $pdo->beginTransaction();

    try {
        $placeholders = implode(',', array_fill(0, count($quantities), '?'));
        $statement = $pdo->prepare(
            "SELECT id, name, price, stock FROM products WHERE id IN ($placeholders) FOR UPDATE"
        );
        $statement->execute(array_keys($quantities));
        $products = $statement->fetchAll();

        if (count($products) !== count($quantities)) {
            $pdo->rollBack();
            Response::error('One of the products is no longer available.', 422);
        }

        $total = 0;
        $lines = [];
        foreach ($products as $product) {
            $quantity = $quantities[(int) $product['id']];
            if ((int) $product['stock'] < $quantity) {
                $pdo->rollBack();
                Response::error($product['name'] . ' does not have enough stock.', 422);
            }
            $lineTotal = (float) $product['price'] * $quantity;
            $total += $lineTotal;
            $lines[] = [
                'product_id' => (int) $product['id'],
                'quantity' => $quantity,
                'unit_price' => (float) $product['price'],
            ];
        }

        $order = $pdo->prepare(
            'INSERT INTO orders (customer_name, email, phone, address, notes, total)
             VALUES (:customer_name, :email, :phone, :address, :notes, :total)'
        );
        $order->execute([
            'customer_name' => $name,
            'email' => $email,
            'phone' => $phone,
            'address' => $address,
            'notes' => $notes,
            'total' => $total,
        ]);
        $orderId = (int) $pdo->lastInsertId();

        $itemInsert = $pdo->prepare(
            'INSERT INTO order_items (order_id, product_id, quantity, unit_price)
             VALUES (:order_id, :product_id, :quantity, :unit_price)'
        );
        $stockUpdate = $pdo->prepare(
            'UPDATE products SET stock = stock - :quantity WHERE id = :id'
        );

        foreach ($lines as $line) {
            $itemInsert->execute([
                'order_id' => $orderId,
                'product_id' => $line['product_id'],
                'quantity' => $line['quantity'],
                'unit_price' => $line['unit_price'],
            ]);
            $stockUpdate->execute([
                'quantity' => $line['quantity'],
                'id' => $line['product_id'],
            ]);
        }

        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }

    Response::json([
        'ok' => true,
        'order_id' => $orderId,
        'total' => $total,
        'currency' => $config['currency'] ?? 'THB',
    ], 201);
}

function create_message(array $config): void
{
    $body = read_json();
    $name = text_field($body, 'name', 120);
    $email = text_field($body, 'email', 180);
    $message = text_field($body, 'message', 2000);

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        Response::error('Email is not valid.', 422);
    }

    $statement = Database::connection($config)->prepare(
        'INSERT INTO messages (name, email, message) VALUES (:name, :email, :message)'
    );
    $statement->execute([
        'name' => $name,
        'email' => $email,
        'message' => $message,
    ]);

    Response::json(['ok' => true], 201);
}
