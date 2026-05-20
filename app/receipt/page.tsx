"use client";

import { useState, useEffect, Suspense } from "react";
import React from "react";
import { exportToPDF, exportToPrinter } from "@/lib/pdf";
import { saveReceiptToFirestore, getDocumentFromFirestore, updateReceiptInFirestore, getNextDocumentNumber } from "@/lib/documentStorage";
import Link from "next/link";
import { ArrowLeft, Loader2, Receipt, CheckCircle, Calendar, CreditCard, User, FileText, Type, Hash, X } from "lucide-react";
import { useSettingsStore } from "@/lib/settingsStore";
import { useSearchParams } from "next/navigation";
import { numberToWords } from "@/lib/utils";


interface DocumentEditorProps {
  editId?: string;
  isViewOnly?: boolean;
  onBack?: () => void;
}

export default function ReceiptPage({ editId, isViewOnly, onBack }: DocumentEditorProps) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#E8973A]" /></div>}>
      <ReceiptEditor propEditId={editId} propIsViewOnly={isViewOnly} onBack={onBack} />
    </Suspense>
  );
}

function ReceiptEditor({ propEditId, propIsViewOnly, onBack }: { propEditId?: string; propIsViewOnly?: boolean; onBack?: () => void }) {
  const searchParams = useSearchParams();
  const editId = propEditId || searchParams.get("id");

  const settings = useSettingsStore();
  const company = settings.company;

  const [receiptNo, setReceiptNo] = useState("");
  const [receivedFrom, setReceivedFrom] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [amountInWords, setAmountInWords] = useState("");
  const [paymentFor, setPaymentFor] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Cheque" | "Bank Transfer" | "Card">("Cash");
  const [referenceNo, setReferenceNo] = useState("");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [preparedBy, setPreparedBy] = useState("");
  const [invoiceQuotationNo, setInvoiceQuotationNo] = useState("");
  const isViewMode = propIsViewOnly !== undefined ? propIsViewOnly : (searchParams.get("mode") === "view");
  const [showPreview, setShowPreview] = useState(isViewMode);
  const [documentId, setDocumentId] = useState<string | null>(editId);
  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {
    if (editId) {
      loadExistingDocument(editId);
    } else {
      const fetchNextNum = async () => {
        const nextVal = await getNextDocumentNumber("receipt");
        setReceiptNo(nextVal);
      };
      fetchNextNum();
    }
  }, [editId]);

  const loadExistingDocument = async (id: string) => {
    setIsLoading(true);
    try {
      const doc: any = await getDocumentFromFirestore("receipt", id);
      if (doc) {
        setReceiptNo(doc.receiptNo || "");
        setReceivedFrom(doc.receivedFrom || doc.clientName || "");
        setAmount(doc.summary?.finalTotal || 0);
        setAmountInWords(doc.summary?.amountInWords || (doc.summary?.finalTotal ? numberToWords(doc.summary.finalTotal) : ""));
        setPaymentFor(doc.paymentFor || "");
        setPaymentMethod(doc.paymentMethod || "Cash");
        setReferenceNo(doc.referenceNo || "");
        setInvoiceQuotationNo(doc.invoiceQuotationNo || "");
        setIssueDate(doc.issueDate || new Date().toISOString().split("T")[0]);
        setPreparedBy(doc.preparedBy || "");
        setDocumentId(id);
      }
    } catch (error) {
      console.error("Error loading receipt:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCurrentReceipt = async () => {
    const docData = {
      receiptNo,
      clientName: receivedFrom,
      receivedFrom,
      paymentFor,
      paymentMethod,
      referenceNo,
      invoiceQuotationNo,
      issueDate,
      preparedBy,
      summary: {
        finalTotal: amount,
        amountInWords
      }
    };

    try {
      if (documentId) {
        await updateReceiptInFirestore(documentId, docData);
      } else {
        const newId = await saveReceiptToFirestore(docData);
        setDocumentId(newId);
      }
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleExportPDF = async () => {
    if (!isViewMode) {
      await saveCurrentReceipt();
    }
    await exportToPDF("receipt-preview", `${receiptNo}.pdf`);
    if (!isViewMode && onBack) {
      onBack();
    }
  };

  const handleDirectPrint = async () => {
    if (!isViewMode) {
      await saveCurrentReceipt();
    }
    await exportToPrinter("receipt-preview");
    if (!isViewMode && onBack) {
      onBack();
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#E8973A]" />
          <p className="text-gray-500 text-sm font-medium">Loading Receipt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <main className={`flex-1 pb-20 ${isViewMode ? "pointer-events-none select-none opacity-75" : ""}`}>

        {/* Editor Area */}
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 md:px-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">


            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Row */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <FileText className="w-4 h-4 text-gray-400" />
                    Receipt Number
                  </label>
                  <input
                    type="text"
                    value={receiptNo}
                    onChange={(e) => setReceiptNo(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#E8973A] focus:border-transparent outline-none text-base font-medium transition-all text-gray-500"
                    placeholder="e.g. #R24-001"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#E8973A] focus:border-transparent outline-none text-base font-medium transition-all text-gray-500"
                  />
                </div>
              </div>
              {/* Invoice / Quotation Reference */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <Hash className="w-4 h-4 text-gray-400" />
                  Invoice / Quotation Reference Number
                </label>
                <input
                  type="text"
                  value={invoiceQuotationNo}
                  onChange={(e) => setInvoiceQuotationNo(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#E8973A] focus:border-transparent outline-none text-base font-medium transition-all text-gray-500"
                  placeholder="# 26 - 004 or #Q26 - 004"
                />
              </div>

              {/* Received From */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <User className="w-4 h-4 text-gray-400" />
                  Received From
                </label>
                <input
                  type="text"
                  value={receivedFrom}
                  onChange={(e) => setReceivedFrom(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#E8973A] focus:border-transparent outline-none text-base font-medium transition-all placeholder-gray-400 text-gray-500"
                  placeholder="Name of the client or company"
                />
              </div>

              {/* Amount Field - Massive */}
              <div className="space-y-2 bg-[#E8973A]/5 p-5 rounded-xl border border-[#E8973A]/20">
                <label className="flex items-center gap-2 text-xs font-bold text-[#E8973A] uppercase tracking-wider">
                  {/* <DollarSign className="w-4 h-4" /> */}
                  Amount Received (LKR)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 font-bold text-xl">Rs.</span>
                  </div>
                  <input
                    type="number"
                    value={amount === 0 ? "" : amount}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setAmount(val);
                      if (val > 0) {
                        setAmountInWords(numberToWords(val));
                      } else {
                        setAmountInWords("");
                      }
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full pl-14 pr-4 py-4 bg-white border-2 border-[#E8973A]/20 rounded-xl focus:border-[#E8973A] focus:ring-4 focus:ring-[#E8973A]/10 outline-none text-2xl font-extrabold text-gray-900 transition-all placeholder-gray-600"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Amount In Words Explicit - Fulfilling "fill automatically the total amount from the text too" */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <Type className="w-4 h-4 text-gray-400" />
                  Amount In Words (Autofilled from Amount)
                </label>
                <textarea
                  value={amountInWords}
                  onChange={(e) => setAmountInWords(e.target.value)}
                  rows={1}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E8973A] outline-none text-sm font-medium text-gray-700 italic transition-all resize-none placeholder-gray-400 text-gray-500"
                  placeholder="Will populate automatically..."
                />
              </div>

              {/* Payment Details */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4 text-gray-400" />
                  Payment Being For
                </label>
                <textarea
                  value={paymentFor}
                  onChange={(e) => setPaymentFor(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#E8973A] focus:border-transparent outline-none text-sm md:text-base transition-all resize-none placeholder-gray-400 text-gray-500"
                  placeholder="e.g. Advance payment for wall panels / Final settlement for invoice"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["Cash", "Cheque", "Bank Transfer", "Card"] as const).map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${paymentMethod === method
                          ? 'bg-[#E8973A] border-[#E8973A] text-white shadow-md shadow-[#E8973A]/20 scale-[1.02]'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                          }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Ref / Chq Number
                  </label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#E8973A] focus:border-transparent outline-none text-base transition-all h-[94px] placeholder-gray-400 text-gray-500"
                    placeholder="Reference Number (if any)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Prepared By
                </label>
                <input
                  type="text"
                  value={preparedBy}
                  onChange={(e) => setPreparedBy(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#E8973A] focus:border-transparent outline-none text-base transition-all placeholder-gray-400 text-gray-500"
                  placeholder="Your Name"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  disabled={!receivedFrom || amount <= 0}
                  onClick={() => setShowPreview(true)}
                  className="w-full md:w-auto px-10 py-4 bg-[#E8973A] hover:bg-[#d4832b] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition shadow-lg shadow-[#E8973A]/20 active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  Preview & Generate Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-y-0 right-0 left-0 md:left-64 z-[100] bg-gray-900/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-white border-b border-gray-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
              <div>
                <span className="text-xs font-extrabold text-[#E8973A] uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-md">Receipt Preview</span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">{receiptNo || "Receipt"}.pdf</h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={handleExportPDF}
                  className="flex-1 sm:flex-initial px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-xl transition-all duration-150 font-bold text-sm uppercase tracking-wider shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PDF
                </button>
                <button
                  onClick={handleDirectPrint}
                  className="flex-1 sm:flex-initial px-6 py-3 bg-[#E8973A] hover:bg-[#d4832b] text-white rounded-xl transition-all duration-150 font-bold text-sm uppercase tracking-wider shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Now
                </button>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    if (isViewMode && onBack) onBack();
                  }}
                  className="flex-1 sm:flex-initial px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-150 font-bold text-sm active:scale-[0.98]"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-gray-200/50 p-4 md:p-8 flex justify-center items-start">
              <div id="receipt-preview" className="shadow-2xl bg-white">
                <ReceiptPreview
                  receiptNo={receiptNo}
                  receivedFrom={receivedFrom}
                  amount={amount}
                  amountInWords={amountInWords}
                  paymentFor={paymentFor}
                  paymentMethod={paymentMethod}
                  referenceNo={referenceNo}
                  invoiceQuotationNo={invoiceQuotationNo}
                  issueDate={issueDate}
                  preparedBy={preparedBy}
                  company={company}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ReceiptPreviewProps {
  receiptNo: string;
  receivedFrom: string;
  amount: number;
  amountInWords?: string;
  paymentFor: string;
  paymentMethod: string;
  referenceNo: string;
  invoiceQuotationNo?: string;
  issueDate: string;
  preparedBy: string;
  company: any;
}

function ReceiptPreview({
  receiptNo,
  receivedFrom,
  amount,
  amountInWords,
  paymentFor,
  paymentMethod,
  referenceNo,
  invoiceQuotationNo,
  issueDate,
  preparedBy,
  company
}: ReceiptPreviewProps) {
  const settings = useSettingsStore();
  const bankDetails = settings.bankDetails || [];

  return (
    <div className="w-[210mm] min-h-[297mm] p-10 text-sm text-black font-medium bg-white relative flex flex-col mx-auto font-sans box-border">
      <div className="flex-1 flex flex-col">

        {/* Header Section duplicated from Invoice */}
        <div className="flex justify-between items-start w-full mb-4">
          <div className="w-[140px]">
            <img
              src="/Japan-Gedara-Logo-removebg-preview.png"
              alt="Logo"
              className="w-32 h-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div className="flex flex-col items-end text-right flex-1">
            <span className="text-base font-bold text-black mb-1">
              {company.name.toUpperCase()}
            </span>
            <span className="text-[10px] text-black max-w-[200px] leading-tight mb-1">
              {company.address}
            </span>
            <span className="text-base font-extrabold text-black uppercase tracking-wider mt-4">
              OFFICIAL RECEIPT
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-[2px] bg-black mb-6 w-full rounded-full" />

        {/* Information Bar */}
        <div className="flex mb-8 w-full">
          <div className="flex-1">
            <div className="flex mb-1 items-center">
              <span className="font-bold w-[90px] text-[10px] text-black">DATE:</span>
              <span className="text-[10px] text-black">{new Date(issueDate).toLocaleDateString()}</span>
            </div>
            <div className="flex mb-1 items-center">
              <span className="font-bold w-[90px] text-[10px] text-black">RECEIPT NO:</span>
              <span className="text-[10px] text-black">{receiptNo || "####"}</span>
            </div>
            {invoiceQuotationNo && (
              <div className="flex mb-1 items-center">
                <span className="font-bold w-[90px] text-[10px] text-black uppercase">INV / QUO NO:</span>
                <span className="text-[10px] text-black uppercase">{invoiceQuotationNo}</span>
              </div>
            )}
          </div>


          <div className="flex-1">
            <div className="flex mb-1 items-center">
              <span className="font-bold w-[120px] text-[10px] text-black">RECEIVED FROM:</span>
              <span className="text-[10px] text-black flex-1 uppercase">{receivedFrom || "N/A"}</span>
            </div>
            <div className="flex mb-1 items-center">
              <span className="font-bold w-[120px] text-[10px] text-black">PAYMENT METHOD:</span>
              <span className="text-[10px] text-black flex-1 uppercase">{paymentMethod} {referenceNo ? `(${referenceNo})` : ''}</span>
            </div>
          </div>
        </div>

        {/* Standardized Table Layout for Uniformity */}
        <div className="mb-5">
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1.5px solid #000000",
            fontFamily: "Poppins, sans-serif",
            fontSize: "11px",
            color: "#000000",
          }}>
            <thead>
              <tr style={{ borderBottom: "1.5px solid #000000", backgroundColor: "#FFFFFF" }}>
                <th style={{ border: "1px solid #000000", padding: "8px 8px", textAlign: "left", fontWeight: "bold", width: "70%" }}>DESCRIPTION OF PAYMENT</th>
                <th style={{ border: "1px solid #000000", padding: "8px 8px", textAlign: "right", fontWeight: "bold", width: "30%" }}>AMOUNT (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{
                  border: "1px solid #000000",
                  padding: "12px 8px",
                  textAlign: "left",
                  lineHeight: "1.5",
                  height: "80px",
                  verticalAlign: "top"
                }}>
                  {paymentFor || "General Payment"}
                </td>
                <td style={{
                  border: "1px solid #000000",
                  padding: "12px 8px",
                  textAlign: "right",
                  fontWeight: "normal",
                  fontSize: "14px",
                  verticalAlign: "top"
                }}>
                  {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Total Highlight Row */}
              <tr style={{ backgroundColor: "#f3f4f6", color: "#000000" }}>
                <td style={{
                  border: "1px solid #000000",
                  padding: "8px 8px",
                  textAlign: "right",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  fontSize: "10px"
                }}>
                  Total Received Amount
                </td>
                <td style={{
                  border: "1px solid #000000",
                  padding: "8px 8px",
                  textAlign: "right",
                  fontWeight: "bold",
                  fontSize: "16px"
                }}>
                  {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Amount in Words Box */}
        <div className="mb-8 border border-black p-3 bg-gray-50/50 rounded-sm">
          <span className="block text-[9px] font-bold text-black uppercase mb-1">Amount in Words:</span>
          <span className="block text-xs font-bold text-black italic uppercase tracking-wide">
            {amountInWords || (amount > 0 ? numberToWords(amount) : "Zero Only")}
          </span>
        </div>

      </div>

      {/* Footer Section Matching Invoice Layout */}
      <div className="flex justify-between items-end mt-auto mb-24 w-full">
        {/* Disclaimer and Ruwanthi Authorization */}
        <div className="flex-1 flex flex-col items-start mr-5">
          <p className="text-[9px] text-black italic leading-relaxed mb-12">
            * This is a computer generated receipt. Valid only upon clearance of relevant funds.
            Thank you for doing business with us.
          </p>
          <div className="w-48 border-b border-black mb-2"></div>
          <div className="w-48 text-center">
            <span className="font-bold text-[10px] text-black block">Authorized Signature</span>
            <span className="text-[9px] text-black block">{preparedBy || "Company Representative"}</span>
          </div>
        </div>

        {/* Prepared By block shifted right */}
        {/* <div className="flex-1 flex flex-col items-end">
          <div className="w-48 border-b border-black mb-2"></div>
          <div className="w-48 text-center">
            <span className="font-bold text-[10px] text-black block">Authorized Signature</span>
            <span className="text-[9px] text-black block">{preparedBy || "Company Representative"}</span>
          </div>
        </div> */}
      </div>

      {/* Static Standardized Footer */}
      <div className="absolute bottom-8 left-10 right-10 border-t border-black pt-2 text-center flex flex-col items-center">
        <span className="text-[9px] text-black mb-1">
          {company.phones.join(" | ")}
        </span>
        <span className="text-[9px] text-black mb-1">
          {company.email} | {company.website}
        </span>
        <span className="text-[9px] text-black">
          Prepared by: {preparedBy || "JP User"} | {company.name}
        </span>
      </div>
    </div>
  );
}
