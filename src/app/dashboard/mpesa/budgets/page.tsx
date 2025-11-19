"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Target,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Calendar,
} from "lucide-react";

interface Budget {
  id: string;
  category: string;
  amount: number;
  period: "WEEKLY" | "MONTHLY" | "YEARLY" | "weekly" | "monthly" | "yearly";
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

interface BudgetWithSpending extends Budget {
  spent: number;
  remaining: number;
  percentageUsed: number;
  transactionsCount: number;
}

interface CategorySpending {
  category: string;
  total: number;
  count: number;
}

export default function MpesaBudgetsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [budgets, setBudgets] = useState<BudgetWithSpending[]>([]);
  const [categories, setCategories] = useState<CategorySpending[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    period: "monthly" as "monthly" | "weekly" | "yearly",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch budgets (we'll create this API endpoint)
      const budgetsResponse = await fetch("/api/mpesa/budgets");
      const budgetsData = budgetsResponse.ok ? await budgetsResponse.json() : { budgets: [] };

      // Fetch category spending from analytics
      const analyticsResponse = await fetch("/api/mpesa/analytics?period=30d");
      const analyticsData = analyticsResponse.ok ? await analyticsResponse.json() : { categories: {} };

      // Calculate spending for each budget
      const budgetsWithSpending: BudgetWithSpending[] = (budgetsData.budgets || []).map((budget: Budget) => {
        const categorySpending = analyticsData.categories[budget.category] || { total: 0, count: 0 };
        const spent = categorySpending.total;
        const remaining = budget.amount - spent;
        const percentageUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

        return {
          ...budget,
          spent,
          remaining,
          percentageUsed,
          transactionsCount: categorySpending.count,
        };
      });

      setBudgets(budgetsWithSpending);

      // Get all categories for the form
      const categoryList = Object.entries(analyticsData.categories || {})
        .map(([name, data]: [string, any]) => ({
          category: name,
          total: data.total,
          count: data.count,
        }))
        .sort((a, b) => b.total - a.total);

      setCategories(categoryList);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const budgetData = {
        category: formData.category,
        amount: parseFloat(formData.amount),
        period: formData.period,
      };

      const url = editingBudget ? `/api/mpesa/budgets/${editingBudget.id}` : "/api/mpesa/budgets";
      const method = editingBudget ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(budgetData),
      });

      if (response.ok) {
        setShowAddModal(false);
        setEditingBudget(null);
        setFormData({ category: "", amount: "", period: "monthly" });
        fetchData();
      }
    } catch (error) {
      console.error("Error saving budget:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this budget?")) return;

    try {
      const response = await fetch(`/api/mpesa/budgets/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting budget:", error);
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      amount: budget.amount.toString(),
      period: budget.period,
    });
    setShowAddModal(true);
  };

  const getStatusColor = (percentageUsed: number) => {
    if (percentageUsed >= 100) return "text-red-600 dark:text-red-400";
    if (percentageUsed >= 80) return "text-amber-600 dark:text-amber-400";
    return "text-green-600 dark:text-green-400";
  };

  const getStatusIcon = (percentageUsed: number) => {
    if (percentageUsed >= 100) return <AlertCircle className="w-5 h-5" />;
    if (percentageUsed >= 80) return <AlertCircle className="w-5 h-5" />;
    return <CheckCircle className="w-5 h-5" />;
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
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                <Target className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Budget Management</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Track and manage your spending budgets
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingBudget(null);
                setFormData({ category: "", amount: "", period: "monthly" });
                setShowAddModal(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all font-semibold flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Budget
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
            </div>
          ) : (
            <>
              {/* Budget Cards */}
              {budgets.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
                  <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No Budgets Set
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Create your first budget to start tracking your spending
                  </p>
                  <button
                    onClick={() => {
                      setEditingBudget(null);
                      setFormData({ category: "", amount: "", period: "monthly" });
                      setShowAddModal(true);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                  >
                    Create Budget
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {budgets.map((budget) => (
                    <div
                      key={budget.id}
                      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {budget.category}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                            {budget.period.toLowerCase()} budget
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(budget)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(budget.id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Budget</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            KES {budget.amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Spent</span>
                          <span className={`text-sm font-semibold ${getStatusColor(budget.percentageUsed)}`}>
                            KES {budget.spent.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Remaining</span>
                          <span
                            className={`text-sm font-semibold ${
                              budget.remaining >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            KES {Math.abs(budget.remaining).toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-3">
                          <div
                            className={`h-3 rounded-full transition-all ${
                              budget.percentageUsed >= 100
                                ? "bg-red-500"
                                : budget.percentageUsed >= 80
                                ? "bg-amber-500"
                                : "bg-green-500"
                            }`}
                            style={{ width: `${Math.min(budget.percentageUsed, 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className={`flex items-center gap-1 ${getStatusColor(budget.percentageUsed)}`}>
                            {getStatusIcon(budget.percentageUsed)}
                            <span className="text-sm font-medium">
                              {budget.percentageUsed.toFixed(1)}% used
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {budget.transactionsCount} transactions
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Category Spending Overview */}
              {categories.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Category Spending (Last 30 Days)
                  </h3>
                  <div className="space-y-3">
                    {categories.slice(0, 10).map((cat, idx) => {
                      const hasBudget = budgets.some((b) => b.category === cat.category);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{cat.category}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {cat.count} transactions
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              KES {cat.total.toLocaleString()}
                            </p>
                            {!hasBudget && (
                              <button
                                onClick={() => {
                                  setFormData({
                                    category: cat.category,
                                    amount: "",
                                    period: "monthly",
                                  });
                                  setShowAddModal(true);
                                }}
                                className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                              >
                                Set Budget
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Add/Edit Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {editingBudget ? "Edit Budget" : "Create Budget"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat.category} value={cat.category}>
                          {cat.category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Budget Amount (KES)
                    </label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Period
                    </label>
                    <select
                      value={formData.period}
                      onChange={(e) =>
                        setFormData({ ...formData, period: e.target.value as "monthly" | "weekly" | "yearly" })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setEditingBudget(null);
                        setFormData({ category: "", amount: "", period: "monthly" });
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
                    >
                      {editingBudget ? "Update" : "Create"} Budget
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

