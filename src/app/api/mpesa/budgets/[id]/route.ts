/**
 * MPESA Budget API Endpoint (Individual)
 * GET /api/mpesa/budgets/[id] - Get a budget
 * PUT /api/mpesa/budgets/[id] - Update a budget
 * DELETE /api/mpesa/budgets/[id] - Delete a budget
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;
    const budget = await prisma.budget.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

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
    console.error("Get budget error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;
    const body = await request.json();
    const { category, amount, period, isActive } = body;

    // Verify budget belongs to user
    const existing = await prisma.budget.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (category !== undefined) updateData.category = category;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (period !== undefined) {
      const periodMap: Record<string, "WEEKLY" | "MONTHLY" | "YEARLY"> = {
        weekly: "WEEKLY",
        monthly: "MONTHLY",
        yearly: "YEARLY",
      };
      updateData.period = periodMap[period.toLowerCase()] || "MONTHLY";
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    const budget = await prisma.budget.update({
      where: { id },
      data: updateData,
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
    console.error("Update budget error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    // Verify budget belongs to user
    const existing = await prisma.budget.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    await prisma.budget.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete budget error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}



