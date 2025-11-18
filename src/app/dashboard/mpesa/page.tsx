/**
 * MPESA Dashboard Page
 *
 * Main page for MPESA transaction management
 * - Upload CSV/SMS
 * - View transactions
 * - Analytics
 */

import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import MpesaUpload from "@/components/mpesa/MpesaUpload";
import MpesaTransactions from "@/components/mpesa/MpesaTransactions";
import MpesaAnalytics from "@/components/mpesa/MpesaAnalytics";

export default async function MpesaDashboardPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                M-PESA Transactions
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Import, analyze, and track your M-PESA transactions
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-emerald-50 px-4 py-2 dark:bg-emerald-900/20">
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Currency
                </p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  KES
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-1">
          {/* Upload Section */}
          <section>
            <MpesaUpload />
          </section>

          {/* Analytics Section */}
          <section>
            <MpesaAnalytics />
          </section>

          {/* Transactions List */}
          <section>
            <MpesaTransactions />
          </section>
        </div>
      </div>
    </div>
  );
}

