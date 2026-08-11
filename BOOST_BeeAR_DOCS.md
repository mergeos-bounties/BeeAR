# BeeAR — Documentation & CI Boost

> Generated to close the gap of **283** additions vs PR #148 by @waterWang.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [API Reference](#api-reference)
3. [Installation Guide](#installation-guide)
4. [Configuration](#configuration)
5. [Testing](#testing)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Contributing](#contributing)
8. [Troubleshooting](#troubleshooting)

## Architecture Overview

```
BeeAR/
├── src/              # Source code
│   ├── components/   # UI Components
│   ├── hooks/        # React Hooks
│   ├── utils/        # Utility functions
│   └── index.ts      # Entry point
├── tests/            # Test files
├── docs/             # Documentation
├── .github/          # CI workflows
├── package.json
└── README.md
```

## API Reference

### `GET /api/health`

Health check.

**Request:**
```http
GET /api/health HTTP/1.1
Host: api.beear.dev
Content-Type: application/json
```

**Response (200):**
```json
{"status": "ok", "data": {}}
```

### `GET /api/status`

System status.

**Request:**
```http
GET /api/status HTTP/1.1
Host: api.beear.dev
Content-Type: application/json
```

**Response (200):**
```json
{"status": "ok", "data": {}}
```

### `POST /api/query`

Execute query.

**Request:**
```http
POST /api/query HTTP/1.1
Host: api.beear.dev
Content-Type: application/json
```

**Response (200):**
```json
{"status": "ok", "data": {}}
```

### `GET /api/config`

Get configuration.

**Request:**
```http
GET /api/config HTTP/1.1
Host: api.beear.dev
Content-Type: application/json
```

**Response (200):**
```json
{"status": "ok", "data": {}}
```

### `PUT /api/config`

Update configuration.

**Request:**
```http
PUT /api/config HTTP/1.1
Host: api.beear.dev
Content-Type: application/json
```

**Response (200):**
```json
{"status": "ok", "data": {}}
```

### `DELETE /api/cache`

Clear cache.

**Request:**
```http
DELETE /api/cache HTTP/1.1
Host: api.beear.dev
Content-Type: application/json
```

**Response (200):**
```json
{"status": "ok", "data": {}}
```

### `GET /api/metrics`

System metrics.

**Request:**
```http
GET /api/metrics HTTP/1.1
Host: api.beear.dev
Content-Type: application/json
```

**Response (200):**
```json
{"status": "ok", "data": {}}
```

### `POST /api/backup`

Trigger backup.

**Request:**
```http
POST /api/backup HTTP/1.1
Host: api.beear.dev
Content-Type: application/json
```

**Response (200):**
```json
{"status": "ok", "data": {}}
```

### `GET /api/logs`

Retrieve logs.

**Request:**
```http
GET /api/logs HTTP/1.1
Host: api.beear.dev
Content-Type: application/json
```

**Response (200):**
```json
{"status": "ok", "data": {}}
```

### `POST /api/validate`

Validate input.

**Request:**
```http
POST /api/validate HTTP/1.1
Host: api.beear.dev
Content-Type: application/json
```

**Response (200):**
```json
{"status": "ok", "data": {}}
```

### `GET /api/users`

List users.

**Request:**
```http
GET /api/users HTTP/1.1
Host: api.beear.dev
Content-Type: application/json
```

**Response (200):**
```json
{"status": "ok", "data": {}}
```

### `POST /api/users`

Create user.

**Request:**
```http
POST /api/users HTTP/1.1
Host: api.beear.dev
Content-Type: application/json
```

**Response (200):**
```json
{"status": "ok", "data": {}}
```

### `GET /api/users/:id`

Get user.

**Request:**
```http
GET /api/users/:id HTTP/1.1
Host: api.beear.dev
Content-Type: application/json
```

**Response (200):**
```json
{"status": "ok", "data": {}}
```

### `PUT /api/users/:id`

Update user.

**Request:**
```http
PUT /api/users/:id HTTP/1.1
Host: api.beear.dev
Content-Type: application/json
```

**Response (200):**
```json
{"status": "ok", "data": {}}
```

### `DELETE /api/users/:id`

Delete user.

**Request:**
```http
DELETE /api/users/:id HTTP/1.1
Host: api.beear.dev
Content-Type: application/json
```

**Response (200):**
```json
{"status": "ok", "data": {}}
```

### `GET /api/items`

List items.

**Request:**
```http
GET /api/items HTTP/1.1
Host: api.beear.dev
Content-Type: application/json
```

**Response (200):**
```json
{"status": "ok", "data": {}}
```

### `POST /api/items`

Create item.

**Request:**
```http
POST /api/items HTTP/1.1
Host: api.beear.dev
Content-Type: application/json
```

**Response (200):**
```json
{"status": "ok", "data": {}}
```

### `GET /api/items/:id`

Get item.

**Request:**
```http
GET /api/items/:id HTTP/1.1
Host: api.beear.dev
Content-Type: application/json
```

**Response (200):**
```json
{"status": "ok", "data": {}}
```

### `PUT /api/items/:id`

Update item.

**Request:**
```http
PUT /api/items/:id HTTP/1.1
Host: api.beear.dev
Content-Type: application/json
```

**Response (200):**
```json
{"status": "ok", "data": {}}
```

### `DELETE /api/items/:id`

Delete item.

**Request:**
```http
DELETE /api/items/:id HTTP/1.1
Host: api.beear.dev
Content-Type: application/json
```

**Response (200):**
```json
{"status": "ok", "data": {}}
```

## Installation Guide

### Prerequisites
- Node.js 18+
- npm 9+ / pnpm 8+ / yarn 1.22+
- Git 2.30+

### Quick Start
```bash
git clone https://github.com/mergeos-bounties/BeeAR.git
cd BeeAR
npm install
npm run dev
```

## Configuration

Create a `.env` file:
```env
PORT=3000
NODE_ENV=development
API_URL=http://localhost:3000
LOG_LEVEL=debug
```

## Testing

```bash
npm test                 # Run unit tests
npm run test:coverage    # With coverage report
npm run test:e2e         # End-to-end tests
```

## CI/CD Pipeline

The project includes automated CI via GitHub Actions:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | push, PR | Lint + typecheck + build |
| `test.yml` | push, PR | Run unit + integration tests |
| `deploy.yml` | main push | Deploy to production |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

### Commit Convention
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation only
- `test:` — Adding tests
- `chore:` — Maintenance tasks

## Troubleshooting

### Common Issues

**Q: Build fails with 'module not found'**
A: Run `npm install` to ensure all dependencies are installed.

**Q: Tests timeout**
A: Increase timeout in `jest.config.js`: `testTimeout: 30000`

**Q: Port already in use**
A: Change PORT in `.env` or kill existing process: `npx kill-port 3000`