/**
 * MPESA Transactions API Endpoint
 * GET /api/mpesa/transactions
 *
 * Retrieves user's MPESA transactions with filtering and pagination
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const accountId = searchParams.get("accountId");
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const isIncome = searchParams.get("isIncome");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");
    const importBatchId = searchParams.get("importBatchId");

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId };

    if (accountId) where.accountId = accountId;
    if (category) where.category = category;
    if (type) where.type = type;
    if (isIncome !== null) where.isIncome = isIncome === "true";
    if (importBatchId) where.importBatchId = importBatchId;

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.gte = new Date(startDate);
      if (endDate) where.transactionDate.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { transactionCode: { contains: search, mode: "insensitive" } },
        { counterpartyName: { contains: search, mode: "insensitive" } },
        { merchantName: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch transactions
    const [transactions, total] = await Promise.all([
      prisma.mpesaTransaction.findMany({
        where,
        orderBy: { transactionDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.mpesaTransaction.count({ where }),
    ]);

    // Calculate summary statistics
    const summary = await prisma.mpesaTransaction.aggregate({
      where,
      _sum: {
        amount: true,
      },
      _count: true,
    });

    const incomeSum = await prisma.mpesaTransaction.aggregate({
      where: { ...where, isIncome: true },
      _sum: { amount: true },
    });

    const expenseSum = await prisma.mpesaTransaction.aggregate({
      where: { ...where, isIncome: false },
      _sum: { amount: true },
    });

    return NextResponse.json({
      transactions: transactions.map((t) => ({
        ...t,
        amount: Number(t.amount), // Convert Decimal to number
        balanceAfter: t.balanceAfter ? Number(t.balanceAfter) : null,
        timestamp: Number(t.timestamp),
        transactionDate: t.transactionDate.toISOString(),
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalTransactions: summary._count,
        totalAmount: summary._sum.amount ? Number(summary._sum.amount) : 0,
        totalIncome: incomeSum._sum.amount ? Number(incomeSum._sum.amount) : 0,
        totalExpense: expenseSum._sum.amount ? Number(expenseSum._sum.amount) : 0,
        netAmount: (incomeSum._sum.amount ? Number(incomeSum._sum.amount) : 0) - (expenseSum._sum.amount ? Number(expenseSum._sum.amount) : 0),
      },
    });
  } catch (error) {
    console.error("Fetch transactions error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mpesa/transactions
 * Delete transactions by batch ID or individual IDs
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { transactionIds, importBatchId } = body;

    if (!transactionIds && !importBatchId) {
      return NextResponse.json(
        { error: "Either transactionIds or importBatchId is required" },
        { status: 400 }
      );
    }

    const where: any = { userId };

    if (importBatchId) {
      where.importBatchId = importBatchId;
    } else if (transactionIds && Array.isArray(transactionIds)) {
      where.id = { in: transactionIds };
    }

    const result = await prisma.mpesaTransaction.deleteMany({ where });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("Delete transactions error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

