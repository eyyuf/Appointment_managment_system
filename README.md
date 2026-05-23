# University Leadership Appointment Management System

A production-ready full-stack mobile application for managing appointments across university leadership hierarchy.

## Project Structure

```
appointment-management-system/
├── client/          # React Native (Expo) Mobile App
├── server/          # Express.js Backend API
├── docs/            # Documentation
├── database/        # SQL schema, seeds, ERD
├── README.md
└── .gitignore
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native + Expo |
| Navigation | React Navigation v6 |
| State | Context API |
| HTTP | Axios |
| Backend | Node.js + Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT + bcrypt |
| Push Notif | Firebase Cloud Messaging |

## Roles

| Role | Code |
|------|------|
| Student / Visitor | `STUDENT` |
| Secretary | `SECRETARY` |
| Department Head | `DEPARTMENT_HEAD` |
| Dean | `DEAN` |
| Vice President | `VICE_PRESIDENT` |
| President | `PRESIDENT` |
| Administrator | `ADMIN` |

## Quick Start

### 1. Database Setup
```bash
# Install & start PostgreSQL, then:
createdb university_appointments
cd server
npx prisma migrate dev
npx prisma db seed
```

### 2. Backend
```bash
cd server
cp .env.example .env   # fill values
npm install
npm run dev
```

### 3. Mobile App
```bash
cd client
npm install
npx expo start
```

Scan the QR code with Expo Go on your Android/iOS device.


## Sample Accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@university.edu | Admin@123 |
| President | president@university.edu | Pass@123 |
| VP | vp@university.edu | Pass@123 |
| Dean | dean@university.edu | Pass@123 |
| Dept Head | depthead@university.edu | Pass@123 |
| Secretary | secretary@university.edu | Pass@123 |
| Student | student@university.edu | Pass@123 |

## API Base URL:

```
http://localhost:5000/api
```

## Build Android APK:

```bash
cd client
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

you can See `docs/apk-build-guide.md` for detailed instructions.
