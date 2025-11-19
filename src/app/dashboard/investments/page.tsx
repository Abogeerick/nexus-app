"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { TrendingUp, Plus, MoreVertical, Trash2, Edit2, Search, X, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Asset {
  id: string;
  name: string;
  symbol: string;
  type: string;
  quantity: number;
  purchasePrice: number;
  currentPrice?: number; // From API
  currency: string;
  exchange?: string;
  notes?: string;
}

export default function InvestmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    type: "STOCK",
    quantity: "",
    purchasePrice: "",
    currency: "KES",
    exchange: "",
    notes: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchAssets();
    }
  }, [session]);

  const fetchAssets = async () => {
    try {
      const res = await fetch("/api/assets");
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      }
    } catch (error) {
      console.error("Failed to fetch assets", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAsset ? `/api/assets/${editingAsset.id}` : "/api/assets";
      const method = editingAsset ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchAssets();
        setIsModalOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to save asset", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;
    try {
      const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAssets(assets.filter(a => a.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete asset", error);
    }
  };

  const openEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      symbol: asset.symbol,
      type: asset.type,
      quantity: asset.quantity.toString(),
      purchasePrice: asset.purchasePrice.toString(),
      currency: asset.currency,
      exchange: asset.exchange || "",
      notes: asset.notes || "",
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingAsset(null);
    setFormData({
      name: "",
      symbol: "",
      type: "STOCK",
      quantity: "",
      purchasePrice: "",
      currency: "KES",
      exchange: "",
      notes: "",
    });
  };

  const calculateTotalValue = (asset: Asset) => {
      const price = asset.currentPrice || asset.purchasePrice;
      return asset.quantity * price;
  }

  const totalValue = assets.reduce((acc, asset) => acc + calculateTotalValue(asset), 0);
  
  // Find top performer (highest % gain)
  const topPerformer = assets.reduce((prev, current) => {
      const prevGain = prev.currentPrice ? ((prev.currentPrice - prev.purchasePrice) / prev.purchasePrice) : 0;
      const currGain = current.currentPrice ? ((current.currentPrice - current.purchasePrice) / current.purchasePrice) : 0;
      return (prevGain > currGain) ? prev : current;
  }, assets[0]);

  const topPerformerGain = topPerformer && topPerformer.currentPrice 
    ? ((topPerformer.currentPrice - topPerformer.purchasePrice) / topPerformer.purchasePrice) * 100 
    : 0;


  if (status === "loading" || loading) {
    return (
      <DashboardLayout user={session?.user}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading investments...</p>
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Investments</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Track your portfolio performance</p>
            </div>
            <button
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Asset
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Portfolio Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                KES {totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Assets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{assets.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Top Performer</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{topPerformer ? topPerformer.symbol : "-"}</p>
                {topPerformerGain !== 0 && (
                    <span className={`text-sm font-bold ${topPerformerGain >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {topPerformerGain >= 0 ? "+" : ""}{topPerformerGain.toFixed(2)}%
                    </span>
                )}
              </div>
            </div>
          </div>

          {/* Assets List */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 text-sm">
                  <tr>
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Symbol</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium">Quantity</th>
                    <th className="px-6 py-4 font-medium">Buy Price</th>
                    <th className="px-6 py-4 font-medium">Current Price</th>
                    <th className="px-6 py-4 font-medium">Total Value</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {assets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        No assets found. Add your first investment!
                      </td>
                    </tr>
                  ) : (
                    assets.map((asset) => {
                        const currentValue = calculateTotalValue(asset);
                        const gain = asset.currentPrice ? ((asset.currentPrice - asset.purchasePrice) / asset.purchasePrice) * 100 : 0;
                        
                        return (
                      <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">{asset.name}</td>
                        <td className="px-6 py-4 text-gray-500">{asset.symbol}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                            {asset.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-900 dark:text-white">{asset.quantity}</td>
                        <td className="px-6 py-4 text-gray-900 dark:text-white">
                          {asset.currency} {asset.purchasePrice.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-gray-900 dark:text-white">
                            {asset.currentPrice ? (
                                <div className="flex flex-col">
                                    <span>{asset.currency} {asset.currentPrice.toLocaleString()}</span>
                                    <span className={`text-xs ${gain >= 0 ? "text-green-500" : "text-red-500"}`}>
                                        {gain >= 0 ? "+" : ""}{gain.toFixed(2)}%
                                    </span>
                                </div>
                            ) : "-"}
                        </td>
                        <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                          {asset.currency} {currentValue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(asset)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(asset.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )})
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal (Same as before) */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200 dark:border-gray-800">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingAsset ? "Edit Asset" : "Add New Asset"}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Apple Inc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Symbol</label>
                    <input
                      type="text"
                      value={formData.symbol}
                      onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="AAPL"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="STOCK">Stock</option>
                      <option value="CRYPTO">Crypto</option>
                      <option value="BOND">Bond</option>
                      <option value="REAL_ESTATE">Real Estate</option>
                      <option value="COMMODITY">Commodity</option>
                      <option value="CUSTOM">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exchange</label>
                    <input
                      type="text"
                      value={formData.exchange}
                      onChange={(e) => setFormData({ ...formData, exchange: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="NASDAQ"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                    <input
                      required
                      type="number"
                      step="any"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buy Price</label>
                    <input
                      required
                      type="number"
                      step="any"
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                   <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="KES">KES</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
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
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    {editingAsset ? "Update Asset" : "Add Asset"}
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
