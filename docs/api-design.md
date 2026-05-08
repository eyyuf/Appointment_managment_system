# API Documentation

**Base URL:** `http://localhost:5000/api`

All protected routes require header: `Authorization: Bearer <access_token>`

---

## Auth Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login |
| POST | `/auth/logout` | ✅ | Logout |
| GET | `/auth/me` | ✅ | Get current user |
| PUT | `/auth/change-password` | ✅ | Change password |
| PUT | `/auth/fcm-token` | ✅ | Update push token |

### POST /auth/register
```json
{
  "fullName": "John Doe",
  "email": "john@university.edu",
  "password": "Test@1234",
  "role": "STUDENT",
  "phone": "+254700000000",
  "department": "Computer Science"
}
```

### POST /auth/login
```json
{ "email": "john@university.edu", "password": "Test@1234" }
```

---

## Appointment Endpoints

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/appointments` | ✅ | All | List appointments (role-filtered) |
| POST | `/appointments` | ✅ | All | Create appointment |
| GET | `/appointments/:id` | ✅ | All | Get details |
| POST | `/appointments/:id/secretary-approve` | ✅ | SECRETARY | Forward to leader |
| POST | `/appointments/:id/approve` | ✅ | Leaders | Approve |
| POST | `/appointments/:id/reject` | ✅ | Staff | Reject |
| POST | `/appointments/:id/cancel` | ✅ | All | Cancel |
| POST | `/appointments/:id/reschedule` | ✅ | All | Request reschedule |
| GET | `/appointments/slots/:leaderId` | ✅ | All | Get available slots |

### POST /appointments
```json
{
  "leaderId": "uuid",
  "title": "Academic Advising",
  "description": "Discuss course selection",
  "date": "2026-05-15",
  "startTime": "09:00",
  "endTime": "09:30",
  "location": "Room 201"
}
```

---

## Notification Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | Get notifications |
| PUT | `/notifications/read-all` | Mark all read |
| PUT | `/notifications/:id/read` | Mark one read |
| DELETE | `/notifications/:id` | Delete |

---

## User Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/users/leaders` | All | Get all leaders |
| PUT | `/users/profile` | All | Update own profile |
| GET | `/users` | ADMIN | All users |
| PUT | `/users/:id/toggle-active` | ADMIN | Activate/deactivate |

---

## Calendar Endpoints

| Method | Endpoint | Query Params | Description |
|--------|----------|-------------|-------------|
| GET | `/calendar` | `year`, `month` | Monthly schedule |
| GET | `/calendar/day` | `date` (YYYY-MM-DD) | Day schedule |

---

## Response Format

```json
{
  "success": true,
  "message": "Success",
  "data": { ... }
}
```

### Error Format
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "Invalid email" }]
}
```

---

## Appointment Status Flow

```
PENDING → SECRETARY_APPROVED → APPROVED → COMPLETED
       ↘                     ↘
        REJECTED              CANCELLED
PENDING/APPROVED → RESCHEDULED
```
