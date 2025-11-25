"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Calendar,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { useTheme } from "next-themes";

interface AnalyticsData {
  summary: {
    totalTransactions: number;
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
    avgIncome: number;
    avgExpense: number;
    savingsRate: number;
  };
  categories: Record<string, { total: number; count: number }>;
  merchants: {
    top: Array<{ merchant: string; amount: number; count: number }>;
    all: number;
  };
  monthlyTrend: Array<{ month: string; income: number; expense: number }>;
  spendingTrend: Array<{ date: string; amount: number }>;
  insights: {
    largestIncome: Array<{ transactionCode: string; amount: number; counterparty: string; date: string }>;
    largestExpense: Array<{ transactionCode: string; amount: number; merchant: string; date: string }>;
    mostFrequentMerchant: string;
    topCategory: string;
  };
  recurringPayments?: Array<{
    merchant: string;
    frequency: string;
    averageAmount: number;
    transactionCount: number;
  }>;
  typeDistribution?: Record<string, number>;
}

const COLORS = [
  "#10b981", // green
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

export default function MpesaAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [period, setPeriod] = useState("30d");
  const { theme } = useTheme();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        period: dateRange?.start && dateRange?.end ? "custom" : period,
        ...(dateRange?.start && { startDate: dateRange.start }),
        ...(dateRange?.end && { endDate: dateRange.end }),
      });

      const response = await fetch(`/api/mpesa/analytics?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period, dateRange]);

  const handleDateFilter = () => {
    if (dateRange?.start && dateRange?.end) {
      fetchAnalytics();
    }
  };

  const exportData = () => {
    if (!analytics) return;
    const dataStr = JSON.stringify(analytics, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mpesa-analytics-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
  };

  if (status === "loading") {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={session?.user ? { name: session.user.name, email: session.user.email } : undefined}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  M-PESA Analytics
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Deep insights into your financial patterns
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportData}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={fetchAnalytics}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Period Filter */}
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4 flex-wrap">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div className="flex gap-2">
                {["7d", "30d", "90d", "1y", "all"].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPeriod(p);
                      setDateRange(null);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      period === p
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : p === "90d" ? "90 Days" : p === "1y" ? "1 Year" : "All Time"}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 flex-1">
                <input
                  type="date"
                  value={dateRange?.start || ""}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value } as { start: string; end: string })
                  }
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="date"
                  value={dateRange?.end || ""}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end: e.target.value } as { start: string; end: string })
                  }
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                {(dateRange?.start || dateRange?.end) && (
                  <button
                    onClick={handleDateFilter}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    Apply
                  </button>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
            </div>
          ) : analytics ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Income</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        KES {analytics.summary.totalIncome.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Avg: KES {analytics.summary.avgIncome.toLocaleString()}
                      </p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-green-500 opacity-50" />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        KES {analytics.summary.totalExpense.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Avg: KES {analytics.summary.avgExpense.toLocaleString()}
                      </p>
                    </div>
                    <TrendingDown className="w-12 h-12 text-red-500 opacity-50" />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Net Balance</p>
                      <p className={`text-2xl font-bold ${analytics.summary.netAmount >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        KES {analytics.summary.netAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {analytics.summary.savingsRate.toFixed(1)}% savings rate
                      </p>
                    </div>
                    <PieChart className="w-12 h-12 text-blue-500 opacity-50" />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Transactions</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {analytics.summary.totalTransactions}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {analytics.merchants.all} unique merchants
                      </p>
                    </div>
                    <BarChart3 className="w-12 h-12 text-purple-500 opacity-50" />
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Monthly Trend */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Income vs Expenses Trend
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                      <XAxis
                        dataKey="month"
                        stroke="#9ca3af"
                        tickFormatter={(value) => {
                          const [year, month] = value.split("-");
                          return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          });
                        }}
                      />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme === "dark" ? "#1f2937" : "#fff",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="income"
                        stackId="1"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.6}
                        name="Income"
                      />
                      <Area
                        type="monotone"
                        dataKey="expense"
                        stackId="2"
                        stroke="#ef4444"
                        fill="#ef4444"
                        fillOpacity={0.6}
                        name="Expenses"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Category Breakdown */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Spending by Category
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={Object.entries(analytics.categories)
                          .filter(([_, data]) => data.total > 0)
                          .map(([name, data]) => ({ name, value: data.total }))
                          .sort((a, b) => b.value - a.value)
                          .slice(0, 8)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.entries(analytics.categories)
                          .filter(([_, data]) => data.total > 0)
                          .slice(0, 8)
                          .map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme === "dark" ? "#1f2937" : "#fff",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Daily Spending Trend */}
              {analytics.spendingTrend && analytics.spendingTrend.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Daily Spending Trend
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.spendingTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                      <XAxis
                        dataKey="date"
                        stroke="#9ca3af"
                        tickFormatter={(value) => {
                          return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                        }}
                      />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme === "dark" ? "#1f2937" : "#fff",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                        }}
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ fill: "#ef4444", r: 3 }}
                        name="Daily Spending"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Top Merchants & Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Top Merchants */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Top Spending Merchants
                  </h3>
                  <div className="space-y-3">
                    {analytics.merchants.top.slice(0, 10).map((merchant, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                          >
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{merchant.merchant}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {merchant.count} transactions
                            </p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          KES {merchant.amount.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Insights */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Key Insights
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Most Frequent Merchant
                      </p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {analytics.insights.mostFrequentMerchant}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                        Top Category
                      </p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {analytics.insights.topCategory}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">
                        Largest Single Expense
                      </p>
                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        KES {analytics.insights.largestExpense[0]?.amount.toLocaleString() || "N/A"}
                      </p>
                      <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                        {analytics.insights.largestExpense[0]?.merchant || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recurring Payments */}
              {analytics.recurringPayments && analytics.recurringPayments.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Recurring Payments (Subscriptions)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analytics.recurringPayments.map((payment, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
                      >
                        <p className="font-semibold text-gray-900 dark:text-white mb-2">{payment.merchant}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Frequency: {payment.frequency}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Avg Amount: KES {payment.averageAmount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {payment.transactionCount} transactions
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No analytics data available</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}



