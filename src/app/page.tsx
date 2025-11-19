import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  Smartphone,
  DollarSign,
  Bitcoin,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Target,
  PieChart,
} from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      icon: Wallet,
      title: "M-PESA Management",
      description: "Track, categorize, and analyze your M-PESA transactions with AI-powered insights.",
      gradient: "from-green-500 to-emerald-600",
    },
    {
      icon: TrendingUp,
      title: "Investment Portfolio",
      description: "Monitor stocks, bonds, and mutual funds all in one place.",
      gradient: "from-blue-500 to-cyan-600",
    },
    {
      icon: Bitcoin,
      title: "Crypto Tracking",
      description: "Keep tabs on your cryptocurrency investments with real-time updates.",
      gradient: "from-orange-500 to-yellow-600",
    },
    {
      icon: BarChart3,
      title: "Smart Analytics",
      description: "AI-powered insights help you understand your spending patterns.",
      gradient: "from-purple-500 to-pink-600",
    },
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "Your financial data is encrypted and secured with industry standards.",
      gradient: "from-indigo-500 to-blue-600",
    },
    {
      icon: Zap,
      title: "Real-Time Updates",
      description: "Get instant notifications and updates on all your financial activities.",
      gradient: "from-red-500 to-orange-600",
    },
  ];

  const stats = [
    { value: "400+", label: "Transactions Tracked", icon: Smartphone },
    { value: "99.9%", label: "Accuracy Rate", icon: Target },
    { value: "₿50K+", label: "Assets Managed", icon: DollarSign },
    { value: "24/7", label: "Support Available", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Nexus
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                How It Works
              </Link>
              <Link href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                Pricing
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/auth/login"
                className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                AI-Powered Financial Management
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Your Complete
              </span>
              <br />
              <span className="text-gray-900 dark:text-white">
                Financial Dashboard
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Track M-PESA, stocks, crypto, and bank accounts all in one place.
              AI-powered insights help you make smarter financial decisions.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="/auth/register"
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-200 flex items-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/auth/login"
                className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-xl font-semibold hover:border-green-600 dark:hover:border-green-400 transition-all duration-200"
              >
                Try Demo Account
              </Link>
            </div>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Free forever</span>
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-3xl"></div>
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                  <Wallet className="w-8 h-8 text-green-600 dark:text-green-400 mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">M-PESA Balance</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">KES 45,250</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                  <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Investments</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">$12,450</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 p-6 rounded-xl border border-orange-200 dark:border-orange-800">
                  <Bitcoin className="w-8 h-8 text-orange-600 dark:text-orange-400 mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Crypto</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">0.245 BTC</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need to manage your finances
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Powerful features designed for modern Kenyan financial management
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-transparent hover:shadow-2xl transition-all duration-300"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity`}></div>
                  <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl mb-6`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Get started in minutes
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Simple, secure, and straightforward setup process
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Create Account",
                description: "Sign up with your email. No credit card required.",
              },
              {
                step: "2",
                title: "Connect Accounts",
                description: "Upload M-PESA statements or connect your accounts.",
              },
              {
                step: "3",
                title: "Track & Grow",
                description: "Get AI-powered insights and watch your wealth grow.",
              },
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border-2 border-gray-200 dark:border-gray-800 hover:border-green-500 dark:hover:border-green-400 transition-all">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-xl font-bold mb-6">
                    {step.step}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {step.description}
                  </p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/10"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Ready to take control of your finances?
              </h2>
              <p className="text-xl text-green-50 mb-8">
                Join thousands of Kenyans managing their money smarter
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/auth/register"
                  className="px-8 py-4 bg-white text-green-600 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-200 flex items-center gap-2"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/auth/login"
                  className="px-8 py-4 bg-green-500/20 text-white border-2 border-white/30 rounded-xl font-semibold hover:bg-white/10 transition-all duration-200"
                >
                  Use Demo Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Nexus</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              © 2025 Nexus Financial. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                Privacy
              </Link>
              <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                Terms
              </Link>
              <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
