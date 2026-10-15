import jwt, { SignOptions } from 'jsonwebtoken';
import { CONFIG, RoleType } from '../config';

export interface TokenPayload {
  userId: string;
  role: RoleType;
  username: string;
  studentId?: string;
  driverId?: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: CONFIG.JWT_ACCESS_EXPIRES_IN as any,
  };
  return jwt.sign(payload, CONFIG.JWT_ACCESS_SECRET, options);
}

export function generateRefreshToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: CONFIG.JWT_REFRESH_EXPIRES_IN as any,
  };
  return jwt.sign(payload, CONFIG.JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, CONFIG.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, CONFIG.JWT_REFRESH_SECRET) as TokenPayload;
}
