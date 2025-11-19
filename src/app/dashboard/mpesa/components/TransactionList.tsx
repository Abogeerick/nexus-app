import { Transaction } from "../page";
import { Edit, Save, Trash2, X } from "lucide-react";
import { useState } from "react";

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  onSave: (t: Transaction) => void;
  categories: string[];
}

export function TransactionList({ transactions, onEdit, onDelete, onSave, categories }: TransactionListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});

  const handleStartEdit = (t: Transaction) => {
    setEditingId(t.id);
    setEditForm(t);
  };

  const handleSave = () => {
    if (editingId && editForm) {
      onSave({ ...editForm, id: editingId } as Transaction);
      setEditingId(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Recent Transactions
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Date</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Description</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Category</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Amount</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {new Date(transaction.transactionDate).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                  {transaction.description}
                </td>
                <td className="py-3 px-4">
                  {editingId === transaction.id ? (
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                      {transaction.category}
                    </span>
                  )}
                </td>
                <td className={`py-3 px-4 text-sm font-medium text-right ${transaction.isIncome ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                  {transaction.isIncome ? '+' : '-'} {transaction.amount.toLocaleString()}
                </td>
                <td className="py-3 px-4">
                   <div className="flex items-center justify-center gap-2">
                      {editingId === transaction.id ? (
                        <>
                            <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save className="w-4 h-4"/></button>
                            <button onClick={handleCancel} className="p-1 text-gray-500 hover:bg-gray-100 rounded"><X className="w-4 h-4"/></button>
                        </>
                      ) : (
                        <>
                            <button onClick={() => handleStartEdit(transaction)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4"/></button>
                            <button onClick={() => onDelete(transaction.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                        </>
                      )}
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

