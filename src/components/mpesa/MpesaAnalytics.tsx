"use client";

/**
 * MPESA Analytics Component
 *
 * Displays insights, charts, and spending analytics
 */

import { useState, useEffect } from "react";

interface AnalyticsData {
  summary: {
    totalTransactions: number;
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
    savingsRate: number;
  };
  categories: Record<
    string,
    { count: number; total: number; percentage: number }
  >;
  merchants: {
    top: Array<{
      merchant: string;
      totalSpent: number;
      transactionCount: number;
    }>;
  };
  recurringPayments: Array<{
    merchant: string;
    frequency: number;
    averageAmount: number;
  }>;
  insights: {
    mostFrequentMerchant: string;
    topCategory: string;
  };
}

export default function MpesaAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/mpesa/analytics?period=${period}`);
      const data = await response.json();

      if (response.ok) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Analytics & Insights
        </h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Total Income
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            KES {analytics.summary.totalIncome.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Total Expense
          </p>
          <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
            KES {analytics.summary.totalExpense.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-600 dark:text-slate-400">Net Amount</p>
          <p
            className={`mt-2 text-2xl font-bold ${
              analytics.summary.netAmount >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            KES {analytics.summary.netAmount.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Savings Rate
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
            {analytics.summary.savingsRate?.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          Spending by Category
        </h3>
        <div className="space-y-3">
          {Object.entries(analytics.categories)
            .sort(([, a], [, b]) => b.total - a.total)
            .slice(0, 8)
            .map(([category, data]) => (
              <div key={category}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {category}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    KES {data.total.toLocaleString()} ({data.percentage.toFixed(1)}
                    %)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${Math.min(data.percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Top Merchants */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Top Merchants
          </h3>
          <div className="space-y-3">
            {analytics.merchants.top?.slice(0, 5).map((merchant, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-700"
              >
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-300">
                    {merchant.merchant}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {merchant.transactionCount} transactions
                  </p>
                </div>
                <p className="font-bold text-slate-900 dark:text-white">
                  KES {merchant.totalSpent.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recurring Payments */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Recurring Payments
          </h3>
          {analytics.recurringPayments.length > 0 ? (
            <div className="space-y-3">
              {analytics.recurringPayments.slice(0, 5).map((payment, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-700"
                >
                  <div>
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      {payment.merchant}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {payment.frequency}x • Likely subscription
                    </p>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    ~KES {payment.averageAmount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No recurring payments detected
            </p>
          )}
        </div>
      </div>

      {/* Quick Insights */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-900/20">
        <h3 className="mb-3 text-lg font-semibold text-emerald-900 dark:text-emerald-300">
          💡 Quick Insights
        </h3>
        <ul className="space-y-2 text-sm text-emerald-800 dark:text-emerald-400">
          <li>
            • Your most frequent merchant is <strong>{analytics.insights?.mostFrequentMerchant}</strong>
          </li>
          <li>
            • You spend the most on <strong>{analytics.insights?.topCategory}</strong>
          </li>
          <li>
            • Your savings rate is{" "}
            <strong>{analytics.summary.savingsRate?.toFixed(1)}%</strong>
            {analytics.summary.savingsRate >= 20
              ? " - Great job! 🎉"
              : " - Try to save more 💪"}
          </li>
          {analytics.recurringPayments.length > 0 && (
            <li>
              • You have <strong>{analytics.recurringPayments.length}</strong>{" "}
              recurring payments (subscriptions)
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

