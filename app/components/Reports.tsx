"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  ShoppingCart,
  Users,
  FileText,
  Wallet,
  Loader2,
  Receipt,
  ChevronDown,
  Building2,
  DollarSign,
  Award,
  UserPlus,
} from "lucide-react";
import jsPDF from "jspdf";
import { OrderData, Customer } from "../types";
import { useSettingsStore } from "@/lib/settingsStore";
import {
  getOrdersFromFirestore,
  getCustomersFromFirestore,
  getPettyCashEntriesFromFirestore,
} from "@/lib/firestoreService";
import {
  getInvoicesFromFirestore,
  getQuotationsFromFirestore,
  getReceiptsFromFirestore,
} from "@/lib/documentStorage";
import { useAuthStore } from "@/lib/store";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportPeriod = "daily" | "weekly" | "monthly" | "yearly";
type PreviewTab =
  | "orders"
  | "invoices"
  | "quotations"
  | "valuableClients"
  | "newCustomers"
  | "pettyCash";

interface ReportData {
  orders: OrderData[];
  invoices: any[];
  quotations: any[];
  receipts: any[];
  customers: Customer[];
  pettyCash: any[];
}

interface ValuableClient {
  name: string;
  contact: string;
  company: string;
  invoicesCount: number;
  invoicedTotal: number;
  quotationsCount: number;
  quotedTotal: number;
  ordersCount: number;
  ordersTotal: number;
  grandTotal: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDateRange(
  period: ReportPeriod,
  customDate?: string,
): { start: Date; end: Date; label: string } {
  const now = customDate ? new Date(customDate + "T23:59:59") : new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  );
  const todayEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );

  switch (period) {
    case "daily":
      return {
        start: todayStart,
        end: todayEnd,
        label: todayStart.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      };
    case "weekly": {
      const dayOfWeek = todayStart.getDay();
      const weekStart = new Date(todayStart);
      weekStart.setDate(todayStart.getDate() - dayOfWeek);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      return {
        start: weekStart,
        end: weekEnd,
        label: `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
      };
    }
    case "monthly": {
      const monthStart = new Date(
        todayStart.getFullYear(),
        todayStart.getMonth(),
        1,
        0,
        0,
        0,
        0,
      );
      const monthEnd = new Date(
        todayStart.getFullYear(),
        todayStart.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
      return {
        start: monthStart,
        end: monthEnd,
        label: todayStart.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
      };
    }
    case "yearly": {
      const yearStart = new Date(todayStart.getFullYear(), 0, 1, 0, 0, 0, 0);
      const yearEnd = new Date(
        todayStart.getFullYear(),
        11,
        31,
        23,
        59,
        59,
        999,
      );
      return {
        start: yearStart,
        end: yearEnd,
        label: `Year ${todayStart.getFullYear()}`,
      };
    }
  }
}

function parseDate(raw: any): Date | null {
  if (!raw) return null;
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
  if (typeof raw === "object" && typeof raw.toDate === "function") {
    const d = raw.toDate();
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function getRecordDate(record: any): Date | null {
  return (
    parseDate(record?.createdAt) ||
    parseDate(record?.timestamp) ||
    parseDate(record?.issueDate) ||
    parseDate(record?.lastUpdated) ||
    parseDate(record?.date) ||
    parseDate(record?.dateKey ? record.dateKey + "T00:00:00" : null)
  );
}

function isInRange(record: any, start: Date, end: Date): boolean {
  const d = getRecordDate(record);
  if (!d) return false;
  return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
}

function formatLKR(amount: number): string {
  return `LKR ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getDocTotal(doc: any): number {
  if (doc?.summary?.finalTotal !== undefined && doc.summary.finalTotal !== null) {
    return Number(doc.summary.finalTotal) || 0;
  }
  if (doc?.amount !== undefined && doc.amount !== null) {
    return Number(doc.amount) || 0;
  }
  if (doc?.total !== undefined && doc.total !== null) {
    return Number(doc.total) || 0;
  }
  return 0;
}

function getDocClientName(doc: any): string {
  return (
    doc?.clientName ||
    doc?.customer ||
    doc?.client ||
    doc?.receivedFrom ||
    "—"
  );
}

function getDocNumber(
  doc: any,
  type: "invoice" | "quotation" | "receipt",
): string {
  if (type === "invoice") return doc?.invoiceNo || doc?.id || "—";
  if (type === "quotation") return doc?.quotationNo || doc?.id || "—";
  if (type === "receipt")
    return doc?.receiptNo || doc?.invoiceQuotationNo || doc?.id || "—";
  return "—";
}

// ─── Compute Valuable Clients ────────────────────────────────────────────────

function computeValuableClients(
  invoices: any[],
  quotations: any[],
  orders: OrderData[],
  allCustomers: Customer[],
): ValuableClient[] {
  const map = new Map<string, ValuableClient>();

  const getOrCreate = (name: string, fallbackContact = ""): ValuableClient => {
    const key = name.trim().toLowerCase();
    if (!map.has(key)) {
      const match = allCustomers.find(
        (c) => (c.name || "").trim().toLowerCase() === key,
      );
      map.set(key, {
        name: match?.name || name.trim(),
        contact: match?.contactNumber || match?.phone || fallbackContact || "—",
        company: match?.company || match?.address || "—",
        invoicesCount: 0,
        invoicedTotal: 0,
        quotationsCount: 0,
        quotedTotal: 0,
        ordersCount: 0,
        ordersTotal: 0,
        grandTotal: 0,
      });
    }
    return map.get(key)!;
  };

  invoices.forEach((inv) => {
    const name = getDocClientName(inv);
    if (!name || name === "—") return;
    const client = getOrCreate(
      name,
      inv?.clientContactNumber || inv?.contactNumber,
    );
    client.invoicesCount += 1;
    client.invoicedTotal += getDocTotal(inv);
  });

  quotations.forEach((q) => {
    const name = getDocClientName(q);
    if (!name || name === "—") return;
    const client = getOrCreate(
      name,
      q?.clientContactNumber || q?.contactNumber,
    );
    client.quotationsCount += 1;
    client.quotedTotal += getDocTotal(q);
  });

  orders.forEach((o) => {
    const name = o.customer;
    if (!name || name === "—") return;
    const client = getOrCreate(name);
    client.ordersCount += 1;
    client.ordersTotal += Number(o.total) || 0;
  });

  const list = Array.from(map.values()).map((c) => ({
    ...c,
    grandTotal:
      c.invoicedTotal > 0
        ? c.invoicedTotal
        : c.ordersTotal > 0
          ? c.ordersTotal
          : c.quotedTotal,
  }));

  list.sort((a, b) => b.grandTotal - a.grandTotal);
  return list;
}

// ─── Logo Loader ─────────────────────────────────────────────────────────────

async function loadLogoBase64(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/Japan-Gedara-Logo-removebg-preview.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ─── PDF Generator ────────────────────────────────────────────────────────────

async function generateReportPDF(
  data: ReportData,
  period: ReportPeriod,
  dateRange: { start: Date; end: Date; label: string },
  companyName: string,
  companyAddress: string,
  companyPhones: string[],
) {
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const accentColor: [number, number, number] = [232, 151, 58]; // #E8973A
  const darkColor: [number, number, number] = [20, 20, 20];
  const grayColor: [number, number, number] = [100, 100, 100];
  const lightGray: [number, number, number] = [245, 245, 245];
  const white: [number, number, number] = [255, 255, 255];

  // --- Filter data by selected date range ---
  const filteredOrders = data.orders.filter((o) =>
    isInRange(o, dateRange.start, dateRange.end),
  );
  const filteredInvoices = data.invoices.filter((i) =>
    isInRange(i, dateRange.start, dateRange.end),
  );
  const filteredQuotations = data.quotations.filter((q) =>
    isInRange(q, dateRange.start, dateRange.end),
  );
  const filteredReceipts = data.receipts.filter((r) =>
    isInRange(r, dateRange.start, dateRange.end),
  );
  const filteredPettyCash = data.pettyCash.filter((p) =>
    isInRange(p, dateRange.start, dateRange.end),
  );
  const newCustomersAdded = data.customers.filter((c) =>
    isInRange(c, dateRange.start, dateRange.end),
  );

  // --- Computed Metrics ---
  const totalOrderRevenue = filteredOrders.reduce(
    (s, o) => s + (Number(o.total) || 0),
    0,
  );
  const totalInvoiceValue = filteredInvoices.reduce(
    (s, i) => s + getDocTotal(i),
    0,
  );
  const totalQuotationValue = filteredQuotations.reduce(
    (s, q) => s + getDocTotal(q),
    0,
  );
  const totalReceiptsValue = filteredReceipts.reduce(
    (s, r) => s + getDocTotal(r),
    0,
  );
  const totalPettyCash = filteredPettyCash.reduce(
    (s, p) => s + (Number(p.amount) || 0),
    0,
  );
  const netRevenue = totalOrderRevenue - totalPettyCash;

  const valuableClients = computeValuableClients(
    filteredInvoices,
    filteredQuotations,
    filteredOrders,
    data.customers,
  );

  // ─── Helper Functions ─────────────────────────────────────────────────────

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  const drawHorizontalLine = (
    yPos: number,
    color: [number, number, number] = [220, 220, 220],
  ) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
  };

  // ─── PAGE 1: HEADER (INVOICE & QUOTATION STYLE) ───────────────────────────

  // Top Section: Logo on Left, Company Details & Document Title on Right
  const logoBase64 = await loadLogoBase64();
  if (logoBase64) {
    try {
      // 240x190 aspect ratio (1.263:1) -> 28mm x 22.16mm
      doc.addImage(logoBase64, "PNG", margin, y, 28, 22.16);
    } catch (e) {
      console.warn("Logo rendering in PDF fallback", e);
    }
  } else {
    doc.setFillColor(...accentColor);
    doc.roundedRect(margin, y, 28, 22, 2, 2, "F");
    doc.setTextColor(...white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("JP", margin + 11, y + 13);
  }

  // Right-aligned Company Details (matching Invoice / Quotation header)
  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(companyName.toUpperCase(), pageWidth - margin, y + 3, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...grayColor);

  const addressLines = doc.splitTextToSize(companyAddress, 75);
  doc.text(addressLines, pageWidth - margin, y + 7.5, { align: "right" });

  // Large document title on the right, matching "INVOICE" / "QUOTATION" style
  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  const titleY = y + 7.5 + addressLines.length * 3.5 + 4;
  doc.text(
    `${period.toUpperCase()} PERFORMANCE REPORT`,
    pageWidth - margin,
    titleY,
    { align: "right" },
  );

  y = Math.max(y + 24, titleY + 5);

  // Divider line matching invoice style (h-0.5 bg-black)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5.5;

  // Two-Column Meta Info Grid (Clean, balanced layout)
  const colHalf = contentWidth / 2;
  const leftX = margin;
  const rightX = margin + colHalf;

  const leftMeta = [
    { label: "DATE RANGE:", value: dateRange.label },
    { label: "REPORT PERIOD:", value: `${period.toUpperCase()} REPORT` },
  ];

  const rightMeta = [
    {
      label: "GENERATED ON:",
      value: `${new Date().toLocaleDateString("en-GB")}  ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`,
    },
    { label: "ISSUED BY:", value: companyName },
  ];

  const rowHeight = 5;
  for (let i = 0; i < 2; i++) {
    const curY = y + i * rowHeight;

    // Left column
    doc.setTextColor(...darkColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(leftMeta[i].label, leftX, curY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    doc.text(leftMeta[i].value, leftX + 27, curY);

    // Right column
    doc.setTextColor(...darkColor);
    doc.setFont("helvetica", "bold");
    doc.text(rightMeta[i].label, rightX, curY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    doc.text(rightMeta[i].value, rightX + 27, curY);
  }

  y += 2 * rowHeight + 3.5;

  drawHorizontalLine(y, [210, 210, 210]);
  y += 6.5;

  // ─── EXECUTIVE SUMMARY MATRIX ─────────────────────────────────────────────

  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Executive Summary", margin, y);
  y += 8;

  // 6 cards (2 rows of 3)
  const cardW = (contentWidth - 8) / 3;
  const cardH = 28;
  const cardData = [
    {
      label: "Orders Revenue",
      value: formatLKR(totalOrderRevenue),
      sub: `${filteredOrders.length} orders recorded`,
    },
    {
      label: "Invoices Billed",
      value: formatLKR(totalInvoiceValue),
      sub: `${filteredInvoices.length} invoices issued`,
    },
    {
      label: "Quotations Pipeline",
      value: formatLKR(totalQuotationValue),
      sub: `${filteredQuotations.length} quotes prepared`,
    },
    {
      label: "Petty Cash Expenses",
      value: formatLKR(totalPettyCash),
      sub: `${filteredPettyCash.length} expenses logged`,
    },
    {
      label: "Net Revenue (Orders - Exp)",
      value: formatLKR(netRevenue),
      sub: "After operational expenses",
    },
    {
      label: "New Customers Added",
      value: `${newCustomersAdded.length}`,
      sub: `Added in ${period} period`,
    },
  ];

  for (let i = 0; i < cardData.length; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = margin + col * (cardW + 4);
    const cy = y + row * (cardH + 4);

    doc.setFillColor(...lightGray);
    doc.roundedRect(cx, cy, cardW, cardH, 2, 2, "F");

    doc.setTextColor(...grayColor);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(cardData[i].label, cx + 5, cy + 8);

    doc.setTextColor(...darkColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(cardData[i].value, cx + 5, cy + 17);

    doc.setTextColor(...grayColor);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text(cardData[i].sub, cx + 5, cy + 23);
  }

  y += 2 * (cardH + 4) + 8;

  // ─── ORDER STATUS BREAKDOWN ────────────────────────────────────────────────

  drawHorizontalLine(y);
  y += 8;

  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Order Status Breakdown", margin, y);
  y += 8;

  const statusCounts = [
    {
      status: "Pending",
      count: filteredOrders.filter((o) => o.status === "Pending").length,
    },
    {
      status: "Processing",
      count: filteredOrders.filter((o) => o.status === "Processing").length,
    },
    {
      status: "Delivered",
      count: filteredOrders.filter((o) => o.status === "Delivered").length,
    },
  ];

  const barWidth = contentWidth;
  const barHeight = 10;
  const totalOrd = filteredOrders.length || 1;
  const statusColors: [number, number, number][] = [
    [255, 190, 100],
    [100, 180, 255],
    [100, 200, 130],
  ];

  let barX = margin;
  for (let i = 0; i < statusCounts.length; i++) {
    const w = (statusCounts[i].count / totalOrd) * barWidth;
    if (w > 0) {
      doc.setFillColor(...statusColors[i]);
      if (i === 0) {
        doc.roundedRect(barX, y, w, barHeight, 2, 2, "F");
      } else if (i === statusCounts.length - 1) {
        doc.roundedRect(barX, y, w, barHeight, 2, 2, "F");
      } else {
        doc.rect(barX, y, w, barHeight, "F");
      }
      barX += w;
    }
  }

  y += barHeight + 4;

  for (let i = 0; i < statusCounts.length; i++) {
    const lx = margin + i * 60;
    doc.setFillColor(...statusColors[i]);
    doc.circle(lx + 2, y + 1, 2, "F");
    doc.setTextColor(...darkColor);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      `${statusCounts[i].status}: ${statusCounts[i].count}`,
      lx + 7,
      y + 3,
    );
  }

  y += 12;

  // ─── ORDERS TABLE ──────────────────────────────────────────────────────────

  checkPageBreak(50);
  drawHorizontalLine(y);
  y += 8;

  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Orders in Period (${filteredOrders.length})`, margin, y);
  y += 8;

  if (filteredOrders.length > 0) {
    const colWidths = [12, 45, 30, 30, 30, 33];
    const colHeaders = ["#", "Customer", "Date", "Items", "Status", "Total"];

    doc.setFillColor(...accentColor);
    doc.rect(margin, y, contentWidth, 8, "F");
    doc.setTextColor(...white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);

    let hx = margin + 3;
    colHeaders.forEach((header, i) => {
      doc.text(header, hx, y + 5.5);
      hx += colWidths[i];
    });
    y += 8;

    const maxRows = 20;
    const displayOrders = filteredOrders.slice(0, maxRows);

    displayOrders.forEach((order, idx) => {
      checkPageBreak(8);
      if (idx % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y, contentWidth, 7, "F");
      }

      doc.setTextColor(...darkColor);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);

      let rx = margin + 3;
      doc.text(`${idx + 1}`, rx, y + 5);
      rx += colWidths[0];
      doc.text((order.customer || "—").substring(0, 22), rx, y + 5);
      rx += colWidths[1];
      const orderDate = getRecordDate(order);
      doc.text(
        orderDate ? orderDate.toLocaleDateString("en-GB") : "—",
        rx,
        y + 5,
      );
      rx += colWidths[2];
      doc.text(`${order.items || 0} Sqft`, rx, y + 5);
      rx += colWidths[3];

      const statusColor: [number, number, number] =
        order.status === "Delivered"
          ? [100, 200, 130]
          : order.status === "Processing"
            ? [100, 180, 255]
            : [255, 190, 100];
      doc.setFillColor(...statusColor);
      doc.roundedRect(rx, y + 1, 22, 4.5, 1.5, 1.5, "F");
      doc.setTextColor(...white);
      doc.setFontSize(5.5);
      doc.text(order.status, rx + 2, y + 4.3);
      rx += colWidths[4];

      doc.setTextColor(...darkColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text(formatLKR(order.total), rx, y + 5);

      y += 7;
    });

    if (filteredOrders.length > maxRows) {
      doc.setTextColor(...grayColor);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.text(
        `... and ${filteredOrders.length - maxRows} more orders`,
        margin + 3,
        y + 5,
      );
      y += 7;
    }

    y += 2;
    doc.setFillColor(...lightGray);
    doc.rect(margin, y, contentWidth, 8, "F");
    doc.setTextColor(...darkColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Total Orders Revenue", margin + 3, y + 5.5);
    doc.text(
      formatLKR(totalOrderRevenue),
      pageWidth - margin - 3,
      y + 5.5,
      { align: "right" },
    );
    y += 12;
  } else {
    doc.setTextColor(...grayColor);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("No orders found in this period.", margin, y + 3);
    y += 12;
  }

  // ─── DOCUMENT SUMMARY: INVOICES & QUOTATIONS ─────────────────────────────

  checkPageBreak(50);
  drawHorizontalLine(y);
  y += 8;

  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Document Summary & Detailed Ledger", margin, y);
  y += 9;

  // 3 Document Summary KPI Cards
  const docCardW = (contentWidth - 6) / 3;
  const docCardH = 22;

  const docKpis = [
    {
      title: "Invoices Billed",
      count: `${filteredInvoices.length} Invoices`,
      total: formatLKR(totalInvoiceValue),
      color: [232, 151, 58] as [number, number, number],
    },
    {
      title: "Quotations Issued",
      count: `${filteredQuotations.length} Quotations`,
      total: formatLKR(totalQuotationValue),
      color: [59, 130, 246] as [number, number, number],
    },
    {
      title: "Receipts Collected",
      count: `${filteredReceipts.length} Receipts`,
      total: formatLKR(totalReceiptsValue),
      color: [16, 185, 129] as [number, number, number],
    },
  ];

  docKpis.forEach((kpi, idx) => {
    const cx = margin + idx * (docCardW + 3);
    doc.setFillColor(...lightGray);
    doc.roundedRect(cx, y, docCardW, docCardH, 2, 2, "F");

    doc.setFillColor(...kpi.color);
    doc.rect(cx, y, 3, docCardH, "F");

    doc.setTextColor(...grayColor);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(kpi.title, cx + 6, y + 6);

    doc.setTextColor(...darkColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(kpi.total, cx + 6, y + 14);

    doc.setTextColor(...grayColor);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text(kpi.count, cx + 6, y + 19);
  });

  y += docCardH + 10;

  // --- Detailed Invoices Table ---
  checkPageBreak(40);
  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text(`Invoices Created in Period (${filteredInvoices.length})`, margin, y);
  y += 6;

  if (filteredInvoices.length > 0) {
    const invColWidths = [12, 36, 52, 26, 26, 28];
    const invHeaders = [
      "#",
      "Invoice No",
      "Customer / Client",
      "Date",
      "Prepared By",
      "Amount",
    ];

    doc.setFillColor(232, 151, 58);
    doc.rect(margin, y, contentWidth, 7, "F");
    doc.setTextColor(...white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);

    let hx = margin + 3;
    invHeaders.forEach((h, idx) => {
      doc.text(h, hx, y + 4.8);
      hx += invColWidths[idx];
    });
    y += 7;

    const maxInv = 15;
    filteredInvoices.slice(0, maxInv).forEach((inv, idx) => {
      checkPageBreak(7);
      if (idx % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y, contentWidth, 6.5, "F");
      }

      doc.setTextColor(...darkColor);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);

      let rx = margin + 3;
      doc.text(`${idx + 1}`, rx, y + 4.5);
      rx += invColWidths[0];
      doc.setFont("helvetica", "bold");
      doc.text(getDocNumber(inv, "invoice").substring(0, 18), rx, y + 4.5);
      rx += invColWidths[1];
      doc.setFont("helvetica", "normal");
      doc.text(getDocClientName(inv).substring(0, 28), rx, y + 4.5);
      rx += invColWidths[2];
      const d = getRecordDate(inv);
      doc.text(d ? d.toLocaleDateString("en-GB") : "—", rx, y + 4.5);
      rx += invColWidths[3];
      doc.text(
        (inv?.preparedBy || inv?.prepared_by || "—").substring(0, 14),
        rx,
        y + 4.5,
      );
      rx += invColWidths[4];
      doc.setFont("helvetica", "bold");
      doc.text(formatLKR(getDocTotal(inv)), rx, y + 4.5);

      y += 6.5;
    });

    if (filteredInvoices.length > maxInv) {
      doc.setTextColor(...grayColor);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(6.5);
      doc.text(
        `... and ${filteredInvoices.length - maxInv} more invoices`,
        margin + 3,
        y + 4,
      );
      y += 6;
    }

    y += 2;
    doc.setFillColor(...lightGray);
    doc.rect(margin, y, contentWidth, 7, "F");
    doc.setTextColor(...darkColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("Total Invoices Billed", margin + 3, y + 4.8);
    doc.text(
      formatLKR(totalInvoiceValue),
      pageWidth - margin - 3,
      y + 4.8,
      { align: "right" },
    );
    y += 10;
  } else {
    doc.setTextColor(...grayColor);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text("No invoices created in this period.", margin, y + 2);
    y += 9;
  }

  // --- Detailed Quotations Table ---
  checkPageBreak(40);
  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text(
    `Quotations Created in Period (${filteredQuotations.length})`,
    margin,
    y,
  );
  y += 6;

  if (filteredQuotations.length > 0) {
    const qColWidths = [12, 36, 52, 26, 26, 28];
    const qHeaders = [
      "#",
      "Quotation No",
      "Customer / Client",
      "Date",
      "Prepared By",
      "Quoted Cost",
    ];

    doc.setFillColor(59, 130, 246);
    doc.rect(margin, y, contentWidth, 7, "F");
    doc.setTextColor(...white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);

    let hx = margin + 3;
    qHeaders.forEach((h, idx) => {
      doc.text(h, hx, y + 4.8);
      hx += qColWidths[idx];
    });
    y += 7;

    const maxQ = 15;
    filteredQuotations.slice(0, maxQ).forEach((q, idx) => {
      checkPageBreak(7);
      if (idx % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y, contentWidth, 6.5, "F");
      }

      doc.setTextColor(...darkColor);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);

      let rx = margin + 3;
      doc.text(`${idx + 1}`, rx, y + 4.5);
      rx += qColWidths[0];
      doc.setFont("helvetica", "bold");
      doc.text(getDocNumber(q, "quotation").substring(0, 18), rx, y + 4.5);
      rx += qColWidths[1];
      doc.setFont("helvetica", "normal");
      doc.text(getDocClientName(q).substring(0, 28), rx, y + 4.5);
      rx += qColWidths[2];
      const d = getRecordDate(q);
      doc.text(d ? d.toLocaleDateString("en-GB") : "—", rx, y + 4.5);
      rx += qColWidths[3];
      doc.text(
        (q?.preparedBy || q?.prepared_by || "—").substring(0, 14),
        rx,
        y + 4.5,
      );
      rx += qColWidths[4];
      doc.setFont("helvetica", "bold");
      doc.text(formatLKR(getDocTotal(q)), rx, y + 4.5);

      y += 6.5;
    });

    if (filteredQuotations.length > maxQ) {
      doc.setTextColor(...grayColor);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(6.5);
      doc.text(
        `... and ${filteredQuotations.length - maxQ} more quotations`,
        margin + 3,
        y + 4,
      );
      y += 6;
    }

    y += 2;
    doc.setFillColor(...lightGray);
    doc.rect(margin, y, contentWidth, 7, "F");
    doc.setTextColor(...darkColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("Total Quotations Value", margin + 3, y + 4.8);
    doc.text(
      formatLKR(totalQuotationValue),
      pageWidth - margin - 3,
      y + 4.8,
      { align: "right" },
    );
    y += 10;
  } else {
    doc.setTextColor(...grayColor);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text("No quotations created in this period.", margin, y + 2);
    y += 9;
  }

  // ─── VALUABLE CLIENTS (TOP SPENDERS IN THIS PERIOD) ───────────────────────

  checkPageBreak(45);
  drawHorizontalLine(y);
  y += 8;

  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Most Valuable Clients in Selected Period", margin, y);
  y += 7;

  if (valuableClients.length > 0) {
    const vcColWidths = [10, 50, 36, 26, 26, 32];
    const vcHeaders = [
      "#",
      "Client Name",
      "Contact Number",
      "Invoices",
      "Orders",
      "Total Value",
    ];

    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y, contentWidth, 7, "F");
    doc.setTextColor(...white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);

    let hx = margin + 3;
    vcHeaders.forEach((h, idx) => {
      doc.text(h, hx, y + 4.8);
      hx += vcColWidths[idx];
    });
    y += 7;

    const maxVC = 10;
    valuableClients.slice(0, maxVC).forEach((vc, idx) => {
      checkPageBreak(7);
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, 6.5, "F");
      }

      doc.setTextColor(...darkColor);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);

      let rx = margin + 3;
      doc.text(`${idx + 1}`, rx, y + 4.5);
      rx += vcColWidths[0];
      doc.setFont("helvetica", "bold");
      doc.text(vc.name.substring(0, 26), rx, y + 4.5);
      rx += vcColWidths[1];
      doc.setFont("helvetica", "normal");
      doc.text(vc.contact.substring(0, 18), rx, y + 4.5);
      rx += vcColWidths[2];
      doc.text(
        `${vc.invoicesCount} (${formatLKR(vc.invoicedTotal)})`,
        rx,
        y + 4.5,
      );
      rx += vcColWidths[3];
      doc.text(`${vc.ordersCount}`, rx, y + 4.5);
      rx += vcColWidths[4];
      doc.setFont("helvetica", "bold");
      doc.text(formatLKR(vc.grandTotal), rx, y + 4.5);

      y += 6.5;
    });

    y += 8;
  } else {
    doc.setTextColor(...grayColor);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text("No client transactions recorded in this period.", margin, y + 2);
    y += 8;
  }

  // ─── NEW CUSTOMERS ADDED IN SELECTED PERIOD ───────────────────────────────

  checkPageBreak(40);
  drawHorizontalLine(y);
  y += 8;

  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(
    `New Customers Added in Period (${newCustomersAdded.length})`,
    margin,
    y,
  );
  y += 7;

  if (newCustomersAdded.length > 0) {
    const custColWidths = [10, 48, 36, 46, 20, 20];
    const custHeaders = [
      "#",
      "Customer Name",
      "Contact",
      "Company / Address",
      "Discount",
      "Added Date",
    ];

    doc.setFillColor(16, 185, 129);
    doc.rect(margin, y, contentWidth, 7, "F");
    doc.setTextColor(...white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);

    let hx = margin + 3;
    custHeaders.forEach((h, idx) => {
      doc.text(h, hx, y + 4.8);
      hx += custColWidths[idx];
    });
    y += 7;

    newCustomersAdded.forEach((c, idx) => {
      checkPageBreak(7);
      if (idx % 2 === 0) {
        doc.setFillColor(245, 253, 250);
        doc.rect(margin, y, contentWidth, 6.5, "F");
      }

      doc.setTextColor(...darkColor);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);

      let rx = margin + 3;
      doc.text(`${idx + 1}`, rx, y + 4.5);
      rx += custColWidths[0];
      doc.setFont("helvetica", "bold");
      doc.text((c.name || "—").substring(0, 24), rx, y + 4.5);
      rx += custColWidths[1];
      doc.setFont("helvetica", "normal");
      doc.text(
        (c.contactNumber || c.phone || "—").substring(0, 18),
        rx,
        y + 4.5,
      );
      rx += custColWidths[2];
      doc.text((c.company || c.address || "—").substring(0, 24), rx, y + 4.5);
      rx += custColWidths[3];
      doc.text(`${c.discount || 0}%`, rx, y + 4.5);
      rx += custColWidths[4];
      const addedDate = getRecordDate(c);
      doc.text(
        addedDate ? addedDate.toLocaleDateString("en-GB") : "—",
        rx,
        y + 4.5,
      );

      y += 6.5;
    });

    y += 8;
  } else {
    doc.setTextColor(...grayColor);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text(
      "No new customers registered in this selected time period.",
      margin,
      y + 2,
    );
    y += 8;
  }

  // ─── PETTY CASH EXPENSES ──────────────────────────────────────────────────

  checkPageBreak(40);
  drawHorizontalLine(y);
  y += 8;

  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(
    `Petty Cash Operational Expenses (${filteredPettyCash.length})`,
    margin,
    y,
  );
  y += 7;

  if (filteredPettyCash.length > 0) {
    const pcColWidths = [12, 60, 40, 32, 36];
    const pcHeaders = ["#", "Description", "Category", "Date", "Amount"];

    doc.setFillColor(80, 80, 80);
    doc.rect(margin, y, contentWidth, 7, "F");
    doc.setTextColor(...white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);

    let hx = margin + 3;
    pcHeaders.forEach((h, idx) => {
      doc.text(h, hx, y + 4.8);
      hx += pcColWidths[idx];
    });
    y += 7;

    const maxPCRows = 20;
    filteredPettyCash.slice(0, maxPCRows).forEach((entry, idx) => {
      checkPageBreak(7);
      if (idx % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y, contentWidth, 6.5, "F");
      }

      doc.setTextColor(...darkColor);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);

      let rx = margin + 3;
      doc.text(`${idx + 1}`, rx, y + 4.5);
      rx += pcColWidths[0];
      doc.text((entry.description || "Untitled").substring(0, 30), rx, y + 4.5);
      rx += pcColWidths[1];
      doc.text((entry.category || "General").substring(0, 18), rx, y + 4.5);
      rx += pcColWidths[2];
      doc.text(entry.dateKey || "—", rx, y + 4.5);
      rx += pcColWidths[3];
      doc.setFont("helvetica", "bold");
      doc.text(formatLKR(Number(entry.amount) || 0), rx, y + 4.5);

      y += 6.5;
    });

    if (filteredPettyCash.length > maxPCRows) {
      doc.setTextColor(...grayColor);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(6.5);
      doc.text(
        `... and ${filteredPettyCash.length - maxPCRows} more entries`,
        margin + 3,
        y + 4,
      );
      y += 6;
    }

    y += 2;
    doc.setFillColor(...lightGray);
    doc.rect(margin, y, contentWidth, 7, "F");
    doc.setTextColor(...darkColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("Total Operational Expenses", margin + 3, y + 4.8);
    doc.text(
      formatLKR(totalPettyCash),
      pageWidth - margin - 3,
      y + 4.8,
      { align: "right" },
    );
    y += 10;
  } else {
    doc.setTextColor(...grayColor);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text("No petty cash expenses logged in this period.", margin, y + 2);
    y += 8;
  }

  // ─── NET REVENUE BANNER ────────────────────────────────────────────────────

  checkPageBreak(30);

  doc.setFillColor(...accentColor);
  doc.roundedRect(margin, y, contentWidth, 20, 2.5, 2.5, "F");

  doc.setTextColor(...white);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("NET REVENUE (Orders Revenue - Operational Expenses)", margin + 7, y + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(formatLKR(netRevenue), margin + 7, y + 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(
    `Period: ${dateRange.label}`,
    pageWidth - margin - 7,
    y + 16,
    { align: "right" },
  );

  y += 26;

  // ─── FOOTER ────────────────────────────────────────────────────────────────

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

    doc.setTextColor(...grayColor);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(
      `${companyName} — Confidential Business & Financial Report`,
      margin,
      pageHeight - 9,
    );
    doc.text(
      `Page ${p} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 9,
      { align: "right" },
    );
  }

  // ─── Save PDF ──────────────────────────────────────────────────────────────

  const dateStr = new Date().toISOString().split("T")[0];
  doc.save(
    `${companyName.replace(/\s+/g, "_")}_${period}_Financial_Report_${dateStr}.pdf`,
  );
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function Reports() {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const company = useSettingsStore((s) => s.company);

  const [period, setPeriod] = useState<ReportPeriod>("monthly");
  const [customDate, setCustomDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [previewTab, setPreviewTab] = useState<PreviewTab>("invoices");
  const [expandedTabs, setExpandedTabs] = useState<
    Partial<Record<PreviewTab, boolean>>
  >({});

  const [data, setData] = useState<ReportData>({
    orders: [],
    invoices: [],
    quotations: [],
    receipts: [],
    customers: [],
    pettyCash: [],
  });

  // Load Firestore data
  useEffect(() => {
    if (!hasHydrated || !user) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const [orders, invoices, quotations, receipts, customers, pettyCash] =
          await Promise.all([
            getOrdersFromFirestore(),
            getInvoicesFromFirestore(),
            getQuotationsFromFirestore(),
            getReceiptsFromFirestore(),
            getCustomersFromFirestore(),
            getPettyCashEntriesFromFirestore(),
          ]);
        setData({
          orders: (orders as OrderData[]) || [],
          invoices: invoices || [],
          quotations: quotations || [],
          receipts: receipts || [],
          customers: (customers as Customer[]) || [],
          pettyCash: pettyCash || [],
        });
      } catch (err) {
        console.error("Failed to load report data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [hasHydrated, user]);

  const dateRange = useMemo(
    () => getDateRange(period, customDate),
    [period, customDate],
  );

  // Filtered collections
  const filteredOrders = useMemo(
    () =>
      data.orders
        .filter((o) => isInRange(o, dateRange.start, dateRange.end))
        .sort(
          (a, b) =>
            (getRecordDate(b)?.getTime() ?? 0) -
            (getRecordDate(a)?.getTime() ?? 0),
        ),
    [data.orders, dateRange],
  );
  const filteredInvoices = useMemo(
    () =>
      data.invoices
        .filter((i) => isInRange(i, dateRange.start, dateRange.end))
        .sort(
          (a, b) =>
            (getRecordDate(b)?.getTime() ?? 0) -
            (getRecordDate(a)?.getTime() ?? 0),
        ),
    [data.invoices, dateRange],
  );
  const visibleInvoices = expandedTabs.invoices
    ? filteredInvoices
    : filteredInvoices.slice(0, 10);

  const filteredQuotations = useMemo(
    () =>
      data.quotations
        .filter((q) => isInRange(q, dateRange.start, dateRange.end))
        .sort(
          (a, b) =>
            (getRecordDate(b)?.getTime() ?? 0) -
            (getRecordDate(a)?.getTime() ?? 0),
        ),
    [data.quotations, dateRange],
  );
  const filteredReceipts = useMemo(
    () =>
      data.receipts.filter((r) => isInRange(r, dateRange.start, dateRange.end)),
    [data.receipts, dateRange],
  );
  const filteredPettyCash = useMemo(
    () =>
      data.pettyCash
        .filter((p) => isInRange(p, dateRange.start, dateRange.end))
        .sort(
          (a, b) =>
            (getRecordDate(b)?.getTime() ?? 0) -
            (getRecordDate(a)?.getTime() ?? 0),
        ),
    [data.pettyCash, dateRange],
  );
  const newCustomersAdded = useMemo(
    () =>
      data.customers
        .filter((c) => isInRange(c, dateRange.start, dateRange.end))
        .sort(
          (a, b) =>
            (getRecordDate(b)?.getTime() ?? 0) -
            (getRecordDate(a)?.getTime() ?? 0),
        ),
    [data.customers, dateRange],
  );

  // Financial aggregates
  const totalOrderRevenue = useMemo(
    () => filteredOrders.reduce((s, o) => s + (Number(o.total) || 0), 0),
    [filteredOrders],
  );
  const totalInvoiceValue = useMemo(
    () => filteredInvoices.reduce((s, i) => s + getDocTotal(i), 0),
    [filteredInvoices],
  );
  const totalQuotationValue = useMemo(
    () => filteredQuotations.reduce((s, q) => s + getDocTotal(q), 0),
    [filteredQuotations],
  );
  const totalPettyCash = useMemo(
    () => filteredPettyCash.reduce((s, p) => s + (Number(p.amount) || 0), 0),
    [filteredPettyCash],
  );
  const netRevenue = totalOrderRevenue - totalPettyCash;

  const valuableClients = useMemo(
    () =>
      computeValuableClients(
        filteredInvoices,
        filteredQuotations,
        filteredOrders,
        data.customers,
      ),
    [filteredInvoices, filteredQuotations, filteredOrders, data.customers],
  );

  const visibleQuotations = expandedTabs.quotations
    ? filteredQuotations
    : filteredQuotations.slice(0, 10);
  const visibleOrders = expandedTabs.orders
    ? filteredOrders
    : filteredOrders.slice(0, 10);
  const visibleValuableClients = expandedTabs.valuableClients
    ? valuableClients
    : valuableClients.slice(0, 10);
  const visibleNewCustomers = expandedTabs.newCustomers
    ? newCustomersAdded
    : newCustomersAdded.slice(0, 10);
  const visiblePettyCash = expandedTabs.pettyCash
    ? filteredPettyCash
    : filteredPettyCash.slice(0, 10);

  const renderViewMore = (tab: PreviewTab, total: number) => {
    if (total <= 10) return null;
    const isExpanded = Boolean(expandedTabs[tab]);

    return (
      <div className="flex justify-center border-t border-gray-100 pt-4 mt-2">
        <button
          type="button"
          onClick={() =>
            setExpandedTabs((current) => ({
              ...current,
              [tab]: !current[tab],
            }))
          }
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950"
        >
          {isExpanded ? "Show top 10" : `View ${total - 10} more`}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>
    );
  };

  const handleDownloadPDF = useCallback(async () => {
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 100));
    try {
      await generateReportPDF(
        data,
        period,
        dateRange,
        company.name,
        company.address,
        company.phones || [],
      );
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [data, period, dateRange, company]);

  const periodOptions: { key: ReportPeriod; label: string }[] = [
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
    { key: "yearly", label: "Yearly" },
  ];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-8 h-8 border-4 border-[#E8973A] border-t-transparent rounded-full" />
          <span className="text-sm text-gray-500">Loading business data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#B96C24]">
            <BarChart3 className="h-4 w-4" />
            Performance overview
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-950">Business Reports</h2>
          <p className="text-sm text-gray-500 mt-1">
            Detailed financial metrics, document ledger, valuable clients, and new customer analysis
          </p>
        </div>
        <button
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="flex items-center gap-2.5 px-5 py-2.5 bg-gray-950 text-white rounded-lg font-semibold text-sm hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isGenerating ? "Generating PDF..." : "Download PDF Report"}
        </button>
      </div>

      {/* Period Filter & Date Picker */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/70 p-2">
        <div className="flex w-full items-center gap-1 sm:w-auto">
          {periodOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => {
                setPeriod(opt.key);
                setExpandedTabs({});
              }}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer sm:flex-none ${
                period === opt.key
                  ? "bg-white text-gray-950 shadow-sm ring-1 ring-gray-200"
                  : "text-gray-500 hover:bg-white/70 hover:text-gray-900"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors"
          >
            <Calendar className="w-4 h-4 text-gray-400" />
            {dateRange.label}
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
          {showDatePicker && (
            <div className="absolute top-full mt-2 left-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-3 animate-in slide-in-from-top-1 duration-200">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Select Reference Date
              </label>
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setExpandedTabs({});
                  setShowDatePicker(false);
                }}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50"
              />
            </div>
          )}
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Invoices Billed */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 flex flex-col gap-3 relative overflow-hidden group min-h-32 shadow-sm hover:border-gray-300 transition-colors">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-[#E8973A]" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-gray-500 text-sm font-medium">Invoices Billed</span>
            <div className="p-2 rounded-lg bg-gray-100 text-gray-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-bold tracking-tighter">
              {formatLKR(totalInvoiceValue)}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {filteredInvoices.length} invoices issued in this period
            </p>
          </div>
        </div>

        {/* Quotations Pipeline */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 flex flex-col gap-3 relative overflow-hidden group min-h-32 shadow-sm hover:border-gray-300 transition-colors">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-[#E8973A]" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-gray-500 text-sm font-medium">Quotations Pipeline</span>
            <div className="p-2 rounded-lg bg-gray-100 text-gray-700">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-bold tracking-tighter">
              {formatLKR(totalQuotationValue)}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {filteredQuotations.length} quotes prepared for customers
            </p>
          </div>
        </div>

        {/* Net Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 flex flex-col gap-3 relative overflow-hidden group min-h-32 shadow-sm hover:border-gray-300 transition-colors">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-[#E8973A]" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-gray-500 text-sm font-medium">Net Revenue</span>
            <div className="p-2 rounded-lg bg-gray-100 text-gray-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="relative z-10">
            <h3
              className={`text-2xl font-bold tracking-tighter ${netRevenue >= 0 ? "text-gray-900" : "text-red-600"}`}
            >
              {formatLKR(netRevenue)}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Orders ({formatLKR(totalOrderRevenue)}) - Petty Cash ({formatLKR(totalPettyCash)})
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* New Customers Added */}
        <div className="p-4 rounded-xl bg-white border border-gray-200 flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-xl bg-[#E8973A]/10 text-[#B96C24]">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {newCustomersAdded.length} New Customers
            </p>
            <p className="text-xs text-gray-500">Enrolled during this {period} window</p>
          </div>
        </div>

        {/* Valuable Clients */}
        <div className="p-4 rounded-xl bg-white border border-gray-200 flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-xl bg-[#E8973A]/10 text-[#B96C24]">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {valuableClients.length} Active Clients
            </p>
            <p className="text-xs text-gray-500">Transacted or quoted in this period</p>
          </div>
        </div>

        {/* Petty Cash Expenses */}
        <div className="p-4 rounded-xl bg-white border border-gray-200 flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-xl bg-[#E8973A]/10 text-[#B96C24]">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {formatLKR(totalPettyCash)} Expenses
            </p>
            <p className="text-xs text-gray-500">{filteredPettyCash.length} petty cash records</p>
          </div>
        </div>
      </div>

      {/* Interactive Data Preview Explorer */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 pb-4 overflow-x-auto scrollbar-none">
          {[
            { id: "invoices", label: `Invoices (${filteredInvoices.length})`, icon: FileText },
            { id: "quotations", label: `Quotations (${filteredQuotations.length})`, icon: Receipt },
            { id: "orders", label: `Orders (${filteredOrders.length})`, icon: ShoppingCart },
            { id: "valuableClients", label: `Valuable Clients (${valuableClients.length})`, icon: Award },
            { id: "newCustomers", label: `New Customers (${newCustomersAdded.length})`, icon: UserPlus },
            { id: "pettyCash", label: `Petty Cash (${filteredPettyCash.length})`, icon: Wallet },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPreviewTab(tab.id as PreviewTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                previewTab === tab.id
                  ? "bg-gray-950 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: INVOICES PREVIEW */}
        {previewTab === "invoices" && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">
                Invoices Created — {dateRange.label}
              </h3>
              <span className="text-sm font-bold text-[#E8973A]">
                Total: {formatLKR(totalInvoiceValue)}
              </span>
            </div>
            {filteredInvoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">#</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Invoice No</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Prepared By</th>
                      <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visibleInvoices.map((inv, idx) => {
                      const d = getRecordDate(inv);
                      return (
                        <tr key={inv.id || idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-2 text-gray-500">{idx + 1}</td>
                          <td className="py-3 px-2 font-mono font-semibold text-[#E8973A]">
                            {getDocNumber(inv, "invoice")}
                          </td>
                          <td className="py-3 px-2 font-medium text-gray-900">
                            {getDocClientName(inv)}
                          </td>
                          <td className="py-3 px-2 text-gray-600">
                            {d ? d.toLocaleDateString("en-GB") : "—"}
                          </td>
                          <td className="py-3 px-2 text-gray-600">
                            {inv.preparedBy || inv.prepared_by || "—"}
                          </td>
                          <td className="py-3 px-2 text-right font-bold text-gray-900">
                            {formatLKR(getDocTotal(inv))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50/50">
                      <td colSpan={5} className="py-3 px-2 font-bold text-gray-900">
                        Total Invoiced Amount
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-[#E8973A] text-base">
                        {formatLKR(totalInvoiceValue)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
                {renderViewMore("invoices", filteredInvoices.length)}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                No invoices created in this period
              </div>
            )}
          </div>
        )}

        {/* TAB 2: QUOTATIONS PREVIEW */}
        {previewTab === "quotations" && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">
                Quotations Created — {dateRange.label}
              </h3>
              <span className="text-sm font-bold text-[#B96C24]">
                Total Pipeline: {formatLKR(totalQuotationValue)}
              </span>
            </div>
            {filteredQuotations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">#</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Quotation No</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Prepared By</th>
                      <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Quoted Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visibleQuotations.map((q, idx) => {
                      const d = getRecordDate(q);
                      return (
                        <tr key={q.id || idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-2 text-gray-500">{idx + 1}</td>
                          <td className="py-3 px-2 font-mono font-semibold text-[#B96C24]">
                            {getDocNumber(q, "quotation")}
                          </td>
                          <td className="py-3 px-2 font-medium text-gray-900">
                            {getDocClientName(q)}
                          </td>
                          <td className="py-3 px-2 text-gray-600">
                            {d ? d.toLocaleDateString("en-GB") : "—"}
                          </td>
                          <td className="py-3 px-2 text-gray-600">
                            {q.preparedBy || q.prepared_by || "—"}
                          </td>
                          <td className="py-3 px-2 text-right font-bold text-gray-900">
                            {formatLKR(getDocTotal(q))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50/50">
                      <td colSpan={5} className="py-3 px-2 font-bold text-gray-900">
                        Total Quotations Value
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-[#B96C24] text-base">
                        {formatLKR(totalQuotationValue)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
                {renderViewMore("quotations", filteredQuotations.length)}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Receipt className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                No quotations created in this period
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ORDERS PREVIEW */}
        {previewTab === "orders" && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">
                Orders — {dateRange.label}
              </h3>
              <span className="text-sm font-bold text-[#E8973A]">
                Total: {formatLKR(totalOrderRevenue)}
              </span>
            </div>
            {filteredOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">#</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Items</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visibleOrders.map((order, idx) => {
                      const orderDate = getRecordDate(order);
                      return (
                        <tr key={order.id || idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-2 text-gray-500">{idx + 1}</td>
                          <td className="py-3 px-2 font-medium text-gray-900">
                            {order.customer || "—"}
                          </td>
                          <td className="py-3 px-2 text-gray-600">
                            {orderDate ? orderDate.toLocaleDateString("en-GB") : "—"}
                          </td>
                          <td className="py-3 px-2 text-gray-600">{order.items || 0} Sqft</td>
                          <td className="py-3 px-2">
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                order.status === "Delivered"
                                  ? "bg-gray-900 text-white"
                                  : order.status === "Processing"
                                    ? "bg-[#E8973A]/15 text-[#9A571D]"
                                    : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right font-bold text-gray-900">
                            {formatLKR(order.total)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50/50">
                      <td colSpan={5} className="py-3 px-2 font-bold text-gray-900">
                        Total Orders Revenue
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-[#E8973A] text-base">
                        {formatLKR(totalOrderRevenue)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
                {renderViewMore("orders", filteredOrders.length)}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <ShoppingCart className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                No orders found for this period
              </div>
            )}
          </div>
        )}

        {/* TAB 4: VALUABLE CLIENTS PREVIEW */}
        {previewTab === "valuableClients" && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">
                Most Valuable Clients in Selected Period
              </h3>
              <span className="text-sm font-medium text-gray-500">
                Ranked by Transaction & Billed Value
              </span>
            </div>
            {valuableClients.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">#</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Client Name</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Contact</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Company / Address</th>
                      <th className="text-center py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Invoices</th>
                      <th className="text-center py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Quotes</th>
                      <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Total Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visibleValuableClients.map((vc, idx) => (
                      <tr key={vc.name + idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-2 text-gray-500 font-semibold">{idx + 1}</td>
                        <td className="py-3 px-2 font-bold text-gray-900 flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          {vc.name}
                        </td>
                        <td className="py-3 px-2 text-gray-600">{vc.contact}</td>
                        <td className="py-3 px-2 text-gray-600">{vc.company}</td>
                        <td className="py-3 px-2 text-center font-medium">
                          {vc.invoicesCount > 0 ? (
                            <span className="bg-[#E8973A]/10 text-[#E8973A] px-2 py-0.5 rounded-full text-xs font-bold">
                              {vc.invoicesCount} ({formatLKR(vc.invoicedTotal)})
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center font-medium">
                          {vc.quotationsCount > 0 ? (
                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-bold">
                              {vc.quotationsCount} ({formatLKR(vc.quotedTotal)})
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right font-bold text-gray-900 text-sm">
                          {formatLKR(vc.grandTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {renderViewMore("valuableClients", valuableClients.length)}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Award className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                No client transactions recorded in this period
              </div>
            )}
          </div>
        )}

        {/* TAB 5: NEW CUSTOMERS PREVIEW */}
        {previewTab === "newCustomers" && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">
                Customers Enrolled in Selected Period ({newCustomersAdded.length})
              </h3>
              <span className="text-sm font-medium text-gray-500">
                Only customers added within {dateRange.label}
              </span>
            </div>
            {newCustomersAdded.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">#</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Customer Name</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Contact Number</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Company / Address</th>
                      <th className="text-center py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Discount</th>
                      <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Added Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visibleNewCustomers.map((c, idx) => {
                      const d = getRecordDate(c);
                      return (
                        <tr key={c.id || idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-2 text-gray-500">{idx + 1}</td>
                          <td className="py-3 px-2 font-bold text-gray-900">{c.name}</td>
                          <td className="py-3 px-2 text-gray-600">
                            {c.contactNumber || c.phone || "—"}
                          </td>
                          <td className="py-3 px-2 text-gray-600">{c.company || c.address || "—"}</td>
                          <td className="py-3 px-2 text-center font-bold text-gray-700">
                            {c.discount ?? 0}%
                          </td>
                          <td className="py-3 px-2 text-right text-gray-600">
                            {d ? d.toLocaleDateString("en-GB") : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {renderViewMore("newCustomers", newCustomersAdded.length)}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <UserPlus className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                No new customers registered in this selected time period
              </div>
            )}
          </div>
        )}

        {/* TAB 6: PETTY CASH PREVIEW */}
        {previewTab === "pettyCash" && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">
                Petty Cash Expenses — {dateRange.label}
              </h3>
              <span className="text-sm font-bold text-[#B96C24]">
                Total Expenses: {formatLKR(totalPettyCash)}
              </span>
            </div>
            {filteredPettyCash.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">#</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Description</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Category</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visiblePettyCash.map((entry: any, idx: number) => (
                      <tr key={entry.id || idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-2 text-gray-500">{idx + 1}</td>
                        <td className="py-3 px-2 font-medium text-gray-900">{entry.description || "Untitled"}</td>
                        <td className="py-3 px-2">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            {entry.category || "General"}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-gray-600">{entry.dateKey || "—"}</td>
                        <td className="py-3 px-2 text-right font-bold text-gray-900">
                          {formatLKR(Number(entry.amount) || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50/50">
                      <td colSpan={4} className="py-3 px-2 font-bold text-gray-900">
                        Total Operational Expenses
                      </td>
                      <td className="py-3 px-2 text-right font-bold text-[#B96C24] text-base">
                        {formatLKR(totalPettyCash)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
                {renderViewMore("pettyCash", filteredPettyCash.length)}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Wallet className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                No petty cash expenses logged in this period
              </div>
            )}
          </div>
        )}
      </div>

      {/* Download CTA Banner */}
      <div className="p-6 rounded-2xl border border-gray-800 bg-gray-950 text-white flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm">
        <div>
          <h3 className="text-lg font-bold">
            Download Detailed {period.charAt(0).toUpperCase() + period.slice(1)} Report (PDF)
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Includes full invoice ledger, quotation pipeline, valuable client breakdown, and new customers for {dateRange.label}.
          </p>
        </div>
        <button
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="flex items-center gap-2 px-6 py-3 bg-[#E8973A] text-white rounded-lg font-bold text-sm hover:bg-[#D98732] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isGenerating ? "Generating..." : "Download PDF Report"}
        </button>
      </div>
    </div>
  );
}
