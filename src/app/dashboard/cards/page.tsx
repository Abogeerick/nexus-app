"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { CreditCard, Plus, Trash2, Edit2, X, Building } from "lucide-react";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  institutionName?: string;
  accountNumber?: string;
}

export default function CardsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    type: "BANK",
    balance: "",
    currency: "KES",
    institutionName: "",
    accountNumber: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchAccounts();
    }
  }, [session]);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error("Failed to fetch accounts", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAccount ? `/api/accounts/${editingAccount.id}` : "/api/accounts";
      const method = editingAccount ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchAccounts();
        setIsModalOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to save account", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return;
    try {
      const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAccounts(accounts.filter(a => a.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete account", error);
    }
  };

  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance.toString(),
      currency: account.currency,
      institutionName: account.institutionName || "",
      accountNumber: account.accountNumber || "",
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingAccount(null);
    setFormData({
      name: "",
      type: "BANK",
      balance: "",
      currency: "KES",
      institutionName: "",
      accountNumber: "",
    });
  };

  const totalBalance = accounts.reduce((acc, account) => acc + account.balance, 0);

  if (status === "loading" || loading) {
    return (
      <DashboardLayout user={session?.user}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading accounts...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={session?.user}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cards & Accounts</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your bank accounts and cards</p>
            </div>
            <button
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Account
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Balance</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                KES {totalBalance.toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Accounts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{accounts.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Active Cards</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                 {accounts.filter(a => a.type === 'BANK').length}
              </p>
            </div>
          </div>

          {/* Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No accounts found. Add your first account!</p>
              </div>
            ) : (
              accounts.map((account) => (
                <div key={account.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 relative group hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
                      {account.type === "BANK" ? <Building className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(account)} className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(account.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{account.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{account.institutionName || account.type}</p>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Balance</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {account.currency} {account.balance.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-xs font-mono text-gray-400">
                      {account.accountNumber ? `**** ${account.accountNumber.slice(-4)}` : ""}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200 dark:border-gray-800">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingAccount ? "Edit Account" : "Add New Account"}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Main Savings"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="BANK">Bank Account</option>
                      <option value="CASH">Cash</option>
                      <option value="MPESA">M-PESA</option>
                      <option value="INVESTMENT">Investment</option>
                      <option value="CRYPTO_WALLET">Crypto Wallet</option>
                      <option value="CUSTOM">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="KES">KES</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Institution</label>
                    <input
                      type="text"
                      value={formData.institutionName}
                      onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g. Equity Bank"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Balance</label>
                    <input
                      required
                      type="number"
                      step="any"
                      value={formData.balance}
                      onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Number (Last 4 digits)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="1234"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    {editingAccount ? "Update Account" : "Add Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
