import { Transaction } from "../page";
import { AlertTriangle, Check, X } from "lucide-react";
import { useState } from "react";

interface UncategorizedTransactionsProps {
  transactions: Transaction[];
  onUpdateCategory: (id: string, category: string) => void;
  categories: string[];
}

export function UncategorizedTransactions({ transactions, onUpdateCategory, categories }: UncategorizedTransactionsProps) {
  const [selectedCategory, setSelectedCategory] = useState<Record<string, string>>({});

  const handleCategoryChange = (id: string, category: string) => {
    setSelectedCategory(prev => ({ ...prev, [id]: category }));
  };

  const handleApply = (id: string) => {
    const category = selectedCategory[id];
    if (category) {
      onUpdateCategory(id, category);
    }
  };

  if (transactions.length === 0) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-6 border border-amber-200 dark:border-amber-800 mb-8">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
             <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-2">
            {transactions.length} Uncategorized Transactions
          </h3>
          <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
            Review these transactions to improve your spending insights.
          </p>
          
          <div className="grid gap-3 max-h-96 overflow-y-auto pr-2">
            {transactions.slice(0, 10).map((t) => (
              <div key={t.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-500">{t.transactionCode}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{new Date(t.transactionDate).toLocaleDateString()}</span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">{t.description}</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">KES {t.amount.toLocaleString()}</p>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    className="flex-1 sm:flex-none px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm"
                    value={selectedCategory[t.id] || ""}
                    onChange={(e) => handleCategoryChange(t.id, e.target.value)}
                  >
                    <option value="">Select Category...</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button
                    onClick={() => handleApply(t.id)}
                    disabled={!selectedCategory[t.id]}
                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {transactions.length > 10 && (
            <p className="text-center text-sm text-amber-700 dark:text-amber-400 mt-4 font-medium">
              + {transactions.length - 10} more (View all in Transactions tab)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

