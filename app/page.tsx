"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Menu,
  Box,
  Users,
  Settings,
  LogOut,
  LayoutDashboard,
  ShoppingCart,
  BarChart3,
  Bell,
  FileText,
  ChevronRight,
} from "lucide-react";
import { useDialog } from "./components/Dialog";

import AddPanel from "./components/AddPanel";
import AddCustomer from "./components/AddCustomer";
import AddOrder from "./components/AddOrder";
import Dashboard from "./components/Dashboard";
import Inventory from "./components/Inventory";
import Orders from "./components/Orders";
import Customers from "./components/Customers";
import Reports from "./components/Reports";
import Documents from "./components/Documents";
import InvoicePage from "./invoice/page";
import QuotationPage from "./quotation/page";
import ReceiptPage from "./receipt/page";
import SettingsPage from "./settings/page";
import { InventoryItem, OrderData, Customer } from "./types";
import Image from "next/image";
import Link from "next/link";
import { getInvoicesFromFirestore } from "@/lib/documentStorage";
import {
  getOrdersFromFirestore,
  saveOrderToFirestore,
  deleteOrderFromFirestore,
  getPanelsFromFirestore,
  savePanelToFirestore,
  deletePanelFromFirestore,
  getCustomersFromFirestore,
} from "@/lib/firestoreService";

export default function InventoryDashboard() {
  const { confirm, toast } = useDialog();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeSubTab, setActiveSubTab] = useState<
    "invoices" | "quotations" | "receipts"
  >("invoices");
  const [editDocId, setEditDocId] = useState<string | undefined>(undefined);
  const [isViewOnly, setIsViewOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [editingPanel, setEditingPanel] = useState<InventoryItem | null>(null);

  const handleDeletePanel = async (item: InventoryItem) => {
    const ok = await confirm({
      title: "Delete Panel",
      message: `Are you sure you want to delete the ${item.design} ${item.panelType} Panel? This cannot be undone.`,
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (ok) {
      try {
        await deletePanelFromFirestore(item.id);
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        toast({ message: "Panel deleted successfully.", type: "success" });
      } catch (e) {
        console.error("Panel delete error:", e);
        toast({ message: "Failed to delete panel.", type: "error" });
      }
    }
  };

  const handleEditPanelClick = (item: InventoryItem) => {
    setEditingPanel(item);
    setActiveTab("add-panel");
  };

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const fetchStoredData = async () => {
      try {
        const [firestoreOrders, storedInvoices, panels, firestoreCustomers] =
          await Promise.all([
            getOrdersFromFirestore(),
            getInvoicesFromFirestore(),
            getPanelsFromFirestore(),
            getCustomersFromFirestore(),
          ]);
        setOrders((firestoreOrders as OrderData[]) || []);
        setInvoices(storedInvoices || []);
        setItems((panels as InventoryItem[]) || []);
        setCustomers((firestoreCustomers as Customer[]) || []);
      } catch (e) {
        console.error("Error fetching data from Firestore:", e);
      }
    };
    fetchStoredData();
  }, [activeTab]);

  const totalValue = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const lowStockCount = items.filter(
    (item) => item.status === "Low Stock" || item.status === "Out of Stock",
  ).length;

  const thisMonthRevenue = invoices
    .filter((inv) => inv.isFromOrder)
    .reduce((acc, inv) => {
      const val =
        inv.summary?.finalTotal !== undefined
          ? inv.summary.finalTotal
          : inv.total !== undefined
            ? inv.total
            : 0;
      return acc + val;
    }, 0);

  const formatLKR = (amount: number) =>
    `LKR ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleViewOrderInvoice = async (orderId: string) => {
    try {
      const allInvoices = await getInvoicesFromFirestore();
      const matchingInvoice = allInvoices.find(
        (inv) => inv.orderId === orderId || inv.orderId === `ord-${orderId}`,
      );
      if (matchingInvoice) {
        setEditDocId(matchingInvoice.id);
        setIsViewOnly(true);
        setActiveTab("edit-invoice");
      } else {
        toast({
          message: "No corresponding invoice found for this order.",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error finding order invoice:", err);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    const ok = await confirm({
      title: "Delete Order",
      message:
        "Are you sure you want to permanently delete this order? This action cannot be undone.",
      confirmLabel: "Delete Order",
      variant: "danger",
    });
    if (ok) {
      try {
        await deleteOrderFromFirestore(orderId);
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        toast({ message: "Order deleted successfully.", type: "success" });
      } catch (e) {
        console.error("Order delete error:", e);
        toast({ message: "Failed to delete order.", type: "error" });
      }
    }
  };

  const handleEditOrder = (orderId: string) => {
    setEditDocId(orderId);
    setActiveTab("edit-order");
  };

  const getBreadcrumbs = (): { label: string; onClick?: () => void }[] => {
    switch (activeTab) {
      case "dashboard":
        return [{ label: "Dashboard" }];
      case "inventory":
        return [{ label: "Inventory" }];
      case "add-panel":
        return [
          {
            label: "Inventory",
            onClick: () => {
              setActiveTab("inventory");
              setEditingPanel(null);
            },
          },
          { label: editingPanel ? "Edit Panel" : "Add Panel" },
        ];
      case "orders":
        return [{ label: "Orders" }];
      case "add-order":
        return [
          { label: "Orders", onClick: () => setActiveTab("orders") },
          { label: "Add Order" },
        ];
      case "customers":
        return [{ label: "Customers" }];
      case "add-customer":
        return [
          { label: "Customers", onClick: () => setActiveTab("customers") },
          { label: "Add Customer" },
        ];
      case "reports":
        return [{ label: "Reports" }];
      case "settings":
        return [{ label: "Settings" }];
      case "documents":
        return [
          { label: "Document", onClick: () => setActiveTab("documents") },
          {
            label: activeSubTab.charAt(0).toUpperCase() + activeSubTab.slice(1),
          },
        ];
      case "create-invoice":
        return [
          { label: "Document", onClick: () => setActiveTab("documents") },
          {
            label: "Invoices",
            onClick: () => {
              setActiveTab("documents");
              setActiveSubTab("invoices");
            },
          },
          { label: "Create Invoice" },
        ];
      case "edit-invoice":
        return [
          { label: "Document", onClick: () => setActiveTab("documents") },
          {
            label: "Invoices",
            onClick: () => {
              setActiveTab("documents");
              setActiveSubTab("invoices");
              setEditDocId(undefined);
              setIsViewOnly(false);
            },
          },
          { label: isViewOnly ? "View Invoice" : "Edit Invoice" },
        ];
      case "create-quotation":
        return [
          { label: "Document", onClick: () => setActiveTab("documents") },
          {
            label: "Quotations",
            onClick: () => {
              setActiveTab("documents");
              setActiveSubTab("quotations");
            },
          },
          { label: "Create Quotation" },
        ];
      case "edit-quotation":
        return [
          { label: "Document", onClick: () => setActiveTab("documents") },
          {
            label: "Quotations",
            onClick: () => {
              setActiveTab("documents");
              setActiveSubTab("quotations");
              setEditDocId(undefined);
              setIsViewOnly(false);
            },
          },
          { label: isViewOnly ? "View Quotation" : "Edit Quotation" },
        ];
      case "create-receipt":
        return [
          { label: "Document", onClick: () => setActiveTab("documents") },
          {
            label: "Receipts",
            onClick: () => {
              setActiveTab("documents");
              setActiveSubTab("receipts");
            },
          },
          { label: "Create Receipt" },
        ];
      case "edit-receipt":
        return [
          { label: "Document", onClick: () => setActiveTab("documents") },
          {
            label: "Receipts",
            onClick: () => {
              setActiveTab("documents");
              setActiveSubTab("receipts");
              setEditDocId(undefined);
              setIsViewOnly(false);
            },
          },
          { label: isViewOnly ? "View Receipt" : "Edit Receipt" },
        ];
      default:
        return [
          { label: activeTab.charAt(0).toUpperCase() + activeTab.slice(1) },
        ];
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-200 bg-gray-50 flex flex-col justify-between transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <Image
              src="/Japan-Gedara-Logo-removebg-preview.png"
              alt="Logo"
              width={50}
              height={50}
            />

            <h1 className="text-xl font-bold tracking-tight">JG Portal</h1>
          </div>

          <nav className="space-y-2">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "inventory", label: "Inventory", icon: Box },
              { id: "orders", label: "Orders", icon: ShoppingCart },
              { id: "customers", label: "Customers", icon: Users },
              { id: "documents", label: "Documents", icon: FileText },
              { id: "reports", label: "Reports", icon: BarChart3 },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === item.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:bg-white hover:text-gray-900"
                }`}
              >
                <item.icon
                  className={`w-5 h-5 ${activeTab === item.id ? "text-[#E8973A]" : ""}`}
                />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
              activeTab === "settings"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:bg-white hover:text-gray-900"
            }`}
          >
            <Settings
              className={`w-5 h-5 ${activeTab === "settings" ? "text-[#E8973A]" : ""}`}
            />
            <span className="font-medium">Settings</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 mt-2">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Background Gradients for Premium feel */}
        <div className="absolute top-0 left-0 w-full h-96 bg-linear-to-b from-[#E8973A]/10 via-[#E8973A]/5 to-transparent pointer-events-none z-0" />

        {/* Topbar */}
        <header className="h-20 border-b border-gray-200 px-4 md:px-8 flex items-center justify-between backdrop-blur-md bg-gray-50/80 z-10 sticky top-0">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              className="md:hidden p-2 -ml-2 rounded-lg hover:bg-gray-200 text-gray-600"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-1 md:gap-2 text-sm md:text-base font-semibold text-gray-500 overflow-x-auto scrollbar-none py-1">
              {getBreadcrumbs().map((crumb, idx, arr) => {
                const isLast = idx === arr.length - 1;
                return (
                  <React.Fragment key={idx}>
                    {idx > 0 && (
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    )}
                    {crumb.onClick && !isLast ? (
                      <button
                        onClick={crumb.onClick}
                        className="hover:text-[#E8973A] transition-colors cursor-pointer whitespace-nowrap text-gray-500 font-medium"
                      >
                        {crumb.label}
                      </button>
                    ) : (
                      <span
                        className={`whitespace-nowrap ${isLast ? "text-gray-900 text-lg md:text-2xl font-bold tracking-tight" : "text-gray-500 font-medium"}`}
                      >
                        {crumb.label}
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="relative hidden md:block">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search everywhere..."
                className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 focus:border-transparent transition-all w-64 placeholder:text-gray-500"
              />
            </div>
            <button className="relative p-2 rounded-full hover:bg-white transition-colors">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#E8973A] rounded-full border-2 border-[#0a0a0b]"></span>
            </button>
            <div className="flex items-center gap-3 pl-3 md:pl-6 border-l border-gray-200">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#E8973A] shrink-0" />
              <div className="flex-col hidden sm:flex">
                <span className="text-sm font-medium leading-tight">
                  Admin User
                </span>
                <span className="text-xs text-gray-500">JP Operations</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8 z-10 relative scroll-smooth">
          {activeTab === "dashboard" && (
            <Dashboard
              thisMonthRevenue={thisMonthRevenue}
              totalValue={totalValue}
              lowStockCount={lowStockCount}
              orders={orders}
              items={items}
              setActiveTab={setActiveTab}
              formatLKR={formatLKR}
            />
          )}
          {activeTab === "inventory" && (
            <Inventory
              items={items}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setActiveTab={setActiveTab}
              setEditingPanel={setEditingPanel}
              handleEditPanelClick={handleEditPanelClick}
              handleDeletePanel={handleDeletePanel}
              formatLKR={formatLKR}
            />
          )}
          {activeTab === "orders" && (
            <Orders
              orders={orders}
              invoices={invoices}
              setActiveTab={setActiveTab}
              formatLKR={formatLKR}
              onViewInvoice={handleViewOrderInvoice}
              onEditOrder={handleEditOrder}
              onDeleteOrder={handleDeleteOrder}
            />
          )}
          {activeTab === "customers" && (
            <Customers customers={customers} setActiveTab={setActiveTab} />
          )}
          {activeTab === "reports" && <Reports />}
          {activeTab === "documents" && (
            <Documents
              activeSubTab={activeSubTab}
              setActiveSubTab={setActiveSubTab}
              onEdit={(type, id) => {
                setEditDocId(id);
                setIsViewOnly(false);
                setActiveTab(`edit-${type}`);
              }}
              onView={(type, id) => {
                setEditDocId(id);
                setIsViewOnly(true);
                setActiveTab(`edit-${type}`);
              }}
              onCreate={(type) => {
                setEditDocId(undefined);
                setIsViewOnly(false);
                setActiveTab(`create-${type}`);
              }}
            />
          )}
          {activeTab === "create-invoice" && (
            <InvoicePage onBack={() => setActiveTab("documents")} />
          )}
          {activeTab === "create-quotation" && (
            <QuotationPage onBack={() => setActiveTab("documents")} />
          )}
          {activeTab === "create-receipt" && (
            <ReceiptPage onBack={() => setActiveTab("documents")} />
          )}
          {activeTab === "edit-invoice" && (
            <InvoicePage
              editId={editDocId}
              isViewOnly={isViewOnly}
              onBack={() => {
                setActiveTab("documents");
                setEditDocId(undefined);
                setIsViewOnly(false);
              }}
            />
          )}
          {activeTab === "edit-quotation" && (
            <QuotationPage
              editId={editDocId}
              isViewOnly={isViewOnly}
              onBack={() => {
                setActiveTab("documents");
                setEditDocId(undefined);
                setIsViewOnly(false);
              }}
            />
          )}
          {activeTab === "edit-receipt" && (
            <ReceiptPage
              editId={editDocId}
              isViewOnly={isViewOnly}
              onBack={() => {
                setActiveTab("documents");
                setEditDocId(undefined);
                setIsViewOnly(false);
              }}
            />
          )}
          {activeTab === "add-panel" && (
            <AddPanel
              initialData={
                editingPanel
                  ? { ...editingPanel, size: editingPanel.size || "" }
                  : undefined
              }
              onBack={() => {
                setActiveTab("inventory");
                setEditingPanel(null);
              }}
              onDelete={async () => {
                if (editingPanel) {
                  await deletePanelFromFirestore(editingPanel.id);
                  setItems((prev) =>
                    prev.filter((i) => i.id !== editingPanel.id),
                  );
                  setActiveTab("inventory");
                  setEditingPanel(null);
                }
              }}
              onSave={async (newPanel, silent = false) => {
                const date = new Date().toISOString().split("T")[0];
                try {
                  if (editingPanel) {
                    const updated = {
                      ...newPanel,
                      id: editingPanel.id,
                      lastUpdated: date,
                    } as InventoryItem;
                    await savePanelToFirestore(updated);
                    setItems((prev) =>
                      prev.map((i) => (i.id === editingPanel.id ? updated : i)),
                    );
                  } else {
                    const savedId = await savePanelToFirestore({
                      ...newPanel,
                      lastUpdated: date,
                    });
                    setItems((prev) => [
                      ...prev,
                      {
                        ...newPanel,
                        id: savedId,
                        lastUpdated: date,
                      } as InventoryItem,
                    ]);
                  }
                } catch (e) {
                  console.error("Panel save error:", e);
                  toast({ message: "Failed to save panel.", type: "error" });
                }

                if (!silent) {
                  setActiveTab("inventory");
                  setEditingPanel(null);
                }
              }}
            />
          )}
          {activeTab === "add-customer" && (
            <AddCustomer onBack={() => setActiveTab("customers")} />
          )}
          {activeTab === "settings" && (
            <SettingsPage onBack={() => setActiveTab("dashboard")} />
          )}
          {(activeTab === "add-order" || activeTab === "edit-order") && (
            <AddOrder
              editId={editDocId}
              inventory={items}
              customers={customers}
              onBack={() => {
                setActiveTab("orders");
                setEditDocId(undefined);
              }}
              onSave={async (savedOrder) => {
                try {
                  if (editDocId) {
                    await saveOrderToFirestore({
                      ...savedOrder,
                      id: editDocId,
                    });
                    setOrders((prev) =>
                      prev.map((o) =>
                        o.id === editDocId
                          ? ({ ...savedOrder, id: editDocId } as OrderData)
                          : o,
                      ),
                    );
                    toast({
                      message: "Order updated successfully!",
                      type: "success",
                    });
                  } else {
                    const newId = await saveOrderToFirestore({
                      ...savedOrder,
                      timestamp:
                        savedOrder.timestamp || new Date().toISOString(),
                    });
                    setOrders((prev) => [
                      { ...savedOrder, id: newId } as OrderData,
                      ...prev,
                    ]);
                    toast({
                      message: "Order saved successfully!",
                      type: "success",
                    });
                  }
                  setActiveTab("orders");
                  setEditDocId(undefined);
                } catch (e) {
                  console.error("Failed to save order:", e);
                  toast({
                    message: "Failed to save order. Please try again.",
                    type: "error",
                  });
                }
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}
