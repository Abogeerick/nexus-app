import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600"></div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">Nexus Finance</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/auth/signin"
              className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-200">
            <span className="mr-2">🚀</span>
            MVP · Kenya-Ready · 100% Free Tier
          </div>

          {/* Heading */}
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl md:text-7xl">
            Your Complete{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Financial Command Center
            </span>
          </h1>

          {/* Description */}
          <p className="mb-10 text-xl leading-relaxed text-slate-600 dark:text-slate-300">
            Track stocks, crypto, bank balances, and Mpesa—all in one place. Get insights, plan your
            goals, and make smarter financial decisions with AI-powered analytics.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="flex h-14 w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl sm:w-auto"
            >
              Open Dashboard →
            </Link>
            <Link
              href="#features"
              className="flex h-14 w-full items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-8 text-lg font-semibold text-slate-900 transition-all hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:border-slate-500 dark:hover:bg-slate-700 sm:w-auto"
            >
              Learn More
            </Link>
          </div>

          {/* Features Grid */}
          <div className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-md dark:bg-slate-800">
              <div className="mb-4 text-4xl">💰</div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                Multi-Asset Tracking
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Stocks, crypto, cash, and Mpesa—all aggregated with real-time pricing
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-md dark:bg-slate-800">
              <div className="mb-4 text-4xl">📊</div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                Smart Analytics
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Performance metrics, allocation charts, and risk indicators
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-md dark:bg-slate-800">
              <div className="mb-4 text-4xl">🎯</div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                Goal Planning
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Monte Carlo simulations and what-if scenarios for your financial goals
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        <p>Built with Next.js, TypeScript, and Tailwind CSS · No paid APIs required</p>
      </footer>
    </div>
  );
}
