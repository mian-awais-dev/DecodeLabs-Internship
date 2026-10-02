# Project 3: Database Integration — Products REST API

A robust, production-grade RESTful Backend API built with **Node.js**, **Express.js**, and a persistent **PostgreSQL** relational database. This is **Project 3: Database Integration**, which builds upon and extends "Project 2: Products REST API" by replacing the in-memory data store with full relational persistence while preserving 100% of the existing API contracts, request/response formats, two-layer validation ("Never Trust the Client"), stateless authentication & RBAC, and error envelopes.

> **Note**: This is a backend-only project. No frontend UI, HTML pages, or visual assets are included.

---

## Table of Contents
1. [Architecture & Folder Structure](#architecture--folder-structure)
2. [Tech Stack](#tech-stack)
3. [Database Integration](#database-integration)
   - [Entity-Relationship Architecture](#entity-relationship-architecture)
   - [Relational Schema Design](#relational-schema-design)
   - [Migration & Seeding Strategy](#migration--seeding-strategy)
   - [Parameterized Queries & SQL Injection Defense](#parameterized-queries--sql-injection-defense)
   - [Database-Specific Error Handling](#database-specific-error-handling)
4. [Getting Started & Installation](#getting-started--installation)
5. [Environment Configuration](#environment-configuration)
6. [Authentication & Authorization](#authentication--authorization)
7. [Validation Strategy ("Never Trust the Client")](#validation-strategy-never-trust-the-client)
8. [Standardized Response Formats](#standardized-response-formats)
9. [HTTP Status Code Reference](#http-status-code-reference)
10. [API Reference & Endpoint Documentation](#api-reference--endpoint-documentation)
    - [GET /health](#1-get-health)
    - [GET /products/categories](#2-get-productscategories)
    - [GET /products](#3-get-products)
    - [GET /products/:id](#4-get-productsid)
    - [POST /products](#5-post-products)
    - [PUT /products/:id](#6-put-productsid)
    - [DELETE /products/:id](#7-delete-productsid)
    - [GET /products/:id/reviews](#8-get-productsidreviews-nested-resource)
    - [POST /products/:id/reviews](#9-post-productsidreviews-nested-resource)
11. [Automated Testing](#automated-testing)
12. [cURL Command Cookbook](#curl-command-cookbook)

---

## Architecture & Folder Structure

The application strictly adheres to modular layering and separation of concerns:
```
Full_Stack_Project_3/
├── .env                              # Local environment variables
├── .env.example                      # Template for environment configuration
├── .gitignore                        # Ignored files for version control
├── package.json                      # Project dependencies and npm scripts
├── README.md                         # Comprehensive API & DB documentation
├── migrations/                       # Plain SQL migration files
│   ├── 001_create_products_table.sql # Products table schema, constraints & indexes
│   ├── 002_create_reviews_table.sql  # Reviews table schema, FK with CASCADE & index
│   ├── 003_seed_data.sql             # SQL seed dataset for initial population
│   └── seed.sql                      # Idempotent seed script (UPSERT)
├── src/
│   ├── app.js                        # Express application setup, security & middleware pipeline
│   ├── server.js                     # Startup DB connection check & server entry point
│   ├── config/
│   │   ├── config.js                 # App configuration & auth credentials
│   │   └── db.js                     # PostgreSQL connection pool (pg.Pool) & query helper
│   ├── constants/
│   │   ├── categories.js             # Allowed category enum list
│   │   └── httpStatusCodes.js        # Standardized HTTP status codes
│   ├── controllers/
│   │   ├── productController.js      # Product CRUD, filtering, pagination, and sorting handlers
│   │   └── reviewController.js       # Nested reviews sub-resource handlers
│   ├── data/
│   │   └── seedProducts.js           # Initial realistic product & review datasets
│   ├── db/
│   │   ├── migrate.js                # Migration runner CLI script (npm run db:migrate)
│   │   ├── seed.js                   # Seed runner CLI script (npm run db:seed)
│   │   └── reset.js                  # Database reset CLI script (npm run db:reset)
│   ├── middlewares/
│   │   ├── auth.js                   # Stateless AuthN (Bearer / x-api-key) & AuthZ (Role checking)
│   │   ├── errorHandler.js           # Error handler mapping Postgres errors (23505, 23503, etc.)
│   │   ├── notFoundHandler.js        # 404 handler for unmatched routes
│   │   ├── rateLimiter.js            # Rate limiter returning 429 Too Many Requests
│   │   └── validation.js             # Two-layer syntactic & semantic validation middlewares
│   ├── models/
│   │   ├── productStore.js           # Product persistence layer with parameterized SQL
│   │   └── reviewStore.js            # Review persistence layer with parameterized SQL
│   ├── routes/
│   │   ├── index.js                  # Root router aggregating /health, /, and /products
│   │   └── productRoutes.js          # RESTful product route definitions
│   └── utils/
│       ├── apiError.js               # Custom HTTP error classes (NotFoundError, ConflictError, etc.)
│       ├── apiResponse.js            # Consistent JSON response envelope helper
│       └── logger.js                 # Structured logger
└── tests/
    ├── auth.test.js                  # AuthN (401) and AuthZ (403/201) automated tests
    ├── databaseIntegration.test.js   # DB tests: unique constraint (409), cascade delete, SQL injection
    ├── errorHandling.test.js         # 404 handler, /health, and metadata tests
    ├── nestedReviews.test.js         # Nested sub-resource (/products/:id/reviews) tests
    ├── products.test.js              # Full CRUD, filtering, search, pagination, and sorting tests
    ├── rateLimit.test.js             # Rate limiting (429) tests
    └── validation.test.js            # Syntactic and semantic validation edge case tests
```

---

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js (v5.x)
- **Database**: PostgreSQL (v14+)
- **Native Driver**: `pg` (node-postgres) with connection pooling via `pg.Pool`
- **Testing Driver / In-Memory Mock**: `pg-mem` for zero-setup local automated testing
- **Security & Resilience**:
  - `helmet`: Secure HTTP headers
  - `cors`: Cross-Origin Resource Sharing
  - `express-rate-limit`: Rate limiting protection against DoS and brute-force
  - `dotenv`: Environment configuration management
- **Testing**:
  - `node:test` + `node:assert`: Built-in Node.js test runner
  - `supertest`: HTTP integration test assertions

---

## Database Integration

### Entity-Relationship Architecture

The database model implements a classic **One-to-Many (1:Many)** relationship between **products** and **reviews**:
- One product can have many reviews ($0 \dots N$).
- Each review belongs to exactly one product via foreign key `reviews.product_id` $\rightarrow$ `products.id`.
- Referential integrity is enforced with `ON DELETE CASCADE`: when a product is deleted, all associated reviews are automatically purged from the database by PostgreSQL, preventing orphaned records.

```
┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
│            products             │                 │             reviews             │
├─────────────────────────────────┼─────────────────┼─────────────────────────────────┤
│ id (PK)            VARCHAR(50)  │ 1             * │ id (PK)            VARCHAR(50)  │
│ name               VARCHAR(100) │ ◄───────────────┤ product_id (FK)    VARCHAR(50)  │
│ description        VARCHAR(500) │                 │ rating             SMALLINT     │
│ price              NUMERIC(10,2)│                 │ comment            VARCHAR(500) │
│ category           VARCHAR(50)  │                 │ author             VARCHAR(50)  │
│ in_stock           BOOLEAN      │                 │ created_at         TIMESTAMPTZ  │
│ created_at         TIMESTAMPTZ  │                 └─────────────────────────────────┘
│ updated_at         TIMESTAMPTZ  │
└─────────────────────────────────┘
```

---

### Relational Schema Design

#### Table: `products`
| Column | PostgreSQL Type | Nullable | Default | Constraints & Indexes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(50)` | **NOT NULL** | None | **PRIMARY KEY** |
| `name` | `VARCHAR(100)` | **NOT NULL** | None | Length 2-100; Part of `UNIQUE (name, category)` |
| `description` | `VARCHAR(500)` | NULL | `''` | Max 500 characters |
| `price` | `NUMERIC(10,2)` | **NOT NULL** | None | `CHECK (price > 0)` |
| `category` | `VARCHAR(50)` | **NOT NULL** | None | `CHECK (category IN ('electronics','clothing','home-kitchen','books','sports','beauty'))` |
| `in_stock` | `BOOLEAN` | **NOT NULL** | `true` | Boolean flag |
| `created_at` | `TIMESTAMPTZ` | **NOT NULL** | `now()` | Set upon record insertion |
| `updated_at` | `TIMESTAMPTZ` | **NOT NULL** | `now()` | Set upon update |

- **Table Constraints**:
  - `CONSTRAINT uq_products_name_category UNIQUE (name, category)`: Enforces business rule preventing duplicate product names within the same category.
- **Indexes**:
  - `CREATE INDEX idx_products_category ON products(category);` (fast category filtering)
  - `CREATE INDEX idx_products_price ON products(price);` (fast price range queries & sorting)

---

#### Table: `reviews`
| Column | PostgreSQL Type | Nullable | Default | Constraints & Indexes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(50)` | **NOT NULL** | None | **PRIMARY KEY** |
| `product_id` | `VARCHAR(50)` | **NOT NULL** | None | **FOREIGN KEY REFERENCES products(id) ON DELETE CASCADE** |
| `rating` | `SMALLINT` | **NOT NULL** | None | `CHECK (rating BETWEEN 1 AND 5)` |
| `comment` | `VARCHAR(500)` | **NOT NULL** | None | `CHECK (length(trim(comment)) > 0)` |
| `author` | `VARCHAR(50)` | **NOT NULL** | `'Anonymous'` | Max 50 characters |
| `created_at` | `TIMESTAMPTZ` | **NOT NULL** | `now()` | Set upon creation |

- **Indexes**:
  - `CREATE INDEX idx_reviews_product_id ON reviews(product_id);` (accelerates nested review lookups for `GET /products/:id/reviews`)

---

### Migration & Seeding Strategy

Schema evolution is managed using plain, numbered SQL migration files under `/migrations`:
- `migrations/001_create_products_table.sql`: Creates `products` table, checks, constraints, and indexes.
- `migrations/002_create_reviews_table.sql`: Creates `reviews` table, foreign key constraint with `ON DELETE CASCADE`, check constraints, and index on `product_id`.
- `migrations/003_seed_data.sql`: Inserts the realistic initial dataset.
- `migrations/seed.sql`: Idempotent upsert seed script.

The project includes CLI scripts and npm shortcuts:
```bash
# Run all pending migrations in alphabetical order
npm run db:migrate

# Seed sample products and reviews
npm run db:seed

# Complete development reset (drops tables, re-runs migrations, and re-seeds)
npm run db:reset
```

---

### Parameterized Queries & SQL Injection Defense

**Why Parameterized Queries?**
SQL Injection occurs when untrusted user input is directly concatenated or interpolated into a SQL command string, allowing an attacker to break out of data literals and execute unintended database commands (e.g. `' OR 1=1 --`, `DROP TABLE`).

**Our Implementation:**
Every database operation strictly utilizes parameterized queries with positional placeholders (`$1`, `$2`, etc.) via the native `pg` driver:
```javascript
// SAFE: Input is bound as a parameter value, NEVER interpolated into SQL
const sql = 'SELECT * FROM products WHERE category = $1';
const result = await query(sql, [category]);
```
- In `productStore.findAll()`, dynamic filter conditions (`category`, `minPrice`, `maxPrice`, `inStock`, `search`) are constructed by appending SQL clauses with `$N` placeholders while pushing the user values into a parallel `params` array.
- In `search` queries, `%` wildcards are concatenated within the parameter value, not inside the SQL string:
  ```javascript
  params.push(`%${search.trim()}%`);
  conditions.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`);
  ```
- Sorting column names are strictly whitelisted against an allowed map (`price`, `name`, `created_at`, `category`) to prevent SQL injection in `ORDER BY` clauses.

---

### Database-Specific Error Handling

PostgreSQL errors are intercepted in `src/middlewares/errorHandler.js` and converted into standardized HTTP responses without leaking raw SQL or database internal details:
| PostgreSQL Error Code | Cause | HTTP Response | Client Message |
| :--- | :--- | :--- | :--- |
| `23505` (`unique_violation`) | Duplicate `(name, category)` | **409 Conflict** | `"A product with this name already exists in this category"` |
| `23503` (`foreign_key_violation`) | Invalid `product_id` reference | **404 Not Found** | `"Referenced resource does not exist"` |
| `23514` (`check_violation`) | Negative price, out-of-range rating | **400 Bad Request** | `"Invalid data: value violates database check constraint"` |
| `ECONNREFUSED` / `08001` / `08006` | PostgreSQL server unreachable | **500 Internal Server Error** | `"Database connection failure: service is temporarily unavailable"` |

---

## Getting Started & Installation

### 1. Prerequisites
- **Node.js**: v18.x or later (`node -v`, `npm -v`)
- **PostgreSQL**: v14+ running locally OR via Docker

#### Option A: Running PostgreSQL via Docker (Fastest)
```bash
docker run --name products-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=products_api_db \
  -p 5432:5432 \
  -d postgres:16-alpine
```

#### Option B: Native PostgreSQL Installation
1. Install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/).
2. Create the application database:
   ```sql
   CREATE DATABASE products_api_db;
   ```

---

### 2. Install Dependencies
```bash
npm install
```

---

### 3. Setup Database Schema & Seed Data
```bash
npm run db:migrate && npm run db:seed
```

---

### 4. Start the Application
- **Development Mode** (with hot reload via Node `--watch`):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```

The server binds to `http://localhost:3000` by default.

---

## Environment Configuration

Configuration is managed via `.env`. A complete template is provided in `.env.example`:

```ini
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=products_api_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
DB_POOL_MAX=20
DB_TIMEOUT_MS=5000

# Rate Limiting (15 minutes window, max 100 requests per IP)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Pre-configured Static Tokens / API Keys
ADMIN_TOKEN=admin-token-secret-123
VIEWER_TOKEN=viewer-token-secret-456
ADMIN_API_KEY=api-key-admin
VIEWER_API_KEY=api-key-viewer
```

---

## Authentication & Authorization

The API is strictly **stateless** — no server-side sessions or cookies. Authentication and authorization are enforced on state-modifying operations (`POST`, `PUT`, `DELETE`).

### Authentication (AuthN)
Credentials can be passed via either:
1. `Authorization: Bearer <token>`
2. `x-api-key: <key>`

If credentials are missing or invalid on protected routes, the API returns **`401 Unauthorized`**.

### Authorization (AuthZ) & Roles
- **`admin`**: Granted full read and write access (`GET`, `POST`, `PUT`, `DELETE`).
- **`viewer`**: Granted read access (`GET`). Attempting `POST`, `PUT`, or `DELETE` returns **`403 Forbidden`**.
- **Public**: `GET /products`, `GET /products/:id`, `GET /products/categories`, `GET /products/:id/reviews`, and `GET /health` require no authentication.

### Demo Credentials
| Role | Bearer Token | Header API Key (`x-api-key`) | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin-token-secret-123` | `api-key-admin` | Full CRUD (Read + Write) |
| **Viewer** | `viewer-token-secret-456` | `api-key-viewer` | Read Only (`GET`) |

---

## Validation Strategy ("Never Trust the Client")

Every incoming request passes through two distinct validation layers before reaching business controllers:

### 1. Syntactic Validation
- Header check: `Content-Type: application/json` required on payload routes (`POST`, `PUT`).
- Request body must be a valid, parsed JSON object (rejects primitives, arrays, nulls).
- Required field presence (`name`, `price`, `category`).
- Type verification (price must be number, inStock must be boolean).

### 2. Semantic Validation
- `name`: 2 to 100 characters; cannot consist solely of whitespace.
- `price`: strictly positive finite number (`> 0`), max \$10,000,000.
- `category`: strictly constrained to whitelist (`electronics`, `clothing`, `home-kitchen`, `books`, `sports`, `beauty`).
- Query parameters: `minPrice <= maxPrice`, valid pagination integers.
- Uniqueness: Prevents duplicate product names within the same category (returns `409 Conflict`).

---

## Standardized Response Formats

Every single endpoint response follows a predictable JSON envelope:

### Success Response (`success: true`)
```json
{
  "success": true,
  "data": { ... },
  "pagination": { ... }
}
```

### Error Response (`success: false`)
```json
{
  "success": false,
  "error": "Human readable error description",
  "details": [
    { "field": "price", "message": "Price must be greater than zero" }
  ]
}
```

---

## HTTP Status Code Reference

| Status | Code | Usage in this API |
| :--- | :--- | :--- |
| **OK** | `200` | Successful retrieval (`GET`) or update (`PUT`) |
| **Created** | `201` | Successful creation (`POST /products`, `POST /products/:id/reviews`) |
| **No Content** | `204` | Successful deletion (`DELETE /products/:id`) |
| **Bad Request** | `400` | Validation failures, malformed JSON, check constraint violation |
| **Unauthorized**| `401` | Missing or invalid Bearer token or API key |
| **Forbidden** | `403` | Authenticated as `viewer` but attempted write operation |
| **Not Found** | `404` | Non-existent route or non-existent entity ID |
| **Conflict** | `409` | Duplicate product in same category (`uq_products_name_category`) |
| **Too Many** | `429` | Exceeded rate limit (100 requests per 15 minutes) |
| **Server Error**| `500` | Database connection error or unhandled exceptions |

---

## API Reference & Endpoint Documentation

### 1. GET /health
- **Description**: Service liveness and readiness probe.
- **Auth**: Public

### 2. GET /products/categories
- **Description**: Returns all allowed category enum values.
- **Auth**: Public

### 3. GET /products
- **Description**: Returns paginated list of products with optional filtering, sorting, and search.
- **Auth**: Public
- **Query Parameters**:
  - `category`: Filter by category (e.g. `electronics`)
  - `minPrice`, `maxPrice`: Filter by price range
  - `inStock`: Filter by boolean status (`true` or `false`)
  - `search`: Case-insensitive substring match on `name` or `description`
  - `sortBy`: `price`, `name`, `createdAt`, or `category` (default: `createdAt`)
  - `order`: `asc` or `desc` (default: `desc`)
  - `page`: Page number (default: `1`)
  - `limit`: Items per page (default: `10`, max: `100`)

### 4. GET /products/:id
- **Description**: Retrieve a single product by ID.
- **Auth**: Public

### 5. POST /products
- **Description**: Create a new product.
- **Auth**: Admin only (`Bearer <ADMIN_TOKEN>` or `x-api-key: <ADMIN_API_KEY>`)

### 6. PUT /products/:id
- **Description**: Update an existing product.
- **Auth**: Admin only

### 7. DELETE /products/:id
- **Description**: Remove a product and its associated reviews (cascade delete).
- **Auth**: Admin only

### 8. GET /products/:id/reviews (Nested Resource)
- **Description**: Retrieve all reviews for a product.
- **Auth**: Public

### 9. POST /products/:id/reviews (Nested Resource)
- **Description**: Add a review for a product.
- **Auth**: Public

---

## Automated Testing

The automated test suite runs via Node.js built-in `node:test` runner. It supports running against live PostgreSQL or an isolated in-memory PostgreSQL instance with zero manual setup.

### Run the Test Suite
```bash
npm test
```

### Test Coverage Highlights (50 Automated Tests Passing)
- **50 automated test assertions** executed across 23 test suites.
- **Database Integration Tests (`tests/databaseIntegration.test.js`)**:
  - **Unique Constraint Violation**: Verifies PostgreSQL error `23505` returns `409 Conflict`.
  - **Cascade Delete Referential Integrity**: Confirms deleting a product automatically purges all associated reviews from the database (`ON DELETE CASCADE`).
  - **Foreign Key Violation**: Verifies posting a review for a non-existent product fails with `404 Not Found` and database foreign key enforcement.
  - **SQL Injection Defense**: Verifies injection payloads (`' OR 1=1 --`, `'; DROP TABLE products; --`) are treated as literal strings and return 0 matching rows without compromising table data.
- **Products CRUD & Filtering (`tests/products.test.js`)**: `GET`, `POST`, `PUT`, `DELETE`, filtering, pagination, sorting, search.
- **Nested Resource Reviews (`tests/nestedReviews.test.js`)**: Review retrieval and creation.
- **Security & RBAC (`tests/auth.test.js`)**: `401 Unauthorized` on missing auth, `403 Forbidden` for viewer role, `201`/`200`/`204` for admin.
- **Validation Layer (`tests/validation.test.js`)**: Syntactic & semantic validation edge cases.
- **Rate Limiter (`tests/rateLimit.test.js`)**: `429 Too Many Requests` threshold verification.
- **System & Error Handling (`tests/errorHandling.test.js`)**: 404 handler, health check, metadata.

---

## cURL Command Cookbook

### 1. Database Setup & Health Check
```bash
# Run migrations and seed
npm run db:migrate && npm run db:seed

# Check server health
curl -s http://localhost:3000/health | jq
```

### 2. Search & Filter Products
```bash
curl -s "http://localhost:3000/products?category=electronics&minPrice=100&maxPrice=1500&sortBy=price&order=asc" | jq
```

### 3. Create a Product (Admin Authenticated)
```bash
curl -s -X POST http://localhost:3000/products \
  -H "Authorization: Bearer admin-token-secret-123" \
  -H "Content-Type: application/json" \
  -d '{"name":"Bose QuietComfort 45","price":279.00,"category":"electronics","inStock":true}' | jq
```

### 4. Create Duplicate Product in Same Category (Expect 409 Conflict)
```bash
curl -s -X POST http://localhost:3000/products \
  -H "Authorization: Bearer admin-token-secret-123" \
  -H "Content-Type: application/json" \
  -d '{"name":"Sony WH-1000XM5 Wireless Headphones","price":399.99,"category":"electronics"}' | jq
```

### 5. Add Nested Review
```bash
curl -s -X POST http://localhost:3000/products/prod_1001/reviews \
  -H "Content-Type: application/json" \
  -d '{"rating":5,"comment":"Exceptional audio quality and comfort!","author":"AudioTester"}' | jq
```

### 6. Delete Product (Cascades to Reviews)
```bash
curl -i -X DELETE http://localhost:3000/products/prod_1001 \
  -H "Authorization: Bearer admin-token-secret-123"
```
