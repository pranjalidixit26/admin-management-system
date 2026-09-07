# Admin Management System

A full-stack admin panel with role-based access control (users, roles, permissions). Built to learn how React and NestJS actually connect in a real app.

**Stack:** React + TypeScript, NestJS + TypeScript, MySQL (TypeORM), JWT auth

## What works so far

- Login with JWT auth, passwords hashed with bcrypt
- Full CRUD for Users — from the UI and Postman both
- Full CRUD for Roles and Permissions (backend only)
- Users , Roles , Permissions are all connected via many-to-many relations

Not done yet: Roles/Permissions UI, and route protection (right now the API doesn't actually check for a valid token — anyone with the URL can hit it).

## Running it

```bash
cd server && npm install
cd ../client && npm install
```

Create a MySQL database called `admin_management_system` and run `server/database/schema.sql` against it.

Add a `.env` in `server/`:

DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=admin_management_system
JWT_SECRET=anything_random


Then run both:
```bash
cd server && npm run start:dev
cd client && npm run dev
```

Backend: `localhost:3000` · Frontend: `localhost:5173`

## Note

`synchronize` is off in TypeORM — it silently corrupted some data during dev, so schema changes now go through `schema.sql` manually, matched in the entity files by hand.  