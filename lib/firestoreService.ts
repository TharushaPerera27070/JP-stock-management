/**
 * lib/firestoreService.ts
 *
 * Central Firestore data layer for all collections:
 *   - invoices
 *   - quotations
 *   - receipts
 *   - orders
 *   - inventory (panels)
 *   - customers
 *   - settings/company
 *   - settings/banks      (sub-collection inside settings doc)
 *   - settings/presets    (sub-collection inside settings doc)
 *   - settings/terms
 *   - settings/pricing
 *
 * All functions return Promises. Server-side (SSR) calls are
 * guarded so they safely return empty data instead of crashing.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isClient = typeof window !== "undefined";

function tsNow() {
  return new Date().toISOString();
}

function serialize(data: any): any {
  // Strip undefined fields so Firestore doesn't throw
  return JSON.parse(JSON.stringify(data));
}

function normalizeDateValue(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  return "";
}

function normalizePanelRecord(data: any) {
  return {
    ...data,
    lastUpdated: normalizeDateValue(data?.lastUpdated),
  };
}

// ─── INVOICES ─────────────────────────────────────────────────────────────────

export async function saveInvoiceToFirestore(data: any): Promise<string> {
  const col = collection(db, "invoices");
  const payload = serialize({ ...data, lastUpdated: tsNow(), createdAt: data.createdAt ?? tsNow() });
  // Use provided id as doc id if given, otherwise let Firestore generate
  if (data.id) {
    await setDoc(doc(db, "invoices", data.id), payload, { merge: true });
    return data.id;
  }
  const ref = await addDoc(col, payload);
  return ref.id;
}

export async function updateInvoiceInFirestore(id: string, data: any): Promise<void> {
  await updateDoc(doc(db, "invoices", id), serialize({ ...data, lastUpdated: tsNow() }));
}

export async function getInvoicesFromFirestore(): Promise<any[]> {
  const snap = await getDocs(query(collection(db, "invoices"), orderBy("lastUpdated", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getInvoiceFromFirestore(id: string): Promise<any | null> {
  const snap = await getDoc(doc(db, "invoices", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function deleteInvoiceFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, "invoices", id));
}

// ─── QUOTATIONS ───────────────────────────────────────────────────────────────

export async function saveQuotationToFirestore(data: any): Promise<string> {
  const payload = serialize({ ...data, lastUpdated: tsNow(), createdAt: data.createdAt ?? tsNow() });
  if (data.id) {
    await setDoc(doc(db, "quotations", data.id), payload, { merge: true });
    return data.id;
  }
  const ref = await addDoc(collection(db, "quotations"), payload);
  return ref.id;
}

export async function updateQuotationInFirestore(id: string, data: any): Promise<void> {
  await updateDoc(doc(db, "quotations", id), serialize({ ...data, lastUpdated: tsNow() }));
}

export async function getQuotationsFromFirestore(): Promise<any[]> {
  const snap = await getDocs(query(collection(db, "quotations"), orderBy("lastUpdated", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getQuotationFromFirestore(id: string): Promise<any | null> {
  const snap = await getDoc(doc(db, "quotations", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function deleteQuotationFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, "quotations", id));
}

// ─── RECEIPTS ─────────────────────────────────────────────────────────────────

export async function saveReceiptToFirestore(data: any): Promise<string> {
  const payload = serialize({ ...data, lastUpdated: tsNow(), createdAt: data.createdAt ?? tsNow() });
  if (data.id) {
    await setDoc(doc(db, "receipts", data.id), payload, { merge: true });
    return data.id;
  }
  const ref = await addDoc(collection(db, "receipts"), payload);
  return ref.id;
}

export async function updateReceiptInFirestore(id: string, data: any): Promise<void> {
  await updateDoc(doc(db, "receipts", id), serialize({ ...data, lastUpdated: tsNow() }));
}

export async function getReceiptsFromFirestore(): Promise<any[]> {
  const snap = await getDocs(query(collection(db, "receipts"), orderBy("lastUpdated", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getReceiptFromFirestore(id: string): Promise<any | null> {
  const snap = await getDoc(doc(db, "receipts", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function deleteReceiptFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, "receipts", id));
}

// ─── PETTY CASH ENTRIES ───────────────────────────────────────────────────────

export async function savePettyCashEntryToFirestore(data: any): Promise<string> {
  const payload = serialize({
    ...data,
    amount: Number(data?.amount) || 0,
    dateKey: data?.dateKey ?? new Date().toISOString().split("T")[0],
    lastUpdated: tsNow(),
    createdAt: data?.createdAt ?? tsNow(),
  });

  if (data?.id) {
    await setDoc(doc(db, "pettyCashEntries", data.id), payload, { merge: true });
    return data.id;
  }

  const ref = await addDoc(collection(db, "pettyCashEntries"), payload);
  return ref.id;
}

export async function getPettyCashEntriesFromFirestore(): Promise<any[]> {
  const snap = await getDocs(
    query(collection(db, "pettyCashEntries"), orderBy("createdAt", "desc")),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── GENERIC DOCUMENT HELPERS (used by Documents.tsx) ────────────────────────

export async function getDocumentFromFirestore(
  type: "invoice" | "quotation" | "receipt",
  id: string
): Promise<any | null> {
  if (type === "invoice")   return getInvoiceFromFirestore(id);
  if (type === "quotation") return getQuotationFromFirestore(id);
  if (type === "receipt")   return getReceiptFromFirestore(id);
  return null;
}

export async function deleteDocumentFromFirestore(
  type: "invoice" | "quotation" | "receipt",
  id: string
): Promise<void> {
  if (type === "invoice")   return deleteInvoiceFromFirestore(id);
  if (type === "quotation") return deleteQuotationFromFirestore(id);
  if (type === "receipt")   return deleteReceiptFromFirestore(id);
}

// ─── NEXT DOCUMENT NUMBER ─────────────────────────────────────────────────────

export async function getNextDocumentNumber(
  type: "invoice" | "quotation" | "receipt"
): Promise<string> {
  const colMap: Record<string, string> = {
    invoice: "invoices",
    quotation: "quotations",
    receipt: "receipts",
  };
  const prefixMap: Record<string, string> = {
    invoice: "",
    quotation: "Q",
    receipt: "R",
  };
  const yearShort = new Date().getFullYear().toString().slice(-2);
  const snap = await getDocs(collection(db, colMap[type]));
  const count = snap.size + 1;
  const countStr = count.toString().padStart(3, "0");
  return `# ${prefixMap[type]}${yearShort} - ${countStr}`;
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────

export async function saveOrderToFirestore(data: any): Promise<string> {
  const payload = serialize({ ...data, lastUpdated: tsNow(), createdAt: data.createdAt ?? tsNow() });
  if (data.id) {
    await setDoc(doc(db, "orders", data.id), payload, { merge: true });
    return data.id;
  }
  const ref = await addDoc(collection(db, "orders"), payload);
  return ref.id;
}

export async function updateOrderInFirestore(id: string, data: any): Promise<void> {
  await updateDoc(doc(db, "orders", id), serialize({ ...data, lastUpdated: tsNow() }));
}

export async function getOrdersFromFirestore(): Promise<any[]> {
  const snap = await getDocs(query(collection(db, "orders"), orderBy("lastUpdated", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteOrderFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, "orders", id));
}

// ─── INVENTORY (PANELS) ───────────────────────────────────────────────────────

export async function savePanelToFirestore(data: any): Promise<string> {
  const payload = serialize({ ...data, lastUpdated: tsNow(), createdAt: data.createdAt ?? tsNow() });
  if (data.id) {
    await setDoc(doc(db, "inventory", data.id), payload, { merge: true });
    return data.id;
  }
  const ref = await addDoc(collection(db, "inventory"), payload);
  return ref.id;
}

export async function updatePanelInFirestore(id: string, data: any): Promise<void> {
  await updateDoc(doc(db, "inventory", id), serialize({ ...data, lastUpdated: tsNow() }));
}

export async function getPanelsFromFirestore(): Promise<any[]> {
  const snap = await getDocs(query(collection(db, "inventory"), orderBy("lastUpdated", "desc")));
  return snap.docs.map((d) => normalizePanelRecord({ id: d.id, ...d.data() }));
}

export async function deletePanelFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, "inventory", id));
}

// ─── CUSTOMERS ────────────────────────────────────────────────────────────────

function normalizeCustomerRecord(data: any) {
  const contactNumber = data?.contactNumber ?? data?.phone ?? "";
  const address = data?.address ?? data?.company ?? "";
  const discount = typeof data?.discount === "number" ? data.discount : Number(data?.discount ?? 0);

  return {
    ...data,
    name: data?.name ?? "",
    contactNumber,
    phone: data?.phone ?? contactNumber,
    company: data?.company ?? "",
    address,
    discount: Number.isFinite(discount) ? discount : 0,
    totalOrders: typeof data?.totalOrders === "number" ? data.totalOrders : Number(data?.totalOrders ?? 0),
  };
}

function customerIdentity(customer: any) {
  return String(customer?.name ?? "").trim().toLowerCase();
}

export async function upsertCustomerToFirestore(data: any): Promise<string> {
  const normalized = normalizeCustomerRecord(data);
  const customers = await getCustomersFromFirestore();
  const match = customers.find((customer) => customerIdentity(customer) === customerIdentity(normalized));
  const id = data?.id ?? match?.id;
  const payload = serialize({
    ...normalized,
    id,
    totalOrders: normalized.totalOrders ?? match?.totalOrders ?? 0,
    createdAt: data?.createdAt ?? match?.createdAt ?? tsNow(),
    lastUpdated: tsNow(),
  });

  if (id) {
    await setDoc(doc(db, "customers", id), payload, { merge: true });
    return id;
  }

  const ref = await addDoc(collection(db, "customers"), payload);
  return ref.id;
}

export async function saveCustomerToFirestore(data: any): Promise<string> {
  return upsertCustomerToFirestore(data);
}

export async function updateCustomerInFirestore(id: string, data: any): Promise<void> {
  await updateDoc(doc(db, "customers", id), serialize({ ...data, lastUpdated: tsNow() }));
}

export async function getCustomersFromFirestore(): Promise<any[]> {
  const snap = await getDocs(query(collection(db, "customers"), orderBy("lastUpdated", "desc")));
  return snap.docs.map((d) => normalizeCustomerRecord({ id: d.id, ...d.data() }));
}

export async function deleteCustomerFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, "customers", id));
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
// Stored as a single document: settings/app
// Bank accounts, presets stored as sub-collections: settings/app/banks, settings/app/presets

const SETTINGS_DOC = doc(db, "settings", "app");

export async function saveCompanyToFirestore(data: any): Promise<void> {
  await setDoc(SETTINGS_DOC, serialize({ company: data, lastUpdated: tsNow() }), { merge: true });
}

export async function saveTermsToFirestore(data: any): Promise<void> {
  await setDoc(SETTINGS_DOC, serialize({ terms: data, lastUpdated: tsNow() }), { merge: true });
}

export async function savePricingDataToFirestore(data: any): Promise<void> {
  await setDoc(SETTINGS_DOC, serialize({ pricingData: data, lastUpdated: tsNow() }), { merge: true });
}

export async function getSettingsFromFirestore(): Promise<any | null> {
  const snap = await getDoc(SETTINGS_DOC);
  if (!snap.exists()) return null;
  const base = snap.data();

  // Load sub-collections
  const [banksSnap, presetsSnap] = await Promise.all([
    getDocs(collection(db, "settings", "app", "banks")),
    getDocs(collection(db, "settings", "app", "presets")),
  ]);

  const bankDetails = banksSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const presets = presetsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return { ...base, bankDetails, presets };
}

// Banks sub-collection
export async function saveBankToFirestore(data: any): Promise<string> {
  const col = collection(db, "settings", "app", "banks");
  const payload = serialize({ ...data, lastUpdated: tsNow() });
  if (data.id) {
    await setDoc(doc(col, data.id), payload, { merge: true });
    return data.id;
  }
  const ref = await addDoc(col, payload);
  return ref.id;
}

export async function deleteBankFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, "settings", "app", "banks", id));
}

// Presets sub-collection
export async function savePresetToFirestore(data: any): Promise<string> {
  const col = collection(db, "settings", "app", "presets");
  const payload = serialize({ ...data, lastUpdated: tsNow() });
  if (data.id) {
    await setDoc(doc(col, data.id), payload, { merge: true });
    return data.id;
  }
  const ref = await addDoc(col, payload);
  return ref.id;
}

export async function deletePresetFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, "settings", "app", "presets", id));
}

// ─── FULL SETTINGS SYNC (used by settingsStore on save) ──────────────────────

export async function fullSettingsSyncToFirestore(state: {
  company: any;
  terms: any;
  pricingData: any;
  bankDetails: any[];
  presets: any[];
}): Promise<void> {
  // Main doc fields
  await setDoc(
    SETTINGS_DOC,
    serialize({ company: state.company, terms: state.terms, pricingData: state.pricingData, lastUpdated: tsNow() }),
    { merge: true }
  );

  // Banks — batch upsert
  const batch = writeBatch(db);
  for (const b of state.bankDetails) {
    batch.set(doc(db, "settings", "app", "banks", b.id), serialize({ ...b, lastUpdated: tsNow() }), { merge: true });
  }
  for (const p of state.presets) {
    batch.set(doc(db, "settings", "app", "presets", p.id), serialize({ ...p, lastUpdated: tsNow() }), { merge: true });
  }
  await batch.commit();
}
