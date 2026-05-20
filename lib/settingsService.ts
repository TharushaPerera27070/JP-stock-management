/**
 * lib/settingsService.ts
 *
 * Cloud settings service — proxies to firestoreService.ts.
 * Keeps the same function signatures so existing callers
 * (CloudSettingsInitializer, settingsStore) still work.
 */

import {
  getSettingsFromFirestore,
  saveCompanyToFirestore,
  saveTermsToFirestore,
  savePricingDataToFirestore,
  saveBankToFirestore,
  deleteBankFromFirestore,
  savePresetToFirestore,
  deletePresetFromFirestore,
  fullSettingsSyncToFirestore,
} from "./firestoreService";

// ─── Company Profile ──────────────────────────────────────────────────────────

export async function loadCompanyProfile(): Promise<any> {
  const settings = await getSettingsFromFirestore();
  return settings?.company ?? null;
}

export async function saveCompanyProfile(data: any): Promise<void> {
  await saveCompanyToFirestore(data);
}

// ─── Bank Accounts ────────────────────────────────────────────────────────────

export async function loadBankAccounts(): Promise<any[]> {
  const settings = await getSettingsFromFirestore();
  return settings?.bankDetails ?? [];
}

export async function saveBankAccount(id: string, data: any): Promise<void> {
  await saveBankToFirestore({ ...data, id });
}

export async function deleteBankAccount(id: string): Promise<void> {
  await deleteBankFromFirestore(id);
}

// ─── Terms & Conditions ───────────────────────────────────────────────────────

export async function loadTermsConditions(): Promise<any> {
  const settings = await getSettingsFromFirestore();
  return settings?.terms ?? null;
}

export async function saveTermsConditions(data: any): Promise<void> {
  await saveTermsToFirestore(data);
}

// ─── Pricing Presets ──────────────────────────────────────────────────────────

export async function loadPricingPresets(): Promise<any[]> {
  const settings = await getSettingsFromFirestore();
  return settings?.presets ?? [];
}

export async function savePreset(id: string, data: any): Promise<void> {
  await savePresetToFirestore({ ...data, id });
}

export async function deletePreset(id: string): Promise<void> {
  await deletePresetFromFirestore(id);
}

// ─── Calculator / Pricing Rates ───────────────────────────────────────────────

export async function loadCalculatorRates(): Promise<any> {
  const settings = await getSettingsFromFirestore();
  return settings?.pricingData ?? null;
}

export async function saveCalculatorRates(data: any): Promise<void> {
  await savePricingDataToFirestore(data);
}

// ─── Mass Sync ────────────────────────────────────────────────────────────────

export async function loadAllSettingsFromCloud(): Promise<any | null> {
  try {
    const settings = await getSettingsFromFirestore();
    if (!settings) return null;

    const { company, bankDetails, terms, presets, pricingData } = settings;
    if (!company && (!bankDetails || bankDetails.length === 0) && !terms && (!presets || presets.length === 0) && !pricingData) {
      return null;
    }

    return { company, bankDetails: bankDetails ?? [], terms, presets: presets ?? [], pricingData };
  } catch (e) {
    console.error("loadAllSettingsFromCloud error:", e);
    throw e;
  }
}

export async function fullCloudSync(state: any): Promise<void> {
  try {
    await fullSettingsSyncToFirestore({
      company: state.company,
      terms: state.terms,
      pricingData: state.pricingData,
      bankDetails: state.bankDetails ?? [],
      presets: state.presets ?? [],
    });
  } catch (e) {
    console.error("fullCloudSync error:", e);
  }
}
