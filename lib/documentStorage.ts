/**
 * lib/documentStorage.ts
 *
 * Backward-compatible re-export shim.
 * All actual Firestore logic lives in lib/firestoreService.ts.
 * Importing code doesn't need to change.
 */

export {
  saveInvoiceToFirestore,
  updateInvoiceInFirestore,
  getInvoicesFromFirestore,
  getInvoiceFromFirestore,
  deleteInvoiceFromFirestore,

  saveQuotationToFirestore,
  updateQuotationInFirestore,
  getQuotationsFromFirestore,
  getQuotationFromFirestore,
  deleteQuotationFromFirestore,

  saveReceiptToFirestore,
  updateReceiptInFirestore,
  getReceiptsFromFirestore,
  getReceiptFromFirestore,
  deleteReceiptFromFirestore,

  getDocumentFromFirestore,
  deleteDocumentFromFirestore,
  getNextDocumentNumber,
} from "./firestoreService";
