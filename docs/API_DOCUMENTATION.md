# Campus Keke REST API Reference (v1)

Base URL: `/api/v1`

All responses follow the structured format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable confirmation"
}
```
Error format:
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "details": [ ... ],
    "code": "OPTIONAL_ERROR_CODE"
  }
}
```

---

## 1. Authentication Endpoints

### Register Student with Ticket ID
- **Method**: `POST`
- **Path**: `/auth/register`
- **Rate Limit**: 20 requests / 15 minutes
- **Request Body**:
  ```json
  {
    "regNumber": "REG/2024/00101",
    "fullName": "Chinedu Eze",
    "phone": "08012345678",
    "ticketId": "CKK-2026-TKT-001",
    "password": "securepassword123"
  }
  ```
- **Responses**:
  - `201 Created`: Returns user profile, active ticket, and access/refresh tokens.
  - `400 Bad Request`: Invalid or exhausted Ticket ID.
  - `409 Conflict`: Reg number already registered or Ticket ID already claimed by another student.

### Unified Login
- **Method**: `POST`
- **Path**: `/auth/login`
- **Rate Limit**: 20 requests / 15 minutes
- **Request Body**:
  ```json
  {
    "identifier": "REG/2024/00101",
    "password": "securepassword123"
  }
  ```
- **Responses**:
  - `200 OK`: Returns authenticated role, profile payload, `accessToken`, and `refreshToken`.
  - `401 Unauthorized`: Invalid credentials or deactivated account.

### Refresh Session Token
- **Method**: `POST`
- **Path**: `/auth/refresh`
- **Request Body**:
  ```json
  {
    "refreshToken": "<jwt-refresh-token>"
  }
  ```

### Current User Profile
- **Method**: `GET`
- **Path**: `/auth/me`
- **Headers**: `Authorization: Bearer <accessToken>`

---

## 2. Student Endpoints

### Get Student Dashboard
- **Method**: `GET`
- **Path**: `/student/dashboard`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Role Required**: `STUDENT`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "student": {
        "id": "uuid",
        "fullName": "Chinedu Eze",
        "regNumber": "REG/2024/00101",
        "phone": "08012345678"
      },
      "ticket": {
        "ticketNumber": "CKK-2026-STUD-001",
        "status": "ACTIVE",
        "remainingRides": 8,
        "usedRides": 2,
        "totalRides": 10,
        "qrPayload": "{...}",
        "qrDataUrl": "data:image/png;base64,..."
      },
      "recentRides": [ ... ]
    }
  }
  ```

---

## 3. Driver Endpoints

### Driver Dashboard Details
- **Method**: `GET`
- **Path**: `/driver/dashboard`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Role Required**: `DRIVER`

### Validate & Activate Ride (QR Scan & Manual Fallback)
- **Method**: `POST`
- **Path**: `/driver/validate-ride`
- **Headers**: `Authorization: Bearer <accessToken>`, `Idempotency-Key: <unique-uuid>`
- **Role Required**: `DRIVER`
- **Rate Limit**: 60 requests / minute (anti-enumeration protection)
- **Request Body**:
  ```json
  {
    "ticketInput": "CKK-2026-STUD-001",
    "validationMethod": "QR_SCAN",
    "idempotencyKey": "ride-1740001-abc1234",
    "useDriverEmergencyCredit": false
  }
  ```
- **Responses**:
  - `201 Created`: Ride validated, exactly 1 ride deducted atomically.
  - `200 OK`: Idempotent replay returned (duplicate scan prevented).
  - `400 Bad Request`: Ticket exhausted (0 remaining rides) or invalid QR payload.
  - `403 Forbidden`: Driver account suspended or unassigned.
  - `404 Not Found`: Ticket not found.

---

## 4. Admin Management Endpoints

All endpoints require `Authorization: Bearer <accessToken>` and role `ADMIN`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/stats` | Real DB metrics (students, drivers, daily rides, revenue, failed scans) |
| `POST` | `/tickets` | Create unassigned ticket batches |
| `POST` | `/tickets/sell` | Record ticket sale (Cash, Bank Transfer, POS) |
| `POST` | `/tickets/refill` | Refill exhausted ticket with additional ride credits |
| `PATCH` | `/tickets/:id/status` | Update ticket status (`ACTIVE`, `SUSPENDED`, `REVOKED`) |
| `GET` | `/tickets/:identifier` | Inspect single ticket with QR code |
| `GET` | `/admin/students` | List student directory with ticket balances and search |
| `GET` | `/admin/drivers` | List drivers with assigned vehicles and performance |
| `POST` | `/admin/drivers` | Create driver account |
| `PATCH`| `/admin/drivers/:id/status` | Suspend or activate driver account |
| `PATCH`| `/admin/drivers/:id/vehicle` | Re-assign vehicle to driver |
| `POST` | `/admin/vehicles` | Register new keke in transit fleet |
| `GET` | `/admin/transactions` | Search & filter ride transactions |
| `GET` | `/admin/audit-logs` | Immutable audit trail |
| `GET` | `/admin/failed-scans` | Security log of failed/suspicious scan attempts |

---

## 5. Health & Monitoring Endpoints

### System Health Check
- **Method**: `GET`
- **Path**: `/health`
- **Response**:
  ```json
  {
    "status": "UP",
    "timestamp": "2026-10-10T17:00:00.000Z",
    "services": {
      "database": "HEALTHY",
      "api": "HEALTHY"
    }
  }
  ```
