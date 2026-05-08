# Full Project Setup Guide

This guide will help you get the "University Leadership Appointment Management System" up and running on your local machine.

## Prerequisites

- **Node.js**: v18 or later
- **PostgreSQL**: v14 or later
- **Expo CLI**: `npm install -g expo-cli` (optional, as `npx` is used)
- **Git**

## Backend Setup (Server)

1. **Navigate to the server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env` (already done in this workspace).
   - Update `DATABASE_URL` with your local PostgreSQL credentials.

4. **Initialize the database:**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations to create tables
   npx prisma migrate dev --name init
   
   # Seed the database with demo users
   npx prisma db seed
   ```

5. **Start the server:**
   ```bash
   npm run dev
   ```
   The API will be running at `http://localhost:5000`.

## Frontend Setup (Client)

1. **Navigate to the client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure API URL:**
   - Open `src/utils/constants.js`.
   - Ensure `API_BASE_URL` points to your backend (default is `http://10.0.2.2:5000/api` for Android emulator).

4. **Start the application:**
   ```bash
   npx expo start
   ```

5. **Run on a device/emulator:**
   - Press `a` for Android emulator.
   - Press `i` for iOS simulator (macOS only).
   - Use the Expo Go app on your physical device to scan the QR code.

## Demo Credentials

You can use the following accounts to test different roles:

| Role | Email | Password |
|------|-------|----------|
| Student | student@university.edu | Pass@123 |
| Secretary | secretary@university.edu | Pass@123 |
| Dean | dean@university.edu | Pass@123 |
| President | president@university.edu | Pass@123 |
| Admin | admin@university.edu | Pass@123 |

## Troubleshooting

- **Database Connection**: Ensure PostgreSQL service is running and the credentials in `.env` are correct.
- **Network Issues**: If running on a physical device, ensure your phone and computer are on the same Wi-Fi network and use your computer's local IP address in the API URL.
- **Prisma Errors**: Run `npx prisma generate` whenever you change the schema.
