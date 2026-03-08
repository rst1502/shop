# 🛍️ ZimShop — Multi-Channel Commerce Platform

A Shopify-like e-commerce platform built for Zimbabwe, supporting:
- **🌐 Web Store** — Angular storefront
- **📘 Facebook Shop** — Automatic product sync via Catalog API
- **💬 WhatsApp Commerce** — Conversational shopping
- **💳 Paynow Zimbabwe** — EcoCash, OneMoney, and web payments

---

## 🗂️ Project Structure

```
zimshop/                        ← Nx Mono Repo
├── apps/
│   ├── admin/                  ← Angular 17 Admin Dashboard  (port 4200)
│   ├── storefront/             ← Angular 17 Customer Store   (port 4201)
│   └── api/                    ← Spring Boot 3.x REST API    (port 9090)
├── libs/
│   ├── shared-types/           ← Shared TypeScript interfaces
│   └── ui-components/          ← Shared Angular components
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Java 21+
- Docker & Docker Compose

### 1. Start infrastructure (DB + Redis)
```bash
docker-compose up postgres redis -d
```

### 2. Start API
```bash
cd apps/api
mvn spring-boot:run
```

### 3. Start Admin Dashboard
```bash
npm install
npx nx serve admin
# → http://localhost:4200
# → Login: admin@zimshop.co.zw / Admin@123
```

### 4. Start Storefront
```bash
npx nx serve storefront
# → http://localhost:4201
```

### Run everything with Docker
```bash
docker-compose up --build
```

---

## 🔧 Environment Setup

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

### Required API Keys

#### Paynow Zimbabwe
1. Register at https://www.paynow.co.zw
2. Get your Integration ID and Key
3. Set in `.env`:
   ```
   PAYNOW_INTEGRATION_ID=your_id
   PAYNOW_INTEGRATION_KEY=your_key
   PAYNOW_ENV=sandbox  # change to 'production' when ready
   ```

#### Facebook Shop Setup (like Shopify)
1. Create a Meta Business Account: https://business.facebook.com
2. Create a Facebook Catalog: https://business.facebook.com/commerce
3. Create a Meta App: https://developers.facebook.com
4. Get your Catalog ID and Page Access Token
5. Configure webhooks to point to: `https://your-domain.com/api/v1/webhooks/facebook`
6. Set in `.env`:
   ```
   FACEBOOK_APP_ID=your_app_id
   FACEBOOK_APP_SECRET=your_secret
   FACEBOOK_ACCESS_TOKEN=your_page_access_token
   FACEBOOK_CATALOG_ID=your_catalog_id
   FACEBOOK_PAGE_ID=your_page_id
   ```

#### WhatsApp Business Cloud API
1. Create WhatsApp Business App at developers.facebook.com
2. Add WhatsApp product to your Meta App
3. Configure phone number and webhooks: `https://your-domain.com/api/v1/webhooks/whatsapp`
4. Set in `.env`:
   ```
   WHATSAPP_ACCESS_TOKEN=your_token
   WHATSAPP_PHONE_NUMBER_ID=your_phone_id
   WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_id
   ```

---

## 📡 How Facebook Shop Sync Works

This is exactly how Shopify pushes products to Facebook:

```
Admin creates/updates product
        ↓
Spring Boot ProductService
        ↓
FacebookCatalogService.syncProductAsync()
        ↓
POST https://graph.facebook.com/v18.0/{catalogId}/products
{
  "name": "Product Title",
  "price": "2500 USD",   ← in cents
  "availability": "in stock",
  "link": "https://zimshop.co.zw/products/product-handle",
  "image_link": "https://...",
  ...
}
        ↓
Product appears in Facebook Shop
        ↓
Customer clicks "Buy on Website" → redirected to zimshop.co.zw
        ↓
Paynow checkout → Payment confirmed → Order created
```

---

## 💬 WhatsApp Commerce Flow

```
Customer WhatsApps your number
        ↓
"CATALOG" → Shows product list (interactive message)
        ↓
Customer selects product → Product detail + Buy button
        ↓
Customer taps "Buy Now" → Draft order created
        ↓
Payment link sent via WhatsApp (Paynow)
        ↓
Customer pays (EcoCash/OneMoney/Web)
        ↓
Order confirmed → WhatsApp notification sent
```

---

## 🏗️ API Endpoints

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/products` | List products |
| POST | `/api/v1/products` | Create product (admin) |
| PUT | `/api/v1/products/{id}` | Update product (admin) |
| POST | `/api/v1/products/{id}/publish` | Publish to channels (admin) |
| POST | `/api/v1/products/{id}/images` | Upload image (admin) |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/orders` | List orders (admin) |
| POST | `/api/v1/orders` | Create order |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/payments/initiate` | Start Paynow payment |
| GET | `/api/v1/payments/status/{orderId}` | Check payment status |
| POST | `/api/v1/payments/paynow/callback` | Paynow result webhook |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/v1/webhooks/facebook` | Facebook webhook |
| GET/POST | `/api/v1/webhooks/whatsapp` | WhatsApp webhook |

---

## 🗄️ Database

PostgreSQL with Flyway migrations.

Run migrations:
```bash
cd apps/api && mvn flyway:migrate
```

---

## 🚢 Production Deployment

### Option 1: Railway (Recommended for ZW)
```bash
railway init
railway add postgresql redis
railway up
```

### Option 2: DigitalOcean / VPS
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### For Paynow webhooks in development, use ngrok:
```bash
ngrok http 9090
# Update PAYNOW_RESULT_URL=https://your-ngrok-url.ngrok.io/api/v1/payments/paynow/callback
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 17, Angular Material, NgRx |
| Backend | Spring Boot 3.2, Java 21 |
| Database | PostgreSQL 16 + Redis 7 |
| Payments | Paynow Zimbabwe (EcoCash, OneMoney, Web) |
| Facebook | Meta Commerce Catalog API v18.0 |
| WhatsApp | WhatsApp Business Cloud API v18.0 |
| Build | Nx Mono Repo, Maven |
| Deploy | Docker, Docker Compose |

---

## 📞 Support

- 📧 dev@zimshop.co.zw
- 💬 WhatsApp: +263 77 XXX XXXX
