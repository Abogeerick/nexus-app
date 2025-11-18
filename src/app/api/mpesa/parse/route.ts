/**
 * MPESA Parse API Endpoint
 * POST /api/mpesa/parse
 *
 * Parses MPESA data from CSV, SMS, or text format
 * Saves transactions to database
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { parseMpesaData } from "@/lib/parsers/mpesa-parser";
import { MpesaStatementFormat } from "@/types/mpesa";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check content type
    const contentType = request.headers.get("content-type") || "";
    let content: string | Buffer;
    let format: string | undefined;
    let accountId: string | undefined;
    let skipDuplicates = true;

    if (contentType.includes("multipart/form-data") || contentType.includes("application/pdf")) {
      // Handle PDF file upload
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      accountId = formData.get("accountId") as string | undefined;
      skipDuplicates = formData.get("skipDuplicates") !== "false";
      format = formData.get("format") as string | undefined;

      if (!file) {
        return NextResponse.json(
          { error: "File is required" },
          { status: 400 }
        );
      }

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      content = Buffer.from(arrayBuffer);
      
      // Auto-detect PDF format
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        format = "PDF";
      }
    } else {
      // Handle JSON request (text/CSV content)
      const body = await request.json();
      content = body.content;
      format = body.format;
      accountId = body.accountId;
      skipDuplicates = body.skipDuplicates ?? true;

      if (!content || (typeof content !== "string" && !Buffer.isBuffer(content))) {
        return NextResponse.json(
          { error: "Content is required" },
          { status: 400 }
        );
      }
    }

    // Validate format if provided
    if (format && !Object.values(MpesaStatementFormat).includes(format)) {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }

    // Verify account ownership if accountId provided
    if (accountId) {
      const account = await prisma.account.findFirst({
        where: { id: accountId, userId },
      });

      if (!account) {
        return NextResponse.json(
          { error: "Account not found or access denied" },
          { status: 404 }
        );
      }
    }

    // Fetch existing transactions for duplicate detection
    const existingTransactions = skipDuplicates
      ? await prisma.mpesaTransaction.findMany({
          where: { userId },
          select: {
            transactionCode: true,
            transactionHash: true,
            amount: true,
            timestamp: true,
            transactionDate: true,
            counterpartyPhone: true,
            isIncome: true,
            type: true,
            category: true,
            counterpartyName: true,
            merchantName: true,
            normalizedMerchantName: true,
            paybillNumber: true,
            tillNumber: true,
            accountNumber: true,
            description: true,
            source: true,
            originalText: true,
            confidence: true,
            parseErrors: true,
            balanceAfter: true,
            currency: true,
          },
        })
      : [];

    // Convert to format expected by parser
    const existingNormalized = existingTransactions.map((t) => ({
      ...t,
      timestamp: Number(t.timestamp),
      parseErrors: Array.isArray(t.parseErrors) ? t.parseErrors as string[] : [],
    }));

    // Parse the data
    const parseResult = await parseMpesaData(content, {
      format,
      autoDetectFormat: !format,
      skipDuplicates,
      existingTransactions: existingNormalized,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Parsing failed",
          details: parseResult.errors,
          summary: parseResult.summary,
        },
        { status: 422 }
      );
    }

    // Generate import batch ID
    const importBatchId = nanoid();

    // Save transactions to database
    const savedTransactions = [];
    for (const transaction of parseResult.transactions) {
      const saved = await prisma.mpesaTransaction.create({
        data: {
          userId,
          accountId: accountId || null,
          importBatchId,
          transactionCode: transaction.transactionCode,
          transactionHash: transaction.transactionHash,
          amount: transaction.amount,
          balanceAfter: transaction.balanceAfter,
          currency: transaction.currency,
          transactionDate: transaction.transactionDate,
          timestamp: BigInt(transaction.timestamp),
          type: transaction.type,
          category: transaction.category,
          isIncome: transaction.isIncome,
          counterpartyName: transaction.counterpartyName,
          counterpartyPhone: transaction.counterpartyPhone,
          merchantName: transaction.merchantName,
          normalizedMerchantName: transaction.normalizedMerchantName,
          paybillNumber: transaction.paybillNumber,
          tillNumber: transaction.tillNumber,
          accountNumber: transaction.accountNumber,
          description: transaction.description,
          source: transaction.source,
          originalText: transaction.originalText,
          confidence: transaction.confidence,
          parseErrors: transaction.parseErrors,
        },
      });

      savedTransactions.push(saved);
    }

    // Update account balance if accountId provided and we have latest balance
    if (accountId && parseResult.transactions.length > 0) {
      const latestTransaction = parseResult.transactions.reduce((latest, current) =>
        current.transactionDate > latest.transactionDate ? current : latest
      );

      if (latestTransaction.balanceAfter !== null) {
        await prisma.account.update({
          where: { id: accountId },
          data: { balance: latestTransaction.balanceAfter },
        });
      }
    }

    return NextResponse.json({
      success: true,
      importBatchId,
      transactions: savedTransactions,
      summary: parseResult.summary,
      errors: parseResult.errors,
    });
  } catch (error) {
    console.error("MPESA parse error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

