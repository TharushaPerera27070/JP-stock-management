const isClient = typeof window !== "undefined";

function getLocalStorageData(key: string): any[] {
  if (!isClient) return [];
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setLocalStorageData(key: string, data: any[]) {
  if (isClient) {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

export async function saveInvoiceToFirestore(data: any) {
  const invoices = getLocalStorageData("jp-invoices");
  const id = `inv-${Date.now()}`;
  const newInvoice = { ...data, id, lastUpdated: new Date().toISOString() };
  invoices.push(newInvoice);
  setLocalStorageData("jp-invoices", invoices);
  return id;
}

export async function updateInvoiceInFirestore(id: string, data: any) {
  const invoices = getLocalStorageData("jp-invoices");
  const index = invoices.findIndex((inv) => inv.id === id);
  if (index !== -1) {
    invoices[index] = { ...invoices[index], ...data, lastUpdated: new Date().toISOString() };
    setLocalStorageData("jp-invoices", invoices);
  }
}

export async function saveQuotationToFirestore(data: any) {
  const quotations = getLocalStorageData("jp-quotations");
  const id = `quo-${Date.now()}`;
  const newQuotation = { ...data, id, lastUpdated: new Date().toISOString() };
  quotations.push(newQuotation);
  setLocalStorageData("jp-quotations", quotations);
  return id;
}

export async function updateQuotationInFirestore(id: string, data: any) {
  const quotations = getLocalStorageData("jp-quotations");
  const index = quotations.findIndex((quo) => quo.id === id);
  if (index !== -1) {
    quotations[index] = { ...quotations[index], ...data, lastUpdated: new Date().toISOString() };
    setLocalStorageData("jp-quotations", quotations);
  }
}

export async function saveReceiptToFirestore(data: any) {
  const receipts = getLocalStorageData("jp-receipts");
  const id = `rec-${Date.now()}`;
  const newReceipt = { ...data, id, lastUpdated: new Date().toISOString() };
  receipts.push(newReceipt);
  setLocalStorageData("jp-receipts", receipts);
  return id;
}

export async function updateReceiptInFirestore(id: string, data: any) {
  const receipts = getLocalStorageData("jp-receipts");
  const index = receipts.findIndex((rec) => rec.id === id);
  if (index !== -1) {
    receipts[index] = { ...receipts[index], ...data, lastUpdated: new Date().toISOString() };
    setLocalStorageData("jp-receipts", receipts);
  }
}

export async function getInvoicesFromFirestore() {
  return getLocalStorageData("jp-invoices");
}

export async function getQuotationsFromFirestore() {
  return getLocalStorageData("jp-quotations");
}

export async function getReceiptsFromFirestore() {
  return getLocalStorageData("jp-receipts");
}

export async function getDocumentFromFirestore(type: "invoice" | "quotation" | "receipt", id: string) {
  let list = [];
  if (type === "invoice") list = getLocalStorageData("jp-invoices");
  else if (type === "quotation") list = getLocalStorageData("jp-quotations");
  else if (type === "receipt") list = getLocalStorageData("jp-receipts");
  
  return list.find((item) => item.id === id) || null;
}

export async function deleteDocumentFromFirestore(type: "invoice" | "quotation" | "receipt", id: string) {
  if (type === "invoice") {
    const list = getLocalStorageData("jp-invoices");
    setLocalStorageData("jp-invoices", list.filter((item) => item.id !== id));
  } else if (type === "quotation") {
    const list = getLocalStorageData("jp-quotations");
    setLocalStorageData("jp-quotations", list.filter((item) => item.id !== id));
  } else if (type === "receipt") {
    const list = getLocalStorageData("jp-receipts");
    setLocalStorageData("jp-receipts", list.filter((item) => item.id !== id));
  }
}

export async function getNextDocumentNumber(type: "invoice" | "quotation" | "receipt") {
  const yearShort = new Date().getFullYear().toString().slice(-2);
  let list = [];
  let prefix = "";
  if (type === "invoice") {
    list = getLocalStorageData("jp-invoices");
    prefix = "";
  } else if (type === "quotation") {
    list = getLocalStorageData("jp-quotations");
    prefix = "Q";
  } else if (type === "receipt") {
    list = getLocalStorageData("jp-receipts");
    prefix = "R";
  }
  
  const count = list.length + 1;
  const countStr = count.toString().padStart(3, "0");
  return `# ${prefix}${yearShort} - ${countStr}`;
}
