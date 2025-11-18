/**
 * MPESA Analytics API Endpoint
 * GET /api/mpesa/analytics
 *
 * Provides analytics and insights on MPESA transactions
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { getCategoryStats } from "@/lib/ai/mpesa-classifier";
import {
  getMerchantSpendingSummary,
  detectRecurringMerchants,
} from "@/lib/ai/merchant-normalizer";

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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const period = searchParams.get("period") || "30d"; // 7d, 30d, 90d, 1y, all

    // Build where clause
    const where: any = { userId };
    if (accountId) where.accountId = accountId;

    // Calculate date range based on period
    const now = new Date();
    let dateFilter: Date | undefined;

    switch (period) {
      case "7d":
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        dateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    if (startDate || dateFilter) {
      where.transactionDate = {};
      if (startDate) {
        where.transactionDate.gte = new Date(startDate);
      } else if (dateFilter) {
        where.transactionDate.gte = dateFilter;
      }
    }

    if (endDate) {
      if (!where.transactionDate) where.transactionDate = {};
      where.transactionDate.lte = new Date(endDate);
    }

    // Fetch transactions
    const transactions = await prisma.mpesaTransaction.findMany({
      where,
      orderBy: { transactionDate: "desc" },
    });

    if (transactions.length === 0) {
      return NextResponse.json({
        message: "No transactions found for the specified period",
        summary: {
          totalTransactions: 0,
          totalIncome: 0,
          totalExpense: 0,
          netAmount: 0,
        },
        categories: {},
        merchants: [],
        recurringPayments: [],
      });
    }

    // Calculate overall summary
    let totalIncome = 0;
    let totalExpense = 0;

    for (const t of transactions) {
      const amount = Number(t.amount); // Convert Decimal to number
      if (t.isIncome) {
        totalIncome += amount;
      } else {
        totalExpense += amount;
      }
    }

    // Category statistics
    const categoryStats = getCategoryStats(
      transactions.map((t) => ({
        category: t.category,
        amount: Number(t.amount), // Convert to number
        isIncome: t.isIncome,
      }))
    );

    // Top merchants
    const merchantSummary = getMerchantSpendingSummary(
      transactions.map((t) => ({
        normalizedMerchantName: t.normalizedMerchantName,
        amount: Number(t.amount), // Convert to number
        isIncome: t.isIncome,
      }))
    );

    // Recurring payments (subscriptions)
    const recurringPayments = detectRecurringMerchants(
      transactions.map((t) => ({
        normalizedMerchantName: t.normalizedMerchantName,
        amount: Number(t.amount), // Convert to number
        transactionDate: t.transactionDate,
      })),
      3 // Min 3 occurrences
    );

    // Transaction type distribution
    const typeDistribution = transactions.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Monthly trend data
    const monthlyTrend = transactions.reduce((acc, t) => {
      const month = t.transactionDate.toISOString().substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { month, income: 0, expense: 0 };
      }
      const amount = Number(t.amount);
      if (t.isIncome) {
        acc[month].income += amount;
      } else {
        acc[month].expense += amount;
      }
      return acc;
    }, {} as Record<string, { month: string; income: number; expense: number }>);

    // Convert to array and sort
    const monthlyTrendArray = Object.values(monthlyTrend)
      .sort((a, b) => a.month.localeCompare(b.month));

    // Daily spending trend (last 30 days or specified period)
    const dailySpending = transactions
      .filter((t) => !t.isIncome)
      .reduce((acc, t) => {
        const date = t.transactionDate.toISOString().split("T")[0];
        acc[date] = (acc[date] || 0) + Number(t.amount); // Convert to number
        return acc;
      }, {} as Record<string, number>);

    // Convert to array and sort
    const spendingTrend = Object.entries(dailySpending)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Average transaction values
    const avgIncome =
      totalIncome / transactions.filter((t) => t.isIncome).length || 0;
    const avgExpense =
      totalExpense / transactions.filter((t) => !t.isIncome).length || 0;

    // Largest transactions
    const largestIncome = transactions
      .filter((t) => t.isIncome)
      .sort((a, b) => Number(b.amount) - Number(a.amount)) // Convert to number for comparison
      .slice(0, 5)
      .map((t) => ({
        transactionCode: t.transactionCode,
        amount: Number(t.amount), // Convert to number
        counterparty: t.counterpartyName,
        date: t.transactionDate.toISOString(),
      }));

    const largestExpense = transactions
      .filter((t) => !t.isIncome)
      .sort((a, b) => Number(b.amount) - Number(a.amount)) // Convert to number for comparison
      .slice(0, 5)
      .map((t) => ({
        transactionCode: t.transactionCode,
        amount: Number(t.amount), // Convert to number
        merchant: t.normalizedMerchantName || t.counterpartyName,
        date: t.transactionDate.toISOString(),
      }));

    return NextResponse.json({
      summary: {
        totalTransactions: transactions.length,
        totalIncome,
        totalExpense,
        netAmount: totalIncome - totalExpense,
        avgIncome,
        avgExpense,
        savingsRate: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0,
      },
      categories: categoryStats,
      merchants: {
        top: merchantSummary.slice(0, 10),
        all: merchantSummary.length,
      },
      recurringPayments: recurringPayments.filter((p) => p.isLikelySubscription),
      typeDistribution,
      monthlyTrend: monthlyTrendArray,
      spendingTrend,
      insights: {
        largestIncome,
        largestExpense,
        mostFrequentMerchant: merchantSummary[0]?.merchant || "N/A",
        topCategory: Object.entries(categoryStats).sort((a, b) => b[1].total - a[1].total)[0]?.[0] || "N/A",
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

