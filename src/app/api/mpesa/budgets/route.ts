/**
 * MPESA Budgets API Endpoint
 * GET /api/mpesa/budgets - Get all budgets
 * POST /api/mpesa/budgets - Create a new budget
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");

    const where: any = { userId };
    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    const budgets = await prisma.budget.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      budgets: budgets.map((b) => ({
        ...b,
        amount: Number(b.amount),
        startDate: b.startDate.toISOString(),
        endDate: b.endDate?.toISOString() || null,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Fetch budgets error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { category, amount, period } = body;

    if (!category || !amount || !period) {
      return NextResponse.json(
        { error: "Missing required fields: category, amount, period" },
        { status: 400 }
      );
    }

    // Map period string to enum
    const periodMap: Record<string, "WEEKLY" | "MONTHLY" | "YEARLY"> = {
      weekly: "WEEKLY",
      monthly: "MONTHLY",
      yearly: "YEARLY",
    };

    const budgetPeriod = periodMap[period.toLowerCase()] || "MONTHLY";

    // Check if budget already exists for this category
    const existing = await prisma.budget.findFirst({
      where: {
        userId,
        category,
        isActive: true,
      },
    });

    if (existing) {
      // Update existing budget instead of creating duplicate
      const updated = await prisma.budget.update({
        where: { id: existing.id },
        data: {
          amount,
          period: budgetPeriod,
        },
      });

      return NextResponse.json({
        budget: {
          ...updated,
          amount: Number(updated.amount),
          startDate: updated.startDate.toISOString(),
          endDate: updated.endDate?.toISOString() || null,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      });
    }

    const budget = await prisma.budget.create({
      data: {
        userId,
        category,
        amount: parseFloat(amount),
        period: budgetPeriod,
      },
    });

    return NextResponse.json({
      budget: {
        ...budget,
        amount: Number(budget.amount),
        startDate: budget.startDate.toISOString(),
        endDate: budget.endDate?.toISOString() || null,
        createdAt: budget.createdAt.toISOString(),
        updatedAt: budget.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Create budget error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

