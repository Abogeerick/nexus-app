/**
 * Dashboard Page
 *
 * Main dashboard for authenticated users
 */

import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/auth/SignOutButton";

export default async function DashboardPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600"></div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                Nexus Finance
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600 dark:text-slate-300">
                {session.user.email}
              </span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-slate-900 dark:text-white">
            Welcome back{session.user.name ? `, ${session.user.name}` : ""}!
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Your financial command center
          </p>
        </div>

        {/* User Info Card */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800">
          <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">
            Account Information
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Name:
              </span>
              <p className="text-lg text-slate-900 dark:text-white">
                {session.user.name || "Not set"}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Email:
              </span>
              <p className="text-lg text-slate-900 dark:text-white">{session.user.email}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Role:
              </span>
              <p className="text-lg text-slate-900 dark:text-white">
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  {session.user.role}
                </span>
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                User ID:
              </span>
              <p className="font-mono text-sm text-slate-700 dark:text-slate-300">
                {session.user.id}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-md transition-all hover:scale-[1.02] hover:shadow-lg dark:bg-slate-800">
            <div className="mb-4 text-4xl">💰</div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
              Add Account
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Connect your bank accounts, Mpesa, or crypto wallets
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-md transition-all hover:scale-[1.02] hover:shadow-lg dark:bg-slate-800">
            <div className="mb-4 text-4xl">📊</div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
              View Analytics
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              See your portfolio performance and allocation
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-md transition-all hover:scale-[1.02] hover:shadow-lg dark:bg-slate-800">
            <div className="mb-4 text-4xl">🎯</div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
              Set Goals
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Create financial goals with Monte Carlo simulations
            </p>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="mt-12 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800/50">
          <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">
            🚀 More Features Coming Soon
          </h3>
          <p className="text-slate-600 dark:text-slate-300">
            Portfolio tracking, Mpesa integration, goal planning, and more!
          </p>
        </div>
      </main>
    </div>
  );
}

