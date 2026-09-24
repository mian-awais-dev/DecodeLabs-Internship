# Project 2: Backend API Development — Products REST API

A simple, robust, production-grade RESTful Backend API built with **Node.js** and **Express.js**. This service acts as the central application nervous system, encapsulating business logic, strict two-layer input validation ("Never Trust the Client"), stateless authentication and authorization, rate limiting, and centralized error handling with uniform JSON envelopes.

> **Note**: This is a backend-only project. No frontend UI, HTML pages, or visual assets are included.

---

## Table of Contents
1. [Architecture & Folder Structure](#architecture--folder-structure)
2. [Tech Stack](#tech-stack)
3. [Getting Started & Installation](#getting-started--installation)
4. [Environment Configuration](#environment-configuration)
5. [Authentication & Authorization](#authentication--authorization)
6. [Data Models & Schema](#data-models--schema)
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

The project follows a clean separation of concerns:
```
Full_Stack_Project_2/
├── .env                         # Local environment variables
├── .env.example                 # Template for environment configuration
├── .gitignore                   # Ignored files for version control
├── package.json                 # Project dependencies and npm scripts
├── README.md                    # Comprehensive API documentation
├── src/
│   ├── app.js                   # Express application setup, security & middleware pipeline
│   ├── server.js                # Server entry point, port binding, and graceful shutdown
│   ├── config/
│   │   └── config.js            # Centralized environment configuration and constants
│   ├── constants/
│   │   ├── categories.js        # Allowed category enum list for semantic validation
│   │   └── httpStatusCodes.js   # Standardized HTTP status codes
│   ├── controllers/
│   │   ├── productController.js # Product CRUD, filtering, pagination, and sorting handlers
│   │   └── reviewController.js  # Nested reviews sub-resource handlers
│   ├── data/
│   │   └── seedProducts.js      # Initial seed dataset with realistic e-commerce products
│   ├── middlewares/
│   │   ├── auth.js              # Stateless AuthN (Bearer / x-api-key) & AuthZ (Role checking)
│   │   ├── errorHandler.js      # Centralized error handler and JSON parse error interceptor
│   │   ├── notFoundHandler.js   # 404 handler for unmatched routes
│   │   ├── rateLimiter.js       # Express rate limiter returning 429 Too Many Requests
│   │   └── validation.js        # Two-layer syntactic & semantic validation middlewares
│   ├── models/
│   │   └── productStore.js      # In-memory thread-safe data store with query/CRUD methods
│   ├── routes/
│   │   ├── index.js             # Root router aggregating /health, /, and /products
│   │   └── productRoutes.js     # RESTful product route definitions and middleware binding
│   └── utils/
│       ├── apiError.js          # Custom HTTP error classes (BadRequestError, NotFoundError, etc.)
│       ├── apiResponse.js       # Consistent JSON response envelope helper
│       └── logger.js            # Structured logger
└── tests/
    ├── auth.test.js             # AuthN (401) and AuthZ (403/201) automated tests
    ├── errorHandling.test.js    # 404 handler, /health, and metadata tests
    ├── nestedReviews.test.js    # Nested sub-resource (/products/:id/reviews) tests
    ├── products.test.js         # Full CRUD, filtering, search, pagination, and sorting tests
    ├── rateLimit.test.js        # Rate limiting (429) tests
    └── validation.test.js       # Syntactic and semantic validation edge case tests
```

---

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js (v5.x)
- **Security & Resilience**:
  - `helmet`: Secure HTTP headers
  - `cors`: Cross-Origin Resource Sharing
  - `express-rate-limit`: Rate limiting protection against DoS and brute-force
  - `dotenv`: Environment configuration management
- **Testing**:
  - `node:test` + `node:assert`: Built-in Node.js test runner
  - `supertest`: HTTP integration test assertions

---

## Getting Started & Installation

### 1. Prerequisites
Ensure you have Node.js (v18.x or later) installed:
```bash
node -v
npm -v
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Server
- **Production Mode**:
  ```bash
  npm start
  ```
- **Development Mode** (with automatic reload on file changes):
  ```bash
  npm run dev
  ```

The server binds to `http://localhost:3000` by default.

---

## Environment Configuration

Configuration is managed via `.env`. A default `.env` is included in the project:

```ini
# Server Configuration
PORT=3000
NODE_ENV=development

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

## Data Models & Schema

### Product Schema
| Field | Type | Required | Description | Constraints / Defaults |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | Auto | Unique identifier | Format: `prod_<hex>` |
| `name` | `string` | **Yes** | Product name | Length: 2 to 100 characters |
| `description` | `string` | No | Detailed description | Maximum 500 characters |
| `price` | `number` | **Yes** | Unit price in USD | Must be positive (`> 0`), finite, max 10,000,000 |
| `category` | `string` | **Yes** | Product category | Whitelist: `electronics`, `clothing`, `home-kitchen`, `books`, `sports`, `beauty` |
| `inStock` | `boolean` | No | Inventory status | Default: `true` |
| `createdAt` | `string` | Auto | ISO 8601 creation timestamp | Set upon creation |
| `updatedAt` | `string` | Auto | ISO 8601 last update timestamp | Updated upon modification |

### Review Schema (Nested Sub-Resource)
| Field | Type | Required | Description | Constraints / Defaults |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | Auto | Unique review ID | Format: `rev_<hex>` |
| `productId` | `string` | Auto | Associated product ID | References valid product |
| `rating` | `number` | **Yes** | Star rating | Integer between 1 and 5 |
| `comment` | `string` | **Yes** | User review text | Non-empty, max 500 characters |
| `author` | `string` | No | Reviewer display name | Max 50 characters, default: `'Anonymous'` |
| `createdAt` | `string` | Auto | ISO 8601 creation timestamp | Set upon creation |

---

## Validation Strategy ("Never Trust the Client")

Every incoming request passes through two distinct validation layers before reaching business controllers:

### 1. Syntactic Validation
- **JSON Content Enforcement**: Validates that mutating requests (`POST`, `PUT`) specify `Content-Type: application/json`.
- **Payload Shape**: Verifies that the body is a non-null JSON object (rejects primitives, arrays, or empty requests).
- **Malformed JSON Handling**: Intercepts `SyntaxError` from body parsing and responds with `400 Bad Request` rather than an unhandled 500 error or HTML error page.
- **Required Fields & Data Types**: Ensures `name` is string, `price` is number, `category` is string, and `inStock` is strictly boolean.

### 2. Semantic Validation
- **Business Boundaries**: `price` must be strictly positive (`> 0`), finite, and within reasonable thresholds.
- **Category Whitelist**: `category` must match one of the predefined values (`electronics`, `clothing`, `home-kitchen`, `books`, `sports`, `beauty`).
- **String Integrity**: `name` cannot be blank or whitespace-only; minimum 2 characters.
- **Duplicate Prevention**: Rejects duplicate products in the same category with `409 Conflict`.
- **Query Filter Logic**: Ensures `minPrice <= maxPrice`, `page >= 1`, `limit` between 1 and 100, and valid sort fields.

When validation fails, a `400 Bad Request` is returned with detailed, actionable error items:
```json
{
  "success": false,
  "error": "Validation failed: Invalid product data",
  "details": [
    {
      "field": "price",
      "message": "Price must be a positive number greater than 0"
    }
  ]
}
```

---

## Standardized Response Formats

All API endpoints return consistent, predictable JSON structures.

### Success Response (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "data": { ... }
}
```

For paginated lists, pagination metadata is attached at top level:
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 8,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### Delete Success Response (`204 No Content`)
- Status code: `204`
- Body: *Empty*

### Error Response (`400`, `401`, `403`, `404`, `409`, `429`, `500`)
```json
{
  "success": false,
  "error": "Human readable description of the error",
  "details": [ ... ]
}
```

---

## HTTP Status Code Reference

| Code | Status | When Used |
| :--- | :--- | :--- |
| **`200 OK`** | Success | Successful `GET` queries, successful `PUT` updates, `/health` check. |
| **`201 Created`** | Created | Successful `POST /products` or `POST /products/:id/reviews`. |
| **`204 No Content`** | No Content | Successful `DELETE /products/:id` (no response body). |
| **`400 Bad Request`** | Client Error | Syntactic/semantic validation failure, malformed JSON, invalid query parameters. |
| **`401 Unauthorized`** | Auth Failure | Missing or invalid `Authorization: Bearer <token>` or `x-api-key`. |
| **`403 Forbidden`** | Forbidden | Valid credentials provided, but user lacks `admin` permission (e.g. `viewer` role). |
| **`404 Not Found`** | Not Found | Requested product ID or API endpoint does not exist. |
| **`409 Conflict`** | Conflict | Duplicate product name within the same category. |
| **`429 Too Many Requests`** | Rate Limit | Request rate threshold exceeded; retry after cooling period. |
| **`500 Internal Server Error`** | Server Error | Unhandled server-side exception intercepted by centralized error handler. |

---

## API Reference & Endpoint Documentation

### Base URLs
- Standard: `http://localhost:3000`
- Versioned: `http://localhost:3000/api/v1`

---

### 1. GET /health
Retrieves the real-time operational status of the API server.

- **Method**: `GET`
- **Path**: `/health`
- **Access**: Public
- **Status Codes**: `200 OK`

#### Example Request:
```bash
curl -X GET http://localhost:3000/health
```

#### Example Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-09-24T06:30:00.000Z",
    "uptime": 120,
    "nodeVersion": "v24.21.0",
    "environment": "development"
  }
}
```

---

### 2. GET /products/categories
Retrieves the list of valid, whitelisted categories for products.

- **Method**: `GET`
- **Path**: `/products/categories`
- **Access**: Public
- **Status Codes**: `200 OK`

#### Example Request:
```bash
curl -X GET http://localhost:3000/products/categories
```

#### Example Response (`200 OK`):
```json
{
  "success": true,
  "data": [
    "electronics",
    "clothing",
    "home-kitchen",
    "books",
    "sports",
    "beauty"
  ]
}
```

---

### 3. GET /products
Retrieves a paginated list of products with optional filtering, full-text search, and sorting. Safe and idempotent.

- **Method**: `GET`
- **Path**: `/products`
- **Access**: Public
- **Query Parameters**:
  - `category` (string, optional): Filter by category (e.g. `electronics`)
  - `minPrice` (number, optional): Minimum price threshold (e.g. `50`)
  - `maxPrice` (number, optional): Maximum price threshold (e.g. `500`)
  - `inStock` (boolean string, optional): Filter by stock availability (`true` or `false`)
  - `search` (string, optional): Case-insensitive search on `name` and `description`
  - `sortBy` (string, optional): Sort field (`price`, `name`, `createdAt`, `category`). Default: `createdAt`
  - `order` (string, optional): Sort direction (`asc` or `desc`). Default: `desc`
  - `page` (integer, optional): Page number (min: 1). Default: `1`
  - `limit` (integer, optional): Items per page (min: 1, max: 100). Default: `10`
- **Status Codes**:
  - `200 OK`: Successful retrieval
  - `400 Bad Request`: Invalid query parameters (e.g. `minPrice > maxPrice`, non-numeric limit)

#### Example Request:
```bash
curl -X GET "http://localhost:3000/products?category=electronics&minPrice=100&sortBy=price&order=asc"
```

#### Example Response (`200 OK`):
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_1001",
      "name": "Sony WH-1000XM5 Wireless Headphones",
      "description": "Industry-leading noise canceling with two processors and 8 microphones.",
      "price": 399.99,
      "category": "electronics",
      "inStock": true,
      "createdAt": "2026-01-15T08:30:00.000Z",
      "updatedAt": "2026-01-15T08:30:00.000Z"
    },
    {
      "id": "prod_1002",
      "name": "Apple MacBook Air M3",
      "description": "13-inch laptop with 8-core CPU, 10-core GPU, and 16GB unified memory.",
      "price": 1099,
      "category": "electronics",
      "inStock": true,
      "createdAt": "2026-01-20T10:15:00.000Z",
      "updatedAt": "2026-01-20T10:15:00.000Z"
    }
  ],
  "pagination": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

### 4. GET /products/:id
Retrieves a single product by its unique identifier. Safe and idempotent.

- **Method**: `GET`
- **Path**: `/products/:id`
- **Access**: Public
- **URL Parameters**:
  - `id` (string, required): Product unique identifier (e.g. `prod_1001`)
- **Status Codes**:
  - `200 OK`: Product found
  - `404 Not Found`: Product ID does not exist

#### Example Request:
```bash
curl -X GET http://localhost:3000/products/prod_1001
```

#### Example Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "id": "prod_1001",
    "name": "Sony WH-1000XM5 Wireless Headphones",
    "description": "Industry-leading noise canceling with two processors and 8 microphones.",
    "price": 399.99,
    "category": "electronics",
    "inStock": true,
    "createdAt": "2026-01-15T08:30:00.000Z",
    "updatedAt": "2026-01-15T08:30:00.000Z"
  }
}
```

#### Example Error Response (`404 Not Found`):
```json
{
  "success": false,
  "error": "Product with ID 'prod_9999' not found"
}
```

---

### 5. POST /products
Creates a new product record. Unsafe and non-idempotent.

- **Method**: `POST`
- **Path**: `/products`
- **Access**: Protected (Requires `admin` role)
- **Headers**:
  - `Content-Type: application/json` (Required)
  - `Authorization: Bearer admin-token-secret-123` (or `x-api-key: api-key-admin`)
- **Request Body**:
  ```json
  {
    "name": "Logitech MX Master 3S Mouse",
    "description": "Quiet clicks and 8K DPI any-surface tracking.",
    "price": 99.99,
    "category": "electronics",
    "inStock": true
  }
  ```
- **Status Codes**:
  - `201 Created`: Successfully created
  - `400 Bad Request`: Validation failure or malformed payload
  - `401 Unauthorized`: Missing or invalid token/API key
  - `403 Forbidden`: Authenticated as non-admin (e.g. `viewer`)
  - `409 Conflict`: Duplicate product name in the same category

#### Example Request:
```bash
curl -X POST http://localhost:3000/products \
  -H "Authorization: Bearer admin-token-secret-123" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Logitech MX Master 3S Mouse",
    "description": "Quiet clicks and 8K DPI any-surface tracking.",
    "price": 99.99,
    "category": "electronics",
    "inStock": true
  }'
```

#### Example Response (`201 Created`):
```json
{
  "success": true,
  "data": {
    "id": "prod_d9a8f273b140",
    "name": "Logitech MX Master 3S Mouse",
    "description": "Quiet clicks and 8K DPI any-surface tracking.",
    "price": 99.99,
    "category": "electronics",
    "inStock": true,
    "createdAt": "2026-09-24T06:35:00.000Z",
    "updatedAt": "2026-09-24T06:35:00.000Z"
  }
}
```

---

### 6. PUT /products/:id
Updates/replaces an existing product record. Idempotent.

- **Method**: `PUT`
- **Path**: `/products/:id`
- **Access**: Protected (Requires `admin` role)
- **Headers**:
  - `Content-Type: application/json` (Required)
  - `Authorization: Bearer admin-token-secret-123` (or `x-api-key: api-key-admin`)
- **URL Parameters**:
  - `id` (string, required): Product ID to update
- **Request Body**:
  ```json
  {
    "name": "Sony WH-1000XM5 Wireless Headphones (Midnight Silver)",
    "description": "Special edition midnight silver finish.",
    "price": 379.99,
    "category": "electronics",
    "inStock": true
  }
  ```
- **Status Codes**:
  - `200 OK`: Successfully updated
  - `400 Bad Request`: Validation failure or malformed payload
  - `401 Unauthorized`: Missing or invalid token/API key
  - `403 Forbidden`: Insufficient permissions (`viewer` role)
  - `404 Not Found`: Product ID not found
  - `409 Conflict`: New name conflicts with another product in category

#### Example Request:
```bash
curl -X PUT http://localhost:3000/products/prod_1001 \
  -H "Authorization: Bearer admin-token-secret-123" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sony WH-1000XM5 Wireless Headphones (Midnight Silver)",
    "description": "Special edition midnight silver finish.",
    "price": 379.99,
    "category": "electronics",
    "inStock": true
  }'
```

#### Example Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "id": "prod_1001",
    "name": "Sony WH-1000XM5 Wireless Headphones (Midnight Silver)",
    "description": "Special edition midnight silver finish.",
    "price": 379.99,
    "category": "electronics",
    "inStock": true,
    "createdAt": "2026-01-15T08:30:00.000Z",
    "updatedAt": "2026-09-24T06:36:12.000Z"
  }
}
```

---

### 7. DELETE /products/:id
Removes a product and its associated reviews. Idempotent.

- **Method**: `DELETE`
- **Path**: `/products/:id`
- **Access**: Protected (Requires `admin` role)
- **Headers**:
  - `Authorization: Bearer admin-token-secret-123` (or `x-api-key: api-key-admin`)
- **URL Parameters**:
  - `id` (string, required): Product ID to delete
- **Status Codes**:
  - `204 No Content`: Successfully deleted (no body returned)
  - `401 Unauthorized`: Missing or invalid authentication
  - `403 Forbidden`: Insufficient permissions (`viewer` role)
  - `404 Not Found`: Product ID does not exist

#### Example Request:
```bash
curl -i -X DELETE http://localhost:3000/products/prod_1001 \
  -H "Authorization: Bearer admin-token-secret-123"
```

#### Example Response (`204 No Content`):
```http
HTTP/1.1 204 No Content
```

---

### 8. GET /products/:id/reviews (Nested Resource)
Retrieves all customer reviews submitted for a specific product. Safe and idempotent.

- **Method**: `GET`
- **Path**: `/products/:id/reviews`
- **Access**: Public
- **URL Parameters**:
  - `id` (string, required): Product ID
- **Status Codes**:
  - `200 OK`: Reviews retrieved
  - `404 Not Found`: Product ID does not exist

#### Example Request:
```bash
curl -X GET http://localhost:3000/products/prod_1001/reviews
```

#### Example Response (`200 OK`):
```json
{
  "success": true,
  "data": [
    {
      "id": "rev_2001",
      "productId": "prod_1001",
      "rating": 5,
      "author": "AudioPhile99",
      "comment": "Exceptional ANC quality and comfortable for long flights.",
      "createdAt": "2026-02-01T15:00:00.000Z"
    }
  ]
}
```

---

### 9. POST /products/:id/reviews (Nested Resource)
Submits a new review for a specified product. Unsafe and non-idempotent.

- **Method**: `POST`
- **Path**: `/products/:id/reviews`
- **Access**: Public
- **Headers**:
  - `Content-Type: application/json`
- **URL Parameters**:
  - `id` (string, required): Product ID
- **Request Body**:
  ```json
  {
    "rating": 5,
    "comment": "Incredible sound quality and battery life!",
    "author": "HappyCustomer"
  }
  ```
- **Status Codes**:
  - `201 Created`: Review submitted successfully
  - `400 Bad Request`: Invalid review payload (e.g. rating not 1–5, empty comment)
  - `404 Not Found`: Product ID does not exist

#### Example Request:
```bash
curl -X POST http://localhost:3000/products/prod_1001/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "comment": "Incredible sound quality and battery life!",
    "author": "HappyCustomer"
  }'
```

#### Example Response (`201 Created`):
```json
{
  "success": true,
  "data": {
    "id": "rev_3910cbe2",
    "productId": "prod_1001",
    "rating": 5,
    "author": "HappyCustomer",
    "comment": "Incredible sound quality and battery life!",
    "createdAt": "2026-09-24T06:37:00.000Z"
  }
}
```

---

## Automated Testing

A comprehensive integration test suite is implemented using Node's built-in `node:test` and `supertest`.

### Run the Test Suite
```bash
npm test
```

### Test Coverage Highlights
- **43 automated test assertions** executed across 18 test suites in ~1.1 seconds.
- **CRUD Operations**: Verification of `200`, `201`, `204`, and `404` status codes for all product operations.
- **Syntactic Validation**: Checks missing required fields, invalid types (string prices, non-boolean inStock), and Content-Type header checks.
- **Semantic Validation**: Rejects negative/zero prices, unapproved categories, and blank names.
- **Malformed JSON**: Catches broken JSON payloads and gracefully returns `400 Bad Request`.
- **Security & RBAC**:
  - Missing token/API key $\rightarrow$ `401 Unauthorized`.
  - Viewer role on write operations $\rightarrow$ `403 Forbidden`.
  - Admin token & admin API key $\rightarrow$ `201 Created` / `200 OK` / `204 No Content`.
- **Nested Resources**: Tests review retrieval and submission, plus 404 on invalid parent ID.
- **Resilience**: Rate limiting threshold triggers `429 Too Many Requests`.

---

## cURL Command Cookbook

You can copy and paste these commands directly into your terminal to test every scenario:

### 1. Retrieve all products
```bash
curl -s http://localhost:3000/products | jq
```

### 2. Search & Filter products
```bash
curl -s "http://localhost:3000/products?category=electronics&minPrice=100&maxPrice=1500&sortBy=price&order=asc" | jq
```

### 3. Create a product (Admin Authenticated)
```bash
curl -s -X POST http://localhost:3000/products \
  -H "Authorization: Bearer admin-token-secret-123" \
  -H "Content-Type: application/json" \
  -d '{"name":"Bose QuietComfort 45","price":279.00,"category":"electronics","inStock":true}' | jq
```

### 4. Create product with Missing Authentication (Expect 401 Unauthorized)
```bash
curl -s -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Unauthenticated Item","price":50,"category":"books"}' | jq
```

### 5. Create product with Viewer Role (Expect 403 Forbidden)
```bash
curl -s -X POST http://localhost:3000/products \
  -H "Authorization: Bearer viewer-token-secret-456" \
  -H "Content-Type: application/json" \
  -d '{"name":"Forbidden Item","price":50,"category":"books"}' | jq
```

### 6. Create product with Invalid Negative Price (Expect 400 Bad Request)
```bash
curl -s -X POST http://localhost:3000/products \
  -H "Authorization: Bearer admin-token-secret-123" \
  -H "Content-Type: application/json" \
  -d '{"name":"Invalid Price Item","price":-10.00,"category":"books"}' | jq
```

### 7. Update an existing product
```bash
curl -s -X PUT http://localhost:3000/products/prod_1001 \
  -H "x-api-key: api-key-admin" \
  -H "Content-Type: application/json" \
  -d '{"name":"Sony WH-1000XM5 Wireless Headphones (Upgraded)","price":389.99,"category":"electronics","inStock":true}' | jq
```

### 8. Delete a product (Expect 204 No Content)
```bash
curl -i -X DELETE http://localhost:3000/products/prod_1001 \
  -H "Authorization: Bearer admin-token-secret-123"
```

### 9. Request a non-existent product (Expect 404 Not Found)
```bash
curl -s http://localhost:3000/products/prod_invalid_id | jq
```

### 10. Fetch nested reviews
```bash
curl -s http://localhost:3000/products/prod_1002/reviews | jq
```
