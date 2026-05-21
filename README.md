# AquaConnect — City Water Management System

> A unified platform for city water billing, administration, and mobile access.

## Overview

This repository contains the AquaConnect admin web app (Next.js), a Node.js backend (Express + Prisma), and a Flutter frontend for mobile access. The project provides tools to manage locations, billing, user authentication, and administrative workflows for city water utilities.

## Repository structure

- `updated backend/` — Node.js backend, Prisma schema, migrations, and server code.
- `aquaconnect-admin-main/` — Next.js admin web app (React) for administrators and staff.
- `flutter_frontend/` — Flutter mobile application and platform-specific projects.
- `build/`, `ios/`, `android/`, etc. — build artifacts and platform outputs (generated).

## Key features

- REST API with authentication (JWT)
- Prisma ORM with PostgreSQL support
- Email/OTP flows (SMTP configurable)
- Admin dashboard (Next.js) consuming the backend API
- Flutter mobile client (configurable via `--dart-define`)

## Requirements

- Node.js 18+ (or compatible LTS)
- npm or yarn
- PostgreSQL 12+
- Flutter SDK (for mobile app)

## Environment files

Place runtime environment variables in `updated backend/.env` (never commit secrets). Example templates are provided as `.env.example` files in the relevant folders. Important variables include:

- `DATABASE_URL` — Postgres connection string used by Prisma
- `JWT_SECRET`, `JWT_REFRESH_SECRET` — JWT signing secrets
- `EMAIL_*` — SMTP configuration for sending OTP and notifications
- `NEXT_PUBLIC_API_BASE_URL` — Admin web app API base URL (in `aquaconnect-admin-main/.env.example`)
- `API_BASE_URL` — Used by the Flutter app via `--dart-define` (see Flutter section)

Do NOT commit `.env` files. Use the provided `*.env.example` files to populate local `.env`.

## Backend (updated backend) — Setup & run

1. Change to the backend folder:

   cd "updated backend"

2. Install dependencies:

   npm install

3. Create a `.env` from the example and set values:

   cp .env.example .env

   # Edit .env and set DATABASE_URL, JWT secrets, EMAIL credentials, etc.

4. Generate Prisma client and apply migrations:

   npx prisma generate
   npx prisma migrate dev --name init

5. Start the server (development):

   npm run dev

The server entrypoint is `updated backend/src/server.js`.

## Admin web app (aquaconnect-admin-main)

1. Change to the admin app folder:

   cd aquaconnect-admin-main

2. Install dependencies:

   npm install

3. Configure environment variables (use `.env` or `.env.local`). Example available at `aquaconnect-admin-main/.env.example`.

4. Run the app in development:

   npm run dev

The admin app uses `NEXT_PUBLIC_API_BASE_URL` to locate the backend API.

## Flutter app (flutter_frontend)

The Flutter app reads `API_BASE_URL` from compile-time defines. Example run command:

flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5001

Or build with:

flutter build apk --dart-define=API_BASE_URL=https://api.example.com

An `.env.example` with usage notes is provided in `flutter_frontend/` for reference.

## Database & Prisma

- Prisma schema and migrations live in `updated backend/prisma/`.
- To interact with the database use `npx prisma studio` or `npx prisma migrate dev`.
- Ensure `DATABASE_URL` in the backend `.env` points to a running Postgres instance.

## Testing

- Backend: add and run tests (if present) via `npm test` inside `updated backend`.
- Frontend: run Next.js tests or typechecks as configured.

## Contributing

- Open issues for bugs or feature requests.
- Create pull requests against `main` with clear descriptions and tests where applicable.
- Do not commit secrets; use `.env.example` files and document required values.

## Troubleshooting

- Backend cannot connect to DB: verify `DATABASE_URL` and that Postgres accepts connections.
- Email issues: verify SMTP credentials, host, and that `ENABLE_EMAIL_QUEUE` is set appropriately.
- Flutter networking on emulator: use `10.0.2.2` for Android emulator to reach a host machine service.

## License & Contact

See project maintainers for licensing details. For questions, contact the repository owners or open an issue.
