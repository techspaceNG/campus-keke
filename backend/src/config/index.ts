import dotenv from 'dotenv';
dotenv.config();

const NEON_DEFAULT_URL =
  'postgresql://neondb_owner:npg_fk0vR5HqKNEm@ep-flat-flower-b81jwutt-pooler.c-14.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:')) {
  process.env.DATABASE_URL = NEON_DEFAULT_URL;
}

export const CONFIG = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'campus_keke_access_token_secret_key_2026_prod_grade_xyz',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'campus_keke_refresh_token_secret_key_2026_prod_grade_abc',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '2h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  TICKET_QR_HMAC_SECRET: process.env.TICKET_QR_HMAC_SECRET || 'campus_keke_qr_hmac_signature_secret_key_2026',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  DEFAULT_FARE_PER_RIDE: 150, // Local campus fare (e.g. 150 NGN)
  CURRENCY_SYMBOL: '₦',
};

export const ROLES = {
  ADMIN: 'ADMIN',
  DRIVER: 'DRIVER',
  STUDENT: 'STUDENT',
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

export const TICKET_STATUS = {
  UNASSIGNED: 'UNASSIGNED',
  ACTIVE: 'ACTIVE',
  EXHAUSTED: 'EXHAUSTED',
  SUSPENDED: 'SUSPENDED',
  REVOKED: 'REVOKED',
} as const;

export const DRIVER_STATUS = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  INACTIVE: 'INACTIVE',
} as const;

export const PAYMENT_METHODS = {
  CASH: 'CASH',
  BANK_TRANSFER: 'BANK_TRANSFER',
  POS: 'POS',
  OTHER: 'OTHER',
} as const;

export const VALIDATION_METHODS = {
  QR_SCAN: 'QR_SCAN',
  MANUAL_ENTRY: 'MANUAL_ENTRY',
} as const;

export const RIDE_SOURCES = {
  STUDENT_TICKET: 'STUDENT_TICKET',
  DRIVER_EMERGENCY_TICKET: 'DRIVER_EMERGENCY_TICKET',
} as const;
