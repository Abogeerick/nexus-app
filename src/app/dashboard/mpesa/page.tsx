"use client";

import { useState, useEffect } from "react";
import { MpesaPDFUpload } from "@/components/mpesa/MpesaPDFUpload";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ShoppingCart,
  Users,
  AlertTriangle,
  Download,
  RefreshCw,
  Moon,
  Sun,
  Calendar,
  Filter,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "next-themes";

interface Transaction {
  id: string;
  transactionCode: string;
  amount: number;
  transactionDate: string;
  type: string;
  category: string;
  isIncome: boolean;
  merchantName?: string;
  normalizedMerchantName?: string;
  description?: string;
}

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
  insights: {
    largestIncome: Array<{ transactionCode: string; amount: number; counterparty: string }>;
    largestExpense: Array<{ transactionCode: string; amount: number; merchant: string }>;
    mostFrequentMerchant: string;
    topCategory: string;
  };
}

const COLORS = [
  "#10b981", // green
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
];

export default function MpesaDashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const { theme, setTheme } = useTheme();

  const fetchData = async (startDate?: string, endDate?: string) => {
    setLoading(true);
    try {
      const period = startDate && endDate ? "custom" : "all";
      const params = new URLSearchParams({
        period,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const [transResponse, analyticsResponse] = await Promise.all([
        fetch(`/api/mpesa/transactions?${params.toString()}`),
        fetch(`/api/mpesa/analytics?${params.toString()}`),
      ]);

      if (transResponse.ok) {
        const transData = await transResponse.json();
        setTransactions(transData.transactions || []);
      }

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDateFilter = () => {
    if (dateRange?.start && dateRange?.end) {
      fetchData(dateRange.start, dateRange.end);
    } else {
      fetchData();
    }
  };

  const unknownTransactions = transactions.filter(
    (t) => !t.normalizedMerchantName || 
           t.normalizedMerchantName === "Unknown" ||
           !t.merchantName ||
           t.merchantName === "Unknown"
  );

  const hasData = transactions.length > 0;

  if (!hasData && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                M-PESA Financial Analytics
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Upload your M-PESA statement to get started
              </p>
            </div>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              )}
            </button>
          </div>

          {/* Upload Section */}
          <MpesaPDFUpload onSuccess={fetchData} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              M-PESA Financial Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {analytics?.summary.totalTransactions || transactions.length} transactions analyzed
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Upload Statement
            </button>
            <button
              onClick={() => fetchData()}
              className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Date Filter */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-500" />
            <div className="flex gap-3 flex-1">
              <input
                type="date"
                value={dateRange?.start || ""}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value } as { start: string; end: string })
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Start date"
              />
              <input
                type="date"
                value={dateRange?.end || ""}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value } as { start: string; end: string })
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="End date"
              />
              <button
                onClick={handleDateFilter}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>
              {dateRange && (
                <button
                  onClick={() => {
                    setDateRange(null);
                    fetchData();
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Upload Modal */}
        {showUpload && (
          <div className="mb-8">
            <MpesaPDFUpload
              onSuccess={() => {
                fetchData();
                setShowUpload(false);
              }}
            />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Income</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      KES {analytics?.summary.totalIncome.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      KES {analytics?.summary.totalExpense.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Net Balance</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      KES {(analytics?.summary.netAmount || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Transactions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analytics?.summary.totalTransactions || transactions.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Monthly Trend */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Income vs Expenses by Month
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics?.monthlyTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                    <XAxis 
                      dataKey="month" 
                      stroke="#9ca3af"
                      tickFormatter={(value) => {
                        const [year, month] = value.split("-");
                        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
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
                  <PieChart>
                    <Pie
                      data={Object.entries(analytics?.categories || {})
                        .filter(([_, data]) => data.total > 0)
                        .map(([name, data]) => ({ name, value: data.total }))
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 6)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(analytics?.categories || {})
                        .filter(([_, data]) => data.total > 0)
                        .slice(0, 6)
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
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Merchants */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Top Spending Merchants
              </h3>
              <div className="space-y-4">
                {analytics?.merchants.top
                  .filter((m) => m.merchant !== "Unknown")
                  .slice(0, 10)
                  .map((merchant, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        >
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {merchant.merchant}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
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

            {/* Unknown Transactions */}
            {unknownTransactions.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">
                      {unknownTransactions.length} Uncategorized Transactions
                    </h3>
                    <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
                      These transactions couldn't be automatically categorized. Review them to
                      improve your insights.
                    </p>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {unknownTransactions.slice(0, 20).map((t) => (
                        <div
                          key={t.id}
                          className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {t.transactionCode}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(t.transactionDate).toLocaleString("en-KE", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                              {t.description || "No description available"}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white ml-4">
                            KES {t.amount.toLocaleString()}
                          </p>
                        </div>
                      ))}
                      {unknownTransactions.length > 20 && (
                        <p className="text-sm text-amber-700 dark:text-amber-300 text-center mt-4">
                          ... and {unknownTransactions.length - 20} more
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
