# Campus Keke Database Architecture & Entity-Relationship Model

## 1. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o| Student : "has profile"
    User ||--o| Driver : "has profile"
    User ||--o{ Ticket : "issues"
    User ||--o{ TicketSale : "records sale"
    User ||--o{ TicketRefill : "authorizes refill"
    User ||--o{ AuditLog : "initiates action"

    Student ||--o{ Ticket : "owns pass"
    Student ||--o{ RideTransaction : "boards keke"

    Driver ||--o| Vehicle : "assigned to"
    Driver ||--o{ Ticket : "holds emergency pass"
    Driver ||--o{ RideTransaction : "validates ride"
    Driver ||--o{ FailedScanLog : "records failure"

    Vehicle ||--o{ RideTransaction : "transport vessel"

    Ticket ||--o{ TicketSale : "purchase history"
    Ticket ||--o{ TicketRefill : "credit refills"
    Ticket ||--o{ RideTransaction : "funds ride"

    User {
        string id PK
        string username UK
        string email UK
        string passwordHash
        string role
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    Student {
        string id PK
        string userId FK
        string regNumber UK
        string fullName
        string phone UK
        datetime createdAt
    }

    Driver {
        string id PK
        string userId FK
        string driverCode UK
        string fullName
        string phone
        string licenseNumber
        string status
        string assignedVehicleId FK
    }

    Vehicle {
        string id PK
        string plateNumber UK
        string kekeNumber UK
        string model
        int capacity
        string status
    }

    Ticket {
        string id PK
        string ticketNumber UK
        string qrPayload UK
        int totalRides
        int usedRides
        int remainingRides
        string status
        string ticketType
        string studentId FK
        string driverId FK
        string issuedById FK
    }

    RideTransaction {
        string id PK
        string transactionNumber UK
        string ticketId FK
        string studentId FK
        string driverId FK
        string vehicleId FK
        string rideSource
        int deductedRides
        int remainingRidesAfter
        string validationMethod
        string idempotencyKey UK
        string status
        datetime timestamp
    }

    TicketSale {
        string id PK
        string ticketId FK
        string adminId FK
        float amount
        int ridesPurchased
        string paymentMethod
        string paymentReference
        string buyerName
        datetime soldAt
    }

    TicketRefill {
        string id PK
        string ticketId FK
        string adminId FK
        int ridesAdded
        int previousBalance
        int newBalance
        float amountPaid
        string paymentMethod
        datetime refilledAt
    }

    AuditLog {
        string id PK
        string userId FK
        string action
        string entityType
        string entityId
        string details
        datetime createdAt
    }

    FailedScanLog {
        string id PK
        string driverId FK
        string attemptedTicket
        string reason
        string ipAddress
        datetime createdAt
    }
```

---

## 2. Table Specifications & Constraints

### `User`
- `id`: UUID Primary Key.
- `username`: Unique, case-insensitive identifier (Student Reg Number, Driver Code, or Admin Username).
- `role`: Strict Enum representation (`ADMIN`, `DRIVER`, `STUDENT`).
- `isActive`: Boolean flag; deactivated accounts are denied immediately at the authentication middleware.

### `Student`
- `regNumber`: Indexed unique constraint.
- `phone`: Unique constraint to prevent multi-account SIM cycling.
- `userId`: Foreign key with `ON DELETE CASCADE`.

### `Driver`
- `driverCode`: Unique identifier (e.g. `DRV-101`).
- `status`: `ACTIVE`, `SUSPENDED`, `INACTIVE`. Deactivated/suspended drivers cannot deduct rides.
- `assignedVehicleId`: Optional Foreign Key to `Vehicle`.

### `Vehicle`
- `plateNumber`: Unique official license plate.
- `kekeNumber`: Unique fleet identifier (e.g. `KEKE-01`).

### `Ticket`
- `ticketNumber`: Cryptographically generated human-readable string (e.g. `CKK-2026-F89A-4E2B`). Unique constraint.
- `qrPayload`: Cryptographic JSON containing payload token and HMAC-SHA256 signature.
- `remainingRides`: Non-negative integer. Decremented on every ride validation.
- `status`:
  - `UNASSIGNED`: Minted and sold by admin, pending initial student claim.
  - `ACTIVE`: Assigned to a student (or driver emergency pass) with remaining rides $> 0$.
  - `EXHAUSTED`: Remaining rides reached 0. Preserved in database; ready for refill.
  - `SUSPENDED`: Temporarily halted by admin.
  - `REVOKED`: Permanently invalidated.

### `RideTransaction`
- `transactionNumber`: Unique immutable transaction code (`TXN-YYYY-XXXX-XXXX`).
- `idempotencyKey`: Unique constraint preventing duplicate debit on network retries.
- `rideSource`: `STUDENT_TICKET` or `DRIVER_EMERGENCY_TICKET`.
- `remainingRidesAfter`: Explicitly stores balance snapshot after deduction.

### `TicketSale` & `TicketRefill`
- Records offline payments (`CASH`, `BANK_TRANSFER`, `POS`, `OTHER`).
- Stores administrator ID, timestamp, and financial receipts for transparent end-of-day revenue reconciliation.
