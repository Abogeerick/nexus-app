"use client";

/**
 * MPESA Transactions List Component
 *
 * Displays list of imported transactions with filtering and search
 */

import { useState, useEffect } from "react";

interface Transaction {
  id: string;
  transactionCode: string;
  transactionDate: Date;
  amount: number;
  type: string;
  category: string;
  isIncome: boolean;
  counterpartyName: string;
  description: string;
  balanceAfter: number | null;
}

export default function MpesaTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    search: "",
    isIncome: "all" as "all" | "true" | "false",
    category: "all",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchTransactions();
  }, [pagination.page, filter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filter.search) params.append("search", filter.search);
      if (filter.isIncome !== "all") params.append("isIncome", filter.isIncome);
      if (filter.category !== "all") params.append("category", filter.category);

      const response = await fetch(`/api/mpesa/transactions?${params}`);
      const data = await response.json();

      if (response.ok) {
        setTransactions(data.transactions);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      RECEIVED_FROM_PERSON: "💰",
      SENT_TO_PERSON: "📤",
      PAYBILL: "🏪",
      BUY_GOODS: "🛒",
      WITHDRAW_AT_AGENT: "💵",
      WITHDRAW_AT_ATM: "🏧",
      AIRTIME_PURCHASE: "📱",
    };
    return icons[type] || "💳";
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/50">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Transaction History
        </h2>
      </div>

      {/* Filters */}
      <div className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="grid gap-4 md:grid-cols-3">
          <input
            type="text"
            placeholder="Search transactions..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          />
          <select
            value={filter.isIncome}
            onChange={(e) =>
              setFilter({ ...filter, isIncome: e.target.value as any })
            }
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          >
            <option value="all">All Transactions</option>
            <option value="true">Income Only</option>
            <option value="false">Expenses Only</option>
          </select>
          <select
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          >
            <option value="all">All Categories</option>
            <option value="Groceries">Groceries</option>
            <option value="Dining">Dining</option>
            <option value="Transport">Transport</option>
            <option value="Utilities">Utilities</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Shopping">Shopping</option>
            <option value="Financial">Financial</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Transaction List */}
      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-500 dark:text-slate-400">
              No transactions found. Upload M-PESA data to get started.
            </p>
          </div>
        ) : (
          transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30"
            >
              <div className="flex items-center space-x-4">
                <div className="text-2xl">{getTypeIcon(transaction.type)}</div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {transaction.counterpartyName}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {transaction.description}
                  </p>
                  <div className="mt-1 flex items-center space-x-3 text-xs text-slate-400">
                    <span>{formatDate(transaction.transactionDate)}</span>
                    <span>•</span>
                    <span>{transaction.transactionCode}</span>
                    <span>•</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-700">
                      {transaction.category}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`text-lg font-bold ${
                    transaction.isIncome
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {transaction.isIncome ? "+" : "-"}KES{" "}
                  {transaction.amount.toLocaleString()}
                </p>
                {transaction.balanceAfter !== null && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Balance: KES {transaction.balanceAfter.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Showing {transactions.length} of {pagination.total} transactions
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() =>
                setPagination({ ...pagination, page: pagination.page - 1 })
              }
              disabled={pagination.page === 1}
              className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Previous
            </button>
            <span className="flex items-center px-3 text-sm text-slate-600 dark:text-slate-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() =>
                setPagination({ ...pagination, page: pagination.page + 1 })
              }
              disabled={pagination.page === pagination.totalPages}
              className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

