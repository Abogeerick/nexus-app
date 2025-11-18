/**
 * MPESA Classification API Endpoint
 * POST /api/mpesa/classify
 *
 * Classify transactions using AI
 * Can classify single transaction or batch
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { classifyTransaction, batchClassify } from "@/lib/ai/mpesa-classifier";
import { normalizeMerchantName } from "@/lib/ai/merchant-normalizer";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { transactionIds, applyToAll = false } = body;

    if (!transactionIds && !applyToAll) {
      return NextResponse.json(
        { error: "Either transactionIds or applyToAll must be provided" },
        { status: 400 }
      );
    }

    // Fetch transactions to classify
    const where: any = { userId };
    if (!applyToAll && transactionIds) {
      where.id = { in: transactionIds };
    }

    const transactions = await prisma.mpesaTransaction.findMany({ where });

    if (transactions.length === 0) {
      return NextResponse.json({ error: "No transactions found" }, { status: 404 });
    }

    // Classify transactions
    const updates = [];
    for (const transaction of transactions) {
      const classification = classifyTransaction(
        transaction.merchantName,
        transaction.description,
        transaction.type
      );

      // Normalize merchant name if exists
      let normalizedMerchant = transaction.normalizedMerchantName;
      if (transaction.merchantName && !normalizedMerchant) {
        const merchantAlias = normalizeMerchantName(transaction.merchantName);
        normalizedMerchant = merchantAlias.normalized;
      }

      // Update transaction
      const updated = await prisma.mpesaTransaction.update({
        where: { id: transaction.id },
        data: {
          aiCategory: classification.category,
          aiConfidence: classification.confidence,
          category: classification.category, // Update main category
          normalizedMerchantName: normalizedMerchant,
        },
      });

      updates.push({
        transactionId: transaction.id,
        transactionCode: transaction.transactionCode,
        originalCategory: transaction.category,
        newCategory: classification.category,
        confidence: classification.confidence,
        reasoning: classification.reasoning,
      });
    }

    return NextResponse.json({
      success: true,
      classified: updates.length,
      updates,
    });
  } catch (error) {
    console.error("Classification error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

