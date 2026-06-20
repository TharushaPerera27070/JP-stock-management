import React, { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Clock,
  AlertCircle,
  ArrowUpRight,
  FileText,
  Receipt,
  Users,
} from "lucide-react";
import { InventoryItem, OrderData } from "../types";
import {
  getPettyCashEntriesFromFirestore,
  savePettyCashEntryToFirestore,
} from "@/lib/documentStorage";
import { useAuthStore } from "@/lib/store";

interface DashboardProps {
  thisMonthRevenue: number;
  revenueGrowthPercent: number;
  totalValue: number;
  lowStockCount: number;
  customerCount: number;
  invoices: any[];
  quotations: any[];
  receipts: any[];
  orders: OrderData[];
  items: InventoryItem[];
  setActiveTab: (tab: string) => void;
  formatLKR: (amount: number) => string;
}

export default function Dashboard({
  thisMonthRevenue,
  revenueGrowthPercent,
  totalValue,
  lowStockCount,
  customerCount,
  invoices,
  quotations,
  receipts,
  orders,
  items,
  setActiveTab,
  formatLKR,
}: DashboardProps) {
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  const [selectedWindow, setSelectedWindow] = useState<"24h" | "7d" | "30d">(
    "30d",
  );
  const [dailyPettyCashInput, setDailyPettyCashInput] = useState("");
  const [pettyCashEntries, setPettyCashEntries] = useState<any[]>([]);

  const windowOptions: Array<{
    key: "24h" | "7d" | "30d";
    label: string;
    shortLabel: string;
    durationMs: number;
  }> = [
    {
      key: "24h",
      label: "Last 24 Hours",
      shortLabel: "24h",
      durationMs: 24 * 60 * 60 * 1000,
    },
    {
      key: "7d",
      label: "Last Week",
      shortLabel: "Week",
      durationMs: 7 * 24 * 60 * 60 * 1000,
    },
    {
      key: "30d",
      label: "Last Month",
      shortLabel: "Month",
      durationMs: 30 * 24 * 60 * 60 * 1000,
    },
  ];

  const getDocumentDate = (doc: any) => {
    const rawDate =
      doc?.createdAt ||
      doc?.lastUpdated ||
      doc?.issueDate ||
      doc?.timestamp ||
      doc?.date;
    if (!rawDate) return null;
    const parsedDate = new Date(rawDate);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  };

  const getOrderDate = (order: OrderData) => {
    const rawDate = order.timestamp || order.date;
    if (!rawDate) return null;
    const parsedDate = new Date(rawDate);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  };

  const selectedWindowInfo =
    windowOptions.find((o) => o.key === selectedWindow) || windowOptions[2];
  const cutoffTime = Date.now() - selectedWindowInfo.durationMs;

  // Guard: only fetch petty cash once Zustand has rehydrated AND a user is logged in
  useEffect(() => {
    if (!hasHydrated || !user) return;

    const loadPettyCashEntries = async () => {
      try {
        const entries = await getPettyCashEntriesFromFirestore();
        console.debug("Loaded pettyCashEntries from Firestore:", entries);
        setPettyCashEntries(entries || []);
      } catch (error) {
        console.error("Failed to load petty cash entries:", error);
      }
    };
    loadPettyCashEntries();
  }, [hasHydrated, user]);

  const filteredRevenue = useMemo(() => {
    return orders.reduce((total, order) => {
      const orderDate = getOrderDate(order);
      if (!orderDate || orderDate.getTime() < cutoffTime) return total;
      return total + (Number(order.total) || 0);
    }, 0);
  }, [orders, cutoffTime]);

  const todayDateKey = new Date().toISOString().split("T")[0];

  const dailyPettyCashAmount = useMemo(() => {
    return pettyCashEntries
      .filter((e) => {
        if (!e) return false;
        if (e.dateKey) return String(e.dateKey) === todayDateKey;
        if (e.createdAt) return String(e.createdAt).startsWith(todayDateKey);
        return false;
      })
      .reduce((s, e) => s + (Number(e?.amount) || 0), 0);
  }, [pettyCashEntries, todayDateKey]);

  const netRevenue = filteredRevenue - dailyPettyCashAmount;

  const dailyPettyCashCount = useMemo(
    () =>
      pettyCashEntries.filter((e) => {
        if (!e) return false;
        if (e.dateKey) return String(e.dateKey) === todayDateKey;
        if (e.createdAt) return String(e.createdAt).startsWith(todayDateKey);
        return false;
      }).length,
    [pettyCashEntries, todayDateKey],
  );

  useEffect(() => {
    console.debug("pettyCashEntries state:", pettyCashEntries);
    console.debug(
      "dailyPettyCashAmount:",
      dailyPettyCashAmount,
      "count:",
      dailyPettyCashCount,
    );
  }, [pettyCashEntries, dailyPettyCashAmount, dailyPettyCashCount]);

  const handleDailyPettyCashChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const nextValue = event.target.value;
    if (/^\d*\.?\d*$/.test(nextValue)) setDailyPettyCashInput(nextValue);
  };

  const handleAddDailyPettyCash = async () => {
    const amount = Number(dailyPettyCashInput);
    if (!Number.isFinite(amount) || amount <= 0) return;
    const payload = {
      amount,
      dateKey: todayDateKey,
      addedAt: new Date().toISOString(),
    };
    try {
      const id = await savePettyCashEntryToFirestore(payload);
      setPettyCashEntries((p) => [
        {
          id,
          ...payload,
          createdAt: payload.addedAt,
          lastUpdated: payload.addedAt,
        },
        ...p,
      ]);
      setDailyPettyCashInput("");
    } catch (error) {
      console.error("Failed to save petty cash entry:", error);
    }
  };

  const countDocs = (docs: any[]) =>
    docs.filter((doc) => {
      const d = getDocumentDate(doc);
      return d ? d.getTime() >= cutoffTime : false;
    }).length;

  const filteredInvoiceCount = useMemo(
    () => countDocs(invoices),
    [invoices, cutoffTime],
  );
  const filteredQuotationCount = useMemo(
    () => countDocs(quotations),
    [quotations, cutoffTime],
  );
  const filteredReceiptCount = useMemo(
    () => countDocs(receipts),
    [receipts, cutoffTime],
  );

  const getLatestDoc = (docs: any[]) => {
    if (!docs || docs.length === 0) return null;
    const withDates = docs
      .map((d) => ({ doc: d, date: getDocumentDate(d) }))
      .filter((x) => x.date)
      .sort((a, b) => b.date!.getTime() - a.date!.getTime());
    return withDates[0]?.doc || docs[0] || null;
  };

  const latestInvoice = useMemo(() => getLatestDoc(invoices), [invoices]);
  const latestQuotation = useMemo(() => getLatestDoc(quotations), [quotations]);

  const latestCustomer = useMemo(() => {
    if (
      latestInvoice?.clientName ||
      latestInvoice?.client ||
      latestInvoice?.customer
    ) {
      return {
        name:
          latestInvoice.clientName ||
          latestInvoice.client ||
          latestInvoice.customer,
        contact:
          latestInvoice.clientContactNumber ||
          latestInvoice.contactNumber ||
          "",
      };
    }
    const latestOrder = orders
      .slice()
      .map((o) => ({ o, date: getOrderDate(o) }))
      .filter((x) => x.date)
      .sort((a, b) => b.date!.getTime() - a.date!.getTime())[0]?.o;
    if (latestOrder) return { name: latestOrder.customer, contact: "" };
    return null;
  }, [latestInvoice, orders]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {windowOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setSelectedWindow(option.key)}
            className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-all ${selectedWindow === option.key ? "bg-[#E8973A] border-[#E8973A] text-white shadow-sm" : "bg-white border-gray-200 text-gray-600 hover:border-[#E8973A]/40 hover:text-gray-900"}`}
          >
            {option.shortLabel}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-gray-200 backdrop-blur-sm flex flex-col gap-3 relative overflow-hidden group min-h-28">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#E8973A]/10 rounded-full blur-2xl group-hover:bg-[#E8973A]/20 transition-all duration-500" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-gray-500 text-sm font-medium">
              Total Revenue - {selectedWindowInfo.label}
            </span>
            <div className="p-2 rounded-lg bg-[#E8973A]/20 text-[#E8973A]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-bold tracking-tighter">
              {formatLKR(netRevenue)}
            </h3>
            <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {selectedWindowInfo.label} revenue after petty cash
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200 backdrop-blur-sm flex flex-col gap-3 relative overflow-hidden group min-h-28">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-gray-900/5 rounded-full blur-2xl group-hover:bg-gray-900/10 transition-all duration-500" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-gray-500 text-sm font-medium">
              Stock Value
            </span>
            <div className="p-2 rounded-lg bg-gray-900/10 text-gray-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-bold tracking-tighter">
              {formatLKR(totalValue)}
            </h3>
            <p className="text-xs text-gray-500 mt-2">
              Current inventory worth
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200 backdrop-blur-sm flex flex-col gap-3 relative overflow-hidden group min-h-28">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-gray-900/5 rounded-full blur-2xl group-hover:bg-gray-900/10 transition-all duration-500" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-gray-500 text-sm font-medium">
              Active Orders
            </span>
            <div className="p-2 rounded-lg bg-gray-900/10 text-gray-600">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-bold tracking-tighter">
              {orders.filter((o) => o.status !== "Delivered").length}
            </h3>
            <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" /> pending fulfillment
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200 backdrop-blur-sm flex flex-col gap-3 relative overflow-hidden group min-h-28">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-gray-900/5 rounded-full blur-2xl group-hover:bg-gray-900/10 transition-all duration-500" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-gray-500 text-sm font-medium">
              Low Stock Alerts
            </span>
            <div className="p-2 rounded-lg bg-gray-900/10 text-gray-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-bold tracking-tighter">
              {lowStockCount}
            </h3>
            <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
              Panels require restock
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Invoices */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200 backdrop-blur-sm flex flex-col justify-between gap-3 min-h-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Invoices
            </p>
            <h4 className="mt-1 text-2xl font-bold text-gray-900">
              {filteredInvoiceCount}
            </h4>
            <div className="mt-2 text-xs text-gray-600">
              {latestInvoice ? (
                <div className="space-y-0.5">
                  <div className="font-medium text-sm">
                    {latestInvoice.clientName ||
                      latestInvoice.customer ||
                      latestInvoice.client ||
                      "Unnamed"}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Prepared by:{" "}
                    {latestInvoice.preparedBy ||
                      latestInvoice.prepared_by ||
                      "--"}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {getDocumentDate(latestInvoice)
                      ? new Date(
                          getDocumentDate(latestInvoice)!,
                        ).toLocaleDateString()
                      : "--"}
                  </div>
                </div>
              ) : (
                <div className="text-gray-400">No recent invoices</div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px] text-gray-500">
            <span>{selectedWindowInfo.label}</span>
            <div className="p-2.5 rounded-xl bg-[#E8973A]/10 text-[#E8973A]">
              <FileText className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Quotations */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200 backdrop-blur-sm flex flex-col justify-between gap-3 min-h-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Quotations
            </p>
            <h4 className="mt-1 text-2xl font-bold text-gray-900">
              {filteredQuotationCount}
            </h4>
            <div className="mt-2 text-xs text-gray-600">
              {latestQuotation ? (
                <div className="space-y-0.5">
                  <div className="font-medium text-sm">
                    {latestQuotation.clientName ||
                      latestQuotation.client ||
                      latestQuotation.customer ||
                      "Unnamed"}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Prepared by:{" "}
                    {latestQuotation.preparedBy ||
                      latestQuotation.prepared_by ||
                      "--"}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {getDocumentDate(latestQuotation)
                      ? new Date(
                          getDocumentDate(latestQuotation)!,
                        ).toLocaleDateString()
                      : "--"}
                  </div>
                </div>
              ) : (
                <div className="text-gray-400">No recent quotations</div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px] text-gray-500">
            <span>{selectedWindowInfo.label}</span>
            <div className="p-2.5 rounded-xl bg-slate-900/10 text-slate-700">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Petty Cash */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200 backdrop-blur-sm flex flex-col justify-between gap-3 min-h-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Petty Cash
            </p>
            <h4 className="mt-1 text-2xl font-bold text-gray-900">
              {formatLKR(dailyPettyCashAmount)}
            </h4>
            <div className="mt-3">
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                Today Amount (LKR)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={dailyPettyCashInput}
                  onChange={handleDailyPettyCashChange}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#E8973A]/30"
                />
                <button
                  type="button"
                  onClick={handleAddDailyPettyCash}
                  className="shrink-0 rounded-lg bg-[#E8973A] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#d4832b]"
                >
                  Add
                </button>
              </div>
              <p className="mt-1 text-[11px] font-semibold text-gray-600">
                Entries today: {dailyPettyCashCount}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px] text-gray-500">
            <span>{selectedWindowInfo.label}</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Customers */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200 backdrop-blur-sm flex flex-col justify-between gap-3 min-h-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Customers
            </p>
            <h4 className="mt-1 text-2xl font-bold text-gray-900">
              {customerCount}
            </h4>
            <div className="mt-2 text-xs text-gray-600">
              {latestCustomer ? (
                <div className="space-y-0.5">
                  <div className="font-medium text-sm">
                    {latestCustomer.name}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {latestCustomer.contact || "No contact"}
                  </div>
                </div>
              ) : (
                <div className="text-gray-400">No recent customer activity</div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px] text-gray-500">
            <span>All time</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-gray-200 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Recent Orders</h3>
            <button
              onClick={() => setActiveTab("orders")}
              className="text-sm text-[#E8973A] hover:text-[#E8973A] flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {orders.slice(0, 3).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-200 hover:bg-white transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#E8973A]/20 flex items-center justify-center text-[#E8973A]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {order.customer}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {order.timestamp
                        ? new Date(order.timestamp).toLocaleTimeString(
                            "en-US",
                            { hour: "2-digit", minute: "2-digit" },
                          )
                        : "--:--"}{" "}
                      • {order.items} Sqft
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatLKR(order.total)}</div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${order.status === "Delivered" ? "bg-gray-900/10 text-gray-600" : "bg-gray-900/10 text-gray-600"}`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-gray-200 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Low Stock Panels</h3>
            <button
              onClick={() => setActiveTab("inventory")}
              className="text-sm text-[#E8973A] hover:text-[#E8973A] flex items-center gap-1"
            >
              View Inventory <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {items
              .filter((i) => i.status !== "In Stock")
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-gray-300/10 hover:bg-gray-900/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-900/10 flex items-center justify-center text-gray-600">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {item.design} {item.panelType} Panel
                      </h4>
                      <p className="text-xs text-gray-500">
                        ID: {item.panelId}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="font-bold text-gray-600">
                      {item.quantity} Sqft
                    </div>
                    <span className="text-xs text-gray-500 mt-1">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
