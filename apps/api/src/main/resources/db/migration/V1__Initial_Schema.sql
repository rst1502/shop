-- ════════════════════════════════════════════
--  ZimShop V1: Initial Schema
-- ════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Customers ────────────────────────────────
CREATE TABLE customers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    phone           VARCHAR(30),
    whatsapp_phone  VARCHAR(30),
    facebook_id     VARCHAR(100),
    total_orders    INTEGER DEFAULT 0,
    total_spent     DECIMAL(12, 2) DEFAULT 0.00,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Products ─────────────────────────────────
CREATE TABLE products (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title               VARCHAR(500) NOT NULL,
    description         TEXT,
    description_html    TEXT,
    handle              VARCHAR(500) UNIQUE NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
                            CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
    vendor              VARCHAR(200),
    product_type        VARCHAR(200),
    facebook_product_id VARCHAR(200),
    metafields          JSONB,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_handle ON products(handle);
CREATE INDEX idx_products_status ON products(status);

-- ── Product Tags ─────────────────────────────
CREATE TABLE product_tags (
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tag         VARCHAR(100) NOT NULL,
    PRIMARY KEY (product_id, tag)
);

-- ── Product Channels ─────────────────────────
CREATE TABLE product_channels (
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    channel     VARCHAR(20) NOT NULL CHECK (channel IN ('WEB', 'FACEBOOK', 'WHATSAPP')),
    PRIMARY KEY (product_id, channel)
);

-- ── Product Options ───────────────────────────
CREATE TABLE product_options (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    position    INTEGER DEFAULT 0,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Product Option Values ─────────────────────
CREATE TABLE product_option_values (
    option_id   UUID NOT NULL REFERENCES product_options(id) ON DELETE CASCADE,
    value       VARCHAR(100) NOT NULL,
    PRIMARY KEY (option_id, value)
);

-- ── Product Variants ─────────────────────────
CREATE TABLE product_variants (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    title               VARCHAR(500) NOT NULL,
    sku                 VARCHAR(200),
    price               DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    compare_at_price    DECIMAL(10, 2),
    currency            VARCHAR(10) NOT NULL DEFAULT 'USD',
    inventory_quantity  INTEGER NOT NULL DEFAULT 0,
    image_url           TEXT,
    options             JSONB,
    position            INTEGER DEFAULT 0,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_variants_product ON product_variants(product_id);

-- ── Product Images ────────────────────────────
CREATE TABLE product_images (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url         TEXT NOT NULL,
    alt_text    VARCHAR(500),
    position    INTEGER DEFAULT 0,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Orders ────────────────────────────────────
CREATE TABLE orders (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number            VARCHAR(50) UNIQUE NOT NULL,
    channel                 VARCHAR(20) NOT NULL CHECK (channel IN ('WEB', 'FACEBOOK', 'WHATSAPP')),
    status                  VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                                CHECK (status IN ('PENDING','PAID','PROCESSING','SHIPPED','DELIVERED','CANCELLED','REFUNDED')),
    payment_status          VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                                CHECK (payment_status IN ('PENDING','PAID','FAILED','REFUNDED')),
    payment_method          VARCHAR(50),
    subtotal                DECIMAL(12, 2) NOT NULL,
    shipping_cost           DECIMAL(10, 2) DEFAULT 0.00,
    tax_amount              DECIMAL(10, 2) DEFAULT 0.00,
    total                   DECIMAL(12, 2) NOT NULL,
    currency                VARCHAR(10) NOT NULL DEFAULT 'USD',
    customer_id             UUID REFERENCES customers(id),
    shipping_address_json   JSONB,
    notes                   TEXT,
    paynow_reference        VARCHAR(200),
    paynow_poll_url         TEXT,
    facebook_order_id       VARCHAR(200),
    whatsapp_phone          VARCHAR(30),
    order_seq               BIGINT,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_channel ON orders(channel);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_facebook ON orders(facebook_order_id);
CREATE INDEX idx_orders_number ON orders(order_number);

-- ── Order Line Items ─────────────────────────
CREATE TABLE order_line_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      VARCHAR(200),
    variant_id      VARCHAR(200),
    product_title   VARCHAR(500) NOT NULL,
    variant_title   VARCHAR(500),
    sku             VARCHAR(200),
    quantity        INTEGER NOT NULL DEFAULT 1,
    price           DECIMAL(10, 2) NOT NULL,
    image_url       TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Admin Users ───────────────────────────────
CREATE TABLE admin_users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(500) NOT NULL,
    first_name      VARCHAR(100),
    last_name       VARCHAR(100),
    role            VARCHAR(50) NOT NULL DEFAULT 'ADMIN',
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Store Settings ────────────────────────────
CREATE TABLE store_settings (
    key         VARCHAR(200) PRIMARY KEY,
    value       TEXT,
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Seed: Default admin user (password: Admin@123) ────────────────
-- Change this immediately in production!
INSERT INTO admin_users (email, password_hash, first_name, last_name, role)
VALUES (
    'admin@zimshop.co.zw',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh9y', -- Admin@123
    'ZimShop',
    'Admin',
    'ADMIN'
);

-- ── Seed: Default store settings ─────────────────────────────────
INSERT INTO store_settings (key, value) VALUES
    ('store.name', 'ZimShop'),
    ('store.currency', 'USD'),
    ('store.timezone', 'Africa/Harare'),
    ('store.free_shipping_threshold', '50'),
    ('store.whatsapp_number', '+263771234567');
