"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { MpesaPDFUpload } from "@/components/mpesa/MpesaPDFUpload";
import { TransactionList } from "./components/TransactionList";
import { UncategorizedTransactions } from "./components/UncategorizedTransactions";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  Sparkles,
  PieChart,
  List,
  LayoutGrid,
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
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

export interface Transaction {
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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "transactions">("overview");
  const { theme } = useTheme();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const fetchData = async (startDate?: string, endDate?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        period: startDate && endDate ? "custom" : "all",
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

  const handleUpdateCategory = async (id: string, category: string) => {
    try {
      const res = await fetch(`/api/mpesa/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      if (res.ok) {
        fetchData(); // Refresh to update lists and analytics
      }
    } catch (error) {
      console.error("Failed to update category", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
        const res = await fetch(`/api/mpesa/transactions/${id}`, { method: "DELETE" });
        if (res.ok) fetchData();
    } catch (error) {
        console.error("Failed to delete", error);
    }
  };

  const handleSaveTransaction = async (t: Transaction) => {
      try {
        const res = await fetch(`/api/mpesa/transactions/${t.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                category: t.category, 
                description: t.description,
                merchantName: t.merchantName
             }),
        });
        if (res.ok) fetchData();
      } catch (error) {
          console.error("Failed to save", error);
      }
  };

  const categories = analytics
    ? Object.keys(analytics.categories).sort()
    : ["Groceries", "Dining", "Transport", "Utilities", "Healthcare", "Entertainment", "Financial", "Transfer"];

  const uncategorized = transactions.filter(t => t.category === "Uncategorized" || t.normalizedMerchantName === "Unknown");

  if (loading && !analytics) {
      return (
        <DashboardLayout user={session?.user}>
             <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
             </div>
        </DashboardLayout>
      );
  }

  return (
    <DashboardLayout user={session?.user}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header & Actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                   <Wallet className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                M-PESA Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 ml-14">
                {transactions.length} transactions analyzed
              </p>
            </div>

            <div className="flex gap-3">
                <button
                  onClick={() => setShowUpload(!showUpload)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-sm hover:shadow-md"
                >
                  <Download className="w-4 h-4" />
                  Upload Statement
                </button>
                <button
                   onClick={() => fetchData()}
                   className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
            </div>
          </div>

           {/* Upload Modal */}
           {showUpload && (
              <div className="mb-8">
                <MpesaPDFUpload onSuccess={() => { setShowUpload(false); fetchData(); }} />
              </div>
            )}

          {/* Uncategorized Alert (Always visible if exists) */}
          <UncategorizedTransactions 
            transactions={uncategorized} 
            onUpdateCategory={handleUpdateCategory}
            categories={categories}
          />

          {/* Tabs */}
          <div className="flex items-center gap-4 mb-6 border-b border-gray-200 dark:border-gray-800">
            <button
                onClick={() => setActiveTab("overview")}
                className={`pb-3 px-2 flex items-center gap-2 font-medium transition-colors relative ${
                    activeTab === "overview" 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
            >
                <LayoutGrid className="w-4 h-4" />
                Overview
                {activeTab === "overview" && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 dark:bg-green-400 rounded-t-full" />
                )}
            </button>
            <button
                onClick={() => setActiveTab("transactions")}
                className={`pb-3 px-2 flex items-center gap-2 font-medium transition-colors relative ${
                    activeTab === "transactions" 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
            >
                <List className="w-4 h-4" />
                Transactions
                {activeTab === "transactions" && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 dark:bg-green-400 rounded-t-full" />
                )}
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
                 {/* Summary Cards */}
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Income</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                            KES {(analytics?.summary?.totalIncome ?? 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                            KES {(analytics?.summary?.totalExpense ?? 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Net Balance</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                            KES {(analytics?.summary?.netAmount ?? 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Savings Rate</p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                            {(analytics?.summary?.savingsRate ?? 0).toFixed(1)}%
                        </p>
                    </div>
                 </div>

                 {/* Charts */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Income vs Expenses</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analytics?.monthlyTrend || []}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="income" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                                    <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Spending by Category</h3>
                         <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart>
                                    <Pie
                                        data={Object.entries(analytics?.categories || {})
                                            .map(([name, data]) => ({ name, value: data.total }))
                                            .sort((a, b) => b.value - a.value)
                                            .slice(0, 5)
                                        }
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {Object.entries(analytics?.categories || {}).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                 </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === "transactions" && (
            <TransactionList 
                transactions={transactions} 
                categories={categories}
                onEdit={() => {}} 
                onDelete={handleDelete}
                onSave={handleSaveTransaction}
            />
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}
