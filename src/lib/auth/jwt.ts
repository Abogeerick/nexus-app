/**
 * JWT Utilities
 *
 * Handles JWT token generation and validation for:
 * - Access tokens (short-lived, 15min)
 * - Refresh tokens (long-lived, 7 days)
 *
 * Note: NextAuth handles session tokens internally,
 * these are for additional refresh token functionality
 */

import jwt, { SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-this";
const ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || "15m";
const REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || "7d";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Generate access token (short-lived)
 * @param payload - User data to encode
 * @returns JWT access token
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_EXPIRATION,
    issuer: "nexus-finance",
    audience: "nexus-finance-api",
  } as SignOptions);
}

/**
 * Generate refresh token (long-lived)
 * @param payload - User data to encode
 * @returns JWT refresh token
 */
export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: REFRESH_EXPIRATION,
    issuer: "nexus-finance",
    audience: "nexus-finance-refresh",
  } as SignOptions);
}

/**
 * Verify and decode access token
 * @param token - JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "nexus-finance",
      audience: "nexus-finance-api",
    }) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error("Access token verification failed:", error);
    return null;
  }
}

/**
 * Verify and decode refresh token
 * @param token - JWT refresh token to verify
 * @returns Decoded token payload or null if invalid
 */
export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "nexus-finance",
      audience: "nexus-finance-refresh",
    }) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error("Refresh token verification failed:", error);
    return null;
  }
}

/**
 * Generate random token for email verification and password reset
 * @returns Random hex string (32 bytes = 64 characters)
 */
export function generateRandomToken(): string {
  const crypto = require("crypto");
  return crypto.randomBytes(32).toString("hex");
}

