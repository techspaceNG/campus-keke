import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { CONFIG } from '../config';

const SALT_ROUNDS = 12;

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

export async function comparePassword(plainText: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plainText, hashed);
}

/**
 * Generates an auditable, high-entropy Ticket ID like 'CKK-2026-F89A-4E2B'
 */
export function generateTicketNumber(): string {
  const year = new Date().getFullYear();
  const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `CKK-${year}-${part1}-${part2}`;
}

/**
 * Generates a unique transaction number like 'TXN-2026-7B3D-9A1F'
 */
export function generateTransactionNumber(): string {
  const year = new Date().getFullYear();
  const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `TXN-${year}-${part1}-${part2}`;
}

/**
 * Generates high-entropy token for ticket QR payload
 */
export function generateSecurePayloadToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}

/**
 * Signs a ticket number + token to prevent counterfeit QR generation
 */
export function signTicketPayload(ticketNumber: string, payloadToken: string): string {
  const hmac = crypto.createHmac('sha256', CONFIG.TICKET_QR_HMAC_SECRET);
  hmac.update(`${ticketNumber}:${payloadToken}`);
  return hmac.digest('hex');
}

/**
 * Verifies a QR signature
 */
export function verifyTicketPayloadSignature(
  ticketNumber: string,
  payloadToken: string,
  signature: string
): boolean {
  const expected = signTicketPayload(ticketNumber, payloadToken);
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}
