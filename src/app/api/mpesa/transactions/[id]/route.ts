/**
 * MPESA Transaction API Endpoint (Individual)
 * GET /api/mpesa/transactions/[id] - Get a transaction
 * PATCH /api/mpesa/transactions/[id] - Update a transaction
 * DELETE /api/mpesa/transactions/[id] - Delete a transaction
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const transaction = await prisma.mpesaTransaction.findFirst({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json({
      transaction: {
        ...transaction,
        amount: Number(transaction.amount),
        balanceAfter: transaction.balanceAfter ? Number(transaction.balanceAfter) : null,
        timestamp: Number(transaction.timestamp),
        transactionDate: transaction.transactionDate.toISOString(),
        createdAt: transaction.createdAt.toISOString(),
        updatedAt: transaction.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Get transaction error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    // Verify transaction belongs to user
    const existing = await prisma.mpesaTransaction.findFirst({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Build update data
    const updateData: any = {};
    
    if (body.category !== undefined) updateData.category = body.category;
    if (body.merchantName !== undefined) updateData.merchantName = body.merchantName;
    if (body.normalizedMerchantName !== undefined) updateData.normalizedMerchantName = body.normalizedMerchantName;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.isIncome !== undefined) updateData.isIncome = body.isIncome;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.amount !== undefined) updateData.amount = parseFloat(body.amount);
    if (body.transactionDate !== undefined) updateData.transactionDate = new Date(body.transactionDate);
    if (body.counterpartyName !== undefined) updateData.counterpartyName = body.counterpartyName;
    if (body.counterpartyPhone !== undefined) updateData.counterpartyPhone = body.counterpartyPhone;

    const transaction = await prisma.mpesaTransaction.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      transaction: {
        ...transaction,
        amount: Number(transaction.amount),
        balanceAfter: transaction.balanceAfter ? Number(transaction.balanceAfter) : null,
        timestamp: Number(transaction.timestamp),
        transactionDate: transaction.transactionDate.toISOString(),
        createdAt: transaction.createdAt.toISOString(),
        updatedAt: transaction.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Update transaction error:", error);
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Verify transaction belongs to user
    const existing = await prisma.mpesaTransaction.findFirst({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    await prisma.mpesaTransaction.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete transaction error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


