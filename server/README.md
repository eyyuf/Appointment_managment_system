# University Appointment Server

Backend API for the University Leadership Appointment Management System. This service handles authentication, appointment workflows, notifications, calendars, users, and Socket.IO events for real-time updates.

## What this service includes

- JWT-based authentication with account re-checks against the database
- Role-based access control for admin, secretary, leadership, and student workflows
- Appointment lifecycle management: submit, review, forward, approve, reject, cancel, reschedule
- Notification storage and read-state updates
- Calendar endpoints for month and day views
- Prisma + PostgreSQL data layer
- Socket.IO server for real-time updates

## Tech Stack

- Node.js + Express
- Prisma + PostgreSQL
- JWT authentication
- Socket.IO
- Nodemailer
- Firebase Admin SDK
- Jest + Supertest

## Prerequisites

- Node.js 18+
- PostgreSQL database
- A configured `.env` file

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your environment file from the sample:

```bash
cp .env.example .env
```

3. Update the database, JWT, email, Firebase, and client URL values in `.env`.

4. Run Prisma migrations:

```bash
npx prisma migrate dev
```

5. Generate the Prisma client if needed:

```bash
npx prisma generate
```

6. Start the server:

```bash
npm run dev
```

## Environment Variables

The server reads these values from `.env`:

- `PORT` - application port, defaults to `5000`
- `NODE_ENV` - runtime mode, defaults to `development`
- `DATABASE_URL` - pooled PostgreSQL connection for the app
- `DIRECT_URL` - direct PostgreSQL connection for Prisma migrations
- `JWT_SECRET` - access token signing secret
- `JWT_REFRESH_SECRET` - refresh token signing secret
- `JWT_EXPIRES_IN` - access token lifetime, defaults to `15m`
- `JWT_REFRESH_EXPIRES_IN` - refresh token lifetime, defaults to `7d`
- `BCRYPT_ROUNDS` - password hashing rounds, defaults to `12`
- `CLIENT_URL` - allowed frontend origin for CORS
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` - SMTP settings
- `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL` - Firebase Admin SDK settings
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` - global rate limiting settings

The sample values in `.env.example` are placeholders and should be replaced before production use.

## Available Scripts

- `npm run dev` - start the server with nodemon
- `npm start` - start the production server
- `npm test` - run the test suite
- `npm run test:coverage` - run tests with coverage
- `npm run prisma:migrate` - run Prisma migrations
- `npm run prisma:seed` - seed the database
- `npm run prisma:studio` - open Prisma Studio
- `npm run lint` - lint the source files
- `npm run format` - format the source files

## Running the API

When the server starts successfully it exposes:

- `GET /health` - health check
- `GET /api/...` - versioned API routes

The server also starts Socket.IO on the same HTTP server instance.

## Authentication Flow

- `POST /api/auth/login` - authenticate a user
- `POST /api/auth/logout` - logout current user
- `GET /api/auth/me` - get the current authenticated user
- `PUT /api/auth/change-password` - change password
- `PUT /api/auth/fcm-token` - update Firebase Cloud Messaging token
- `POST /api/auth/register` - create a new user, restricted to `ADMIN`

Authentication middleware verifies the bearer token, loads the latest user from the database, and rejects inactive or missing accounts.

## Roles

The system supports these roles:

- `STUDENT`
- `SECRETARY`
- `DEPARTMENT_HEAD`
- `DEAN`
- `VICE_PRESIDENT`
- `PRESIDENT`
- `ADMIN`

## API Overview

### Appointments

Base path: `/api/appointments`

- `GET /departments` - list departments
- `POST /` - create an appointment, `STUDENT` only
- `GET /` - list appointments for the current user
- `GET /slots/:leaderId` - list available leader slots
- `GET /:id` - get a single appointment
- `POST /:id/review` - mark appointment under review, `SECRETARY` only
- `POST /:id/forward` - forward appointment to a leader, `SECRETARY` only
- `POST /:id/reject` - reject appointment, secretary or leadership roles
- `POST /:id/approve` - approve appointment, leadership roles and `ADMIN`
- `POST /:id/cancel` - cancel appointment
- `POST /:id/reschedule` - request reschedule

### Users

Base path: `/api/users`

- `GET /leaders` - list leaders for authenticated users
- `PUT /profile` - update the current profile
- `GET /` - list all users, `ADMIN` only
- `GET /:id` - get a user, `ADMIN` or `SECRETARY`
- `PUT /:id/toggle-active` - activate or deactivate a user, `ADMIN` only

### Notifications

Base path: `/api/notifications`

- `GET /` - list notifications for the current user
- `PUT /read-all` - mark all notifications read
- `PUT /:id/read` - mark one notification read
- `DELETE /:id` - delete a notification

### Calendar

Base path: `/api/calendar`

- `GET /` - get monthly calendar data
- `GET /day` - get day view data

## Appointment Workflow

1. A student creates an appointment request.
2. A secretary reviews the request and marks it `UNDER_REVIEW`.
3. The secretary forwards it to a specific leader.
4. The leader approves or rejects the forwarded appointment.
5. Appointments may also be cancelled or rescheduled as needed.

## Database Schema Notes

The Prisma schema defines these main entities:

- `User`
- `Appointment`
- `RescheduleRequest`
- `Notification`
- `AuditLog`

## Health Check

Use this endpoint to confirm the server is up:

```bash
GET /health
```

It returns the service status, environment, and timestamp.

## Tests

Run the test suite with:

```bash
npm test
```

## Notes

- The server uses rate limiting on all `/api/` routes, with stricter limits on authentication endpoints.
- CORS is configured from `CLIENT_URL` in production and allows local development origins when `NODE_ENV=development`.
- Passwords are stored using bcrypt, and token validation happens against both JWT claims and the current user state in the database.
