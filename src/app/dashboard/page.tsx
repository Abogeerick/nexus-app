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
  Sparkles,
  Upload,
  PieChart,
  Target,
  Download,
  Activity
} from "lucide-react";
import { LoadingOverlay, LoadingSpinner } from "@/components/loading";

interface DashboardSummary {
  mpesaBalance: number;
  bankBalance: number;
  investmentValue: number;
  cryptoValue: number;
  recentActivityCount: number;
  totalTransactions: number;
  categorizedCount: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchSummary();
    }
  }, [session]);

  const fetchSummary = async () => {
    try {
      const response = await fetch("/api/dashboard/summary");
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard summary:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <DashboardLayout>
        <LoadingOverlay isLoading={true} text="Loading dashboard..." variant="logo" />
      </DashboardLayout>
    );
  }

  if (!session) return null;

  const portfolioCards = [
    {
      title: "M-PESA Balance",
      amount: summary?.mpesaBalance || 0,
      currency: "KES",
      change: "+",
      changeValue: "2.5", // Mock for MVP
      icon: Wallet,
      gradient: "from-green-500 to-emerald-600",
      href: "/dashboard/mpesa",
    },
    {
      title: "Investments",
      amount: summary?.investmentValue || 0,
      currency: "KES",
      change: "+",
      changeValue: "12.4",
      icon: TrendingUp,
      gradient: "from-blue-500 to-cyan-600",
      href: "/dashboard/investments",
    },
    {
      title: "Crypto Portfolio",
      amount: summary?.cryptoValue || 0,
      currency: "USD",
      change: "-",
      changeValue: "5.2",
      icon: Bitcoin,
      gradient: "from-orange-500 to-yellow-600",
      href: "/dashboard/investments",
    },
    {
      title: "Bank Accounts",
      amount: summary?.bankBalance || 0,
      currency: "KES",
      change: "+",
      changeValue: "0.8",
      icon: CreditCard,
      gradient: "from-purple-500 to-pink-600",
      href: "/dashboard/cards",
    },
  ];

  return (
    <DashboardLayout user={session.user}>
      <LoadingOverlay isLoading={loading} text="Loading your dashboard..." variant="logo" />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {session.user.name?.split(" ")[0]}! 👋
          </h1>
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
                className="group relative bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center shadow-lg shadow-gray-200 dark:shadow-none`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-bold ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"} bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg`}>
                      {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      {card.changeValue}%
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {card.currency} {card.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
                { name: "Upload M-PESA Statement", desc: "Import your transactions", icon: Upload, href: "/dashboard/mpesa", color: "blue" },
                { name: "View Analytics", desc: "Track spending patterns", icon: PieChart, href: "/dashboard/mpesa", color: "purple" },
                { name: "Set Budget Goals", desc: "Manage your finances", icon: Target, href: "/dashboard/mpesa/budgets", color: "pink" },
                { name: "Export Data", desc: "Download your reports", icon: Download, href: "/dashboard/mpesa/export", color: "orange" }
            ].map((action, i) => (
                <Link key={i} href={action.href} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-green-500 dark:hover:border-green-500 transition-all group">
                    <div className={`w-10 h-10 rounded-lg bg-${action.color}-100 dark:bg-${action.color}-900/20 flex items-center justify-center mb-3 text-${action.color}-600 dark:text-${action.color}-400 group-hover:scale-110 transition-transform`}>
                        <action.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{action.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{action.desc}</p>
                </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
             <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                Recent Activity
             </h2>
             {summary?.recentActivityCount ? (
                 <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/20">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <Wallet className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-white">M-PESA Transactions Imported</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {summary.recentActivityCount} transactions today
                        </p>
                    </div>
                 </div>
             ) : (
                 <p className="text-gray-500 text-sm">No recent activity today.</p>
             )}
          </div>

          {/* AI Insights */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                AI Insights
            </h2>
            <div className="space-y-4">
                <p className="text-indigo-100 text-sm leading-relaxed">
                    You have <span className="font-bold text-white">{summary?.totalTransactions || 0}</span> M-PESA transactions. 
                    AI has categorized <span className="font-bold text-white">{summary?.categorizedCount || 0}</span> automatically.
                </p>
                <div className="h-2 bg-indigo-900/50 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-yellow-400 rounded-full" 
                        style={{ width: `${summary?.totalTransactions ? (summary.categorizedCount / summary.totalTransactions) * 100 : 0}%` }}
                    />
                </div>
                <p className="text-xs text-indigo-300">
                    {summary?.totalTransactions ? Math.round((summary.categorizedCount / summary.totalTransactions) * 100) : 0}% Categorized
                </p>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
