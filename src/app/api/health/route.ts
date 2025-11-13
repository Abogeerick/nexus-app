/**
 * Health Check API Route
 *
 * Tests database connectivity and returns system status
 * GET /api/health
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Test database connection by counting users
    const userCount = await prisma.user.count();

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        userCount,
      },
      service: "Nexus Finance Analyst API",
      version: "0.1.0",
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        service: "Nexus Finance Analyst API",
        version: "0.1.0",
      },
      { status: 503 }
    );
  }
}

