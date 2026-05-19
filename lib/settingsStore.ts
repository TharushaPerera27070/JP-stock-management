import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CompanySettings {
  name: string;
  address: string;
  phones: string[];
  email: string;
  website: string;
}

export interface BankDetail {
  id: string;
  bankName: string;
  branch: string;
  accountNo: string;
}

export interface TermsSettings {
  withConstruction: string;
  panelsOnly: string;
  additionalAccessories: string;
  wastageDisclaimer: string;
}

export interface LineItemPreset {
  id: string;
  label: string;
  value: string;
  price: number;
  mode: 'simple' | 'hard' | 'all';
  category: 'Wall Panels' | 'Ceiling Panels' | 'Roofing Panels' | 'Other';
}

export interface HardPanelOption {
  id: string;
  heightLabel: string;
  actualWidth: number;
  coveringSpace: number;
  price: number;
}

export interface CalculatorPricing {
  wall: {
    simple: { rate: number; label: string };
    hard: HardPanelOption[];
  };
  ceiling: {
    simple: { rate: number; label: string };
    hard: HardPanelOption[];
  };
  roofing: {
    simple: { id: string; label: string; rate: number }[];
    hard: HardPanelOption[];
  };
}

interface SettingsState {
  company: CompanySettings;
  bankDetails: BankDetail[];
  terms: TermsSettings;
  presets: LineItemPreset[];
  pricingData: CalculatorPricing;

  // Actions
  updateCompany: (company: Partial<CompanySettings>) => void;
  addBankDetail: (bank: Omit<BankDetail, 'id'>) => void;
  updateBankDetail: (id: string, bank: Partial<BankDetail>) => void;
  deleteBankDetail: (id: string) => void;
  updateTerms: (terms: Partial<TermsSettings>) => void;
  addPreset: (preset: Omit<LineItemPreset, 'id'>) => void;
  updatePreset: (id: string, preset: Partial<LineItemPreset>) => void;
  deletePreset: (id: string) => void;
  updateSimpleRate: (category: 'wall' | 'ceiling', rate: number) => void;
  updateRoofingSimpleRate: (id: 'roof-30mm' | 'roof-40-50mm', rate: number) => void;
  updateHardPanel: (category: 'wall' | 'ceiling' | 'roofing', id: string, updates: Partial<HardPanelOption>) => void;
  deleteHardPanel: (category: 'wall' | 'ceiling' | 'roofing', id: string) => void;
  fetchFromCloud: () => Promise<void>;
  resetToDefaults: () => void;
}

import { 
  loadAllSettingsFromCloud,
  saveCompanyProfile,
  saveBankAccount,
  deleteBankAccount,
  saveTermsConditions,
  savePreset,
  deletePreset,
  saveCalculatorRates,
  fullCloudSync
} from './settingsService';

const defaultCompany: CompanySettings = {
  name: "Japan Gedara",
  address: "No.115/1, Borella Rd, Depanama, Pannipitiya, Sri Lanka.",
  phones: ["+94 (0) 779 437 999", "+94 (0) 707 437 999", "+94 (0) 113 437 999"],
  email: "info@japangedara.com",
  website: "www.japangedara.com",
};

const defaultBankDetails: BankDetail[] = [
  { id: "bank-1", bankName: "Bank of Ceylon", branch: "Thalawathugoda Branch", accountNo: "92112847" },
  { id: "bank-2", bankName: "Seylan Bank", branch: "Thalawathugoda Branch", accountNo: "1780-13882855-001" },
  { id: "bank-3", bankName: "NDB", branch: "Pilimathalawa Branch", accountNo: "111000347872" },
];

const defaultTerms: TermsSettings = {
  withConstruction: "Payment - 80% of the total bill must be paid before delivery.",
  panelsOnly: "Payment - 100% of the total bill must be paid before delivery.",
  additionalAccessories: "Optional for additional accessories as per customer need will be cost seperately.",
  wastageDisclaimer: "Customer understands that the all material above are estimated and any additional panels that is delivered including wastage will be added to final invoice as per the exact Dispatch notes.",
};

const defaultPresets: LineItemPreset[] = [
  { id: "preset-1", label: "Wall Panels - 10ft (119\")", value: "Wall Panels - Height: 10ft (119\"), Width 17\" (Covering 15\")", price: 15230, mode: "hard", category: "Wall Panels" },
  { id: "preset-2", label: "Wall Panels - 12.5ft (149\")", value: "Wall Panels - Height: 12.5ft (149\"), Width 17\" (Covering 15\")", price: 18900, mode: "hard", category: "Wall Panels" },
  { id: "preset-3", label: "Wall Panels - 13ft (156\")", value: "Wall Panels - Height: 13ft (156\"), Width 17\" (Covering 15\")", price: 19800, mode: "hard", category: "Wall Panels" },
  { id: "preset-4", label: "Ceiling Panels - 7.5ft", value: "Ceiling Panels - Height: 7.5ft, Width 16.5\" (Covering 14.5\")", price: 11100, mode: "hard", category: "Ceiling Panels" },
  { id: "preset-5", label: "Ceiling Panels - 10ft (17\")", value: "Ceiling Panels - Height: 10ft, Width 17\" (Covering 15\")", price: 15230, mode: "hard", category: "Ceiling Panels" },
  { id: "preset-6", label: "Ceiling Panels - 10ft (12\")", value: "Ceiling Panels - Height: 10ft, Width 12\" (Covering 10\")", price: 10750, mode: "hard", category: "Ceiling Panels" },
  { id: "preset-7", label: "Ceiling Panels - 12ft", value: "Ceiling Panels - Height: 12ft, Width 17\" (Covering 15\")", price: 18275, mode: "hard", category: "Ceiling Panels" },
  { id: "preset-8", label: "Ceiling Panels - 13ft", value: "Ceiling Panels - Height: 13ft, Width 17\" (Covering 15\")", price: 19800, mode: "hard", category: "Ceiling Panels" },
  { id: "preset-9", label: "Roofing Panels - 9ft (30mm)", value: "Roofing Panels - Height: 9ft (30mm), Width 17\" (Covering 15\")", price: 18500, mode: "hard", category: "Roofing Panels" },
  { id: "preset-10", label: "Roofing Panels - 10ft (30mm)", value: "Roofing Panels - Height: 10ft (30mm), Width 17\" (Covering 15\")", price: 20600, mode: "hard", category: "Roofing Panels" },
  { id: "preset-11", label: "Roofing Panels - 10ft (40/50mm)", value: "Roofing Panels - Height: 10ft (40mm/50mm), Width 17\" (Covering 15\")", price: 23400, mode: "hard", category: "Roofing Panels" },
  { id: "preset-12", label: "Roofing Panels - 11ft (30mm)", value: "Roofing Panels - Height: 11ft (30mm), Width 17\" (Covering 15\")", price: 22600, mode: "hard", category: "Roofing Panels" },
  { id: "preset-13", label: "Roofing Panels - 11ft (40/50mm)", value: "Roofing Panels - Height: 11ft (40mm/50mm), Width 17\" (Covering 15\")", price: 25750, mode: "hard", category: "Roofing Panels" },
  { id: "preset-14", label: "Wall Panels", value: "Wall Siding Panels", price: 1075, mode: "simple", category: "Wall Panels" },
  { id: "preset-15", label: "Ceiling Panels", value: "Ceiling Siding Panels", price: 1075, mode: "simple", category: "Ceiling Panels" },
  { id: "preset-16", label: "Roofing Panels (30mm)", value: "Roofing Siding Panels (30mm)", price: 1450, mode: "simple", category: "Roofing Panels" },
  { id: "preset-17", label: "Roofing Panels (40/50mm)", value: "Roofing Siding Panels (40mm/50mm)", price: 1650, mode: "simple", category: "Roofing Panels" },
  { id: "preset-18", label: "Custom / Manual Entry", value: "custom", price: 0, mode: "all", category: "Other" }
];

const defaultPricingData: CalculatorPricing = {
  wall: {
    simple: { rate: 1075, label: "Rs. 1,075 per Sqft" },
    hard: [
      { id: "wall-10ft", heightLabel: "10ft (119\")", actualWidth: 17, coveringSpace: 15, price: 15230 },
      { id: "wall-12.5ft", heightLabel: "12 1/2ft (149\")", actualWidth: 17, coveringSpace: 15, price: 18900 },
      { id: "wall-13ft", heightLabel: "13ft (156\")", actualWidth: 17, coveringSpace: 15, price: 19800 }
    ]
  },
  ceiling: {
    simple: { rate: 1075, label: "Rs. 1,075 per Sqft" },
    hard: [
      { id: "ceil-7.5ft", heightLabel: "7 1/2ft", actualWidth: 16.5, coveringSpace: 14.5, price: 11100 },
      { id: "ceil-10ft-17", heightLabel: "10ft (Width 17\")", actualWidth: 17, coveringSpace: 15, price: 15230 },
      { id: "ceil-10ft-12", heightLabel: "10ft (Width 12\")", actualWidth: 12, coveringSpace: 10, price: 10750 },
      { id: "ceil-12ft", heightLabel: "12ft", actualWidth: 17, coveringSpace: 15, price: 18275 },
      { id: "ceil-13ft", heightLabel: "13ft", actualWidth: 17, coveringSpace: 15, price: 19800 }
    ]
  },
  roofing: {
    simple: [
      { id: "roof-30mm", label: "30mm Thickness", rate: 1450 },
      { id: "roof-40-50mm", label: "40mm/50mm Thickness", rate: 1650 }
    ],
    hard: [
      { id: "roof-9ft-30mm", heightLabel: "9ft (30mm)", actualWidth: 17, coveringSpace: 15, price: 18500 },
      { id: "roof-10ft-30mm", heightLabel: "10ft (30mm)", actualWidth: 17, coveringSpace: 15, price: 20600 },
      { id: "roof-10ft-40-50mm", heightLabel: "10ft (40mm/50mm)", actualWidth: 17, coveringSpace: 15, price: 23400 },
      { id: "roof-11ft-30mm", heightLabel: "11ft (30mm)", actualWidth: 17, coveringSpace: 15, price: 22600 },
      { id: "roof-11ft-40-50mm", heightLabel: "11ft (40mm/50mm)", actualWidth: 17, coveringSpace: 15, price: 25750 }
    ]
  }
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      company: defaultCompany,
      bankDetails: defaultBankDetails,
      terms: defaultTerms,
      presets: defaultPresets,
      pricingData: defaultPricingData,

      fetchFromCloud: async () => {
        try {
          const cloudData = await loadAllSettingsFromCloud();
          if (cloudData) {
            set({
              company: (cloudData.company as CompanySettings) || defaultCompany,
              // Trust empty arrays from Firestore as actual empty user states rather than falling back
              bankDetails: cloudData.bankDetails as BankDetail[],
              terms: (cloudData.terms as TermsSettings) || defaultTerms,
              presets: cloudData.presets as LineItemPreset[],
              pricingData: (cloudData.pricingData as CalculatorPricing) || defaultPricingData,
            });

            // --- DATA HEALING RECONCILIATION ---
            // Automatically detects existing presets added prior to the sync engine launch
            // and gracefully seeds missing calculator nodes instantly.
            const updatedPricing = { ...get().pricingData };
            let isModified = false;

            get().presets.forEach((preset) => {
              if (preset.mode === 'hard' || preset.mode === 'all') {
                const cat = preset.category === 'Wall Panels' ? 'wall' : preset.category === 'Ceiling Panels' ? 'ceiling' : preset.category === 'Roofing Panels' ? 'roofing' : null;
                if (cat) {
                  // If this dimension doesn't exist yet in math matrix, seed it.
                  const exists = updatedPricing[cat].hard.some(h => h.heightLabel === preset.label || preset.label.includes(h.heightLabel) || h.heightLabel.includes(preset.label));
                  if (!exists) {
                    updatedPricing[cat].hard = [
                      ...updatedPricing[cat].hard,
                      {
                        id: `hp-reconciled-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                        heightLabel: preset.label,
                        actualWidth: 17,
                        coveringSpace: 15,
                        price: preset.price
                      }
                    ];
                    isModified = true;
                  }
                }
              }
            });

            if (isModified) {
              set({ pricingData: updatedPricing });
              saveCalculatorRates(updatedPricing); // Push missing nodes to cloud
            }
          } else {
            // Edge Case: Found complete absence of data in remote Firebase cluster.
            // Seed current Application Defaults to cloud immediately to initialize platform.
            await fullCloudSync(get());
          }
        } catch (err) {
          console.error("Cloud init read failure", err);
        }
      },

      updateCompany: (company) => {
        set((state) => ({ company: { ...state.company, ...company } }));
        saveCompanyProfile(get().company);
      },

      addBankDetail: (bank) => {
        const id = `bank-${Date.now()}`;
        const newItem = { ...bank, id };
        set((state) => ({
          bankDetails: [...state.bankDetails, newItem],
        }));
        saveBankAccount(id, newItem);
      },

      updateBankDetail: (id, bank) => {
        set((state) => ({
          bankDetails: state.bankDetails.map((b) =>
            b.id === id ? { ...b, ...bank } : b
          ),
        }));
        const updated = get().bankDetails.find(b => b.id === id);
        if (updated) saveBankAccount(id, updated);
      },

      deleteBankDetail: (id) => {
        set((state) => ({
          bankDetails: state.bankDetails.filter((b) => b.id !== id),
        }));
        deleteBankAccount(id);
      },

      updateTerms: (terms) => {
        set((state) => ({ terms: { ...state.terms, ...terms } }));
        saveTermsConditions(get().terms);
      },

      addPreset: (preset) => {
        const id = `preset-${Date.now()}`;
        const newItem = { ...preset, id };
        
        set((state) => {
          let updatedPricingData = { ...state.pricingData };
          
          // Dynamic Sync: If this is a dimensional Hard Panel, automatically seed the math engine.
          if (preset.mode === 'hard' || preset.mode === 'all') {
            const cat = preset.category === 'Wall Panels' ? 'wall' : preset.category === 'Ceiling Panels' ? 'ceiling' : preset.category === 'Roofing Panels' ? 'roofing' : null;
            if (cat) {
              updatedPricingData[cat].hard = [
                ...updatedPricingData[cat].hard,
                {
                  id: `hp-${Date.now()}`,
                  heightLabel: preset.label,
                  actualWidth: 17,     // Default common width
                  coveringSpace: 15,   // Default common coverage
                  price: preset.price
                }
              ];
            }
          }
          
          return {
            presets: [...state.presets, newItem],
            pricingData: updatedPricingData
          };
        });

        savePreset(id, newItem);
        saveCalculatorRates(get().pricingData); // Push seeded math node
      },

      updatePreset: (id, preset) => {
        set((state) => {
          const updatedPresets = state.presets.map((p) =>
            p.id === id ? { ...p, ...preset } : p
          );

          let updatedPricingData = { ...state.pricingData };
          const oldPreset = state.presets.find((p) => p.id === id);
          
          if (oldPreset) {
            const syncHardPanel = (category: 'wall' | 'ceiling' | 'roofing') => {
              updatedPricingData[category].hard = updatedPricingData[category].hard.map((panel) => {
                // Match on old label to update label/price
                if (oldPreset.label.includes(panel.heightLabel) || panel.heightLabel.includes(oldPreset.label)) {
                  return { 
                    ...panel, 
                    price: preset.price !== undefined ? preset.price : panel.price,
                    heightLabel: preset.label !== undefined ? preset.label : panel.heightLabel
                  };
                }
                return panel;
              });
            };
            syncHardPanel('wall'); syncHardPanel('ceiling'); syncHardPanel('roofing');
          }
          return { presets: updatedPresets, pricingData: updatedPricingData };
        });
        
        const updated = get().presets.find(p => p.id === id);
        if (updated) savePreset(id, updated);
        saveCalculatorRates(get().pricingData); 
      },

      deletePreset: (id) => {
        const targetPreset = get().presets.find(p => p.id === id);
        
        set((state) => {
          let updatedPricingData = { ...state.pricingData };
          if (targetPreset) {
            // Prune logical Calculator engine nodes mapped to this exact label name
            const cleanList = (category: 'wall' | 'ceiling' | 'roofing') => {
              updatedPricingData[category].hard = updatedPricingData[category].hard.filter(p => 
                !p.heightLabel.includes(targetPreset.label) && !targetPreset.label.includes(p.heightLabel)
              );
            };
            cleanList('wall'); cleanList('ceiling'); cleanList('roofing');
          }
          
          return {
            presets: state.presets.filter((p) => p.id !== id),
            pricingData: updatedPricingData
          };
        });
        
        deletePreset(id);
        saveCalculatorRates(get().pricingData); // Reflect prune in cloud
      },

      updateSimpleRate: (category, rate) => {
        set((state) => {
          const updatedPricingData = { ...state.pricingData };
          updatedPricingData[category].simple = { rate, label: `Rs. ${rate.toLocaleString()} per Sqft` };
          const categoryLabel = category === 'wall' ? 'Wall Panels' : 'Ceiling Panels';
          const updatedPresets = state.presets.map((p) =>
            p.category === categoryLabel && p.mode === 'simple' ? { ...p, price: rate } : p
          );
          return { pricingData: updatedPricingData, presets: updatedPresets };
        });
        saveCalculatorRates(get().pricingData);
        
        const categoryLabel = category === 'wall' ? 'Wall Panels' : 'Ceiling Panels';
        const preset = get().presets.find(p => p.category === categoryLabel && p.mode === 'simple');
        if (preset) savePreset(preset.id, preset);
      },

      updateRoofingSimpleRate: (id, rate) => {
        set((state) => {
          const updatedPricingData = { ...state.pricingData };
          updatedPricingData.roofing.simple = updatedPricingData.roofing.simple.map((o) => o.id === id ? { ...o, rate } : o);
          const thickLabel = id === 'roof-30mm' ? '30mm' : '40/50mm';
          const updatedPresets = state.presets.map((p) =>
            p.category === 'Roofing Panels' && p.mode === 'simple' && p.label.includes(thickLabel) ? { ...p, price: rate } : p
          );
          return { pricingData: updatedPricingData, presets: updatedPresets };
        });
        saveCalculatorRates(get().pricingData);

        const thickLabel = id === 'roof-30mm' ? '30mm' : '40/50mm';
        const preset = get().presets.find(p => p.category === 'Roofing Panels' && p.mode === 'simple' && p.label.includes(thickLabel));
        if (preset) savePreset(preset.id, preset);
      },

      updateHardPanel: (category, id, updates) => {
        set((state) => {
          const updatedPricingData = { ...state.pricingData };
          updatedPricingData[category].hard = updatedPricingData[category].hard.map((p) => p.id === id ? { ...p, ...updates } : p);
          
          const panel = updatedPricingData[category].hard.find((p) => p.id === id);
          let updatedPresets = [...state.presets];
          if (panel && updates.price !== undefined) {
            updatedPresets = state.presets.map((p) => (p.mode === 'hard' && p.label.includes(panel.heightLabel)) ? { ...p, price: updates.price! } : p);
          }
          return { pricingData: updatedPricingData, presets: updatedPresets };
        });
        saveCalculatorRates(get().pricingData);

        // Sync back price to presets
        if (updates.price !== undefined) {
          const panel = get().pricingData[category].hard.find(p => p.id === id);
          if (panel) {
            const presetsToSync = get().presets.filter(p => p.mode === 'hard' && p.label.includes(panel.heightLabel));
            presetsToSync.forEach(p => savePreset(p.id, p));
          }
        }
      },

      deleteHardPanel: (category, id) => {
        const panel = get().pricingData[category].hard.find((p) => p.id === id);
        if (!panel) return;

        const linkedPresets = get().presets.filter(p => p.label.includes(panel.heightLabel) || panel.heightLabel.includes(p.label));
        
        set((state) => {
          const updatedPricingData = { ...state.pricingData };
          updatedPricingData[category].hard = updatedPricingData[category].hard.filter(p => p.id !== id);
          const updatedPresets = state.presets.filter(p => !linkedPresets.some(lp => lp.id === p.id));
          return { pricingData: updatedPricingData, presets: updatedPresets };
        });

        saveCalculatorRates(get().pricingData);
        linkedPresets.forEach(lp => deletePreset(lp.id)); 
      },

      resetToDefaults: () => {
        set({
          company: defaultCompany,
          bankDetails: defaultBankDetails,
          terms: defaultTerms,
          presets: defaultPresets,
          pricingData: defaultPricingData,
        });
        fullCloudSync(get());
      },
    }),
    {
      name: 'jp-invoice-maker-settings',
    }
  )
);
