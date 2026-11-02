# BlogFlow API — Setup Instructions

## Prerequisites

- Node.js v18+
- PostgreSQL 17+
- npm

## 1. Clone & Install

```bash
git clone https://github.com/lakshitha-dev/RBT-month2.git
cd RBT-month2/blog-api
npm install
```

## 2. Environment Variables

Copy the example and fill in your values:

```bash
cp .env.example .env
```

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=blogflow
DB_USER=postgres
DB_PASSWORD=your_password_here

JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=24h
```

## 3. Database Setup

Create the database:

```bash
psql -U postgres -c "CREATE DATABASE blogflow;"
```

Run the migration:

```bash
psql -U postgres -d blogflow -f database/migrations/001_initial_schema.sql
```

Seed sample data (5 users, 20 posts, 50 comments):

```bash
npm run seed
```

Seed credentials — all users have password `password123`:

| Email | Name |
|---|---|
| alice@example.com | Alice Johnson |
| bob@example.com | Bob Smith |
| carol@example.com | Carol Davis |
| dave@example.com | Dave Wilson |
| eve@example.com | Eve Martinez |

## 4. Run the Server

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

Server runs at `http://localhost:3000`

## 5. API Documentation

Swagger UI is available at:

```
http://localhost:3000/api-docs
```

## Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | No | Register new user |
| POST | /api/auth/login | No | Login, returns JWT |

### Users
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/users/me | Yes | Get current user profile |
| PUT | /api/users/me | Yes | Update current user profile |

### Posts
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/posts | No | List posts (paginated, filterable) |
| GET | /api/posts/:id | No | Get single post |
| POST | /api/posts | Yes | Create post |
| PUT | /api/posts/:id | Yes (owner) | Update post |
| DELETE | /api/posts/:id | Yes (owner) | Delete post |

### Comments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/posts/:id/comments | No | List comments for a post |
| POST | /api/posts/:id/comments | Yes | Add comment to a post |
| DELETE | /api/comments/:id | Yes (owner) | Delete own comment |

## Query Parameters — GET /api/posts

| Param | Type | Description |
|---|---|---|
| page | integer | Page number (default: 1) |
| limit | integer | Results per page (default: 10, max: 50) |
| author_id | integer | Filter by author |
| published | boolean | Filter by published status |

## Authentication

All protected routes require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Obtain a token via `POST /api/auth/login`.

## Project Structure

```
blog-api/
├── src/
│   ├── controllers/      # Route handlers
│   ├── middleware/        # auth, validate, errorHandler
│   ├── models/           # DB query functions
│   ├── routes/           # Express routers
│   ├── utils/            # db pool, AppError helper
│   └── app.js            # App entry point
├── database/
│   ├── migrations/       # SQL schema
│   └── seeds/            # Seed script
├── swagger.yaml          # OpenAPI 3.0 spec
├── lakshitha-month2-postman.json
├── .env.example
└── package.json
```

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Auth**: JWT (jsonwebtoken)
- **Password hashing**: bcrypt (10 rounds)
- **Validation**: express-validator
- **Rate limiting**: express-rate-limit (100 req/min)
- **Security**: helmet, cors
- **Docs**: Swagger UI (swagger-ui-express)
