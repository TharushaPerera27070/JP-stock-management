import React, { useState, useEffect } from "react";
import { useDialog } from "./Dialog";
import { Search, Plus, Filter, FileText, Edit2, Trash2, Eye, Receipt } from "lucide-react";
import Link from "next/link";
import {
  getInvoicesFromFirestore,
  getQuotationsFromFirestore,
  getReceiptsFromFirestore,
  deleteDocumentFromFirestore
} from "@/lib/documentStorage";

interface DocumentItem {
  id: string;
  invoiceNo?: string;
  quotationNo?: string;
  receiptNo?: string;
  clientName?: string;
  receivedFrom?: string;
  issueDate: string;
  lastUpdated?: string;
  preparedBy?: string;
  summary: {
    finalTotal: number;
    subtotal?: number;
  };
}

interface DocumentsProps {
  activeSubTab: "invoices" | "quotations" | "receipts";
  setActiveSubTab: (tab: "invoices" | "quotations" | "receipts") => void;
  onEdit?: (type: "invoice" | "quotation" | "receipt", id: string) => void;
  onView?: (type: "invoice" | "quotation" | "receipt", id: string) => void;
  onCreate?: (type: "invoice" | "quotation" | "receipt") => void;
}

export default function Documents({
  activeSubTab,
  setActiveSubTab,
  onEdit,
  onView,
  onCreate
}: DocumentsProps) {
  const { confirm, toast } = useDialog();
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      let data: any[] = [];
      if (activeSubTab === "invoices") {
        data = await getInvoicesFromFirestore();
      } else if (activeSubTab === "quotations") {
        data = await getQuotationsFromFirestore();
      } else if (activeSubTab === "receipts") {
        data = await getReceiptsFromFirestore();
      }
      setDocuments(data);
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [activeSubTab]);

  const handleDelete = async (id: string, docNo: string) => {
    const docTypeLabel = activeSubTab.slice(0, -1); // "invoice", "quotation", "receipt"
    const ok = await confirm({
      title: `Delete ${docTypeLabel.charAt(0).toUpperCase() + docTypeLabel.slice(1)}`,
      message: `Are you sure you want to permanently delete ${docTypeLabel} ${docNo}? This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (ok) {
      try {
        await deleteDocumentFromFirestore(activeSubTab.slice(0, -1) as any, id);
        toast({ message: `${docTypeLabel.toUpperCase()} deleted successfully.`, type: "success" });
        loadDocuments();
      } catch (error) {
        console.error("Error deleting document:", error);
        toast({ message: "Failed to delete document. Please try again.", type: "error" });
      }
    }
  };

  const getDocNumber = (doc: DocumentItem) => {
    return doc.invoiceNo || doc.quotationNo || doc.receiptNo || "N/A";
  };

  const getClientName = (doc: DocumentItem) => {
    return doc.clientName || doc.receivedFrom || "Walk-in Customer";
  };

  const formatLKR = (amount: number) => {
    return `LKR ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const filteredDocs = documents.filter((doc) => {
    const docNo = getDocNumber(doc).toLowerCase();
    const client = getClientName(doc).toLowerCase();
    const query = searchQuery.toLowerCase();
    return docNo.includes(query) || client.includes(query);
  });

  const handleCreateClick = (type: "invoice" | "quotation" | "receipt") => {
    if (onCreate) {
      onCreate(type);
    }
  };

  const handleEditClick = (type: "invoice" | "quotation" | "receipt", id: string) => {
    if (onEdit) {
      onEdit(type, id);
    }
  };

  const handleViewClick = (type: "invoice" | "quotation" | "receipt", id: string) => {
    if (onView) {
      onView(type, id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Sub-Tab Navigation Bar & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {(["invoices", "quotations", "receipts"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveSubTab(tab);
                setSearchQuery("");
              }}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${activeSubTab === tab
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-900"
                }`}
            >
              <span className="capitalize">{tab}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder={`Search ${activeSubTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 w-full sm:w-64 placeholder:text-gray-600 transition-all text-gray-800 font-medium"
            />
          </div>

          {activeSubTab === "invoices" && (
            onCreate ? (
              <button
                onClick={() => handleCreateClick("invoice")}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#E8973A] hover:bg-[#d4832b] text-gray-900 text-sm font-semibold transition-all shadow-lg shadow-[#E8973A]/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create Invoice
              </button>
            ) : (
              <Link
                href="/invoice"
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#E8973A] hover:bg-[#d4832b] text-gray-900 text-sm font-semibold transition-all shadow-lg shadow-[#E8973A]/20"
              >
                <Plus className="w-4 h-4" /> Create Invoice
              </Link>
            )
          )}

          {activeSubTab === "quotations" && (
            onCreate ? (
              <button
                onClick={() => handleCreateClick("quotation")}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#E8973A] hover:bg-[#d4832b] text-gray-900 text-sm font-semibold transition-all shadow-lg shadow-[#E8973A]/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create Quotation
              </button>
            ) : (
              <Link
                href="/quotation"
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#E8973A] hover:bg-[#d4832b] text-gray-900 text-sm font-semibold transition-all shadow-lg shadow-[#E8973A]/20"
              >
                <Plus className="w-4 h-4" /> Create Quotation
              </Link>
            )
          )}

          {activeSubTab === "receipts" && (
            onCreate ? (
              <button
                onClick={() => handleCreateClick("receipt")}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#E8973A] hover:bg-[#d4832b] text-gray-900 text-sm font-semibold transition-all shadow-lg shadow-[#E8973A]/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create Receipt
              </button>
            ) : (
              <Link
                href="/receipt"
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#E8973A] hover:bg-[#d4832b] text-gray-900 text-sm font-semibold transition-all shadow-lg shadow-[#E8973A]/20"
              >
                <Plus className="w-4 h-4" /> Create Receipt
              </Link>
            )
          )}
        </div>
      </div>

      {/* Main List Table */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-2xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-[#E8973A] animate-spin" />
            <p className="text-gray-500 text-sm font-medium">Loading documents...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 border border-gray-100 text-gray-400">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No {activeSubTab} found</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-sm">
              Create a new document or change your search query to view saved records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/40 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-medium tracking-wider">Number</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Client / Received From</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Date</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Prepared By</th>
                  <th className="px-6 py-4 font-medium tracking-wider text-right">Total Amount</th>
                  <th className="px-6 py-4 font-medium tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-800">
                {filteredDocs.map((doc) => {
                  const docNo = getDocNumber(doc);
                  const client = getClientName(doc);
                  const type = activeSubTab.slice(0, -1) as "invoice" | "quotation" | "receipt";
                  const editPath = `/${type}?id=${doc.id}`;
                  const viewPath = `/${type}?id=${doc.id}&mode=view`;

                  return (
                    <tr key={doc.id} className="hover:bg-gray-50/30 transition-colors group">
                      <td className="px-6 py-4 font-bold text-[#E8973A]">{docNo}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{client}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(doc.issueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{doc.preparedBy || "System User"}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        {formatLKR(doc.summary?.finalTotal || 0)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          {onView ? (
                            <button
                              onClick={() => handleViewClick(type, doc.id)}
                              title="View Document"
                              className="p-1.5 text-gray-500 hover:text-[#E8973A] hover:bg-[#E8973A]/10 rounded-md transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          ) : (
                            <Link
                              href={viewPath}
                              title="View Document"
                              className="p-1.5 text-gray-500 hover:text-[#E8973A] hover:bg-[#E8973A]/10 rounded-md transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          )}

                          {onEdit ? (
                            <button
                              onClick={() => handleEditClick(type, doc.id)}
                              title="Edit Document"
                              className="p-1.5 text-gray-500 hover:text-[#E8973A] hover:bg-[#E8973A]/10 rounded-md transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <Link
                              href={editPath}
                              title="Edit Document"
                              className="p-1.5 text-gray-500 hover:text-[#E8973A] hover:bg-[#E8973A]/10 rounded-md transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Link>
                          )}

                          <button
                            onClick={() => handleDelete(doc.id, docNo)}
                            title="Delete"
                            className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
