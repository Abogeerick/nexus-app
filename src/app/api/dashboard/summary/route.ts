import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/prisma";
import { AccountType, AssetType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all accounts
    const accounts = await prisma.account.findMany({
      where: { userId },
    });

    // Fetch all assets
    const assets = await prisma.asset.findMany({
      where: { userId },
    });

    // Fetch M-PESA transaction stats
    const mpesaStats = await prisma.mpesaTransaction.aggregate({
      where: { userId },
      _sum: {
        amount: true,
      },
      _count: {
        _all: true,
      },
    });

    // Calculate totals
    const mpesaBalance = accounts
      .filter(a => a.type === AccountType.MPESA)
      .reduce((sum, a) => sum + a.balance, 0);

    const bankBalance = accounts
      .filter(a => a.type === AccountType.BANK)
      .reduce((sum, a) => sum + a.balance, 0);

    const cashBalance = accounts
      .filter(a => a.type === AccountType.CASH)
      .reduce((sum, a) => sum + a.balance, 0);

    const investmentValue = assets
      .filter(a => a.type === AssetType.STOCK || a.type === AssetType.BOND || a.type === AssetType.REAL_ESTATE || a.type === AssetType.CUSTOM)
      .reduce((sum, a) => sum + (a.quantity * a.purchasePrice), 0); // Note: Using purchase price as current price for MVP

    const cryptoValue = assets
      .filter(a => a.type === AssetType.CRYPTO)
      .reduce((sum, a) => sum + (a.quantity * a.purchasePrice), 0);

    // Get recent activity count (M-PESA transactions today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const recentActivityCount = await prisma.mpesaTransaction.count({
      where: {
        userId,
        transactionDate: {
          gte: today,
        },
      },
    });

    // Get uncategorized count
    const uncategorizedCount = await prisma.mpesaTransaction.count({
        where: {
            userId,
            category: "Uncategorized", // or logic for unknown
        }
    });

    const totalTransactions = mpesaStats._count._all;
    const categorizedCount = totalTransactions - uncategorizedCount;

    return NextResponse.json({
      mpesaBalance,
      bankBalance,
      investmentValue,
      cryptoValue,
      recentActivityCount,
      totalTransactions,
      categorizedCount,
    });

  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
  }
}

