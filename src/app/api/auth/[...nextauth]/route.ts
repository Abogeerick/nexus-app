/**
 * NextAuth API Route Handler
 *
 * Handles all NextAuth requests:
 * - GET /api/auth/session
 * - POST /api/auth/signin
 * - POST /api/auth/signout
 * - GET /api/auth/providers
 * - GET /api/auth/csrf
 */

import { handlers } from "@/lib/auth/auth";

export const { GET, POST } = handlers;

