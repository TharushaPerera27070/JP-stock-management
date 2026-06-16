"use client";

import React, { useState, useEffect, Suspense } from "react";
import { ArrowLeft, Save, Plus, Trash2, Loader2, X } from "lucide-react";
import { InventoryItem, OrderData, Customer } from "../types";
import { exportToPDF, exportToPrinter } from "@/lib/pdf";
import {
  saveInvoiceToFirestore,
  getNextDocumentNumber,
  getInvoicesFromFirestore,
} from "@/lib/documentStorage";
import { useSettingsStore } from "@/lib/settingsStore";
import { useDialog } from "./Dialog";
import { getOrdersFromFirestore } from "@/lib/firestoreService";
import CustomerSearchPicker from "./CustomerSearchPicker";
import type { ReceiptDraft } from "../types";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  category?: string;
  size?: string;
  unit?: string;
  groupTitle?: string;
  discount?: number; // Represented as percentage (e.g. 10 for 10% discount)
}

interface AddOrderProps {
  onBack: () => void;
  onSave: (
    order: OrderData,
    options?: { stayOnPage?: boolean },
  ) => Promise<void> | void;
  onCreateReceipt?: (draft: ReceiptDraft) => void;
  inventory: InventoryItem[];
  customers: Customer[];
  editId?: string;
}

export default function AddOrder({
  onBack,
  onSave,
  onCreateReceipt,
  inventory,
  customers,
  editId,
}: AddOrderProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#E8973A]" />
        </div>
      }
    >
      <OrderEditor
        onBack={onBack}
        onSave={onSave}
        onCreateReceipt={onCreateReceipt}
        inventory={inventory}
        customers={customers}
        editId={editId}
      />
    </Suspense>
  );
}

function OrderEditor({
  onBack,
  onSave,
  onCreateReceipt,
  inventory,
  customers,
  editId,
}: {
  onBack: () => void;
  onSave: (
    order: OrderData,
    options?: { stayOnPage?: boolean },
  ) => Promise<void> | void;
  onCreateReceipt?: (draft: ReceiptDraft) => void;
  inventory: InventoryItem[];
  customers: Customer[];
  editId?: string;
}) {
  const settings = useSettingsStore();
  const LINE_ITEM_PRESETS = settings.presets;
  const company = settings.company;
  const bankDetails = settings.bankDetails;
  const terms = settings.terms;

  const [title, setTitle] = useState("INVOICE");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientContactNumber, setClientContactNumber] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  );
  const [items, setItems] = useState<LineItem[]>([
    {
      description: "",
      quantity: 1,
      unitPrice: 0,
      category: "wall",
      groupTitle: "Walls",
      unit: "Sqft",
      discount: 0,
    },
  ]);
  const [pricingMode, setPricingMode] = useState<"simple" | "hard">("simple");
  const [notes, setNotes] = useState("");
  const [preparedBy, setPreparedBy] = useState("");
  const [orderType, setOrderType] = useState<
    "with_construction" | "panels_only"
  >("with_construction");
  const [showPreview, setShowPreview] = useState(false);
  const [enableDiscounts, setEnableDiscounts] = useState(false);
  const [invoiceType, setInvoiceType] = useState<"normal" | "cash">("normal");
  const [status, setStatus] = useState<OrderData["status"]>("Pending");
  const [isLoading, setIsLoading] = useState(false);
  const [showReceiptPrompt, setShowReceiptPrompt] = useState(false);

  const handleInvoiceTypeChange = (type: "normal" | "cash") => {
    setInvoiceType(type);

    let count = 1;
    const match = invoiceNo.match(/\d+$/);
    if (match) {
      count = parseInt(match[0], 10);
    }

    if (type === "cash") {
      setTitle("CASH INVOICE");
      setInvoiceNo(`A000${count}`);
    } else {
      setTitle("INVOICE");
      const yearShort = new Date().getFullYear().toString().slice(-2);
      const countStr = count.toString().padStart(3, "0");
      setInvoiceNo(`# ${yearShort} - ${countStr}`);
    }
  };

  useEffect(() => {
    const loadOrderData = async () => {
      if (editId) {
        setIsLoading(true);
        try {
          const [orders, storedInvoices] = await Promise.all([
            getOrdersFromFirestore(),
            getInvoicesFromFirestore(),
          ]);
          const orderToEdit = orders.find((o: any) => o.id === editId);
          if (orderToEdit) {
            const invoiceToEdit = storedInvoices.find(
              (i: any) => i.orderId === editId,
            );
            if (invoiceToEdit) {
              setTitle(invoiceToEdit.title);
              setInvoiceNo(invoiceToEdit.invoiceNo);
              setClientName(invoiceToEdit.clientName);
              setClientContactNumber(invoiceToEdit.clientContactNumber);
              setClientAddress(invoiceToEdit.clientAddress);
              setIssueDate(invoiceToEdit.issueDate);
              setDueDate(invoiceToEdit.dueDate);
              setPricingMode(invoiceToEdit.pricingMode);
              setNotes(invoiceToEdit.notes || "");
              setPreparedBy(invoiceToEdit.preparedBy || "");
              setOrderType(invoiceToEdit.orderType || "with_construction");
              setEnableDiscounts(invoiceToEdit.enableDiscounts ?? true);
              setInvoiceType(invoiceToEdit.invoiceType || "normal");
              setItems(invoiceToEdit.items || []);
              setStatus((orderToEdit as any).status || "Pending");
            }
          }
        } catch (e) {
          console.error("Error loading order for edit:", e);
        } finally {
          setIsLoading(false);
        }
      } else {
        const fetchNextNum = async () => {
          const nextVal = await getNextDocumentNumber("invoice");
          setInvoiceNo(nextVal);
        };
        fetchNextNum();
      }
    };
    loadOrderData();
  }, [editId]);

  useEffect(() => {
    if (!clientName.trim() || customers.length === 0) return;

    const matchedCustomer = customers.find(
      (customer) =>
        customer.name.trim().toLowerCase() === clientName.trim().toLowerCase(),
    );

    if (matchedCustomer) {
      setClientContactNumber(
        matchedCustomer.contactNumber || matchedCustomer.phone || "",
      );
      setClientAddress(matchedCustomer.address || "");
    }
  }, [clientName, customers]);

  const applyCustomer = (customer: Customer) => {
    setClientName(customer.name);
    setClientContactNumber(customer.contactNumber || customer.phone || "");
    setClientAddress(customer.address || "");
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        description: "",
        quantity: 1,
        unitPrice: 0,
        category: "custom",
        groupTitle: "Custom Works",
        unit: "Item",
        discount: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    fieldOrUpdates: keyof LineItem | Partial<LineItem>,
    value?: any,
  ) => {
    setItems((prevItems) => {
      const newItems = [...prevItems];
      if (typeof fieldOrUpdates === "object") {
        newItems[index] = { ...newItems[index], ...fieldOrUpdates };
      } else {
        newItems[index] = {
          ...newItems[index],
          [fieldOrUpdates as any]: value,
        };
      }
      return newItems;
    });
  };

  const calculateTotal = () => {
    return items.reduce(
      (sum, item) =>
        sum + item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100),
      0,
    );
  };

  const calculateUndiscountedSubtotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const { toast } = useDialog();

  const getPanelCategory = (panelType: string) => {
    const normalized = panelType.trim().toLowerCase();
    if (normalized.includes("ceiling")) return "ceiling";
    if (normalized.includes("roof")) return "roofing";
    return "wall";
  };

  const getPanelLabel = (panel: InventoryItem) => {
    const design = panel.design?.trim() || panel.panelId;
    const typeLabel = panel.panelType?.trim() || "Panel";
    const sizeLabel = panel.size?.trim() ? ` • ${panel.size.trim()}` : "";
    return `${design} ${typeLabel} Panel${sizeLabel}`;
  };

  const getPanelDisplayLabel = (panel: InventoryItem) => {
    const baseLabel = getPanelLabel(panel);
    const colorLabel = panel.color?.trim() ? ` • ${panel.color.trim()}` : "";
    return `${baseLabel}${colorLabel}`;
  };

  const getPanelsForCategory = (category: "wall" | "ceiling" | "roofing") =>
    inventory.filter((panel) => getPanelCategory(panel.panelType) === category);

  const getDefaultPanelForCategory = (
    category: "wall" | "ceiling" | "roofing",
  ) => getPanelsForCategory(category)[0];

  const handleSave = async (showPromptAfterSave = false) => {
    if (!clientName) {
      toast({ message: "Please enter a client name.", type: "error" });
      return;
    }
    if (items.length === 0 || (!items[0].description && !items[0].groupTitle)) {
      toast({
        message: "Please add at least one valid item to the order.",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    try {
      const orderId = editId || `ord-${Date.now()}`;
      const storedInvoices = await getInvoicesFromFirestore();
      const existingInv = editId
        ? storedInvoices.find((i: any) => i.orderId === editId)
        : null;
      const invoiceId = existingInv ? existingInv.id : `inv-${Date.now()}`;

      // 1. Save corresponding Invoice to local storage
      const invoiceData = {
        id: invoiceId,
        orderId: orderId,
        isFromOrder: true,
        title,
        invoiceNo,
        clientName,
        clientContactNumber,
        clientAddress,
        issueDate,
        dueDate,
        pricingMode,
        notes,
        preparedBy,
        orderType,
        enableDiscounts,
        invoiceType,
        items,
        summary: {
          subtotal: undiscountedSubtotal,
          totalDiscount,
          finalTotal: total,
        },
      };

      await saveInvoiceToFirestore(invoiceData);

      // 2. Prepare Order Data
      const totalQty = items.reduce((acc, item) => acc + item.quantity, 0);
      const finalOrderData: OrderData = {
        id: orderId,
        invoiceNo: invoiceNo,
        customer: clientName,
        date: issueDate,
        items: totalQty,
        total: total,
        status: status,
        lineItems: items.map((item) => ({
          inventoryId: item.category || "custom",
          name: item.description || item.groupTitle || "Item",
          quantity: item.quantity,
          price: item.unitPrice,
          total:
            item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100),
        })),
        deliveryFee: 0,
        timestamp: new Date().toISOString(),
      };

      const shouldStayOnPage = showPromptAfterSave && !editId;
      await onSave(finalOrderData, { stayOnPage: shouldStayOnPage });

      if (showPromptAfterSave && !editId) {
        setShowPreview(false);
        setShowReceiptPrompt(true);
      }
    } catch (err) {
      console.error("Save error:", err);
      toast({
        message: "Error saving order and invoice. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    await exportToPDF("invoice-preview", `${invoiceNo}.pdf`);
    await handleSave(true);
  };

  const handleDirectPrint = async () => {
    await exportToPrinter("invoice-preview");
    await handleSave(true);
  };

  const handleCreateReceiptClick = () => {
    setShowReceiptPrompt(false);
    onCreateReceipt?.({
      invoiceQuotationNo: invoiceNo,
      receivedFrom: clientName,
      amount: total,
      paymentFor: `Payment against invoice ${invoiceNo}`,
      paymentMethod: "Cash",
      referenceNo: "",
      issueDate,
      preparedBy,
    });
  };

  const total = calculateTotal();
  const undiscountedSubtotal = calculateUndiscountedSubtotal();
  const totalDiscount = undiscountedSubtotal - total;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#E8973A]" />
          <p className="text-gray-500 text-sm font-medium">
            Creating Order & Invoice...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <main className="flex-1 pb-20">
        <div className="mx-auto w-full max-w-7xl px-2 sm:px-4 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            {/* <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-white text-gray-700 font-medium transition-all text-sm flex items-center justify-center gap-1.5"
              >
                Preview Invoice
              </button>
              <button
                  onClick={() => handleSave()}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#E8973A] hover:bg-[#d4832b] text-gray-900 font-bold transition-all shadow-lg shadow-[#E8973A]/20 text-sm cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Order
              </button>
            </div> */}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl p-6 sticky top-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                  Order & Invoice Info
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Order Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) =>
                        setStatus(e.target.value as OrderData["status"])
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#E8973A] focus:border-transparent outline-none text-sm font-semibold transition-all text-gray-900"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice Type
                    </label>
                    <select
                      value={invoiceType}
                      onChange={(e) =>
                        handleInvoiceTypeChange(
                          e.target.value as "normal" | "cash",
                        )
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#E8973A] focus:border-transparent outline-none text-sm font-semibold transition-all text-gray-900"
                    >
                      <option value="normal">Normal Invoice</option>
                      <option value="cash">Cash Invoice</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice #
                    </label>
                    <input
                      type="text"
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#E8973A] focus:border-transparent outline-none text-sm font-semibold transition-all text-gray-900"
                    />
                  </div>

                  <CustomerSearchPicker
                    label="Client Name *"
                    value={clientName}
                    customers={customers}
                    onChange={setClientName}
                    onSelectCustomer={applyCustomer}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client Contact Number
                    </label>
                    <input
                      type="number"
                      value={clientContactNumber}
                      onChange={(e) => setClientContactNumber(e.target.value)}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#E8973A] focus:border-transparent outline-none text-sm font-semibold transition-all text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client Address
                    </label>
                    <textarea
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#E8973A] focus:border-transparent outline-none text-sm font-semibold transition-all resize-none text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Issue Date
                    </label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#E8973A] focus:border-transparent outline-none text-sm font-semibold transition-all text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#E8973A] focus:border-transparent outline-none text-sm font-semibold transition-all text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Document Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. INVOICE"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#E8973A] focus:border-transparent outline-none text-sm font-semibold transition-all text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#E8973A] focus:border-transparent outline-none text-sm font-semibold transition-all resize-none text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prepared By
                    </label>
                    <input
                      type="text"
                      value={preparedBy}
                      onChange={(e) => setPreparedBy(e.target.value)}
                      placeholder="e.g. Sales Team / Your Name"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#E8973A] focus:border-transparent outline-none text-sm font-semibold transition-all text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Order Type (Payment Terms)
                    </label>
                    <select
                      value={orderType}
                      onChange={(e) =>
                        setOrderType(
                          e.target.value as "with_construction" | "panels_only",
                        )
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#E8973A] focus:border-transparent outline-none text-sm font-semibold transition-all text-gray-900"
                    >
                      <option value="with_construction">
                        With Construction (80% advance)
                      </option>
                      <option value="panels_only">
                        Panels Only (No Construction) (100% advance)
                      </option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className="hidden lg:block w-full bg-[#E8973A] hover:bg-[#d4832b] text-white font-semibold py-2.5 px-4 rounded-xl transition shadow-lg shadow-[#E8973A]/10 active:scale-[0.98]"
                  >
                    Preview & Export Invoice
                  </button>
                </div>
              </div>
            </div>

            {/* Items Column */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-800">
                      Line Items
                    </h2>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#E8973A] bg-[#E8973A]/5 hover:bg-[#E8973A]/10 px-3 py-1.5 rounded-xl border border-[#E8973A]/20 transition select-none">
                      <input
                        type="checkbox"
                        checked={enableDiscounts}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setEnableDiscounts(val);
                          if (!val) {
                            setItems(
                              items.map((item) => ({ ...item, discount: 0 })),
                            );
                          }
                        }}
                        className="accent-[#E8973A] h-3.5 w-3.5 rounded"
                      />
                      <span>Apply Discounts</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-150 p-1.5 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPricingMode("simple")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                        pricingMode === "simple"
                          ? "bg-white text-gray-800 shadow-sm border border-gray-250"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      Sqft
                    </button>
                    <button
                      type="button"
                      onClick={() => setPricingMode("hard")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                        pricingMode === "hard"
                          ? "bg-white text-gray-800 shadow-sm border border-gray-250"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      Panel-by-Panel
                    </button>
                  </div>
                </div>

                <div className="space-y-4 mb-4">
                  {items.map((item, index) => {
                    const activeCat =
                      item.category ||
                      (item.unit === "Transport" ? "transport" : "wall");
                    return (
                      <div
                        key={index}
                        className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 flex flex-col gap-3.5 w-full"
                      >
                        {/* Row 1: Component Type buttons */}
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                            Component Type
                          </label>
                          <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg max-w-md">
                            {[
                              "wall",
                              "ceiling",
                              "roofing",
                              "transport",
                              "custom",
                            ].map((cat) => {
                              const label =
                                cat === "wall"
                                  ? "Wall"
                                  : cat === "ceiling"
                                    ? "Ceiling"
                                    : cat === "roofing"
                                      ? "Roofing"
                                      : cat === "transport"
                                        ? "Transport"
                                        : "Custom";
                              return (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => {
                                    const groupTitle =
                                      cat === "wall"
                                        ? "Walls"
                                        : cat === "ceiling"
                                          ? "Roof & Ceilling"
                                          : cat === "roofing"
                                            ? "Roofing"
                                            : cat === "transport"
                                              ? "Transport"
                                              : "Custom Works";
                                    const unit =
                                      cat === "custom"
                                        ? "Item"
                                        : cat === "transport"
                                          ? "Transport"
                                          : "Sqft";
                                    if (cat === "custom") {
                                      updateItem(index, {
                                        category: "custom",
                                        groupTitle,
                                        unit,
                                        size: "",
                                        description: "",
                                        unitPrice: 0,
                                        discount: 0,
                                      });
                                    } else if (cat === "transport") {
                                      updateItem(index, {
                                        category: "transport",
                                        groupTitle,
                                        unit,
                                        size: "",
                                        description: "",
                                        quantity: 1,
                                        unitPrice: 0,
                                        discount: 0,
                                      });
                                    } else {
                                      const panelCategory = cat as
                                        | "wall"
                                        | "ceiling"
                                        | "roofing";
                                      const defaultPanel =
                                        getDefaultPanelForCategory(
                                          panelCategory,
                                        );
                                      if (defaultPanel) {
                                        updateItem(index, {
                                          category: cat,
                                          groupTitle,
                                          unit,
                                          size: defaultPanel.size || "",
                                          description: "",
                                          unitPrice: defaultPanel.price || 0,
                                          discount: 0,
                                        });
                                      } else {
                                        updateItem(index, {
                                          category: cat,
                                          groupTitle,
                                          unit,
                                          size: "",
                                          description: "",
                                          unitPrice: 0,
                                          discount: 0,
                                        });
                                      }
                                    }
                                  }}
                                  className={`flex-1 min-w-15 px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-150 ${
                                    activeCat === cat
                                      ? "bg-white text-gray-800 shadow-sm font-bold"
                                      : "text-gray-500 hover:text-gray-800"
                                  }`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Row 1.5: Group Title customization */}
                        {activeCat !== "transport" && (
                          <div className="w-full">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                              Group Header / Category Name
                            </label>
                            {activeCat !== "custom" ? (
                              (() => {
                                const panelCategory = activeCat as
                                  | "wall"
                                  | "ceiling"
                                  | "roofing";
                                return (
                                  <select
                                    value={item.groupTitle || ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const selectedPanel = inventory.find(
                                        (panel) =>
                                          getPanelLabel(panel) === val ||
                                          panel.id === val,
                                      );
                                      if (selectedPanel) {
                                        updateItem(index, {
                                          groupTitle:
                                            getPanelLabel(selectedPanel),
                                          size: selectedPanel.size || "",
                                          description: "",
                                          unitPrice: selectedPanel.price || 0,
                                        });
                                      } else {
                                        updateItem(index, "groupTitle", val);
                                      }
                                    }}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#E8973A] outline-none text-sm text-gray-900 font-normal"
                                  >
                                    <option value="">Select Option...</option>
                                    {getPanelsForCategory(panelCategory).map(
                                      (panel, panelIndex) => (
                                        <option
                                          key={panel.id || panelIndex}
                                          value={getPanelLabel(panel)}
                                        >
                                          {getPanelDisplayLabel(panel)}
                                        </option>
                                      ),
                                    )}
                                  </select>
                                );
                              })()
                            ) : (
                              <input
                                type="text"
                                placeholder="e.g. Custom Works, Doors, Windows..."
                                value={item.groupTitle || ""}
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    "groupTitle",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#E8973A] outline-none text-sm text-gray-900 font-normal"
                              />
                            )}
                          </div>
                        )}

                        {/* Row 2: Pricing Boxes Inline */}
                        <div className="flex flex-col md:flex-row gap-3.5 md:items-end w-full">
                          {activeCat === "custom" && (
                            <div className="flex-1 md:w-20">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                Unit
                              </label>
                              <select
                                value={item.unit || "Item"}
                                onChange={(e) =>
                                  updateItem(index, "unit", e.target.value)
                                }
                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#E8973A] outline-none text-sm font-normal text-gray-900 h-10.5"
                              >
                                <option value="Item">Item</option>
                                <option value="Sqft">Sqft</option>
                                <option value="Nos">Nos</option>
                              </select>
                            </div>
                          )}
                          {activeCat !== "transport" && (
                            <div
                              className={`flex-1 ${enableDiscounts ? "md:w-16" : "md:w-24"}`}
                            >
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                Qty
                              </label>
                              <input
                                type="number"
                                placeholder="Qty"
                                value={item.quantity === 0 ? "" : item.quantity}
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    "quantity",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                onFocus={(e) => e.target.select()}
                                onWheel={(e) => e.currentTarget.blur()}
                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#E8973A] outline-none text-sm font-normal text-center text-gray-900"
                              />
                            </div>
                          )}

                          <div
                            className={`flex-1 ${enableDiscounts ? "md:w-24" : "md:w-32"}`}
                          >
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                              {activeCat === "transport"
                                ? "Amount (Rs.)"
                                : "Rate (Rs.)"}
                            </label>
                            <input
                              type="number"
                              placeholder="Price"
                              value={item.unitPrice === 0 ? "" : item.unitPrice}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "unitPrice",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              onFocus={(e) => e.target.select()}
                              onWheel={(e) => e.currentTarget.blur()}
                              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#E8973A] outline-none text-sm font-normal text-right text-gray-900"
                            />
                          </div>

                          {enableDiscounts && activeCat !== "transport" && (
                            <div className="flex-1 md:w-20 animate-in fade-in duration-100">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                Disc (%)
                              </label>
                              <input
                                type="number"
                                placeholder="0"
                                min="0"
                                max="100"
                                value={
                                  item.discount === 0 || !item.discount
                                    ? ""
                                    : item.discount
                                }
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    "discount",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                onFocus={(e) => e.target.select()}
                                onWheel={(e) => e.currentTarget.blur()}
                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#E8973A] outline-none text-sm font-normal text-center text-gray-900"
                              />
                            </div>
                          )}

                          <div
                            className={`flex-1 ${enableDiscounts ? "md:w-28" : "md:w-36"}`}
                          >
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                              Subtotal
                            </label>
                            <div className="w-full px-3 py-2.5 bg-gray-100 rounded-lg text-sm font-bold text-gray-700 text-right h-10.5 flex items-center justify-end">
                              Rs.{" "}
                              {(
                                item.quantity *
                                item.unitPrice *
                                (1 - (item.discount || 0) / 100)
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          </div>

                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="px-3.5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-150 text-sm font-semibold h-10.5 flex items-center justify-center border border-transparent shadow-sm active:scale-[0.98]"
                              title="Remove item"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        {/* Row 3: Description Textarea */}
                        <div className="w-full">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                            Description
                          </label>
                          <textarea
                            placeholder={
                              activeCat === "transport"
                                ? "Enter transport details..."
                                : activeCat === "custom"
                                  ? "Type custom description..."
                                  : "Add details or customize description..."
                            }
                            value={item.description}
                            onChange={(e) =>
                              updateItem(index, "description", e.target.value)
                            }
                            rows={2}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#E8973A] outline-none text-sm font-normal text-gray-900 resize-y"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={addItem}
                  className="mb-6 px-4 py-2.5 bg-[#E8973A] hover:bg-[#d4832b] text-white rounded-xl transition text-sm font-semibold flex items-center gap-1.5 shadow-sm active:scale-[0.98]"
                >
                  + Add Item
                </button>

                {/* Total */}
                <div className="border-t border-gray-100 pt-4 flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-gray-500 text-sm font-semibold">
                      <span>Subtotal:</span>
                      <span>
                        Rs.{" "}
                        {undiscountedSubtotal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    {enableDiscounts && totalDiscount > 0 && (
                      <div className="flex justify-between text-red-600 text-sm font-semibold">
                        <span>Discount:</span>
                        <span>
                          -Rs.{" "}
                          {totalDiscount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t border-gray-100">
                      <span>Total:</span>
                      <span>
                        Rs.{" "}
                        {total.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile buttons */}
          <div className="mt-8 lg:hidden px-2 space-y-3">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3.5 px-4 rounded-xl transition shadow-md active:scale-[0.98] text-base flex justify-center items-center"
            >
              Preview Invoice
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              className="w-full bg-[#E8973A] hover:bg-[#d4832b] text-white font-bold py-3.5 px-4 rounded-xl transition shadow-lg shadow-[#E8973A]/20 active:scale-[0.98] text-base flex justify-center items-center"
            >
              Save Order
            </button>
          </div>
        </div>
      </main>

      {/* Preview Dialog Modal */}
      {showPreview && (
        <div className="fixed inset-y-0 right-0 left-0 md:left-64 z-400 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-gray-50 border-b border-gray-150 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  PDF Invoice Export Preview
                </span>
                <h3 className="text-base font-extrabold text-gray-800">
                  {invoiceNo}.pdf
                </h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={handleExportPDF}
                  className="flex-1 sm:flex-initial px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl transition-all duration-150 font-bold text-xs uppercase tracking-wider shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Save PDF
                </button>
                <button
                  onClick={handleDirectPrint}
                  className="flex-1 sm:flex-initial px-5 py-2.5 bg-linear-to-r from-[#E8973A] to-[#d4832b] hover:from-[#d4832b] hover:to-[#be7221] text-white rounded-xl transition-all duration-150 font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  Print Now
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex-1 sm:flex-initial px-5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-xl transition-all duration-150 font-bold text-xs uppercase tracking-wider active:scale-[0.98]"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-gray-100 p-6 md:p-12 flex justify-center items-start">
              <div
                id="invoice-preview"
                className="shadow-2xl rounded-sm bg-white"
              >
                <InvoicePreview
                  title={title}
                  pricingMode={pricingMode}
                  invoiceNo={invoiceNo}
                  clientName={clientName}
                  clientContactNumber={clientContactNumber}
                  clientAddress={clientAddress}
                  issueDate={issueDate}
                  dueDate={dueDate}
                  items={items}
                  notes={notes}
                  total={total}
                  undiscountedSubtotal={undiscountedSubtotal}
                  totalDiscount={totalDiscount}
                  company={company}
                  bankDetails={bankDetails}
                  terms={terms}
                  preparedBy={preparedBy}
                  orderType={orderType}
                  enableDiscounts={enableDiscounts}
                  invoiceType={invoiceType}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {showReceiptPrompt && (
        <div className="fixed bottom-6 right-6 z-500 w-[calc(100%-2rem)] max-w-md rounded-2xl border border-[#E8973A]/30 bg-white/95 backdrop-blur-sm p-4 shadow-2xl">
          <p className="text-sm font-semibold text-gray-900">
            Invoice saved successfully. Do you want to create a receipt now?
          </p>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowReceiptPrompt(false)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Not Now
            </button>
            <button
              type="button"
              onClick={handleCreateReceiptClick}
              className="rounded-lg bg-[#E8973A] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#d4832b]"
            >
              Create Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface InvoicePreviewProps {
  title: string;
  pricingMode: "simple" | "hard";
  invoiceNo: string;
  clientName: string;
  clientContactNumber: string;
  clientAddress: string;
  issueDate: string;
  dueDate: string;
  items: LineItem[];
  notes: string;
  total: number;
  undiscountedSubtotal: number;
  totalDiscount: number;
  company: any;
  bankDetails: any[];
  terms: any;
  preparedBy?: string;
  orderType?: "with_construction" | "panels_only";
  enableDiscounts: boolean;
  invoiceType?: "normal" | "cash";
}

function InvoicePreview({
  title,
  pricingMode,
  invoiceNo,
  clientName,
  clientContactNumber,
  clientAddress,
  issueDate,
  dueDate,
  items,
  notes,
  total,
  undiscountedSubtotal,
  totalDiscount,
  company,
  bankDetails,
  terms,
  preparedBy,
  orderType,
  enableDiscounts,
  invoiceType,
}: InvoicePreviewProps) {
  return (
    <div className="w-[210mm] min-h-[297mm] p-10 text-sm text-black font-medium bg-white relative flex flex-col mx-auto font-sans box-border select-none">
      <div className="flex-1 flex flex-col">
        {/* Header Section */}
        <div className="flex justify-between items-start w-full mb-4">
          <div className="w-35">
            <img
              src="/Japan-Gedara-Logo-removebg-preview.png"
              alt="Logo"
              className="w-32 h-auto"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
          <div className="flex flex-col items-end text-right flex-1">
            <span className="text-base font-bold text-black mb-1">
              {company.name.toUpperCase()}
            </span>
            <span className="text-[10px] text-black max-w-50 leading-tight mb-1">
              {company.address}
            </span>
            <span className="text-base font-extrabold text-black uppercase tracking-wider mt-4">
              {invoiceType === "cash" ? "CASH INVOICE" : "INVOICE"}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-0.5 bg-black mb-6 w-full rounded-full" />

        {/* Client & Meta Info */}
        <div className="flex mb-8 w-full">
          <div className="flex-1">
            <div className="flex mb-1 items-center">
              <span className="font-bold w-22.5 text-[10px] text-black">
                DATE:
              </span>
              <span className="text-[10px] text-black">
                {new Date(issueDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex mb-1 items-center">
              <span className="font-bold w-22.5 text-[10px] text-black">
                INVOICE NO:
              </span>
              <span className="text-[10px] text-black">{invoiceNo}</span>
            </div>
            <div className="flex mb-1 items-center">
              <span className="font-bold w-22.5 text-[10px] text-black">
                DUE DATE:
              </span>
              <span className="text-[10px] text-black">
                {new Date(dueDate).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex mb-1 items-center">
              <span className="font-bold w-22.5 text-[10px] text-black">
                NAME:
              </span>
              <span className="text-[10px] text-black flex-1">
                {clientName || "Valued Customer"}
              </span>
            </div>
            <div className="flex mb-1 items-center">
              <span className="font-bold w-22.5 text-[10px] text-black">
                ADDRESS:
              </span>
              <span className="text-[10px] text-black flex-1">
                {clientAddress || "Not Specified"}
              </span>
            </div>
            <div className="flex mb-1 items-center">
              <span className="font-bold w-30 text-[10px] text-black">
                CONTACT NUMBER:
              </span>
              <span className="text-[10px] text-black flex-1">
                {clientContactNumber || "Not Specified"}
              </span>
            </div>
          </div>
        </div>

        <span className="block text-xs font-semibold text-black mb-3">
          TITLE: {title || "INVOICE"}
        </span>

        {/* Materials Table */}
        <div className="mb-5">
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1.5px solid #000000",
              fontFamily: "Arial, sans-serif",
              fontSize: "11px",
              color: "#000000",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1.5px solid #000000",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <th
                  style={{
                    border: "1px solid #000000",
                    padding: "6px 4px",
                    textAlign: "center",
                    fontWeight: "bold",
                    width: "6%",
                  }}
                >
                  ITEM
                </th>
                <th
                  style={{
                    border: "1px solid #000000",
                    padding: "6px 8px",
                    textAlign: "left",
                    fontWeight: "bold",
                    width: enableDiscounts ? "46%" : "54%",
                  }}
                >
                  DESCRIPTION
                </th>
                <th
                  style={{
                    border: "1px solid #000000",
                    padding: "6px 4px",
                    textAlign: "center",
                    fontWeight: "bold",
                    width: "8%",
                  }}
                >
                  UNIT
                </th>
                <th
                  style={{
                    border: "1px solid #000000",
                    padding: "6px 4px",
                    textAlign: "center",
                    fontWeight: "bold",
                    width: "8%",
                  }}
                >
                  QTY
                </th>
                <th
                  style={{
                    border: "1px solid #000000",
                    padding: "6px 4px",
                    textAlign: "right",
                    fontWeight: "bold",
                    width: enableDiscounts ? "10%" : "12%",
                  }}
                >
                  RATE (Rs.)
                </th>
                {enableDiscounts && (
                  <th
                    style={{
                      border: "1px solid #000000",
                      padding: "6px 4px",
                      textAlign: "center",
                      fontWeight: "bold",
                      width: "10%",
                    }}
                  >
                    DISC (%)
                  </th>
                )}
                <th
                  style={{
                    border: "1px solid #000000",
                    padding: "6px 4px",
                    textAlign: "right",
                    fontWeight: "bold",
                    width: "12%",
                  }}
                >
                  AMOUNT (Rs.)
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const groupHeader =
                  item.groupTitle ||
                  (item.category === "wall"
                    ? "Walls"
                    : item.category === "ceiling"
                      ? "Roof & Ceilling"
                      : item.category === "roofing"
                        ? "Roofing"
                        : item.category === "transport"
                          ? "Transport"
                          : "Custom Works");
                const itemUnit =
                  item.category === "transport"
                    ? "Transport"
                    : item.category === "custom"
                      ? item.unit || "Item"
                      : pricingMode === "simple"
                        ? "Sqft"
                        : "Nos";
                const displayQty =
                  item.category === "transport"
                    ? ""
                    : itemUnit.toLowerCase() === "item" &&
                        (item.quantity === 1 || item.quantity === 0)
                      ? ""
                      : item.quantity.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        });

                return (
                  <React.Fragment key={index}>
                    {/* Category Group Header Row */}
                    <tr>
                      <td
                        style={{
                          border: "1px solid #000000",
                          padding: "6px 4px",
                          textAlign: "center",
                          fontWeight: "bold",
                        }}
                      >
                        {index + 1}
                      </td>
                      <td
                        style={{
                          border: "1px solid #000000",
                          padding: "6px 8px",
                          textAlign: "left",
                          fontWeight: "bold",
                        }}
                      >
                        {groupHeader}
                      </td>
                      <td
                        style={{
                          border: "1px solid #000000",
                          padding: "6px 4px",
                        }}
                      ></td>
                      <td
                        style={{
                          border: "1px solid #000000",
                          padding: "6px 4px",
                        }}
                      ></td>
                      <td
                        style={{
                          border: "1px solid #000000",
                          padding: "6px 4px",
                        }}
                      ></td>
                      <td
                        style={{
                          border: "1px solid #000000",
                          padding: "6px 4px",
                        }}
                      ></td>
                      {enableDiscounts && (
                        <td
                          style={{
                            border: "1px solid #000000",
                            padding: "6px 4px",
                          }}
                        ></td>
                      )}
                    </tr>
                    {/* Detail Row */}
                    <tr>
                      <td
                        style={{
                          border: "1px solid #000000",
                          padding: "6px 4px",
                        }}
                      ></td>
                      <td
                        style={{
                          border: "1px solid #000000",
                          padding: "8px 8px",
                          textAlign: "left",
                          lineHeight: "1.4",
                        }}
                      >
                        {item.description || ""}
                      </td>
                      <td
                        style={{
                          border: "1px solid #000000",
                          padding: "6px 4px",
                          textAlign: "center",
                        }}
                      >
                        {itemUnit}
                      </td>
                      <td
                        style={{
                          border: "1px solid #000000",
                          padding: "6px 4px",
                          textAlign: "center",
                        }}
                      >
                        {displayQty}
                      </td>
                      <td
                        style={{
                          border: "1px solid #000000",
                          padding: "6px 4px",
                          textAlign: "right",
                        }}
                      >
                        {item.unitPrice.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      {enableDiscounts && (
                        <td
                          style={{
                            border: "1px solid #000000",
                            padding: "6px 4px",
                            textAlign: "center",
                          }}
                        >
                          {item.discount && item.discount > 0
                            ? `(${item.discount}%)`
                            : "-"}
                        </td>
                      )}
                      <td
                        style={{
                          border: "1px solid #000000",
                          padding: "6px 4px",
                          textAlign: "right",
                        }}
                      >
                        {(
                          item.quantity *
                          item.unitPrice *
                          (1 - (item.discount || 0) / 100)
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}

              {/* Subtotal & Discount Rows inside PDF */}
              {enableDiscounts && totalDiscount > 0 && (
                <>
                  <tr style={{ backgroundColor: "#f9fafb" }}>
                    <td
                      colSpan={6}
                      style={{
                        border: "1px solid #000000",
                        padding: "6px 8px",
                        textAlign: "left",
                        fontWeight: "bold",
                      }}
                    >
                      Subtotal (Before Discount)
                    </td>
                    <td
                      style={{
                        border: "1px solid #000000",
                        padding: "6px 4px",
                        textAlign: "right",
                        fontWeight: "bold",
                      }}
                    >
                      Rs.{" "}
                      {undiscountedSubtotal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: "#f9fafb", color: "#000000" }}>
                    <td
                      colSpan={6}
                      style={{
                        border: "1px solid #000000",
                        padding: "6px 8px",
                        textAlign: "left",
                        fontWeight: "bold",
                      }}
                    >
                      Total Discount Added
                    </td>
                    <td
                      style={{
                        border: "1px solid #000000",
                        padding: "6px 4px",
                        textAlign: "right",
                        fontWeight: "bold",
                      }}
                    >
                      -Rs.{" "}
                      {totalDiscount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                </>
              )}

              {/* Grand Total Row */}
              <tr style={{ backgroundColor: "#f3f4f6", color: "#000000" }}>
                <td
                  colSpan={enableDiscounts ? 6 : 5}
                  style={{
                    border: "1px solid #000000",
                    padding: "8px 8px",
                    textAlign: "left",
                    fontWeight: "bold",
                  }}
                >
                  Total Amount Due
                </td>
                <td
                  style={{
                    border: "1px solid #000000",
                    padding: "8px 4px",
                    textAlign: "right",
                    fontWeight: "bold",
                  }}
                >
                  {total.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Notes */}
        {notes && (
          <div className="mb-5">
            <h3 className="font-bold text-[10px] text-black mb-1">Notes:</h3>
            <p className="text-[10px] text-black whitespace-pre-wrap">
              {notes}
            </p>
          </div>
        )}
      </div>

      {/* Footer Grid */}
      <div className="flex justify-between items-start mt-auto mb-24 w-full">
        {/* Terms & Conditions */}
        <div className="flex-1 mr-5">
          <div className="h-7.5 border-b border-black mb-2 flex items-end pb-1">
            <span className="font-bold text-[11px] text-black">
              Terms & Conditions
            </span>
          </div>
          <span className="block text-[9px] text-black mb-1 leading-normal">
            •{" "}
            {orderType === "with_construction"
              ? terms.withConstruction
              : terms.panelsOnly}
          </span>
          <span className="block text-[9px] text-black mb-1 leading-normal">
            • {terms.additionalAccessories}
          </span>
          <span className="block text-[8.5px] italic text-black mt-1 leading-normal">
            {terms.wastageDisclaimer}
          </span>
        </div>

        {/* Bank Details */}
        <div className="flex-1">
          <div className="h-7.5 border-b border-black mb-2 flex items-end pb-1">
            <span className="font-bold text-[10px] text-black">
              *All Payments should be made in favour of {company.name}
            </span>
          </div>

          {bankDetails.map((bank, index) => (
            <div key={bank.id || index} className="mb-2">
              <span className="block font-bold text-[9px] text-black">
                • {bank.bankName} - {bank.branch}
              </span>
              <span className="block text-[9px] text-black pl-2">
                A/c No: {bank.accountNo}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Static Bottom Footer */}
      <div className="absolute bottom-8 left-10 right-10 border-t border-black pt-2 text-center flex flex-col items-center">
        <span className="text-[9px] text-black mb-1">
          {company.phones.join(" | ")}
        </span>
        <span className="text-[9px] text-black mb-1">
          {company.email} | {company.website}
        </span>
        <span className="text-[9px] text-black">
          Prepared by: {preparedBy || "Japan Gedara Team"} | {company.name}
        </span>
      </div>
    </div>
  );
}
