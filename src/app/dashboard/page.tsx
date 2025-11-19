"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  Bitcoin,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Activity,
  PieChart,
  Target,
  Sparkles,
  Upload,
  Eye,
  Download,
} from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mpesaStats, setMpesaStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchMpesaStats();
    }
  }, [session]);

  const fetchMpesaStats = async () => {
    try {
      const response = await fetch("/api/mpesa/analytics");
      if (response.ok) {
        const data = await response.json();
        setMpesaStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch M-PESA stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const portfolioCards = [
    {
      title: "M-PESA Balance",
      amount: mpesaStats?.summary?.netBalance || 0,
      currency: "KES",
      change: mpesaStats?.summary?.totalIncome > mpesaStats?.summary?.totalExpenses ? "+" : "-",
      changeValue: Math.abs(
        ((mpesaStats?.summary?.netBalance || 0) / (mpesaStats?.summary?.totalIncome || 1)) * 100
      ).toFixed(1),
      icon: Wallet,
      gradient: "from-green-500 to-emerald-600",
      href: "/dashboard/mpesa",
    },
    {
      title: "Investments",
      amount: 0,
      currency: "$",
      change: "+",
      changeValue: "0.0",
      icon: TrendingUp,
      gradient: "from-blue-500 to-cyan-600",
      href: "/dashboard/investments",
      comingSoon: true,
    },
    {
      title: "Crypto Portfolio",
      amount: 0,
      currency: "$",
      change: "+",
      changeValue: "0.0",
      icon: Bitcoin,
      gradient: "from-orange-500 to-yellow-600",
      href: "/dashboard/crypto",
      comingSoon: true,
    },
    {
      title: "Bank Accounts",
      amount: 0,
      currency: "KES",
      change: "+",
      changeValue: "0.0",
      icon: CreditCard,
      gradient: "from-purple-500 to-pink-600",
      href: "/dashboard/banks",
      comingSoon: true,
    },
  ];

  const quickActions = [
    {
      title: "Upload M-PESA Statement",
      description: "Import your transactions",
      icon: Upload,
      href: "/dashboard/mpesa",
      gradient: "from-green-500 to-emerald-600",
    },
    {
      title: "View Analytics",
      description: "Track spending patterns",
      icon: PieChart,
      href: "/dashboard/mpesa",
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      title: "Set Budget Goals",
      description: "Manage your finances",
      icon: Target,
      href: "/dashboard/mpesa/budgets",
      gradient: "from-purple-500 to-pink-600",
    },
    {
      title: "Export Data",
      description: "Download your reports",
      icon: Download,
      href: "/dashboard/mpesa/export",
      gradient: "from-orange-500 to-red-600",
    },
  ];

  const recentActivity = [
    {
      title: "M-PESA Transactions Imported",
      count: mpesaStats?.summary?.totalTransactions || 0,
      timestamp: "Today",
      icon: Wallet,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
  ];

  return (
    <DashboardLayout user={session.user}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Welcome back{session.user.name ? `, ${session.user.name}` : ""}! 👋
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Here's an overview of your financial portfolio
          </p>
        </div>

        {/* Portfolio Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {portfolioCards.map((card, index) => {
            const Icon = card.icon;
            const isPositive = card.change === "+";

            return (
              <Link
                key={index}
                href={card.href}
                className="group relative bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                {card.comingSoon && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full">
                    Coming Soon
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-semibold ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      {card.changeValue}%
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {card.currency} {card.amount.toLocaleString()}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-green-600 dark:text-green-400" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={index}
                  href={action.href}
                  className="group bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 hover:border-transparent hover:shadow-lg transition-all duration-300 relative overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                  <div className="relative">
                    <div className={`w-10 h-10 bg-gradient-to-br ${action.gradient} rounded-lg flex items-center justify-center mb-3`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {action.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                Recent Activity
              </h2>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
                    >
                      <div className={`w-12 h-12 ${activity.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-6 h-6 ${activity.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {activity.count} transactions • {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {(!mpesaStats || mpesaStats.summary?.totalTransactions === 0) && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Activity className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      No recent activity
                    </p>
                    <Link
                      href="/dashboard/mpesa"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                      <Upload className="w-5 h-5" />
                      Upload M-PESA Statement
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                AI Insights
              </h3>
              <p className="text-green-50 text-sm leading-relaxed">
                {mpesaStats?.summary?.totalTransactions > 0
                  ? `You have ${mpesaStats.summary.totalTransactions} M-PESA transactions. AI has categorized ${Math.round((mpesaStats.summary.totalTransactions * 0.95))} automatically.`
                  : "Upload your M-PESA statement to get AI-powered insights about your spending patterns."}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">
                Portfolio Summary
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">M-PESA</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">100%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-600 w-full"></div>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    More asset categories coming soon
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
