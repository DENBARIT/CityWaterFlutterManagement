# AquaConnect — City Water Management System

> A unified platform for city water billing, administration, and mobile access.

## Overview

AquaConnect is a comprehensive water utility management platform designed for city and municipal water service providers. The system consists of:

- Admin Web Portal built with Next.js for utility staff and administrators.
- Backend API built with Node.js, Express, and Prisma ORM.
- Mobile Application built with Flutter for customers and field personnel.

The platform streamlines customer management, billing operations, water consumption tracking, authentication, reporting, and administrative workflows.

---

## Screenshots

<p align="center">
  <img src="screenshots/photo_1_2026-05-21_16-54-49.jpg" width="220">
  <img src="screenshots/photo_2_2026-05-21_16-54-49.jpg" width="220">
  <img src="screenshots/photo_3_2026-05-21_16-54-49.jpg" width="220">
  <img src="screenshots/photo_4_2026-05-21_16-54-49.jpg" width="220">
   <img src="screenshots/photo_5_2026-05-21_16-54-49.jpg" width="220">
  <img src="screenshots/photo_6_2026-05-21_16-54-49.jpg" width="220">
  <img src="screenshots/photo_7_2026-05-21_16-54-49.jpg" width="220">
  <img src="screenshots/photo_8_2026-05-21_16-54-49.jpg" width="220">
  <img src="screenshots/photo_9_2026-05-21_16-54-50.jpg" width="220">
  <img src="screenshots/photo_10_2026-05-21_16-54-50.jpg" width="220">
</p>

---

## Key Features

### Administration

- User and role management
- Service area/location management
- Customer account administration
- Administrative dashboard and reporting

### Billing System

- Water billing generation
- Payment tracking and history
- Outstanding balance monitoring
- Invoice and billing record management

### Authentication & Security

- JWT-based authentication
- Refresh token support
- OTP verification via email
- Role-based access control

### Mobile Access

- Customer account access
- Billing information viewing
- Water account monitoring
- Mobile-friendly user experience

### Backend Services

- RESTful API architecture
- Prisma ORM integration
- PostgreSQL database support
- Email notification services
- Secure authentication flows

---

## Repository Structure

.
├── updated backend/
│   ├── prisma/
│   ├── src/
│   └── .env.example
│
├── aquaconnect-admin-main/
│   ├── src/
│   ├── public/
│   └── .env.example
│
├── flutter_frontend/
│   ├── lib/
│   ├── android/
│   ├── ios/
│   └── .env.example
│
└── screenshots/
    ├── photo_1_2026-05-21_16-54-49.jpg
    ├── ...
    └── photo_10_2026-05-21_16-54-50.jpg

---

## Technology Stack

### Backend

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Nodemailer

### Frontend (Admin Portal)

- Next.js
- React
- TypeScript / JavaScript
- Tailwind CSS

### Mobile Application

- Flutter
- Dart

### Database

- PostgreSQL

---

## Requirements

### Backend

- Node.js 18+
- npm or yarn
- PostgreSQL 12+

### Mobile App

- Flutter SDK
- Android Studio / Xcode

---

## Environment Configuration

Create environment files based on the provided examples.

### Backend

Location:

updated backend/.env

Important variables:

DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=

EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=

### Admin Portal

Location:

aquaconnect-admin-main/.env.local

Example:

NEXT_PUBLIC_API_BASE_URL=http://localhost:5001

### Flutter Application

API URL is supplied using Dart defines:

flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5001

Production:

flutter build apk \
--dart-define=API_BASE_URL=https://api.example.com

---

# Backend Setup

Navigate to backend:

cd "updated backend"

Install dependencies:

npm install

Create environment file:

cp .env.example .env

Generate Prisma client:

npx prisma generate

Run migrations:

npx prisma migrate dev --name init

Start development server:

npm run dev

Server entry point:

updated backend/src/server.js

---

# Admin Portal Setup

Navigate to admin application:

cd aquaconnect-admin-main

Install dependencies:

npm install

Configure environment variables.