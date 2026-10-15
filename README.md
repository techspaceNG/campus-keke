# 🛺 Campus Keke Ticket Management System

> **Simple. Fast. Campus rides.**  
> A secure, production-grade transit pass management platform engineered for university campus tricycle (keke) transit operations.

---

## 🌟 Core Architectural Principle
> **"The admin issues and manages tickets; the student displays the ticket; the driver validates it; and the backend securely controls every ride credit."**

---

## 🛠️ Technology Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons, `html5-qrcode`, `qrcode.react`.
- **Backend**: Node.js, Express REST API (versioned `/api/v1`), TypeScript.
- **ORM & Database**: Prisma ORM with **PostgreSQL** for production; seamless zero-config **SQLite** fallback for local offline testing.
- **Security & Integrity**: Argon2/bcrypt password hashing, HMAC-SHA256 cryptographically signed QR payloads, atomic concurrency-safe decrement transactions, strict RBAC authorization, and idempotency key protection.

---

## 👥 User Roles & Permissions

| Role | Access Level & Capabilities |
|---|---|
| **ADMIN** | Controls ticket creation, offline sales recording (Cash, Transfer, POS), student directory, drivers, vehicles, ticket refills, immutable audit logs, failed scan security monitor, and real database analytics. |
| **DRIVER** | Validates student tickets via real-time camera QR scanning or manual Ticket ID entry, activates rides atomically, views today's trip counter, and accesses emergency driver credits when authorized. |
| **STUDENT** | Displays active digital pass with live QR code, monitors total/used/remaining ride balance, reviews personal trip history. Cannot alter balances or purchase passes without admin issuance. |

---

## 🎫 Student Registration Life-Cycle

Students cannot self-register without an admin-issued ticket. The strictly enforced registration flow:
1. **Admin Issues Ticket**: Admin sells an unassigned ticket at a campus terminal, recording buyer details and payment method (Cash, POS, Bank Transfer).
2. **Student Receives Ticket ID**: Student receives their unique Ticket ID (e.g. `CKK-2026-DEMO-001`) and signed QR code.
3. **Student Registers**:
   - Registration Number (e.g. `REG/2024/09999`)
   - Full Name
   - Phone Number
   - Admin Ticket ID
   - Password
4. **Backend Validation**: Asserts that the Ticket ID exists, is unassigned, has remaining rides $> 0$, and is not claimed by another student.
5. **Account Creation**: Atomically provisions the student profile and binds the ticket to the student.
6. **Subsequent Logins**: Student logs in directly with Registration Number and password (Ticket ID is **never required again** for login).

---

## ⚡ Concurrency Safety & Ride Validation
- **Single Backend Service**: Both QR camera scanning and manual Ticket ID entry route through the same unified `RideService.validateAndActivateRide` endpoint.
- **Atomic Ride Deductions**: Rides are decremented inside Prisma interactive transactions with balance guard checks (`remainingRides > 0`).
- **Idempotency Protection**: Client submits a unique `Idempotency-Key` (UUID); duplicate scans within the transit window return cached confirmations without deducting extra rides.
- **Ticket Exhaustion & Refill**: When remaining balance reaches 0, ticket transitions to `EXHAUSTED` (not deleted). Admins refill tickets via the admin dashboard, reactivating the pass while preserving the original Ticket ID, QR code, and student account.
- **Driver Emergency Ticket Fallback**: If a student is without a usable ticket, an admin-authorized driver emergency ticket can fund the commute. Every ride explicitly records its funding source (`STUDENT_TICKET` or `DRIVER_EMERGENCY_TICKET`).

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+)
- npm (v9+)

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Push database schema & generate Prisma Client
npm run prisma:push

# Seed clean system settings and Admin account
npm run prisma:seed

# Start Backend Server (runs on http://localhost:5000)
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Next.js Development Server (runs on http://localhost:3000)
npm run dev
```

---

## 🔑 System Administrator Credentials

| Role | Username / Identifier | Password | Description |
|---|---|---|---|
| **ADMIN** | `ADMIN` (or `admin@campuskeke.edu`) | `admin123` | Full admin privileges, driver & vehicle registry, ticketing desk, and ledger |

---

## 📁 Repository Structure
```
campus-keke/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma           # Active database schema
│   │   ├── schema.postgresql.prisma# PostgreSQL production schema
│   │   ├── schema.sqlite.prisma    # SQLite zero-config schema
│   │   └── seed.ts                 # Realistic database seeder
│   ├── src/
│   │   ├── config/                 # Environment & constants
│   │   ├── controllers/            # Express controllers
│   │   ├── middleware/             # Auth, RBAC, Rate-limit, Errors
│   │   ├── routes/                 # Versioned /api/v1 router
│   │   ├── services/               # Core business services
│   │   ├── utils/                  # Crypto, QR signing, Prisma, Audit
│   │   ├── app.ts                  # Express application builder
│   │   └── index.ts                # Server entry point
│   ├── tests/
│   │   └── system.test.ts          # Comprehensive Jest E2E test suite
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            # Minimal Landing page
│   │   │   ├── login/page.tsx      # Unified role login
│   │   │   ├── register/page.tsx   # Ticket-verified student registration
│   │   │   ├── student/dashboard/  # Minimal student pass & QR display
│   │   │   ├── driver/dashboard/   # Driver QR camera scanner & manual entry
│   │   │   └── admin/dashboard/    # Real stats, sales, refills, logs
│   │   ├── lib/                    # API client & auth session store
│   │   └── styles/                 # Tailwind CSS styles
│   └── package.json
├── docs/
│   ├── ARCHITECTURE.md             # Complete system architecture
│   ├── DATABASE_SCHEMA.md          # Database ERD & table specs
│   ├── API_DOCUMENTATION.md        # Full REST API v1 reference
│   └── DEPLOYMENT_GUIDE.md         # Vercel & PostgreSQL hosting guide
└── README.md
```

---

## 🧪 Automated Test Suite Coverage
Run tests at any time with `npm test` inside `backend/`:
- ✅ Student registration rejected without a valid ticket
- ✅ Student registration rejected with an already assigned ticket
- ✅ Student registration succeeds with admin-created unassigned ticket
- ✅ Duplicate student registration prevented (reg number & phone)
- ✅ RBAC: Students forbidden from accessing admin endpoints
- ✅ RBAC: Drivers forbidden from accessing student dashboards
- ✅ QR scan ride deduction: atomically subtracts 1 ride
- ✅ Idempotency protection: duplicate scan requests return cached confirmations without double deductions
- ✅ Ticket exhaustion: boarding rejected when balance reaches 0
- ✅ Admin refill: reactivates exhausted ticket and restores balance
- ✅ Driver emergency ticket funding: correctly funds commute and logs transaction source
