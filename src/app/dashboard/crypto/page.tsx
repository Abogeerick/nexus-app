"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Bitcoin, TrendingUp, Wallet, Shield, Sparkles, Lock } from "lucide-react";
import Link from "next/link";

export default function CryptoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <DashboardLayout user={session?.user}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const features = [
    {
      icon: Bitcoin,
      title: "Multi-Currency Support",
      description: "Track Bitcoin, Ethereum, and 100+ cryptocurrencies",
    },
    {
      icon: TrendingUp,
      title: "Real-Time Prices",
      description: "Live market data and price alerts for your holdings",
    },
    {
      icon: Shield,
      title: "Secure Tracking",
      description: "View-only tracking keeps your assets safe",
    },
  ];

  return (
    <DashboardLayout user={session?.user}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-2xl flex items-center justify-center">
              <Bitcoin className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Cryptocurrency Portfolio
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Track your crypto investments
              </p>
            </div>
          </div>

          {/* Coming Soon Card */}
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-3xl p-12 border-2 border-orange-200 dark:border-orange-800 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Coming Soon!
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              We're building a comprehensive cryptocurrency tracker. Monitor your digital assets with real-time prices and portfolio analytics.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-gradient-to-r from-orange-600 to-yellow-600 text-white rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Back to Dashboard
              </Link>
            </div>

            <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
              Want to be notified when this feature launches? Stay tuned!
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

