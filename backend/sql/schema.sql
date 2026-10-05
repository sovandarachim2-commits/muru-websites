-- On cPanel, open your database in phpMyAdmin first, then import this file.
-- Local database name: muru_shop

CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  slug VARCHAR(80) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(160) NOT NULL UNIQUE,
  price DECIMAL(10, 2) NOT NULL,
  compare_price DECIMAL(10, 2) NULL,
  description TEXT NOT NULL,
  image VARCHAR(255) NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  address VARCHAR(500) NOT NULL,
  notes VARCHAR(500) NOT NULL DEFAULT '',
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id),
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS messages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_users (
  email VARCHAR(180) NOT NULL,
  username VARCHAR(40) NULL,
  name VARCHAR(80) NOT NULL DEFAULT '',
  role VARCHAR(40) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  image VARCHAR(500) NOT NULL DEFAULT '',
  active TINYINT(1) NOT NULL DEFAULT 1,
  is_owner TINYINT(1) NOT NULL DEFAULT 0,
  generation CHAR(32) NOT NULL,
  PRIMARY KEY (email),
  UNIQUE KEY admin_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cms_meta (
  id TINYINT NOT NULL,
  revision INT NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cms_categories (
  position INT NOT NULL,
  title VARCHAR(80) NOT NULL,
  text TEXT NOT NULL,
  variant VARCHAR(20) NOT NULL,
  tone VARCHAR(20) NOT NULL,
  image MEDIUMTEXT NOT NULL,
  PRIMARY KEY (position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cms_products (
  id VARCHAR(160) NOT NULL,
  position INT NOT NULL,
  slug VARCHAR(160) NOT NULL,
  title VARCHAR(160) NOT NULL,
  category VARCHAR(80) NOT NULL,
  benefit TEXT NOT NULL,
  type VARCHAR(160) NOT NULL,
  size TEXT NOT NULL,
  skin_type TEXT NOT NULL,
  ingredients TEXT NOT NULL,
  how_to_use TEXT NOT NULL,
  story TEXT NOT NULL,
  updated_at VARCHAR(40) NOT NULL,
  updated_by VARCHAR(160) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image MEDIUMTEXT NOT NULL,
  variant VARCHAR(20) NOT NULL,
  tone VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  is_new TINYINT(1) NOT NULL,
  best_seller TINYINT(1) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY cms_products_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cms_settings (
  setting_key VARCHAR(64) NOT NULL,
  lang VARCHAR(2) NOT NULL DEFAULT '',
  setting_value MEDIUMTEXT NOT NULL,
  PRIMARY KEY (setting_key, lang)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cms_social (
  network VARCHAR(20) NOT NULL,
  url VARCHAR(2048) NOT NULL,
  PRIMARY KEY (network)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_roles (
  id VARCHAR(80) NOT NULL,
  name VARCHAR(80) NOT NULL,
  permissions TEXT NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  ip_hash CHAR(64) NOT NULL,
  attempt_count INT NOT NULL,
  until_time INT NOT NULL,
  PRIMARY KEY (ip_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
