"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Search,
  Calendar,
  Wallet,
  ArrowUpRight,
  Receipt,
  X,
} from "lucide-react";
import {
  getPettyCashEntriesFromFirestore,
  savePettyCashEntryToFirestore,
  deletePettyCashEntryFromFirestore,
} from "@/lib/firestoreService";
import { useDialog } from "./Dialog";
import { useAuthStore } from "@/lib/store";

interface PettyCashEntry {
  id: string;
  description: string;
  category: string;
  amount: number;
  dateKey: string;
  createdAt: string;
  lastUpdated: string;
}

const CATEGORIES = [
  "Transport",
  "Food & Beverages",
  "Office Supplies",
  "Utilities",
  "Maintenance",
  "Salary Advance",
  "Miscellaneous",
];

export default function PettyCash() {
  const { confirm, toast } = useDialog();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  const [entries, setEntries] = useState<PettyCashEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isSaving, setIsSaving] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // Load entries
  useEffect(() => {
    if (!hasHydrated || !user) return;

    const load = async () => {
      try {
        const data = await getPettyCashEntriesFromFirestore();
        setEntries((data as PettyCashEntry[]) || []);
      } catch (err) {
        console.error("Failed to load petty cash entries:", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [hasHydrated, user]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    let result = entries;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          (e.description || "").toLowerCase().includes(q) ||
          (e.category || "").toLowerCase().includes(q)
      );
    }

    if (filterDate) {
      result = result.filter((e) => e.dateKey === filterDate);
    }

    return result;
  }, [entries, searchQuery, filterDate]);

  // Group by date
  const groupedEntries = useMemo(() => {
    const groups: Record<string, PettyCashEntry[]> = {};
    for (const entry of filteredEntries) {
      const key = entry.dateKey || "Unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    }
    // Sort groups by date descending
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredEntries]);

  // Summary calculations
  const todayKey = new Date().toISOString().split("T")[0];
  const todayTotal = useMemo(
    () =>
      entries
        .filter((e) => e.dateKey === todayKey)
        .reduce((s, e) => s + (Number(e.amount) || 0), 0),
    [entries, todayKey]
  );

  const thisMonthKey = todayKey.slice(0, 7); // YYYY-MM
  const monthTotal = useMemo(
    () =>
      entries
        .filter((e) => (e.dateKey || "").startsWith(thisMonthKey))
        .reduce((s, e) => s + (Number(e.amount) || 0), 0),
    [entries, thisMonthKey]
  );

  const allTimeTotal = useMemo(
    () => entries.reduce((s, e) => s + (Number(e.amount) || 0), 0),
    [entries]
  );

  const formatLKR = (amount: number) =>
    `LKR ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Unknown";
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleSave = async () => {
    if (!description.trim() || !amount || Number(amount) <= 0) {
      toast({ message: "Please fill in description and a valid amount.", type: "error" });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        description: description.trim(),
        category,
        amount: Number(amount),
        dateKey: entryDate,
      };
      const id = await savePettyCashEntryToFirestore(payload);
      const newEntry: PettyCashEntry = {
        id,
        ...payload,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };
      setEntries((prev) => [newEntry, ...prev]);
      toast({ message: "Petty cash entry added successfully.", type: "success" });

      // Reset form
      setDescription("");
      setAmount("");
      setEntryDate(new Date().toISOString().split("T")[0]);
      setCategory(CATEGORIES[0]);
      setShowForm(false);
    } catch (err) {
      console.error("Failed to save petty cash entry:", err);
      toast({ message: "Failed to save entry.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (entry: PettyCashEntry) => {
    const ok = await confirm({
      title: "Delete Entry",
      message: `Are you sure you want to delete "${entry.description || "this entry"}" (${formatLKR(entry.amount)})?`,
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await deletePettyCashEntryFromFirestore(entry.id);
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
      toast({ message: "Entry deleted.", type: "delete" });
    } catch (err) {
      console.error("Failed to delete petty cash entry:", err);
      toast({ message: "Failed to delete entry.", type: "error" });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#E8973A] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-gray-200 flex flex-col gap-2 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-gray-500 text-sm font-medium">Today</span>
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold tracking-tighter relative z-10">
            {formatLKR(todayTotal)}
          </h3>
          <p className="text-xs text-gray-500">
            {entries.filter((e) => e.dateKey === todayKey).length} entries
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200 flex flex-col gap-2 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#E8973A]/10 rounded-full blur-2xl group-hover:bg-[#E8973A]/20 transition-all duration-500" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-gray-500 text-sm font-medium">This Month</span>
            <div className="p-2 rounded-lg bg-[#E8973A]/20 text-[#E8973A]">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold tracking-tighter relative z-10">
            {formatLKR(monthTotal)}
          </h3>
          <p className="text-xs text-gray-500">
            {entries.filter((e) => (e.dateKey || "").startsWith(thisMonthKey)).length} entries
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200 flex flex-col gap-2 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-gray-900/5 rounded-full blur-2xl group-hover:bg-gray-900/10 transition-all duration-500" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-gray-500 text-sm font-medium">All Time</span>
            <div className="p-2 rounded-lg bg-gray-900/10 text-gray-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold tracking-tighter relative z-10">
            {formatLKR(allTimeTotal)}
          </h3>
          <p className="text-xs text-gray-500">{entries.length} total entries</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 focus:border-transparent placeholder:text-gray-400"
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full sm:w-56 pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 focus:border-transparent text-gray-600"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-100"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#E8973A] text-white rounded-xl font-semibold text-sm hover:bg-[#d4832b] transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Entry
        </button>
      </div>

      {/* Add Entry Form */}
      {showForm && (
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm animate-in slide-in-from-top-2 duration-300">
          <h3 className="text-lg font-bold text-gray-900 mb-5">New Petty Cash Entry</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Fuel for delivery van"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 focus:border-transparent placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 focus:border-transparent text-gray-700"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Amount (LKR) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  if (/^\d*\.?\d*$/.test(e.target.value)) setAmount(e.target.value);
                }}
                placeholder="0.00"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 focus:border-transparent placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 focus:border-transparent text-gray-700"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#E8973A] text-white rounded-xl font-semibold text-sm hover:bg-[#d4832b] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {isSaving ? "Saving..." : "Add Entry"}
            </button>
          </div>
        </div>
      )}

      {/* Entries List - Grouped by Date */}
      {filteredEntries.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-gray-200 text-center">
          <Wallet className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">No entries found</h3>
          <p className="text-sm text-gray-400 mt-1">
            {searchQuery || filterDate
              ? "Try adjusting your search or date filter."
              : "Click \"Add Entry\" to record your first petty cash expense."}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedEntries.map(([dateKey, dateEntries]) => {
            const dayTotal = dateEntries.reduce(
              (s, e) => s + (Number(e.amount) || 0),
              0
            );
            return (
              <div key={dateKey}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h4 className="text-sm font-semibold text-gray-700">
                    {formatDate(dateKey)}
                  </h4>
                  <span className="text-sm font-bold text-gray-900">
                    {formatLKR(dayTotal)}
                  </span>
                </div>
                <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden divide-y divide-gray-100">
                  {dateEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/80 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#E8973A]/10 flex items-center justify-center text-[#E8973A] shrink-0">
                          <Wallet className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900 text-sm">
                            {entry.description || "Untitled"}
                          </h5>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                              {entry.category || "General"}
                            </span>
                            {entry.createdAt && (
                              <span className="text-[11px] text-gray-400">
                                {new Date(entry.createdAt).toLocaleTimeString(
                                  "en-US",
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-gray-900 text-sm">
                          {formatLKR(entry.amount)}
                        </span>
                        <button
                          onClick={() => handleDelete(entry)}
                          className="p-2 rounded-lg text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"
                          title="Delete entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
