"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building,
  CreditCard,
  FileText,
  Sliders,
  Plus,
  Trash2,
  Edit2,
  Save,
  RotateCcw,
  Check,
  Search,
  Briefcase,
  Lock,
  ShieldAlert
} from "lucide-react";
import { useSettingsStore, BankDetail, LineItemPreset } from "@/lib/settingsStore";

interface SettingsPageProps {
  onBack?: () => void;
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"company" | "banks" | "terms" | "presets" | "calculator">("company");

  // Store Hooks
  const settings = useSettingsStore();

  // Local state for edits
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhones, setCompanyPhones] = useState<string[]>([]);
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");

  const [termsWithConstruction, setTermsWithConstruction] = useState("");
  const [termsPanelsOnly, setTermsPanelsOnly] = useState("");
  const [termsAdditionalAccessories, setTermsAdditionalAccessories] = useState("");
  const [termsWastageDisclaimer, setTermsWastageDisclaimer] = useState("");

  // Bank edit/add states
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [bankForm, setBankForm] = useState({ bankName: "", branch: "", accountNo: "" });
  const [showAddBank, setShowAddBank] = useState(false);

  // Presets edit/add states
  const [presetSearch, setPresetSearch] = useState("");
  const [presetCategoryFilter, setPresetCategoryFilter] = useState<string>("all");
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [presetForm, setPresetForm] = useState<Omit<LineItemPreset, "id">>({
    label: "",
    value: "",
    price: 0,
    mode: "simple",
    category: "Wall Panels"
  });
  const [showAddPreset, setShowAddPreset] = useState(false);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Toast/Feedback state
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync state with store once mounted
  useEffect(() => {
    if (mounted) {
      setCompanyName(settings.company.name);
      setCompanyAddress(settings.company.address);
      setCompanyPhones(settings.company.phones);
      setCompanyEmail(settings.company.email);
      setCompanyWebsite(settings.company.website);

      setTermsWithConstruction(settings.terms.withConstruction);
      setTermsPanelsOnly(settings.terms.panelsOnly);
      setTermsAdditionalAccessories(settings.terms.additionalAccessories);
      setTermsWastageDisclaimer(settings.terms.wastageDisclaimer);
    }
  }, [mounted, settings.company, settings.terms]);

  const triggerFeedback = (message: string, type: "success" | "error" = "success") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail === "adminIQ@japangedara.com" && loginPassword === "jpIQadmin@2026") {
      setIsAuthenticated(true);
      setLoginError("");
    } else {
      setLoginError("Invalid credentials. Access denied.");
    }
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E8973A] border-t-transparent" />
          <p className="text-sm font-semibold text-gray-500">Loading Configuration...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md">


          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#E8973A] to-[#be7221]" />

            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-[#E8973A]/10 rounded-full flex items-center justify-center text-[#E8973A]">
                <Lock className="w-8 h-8" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Protected Access</h1>
            <p className="text-center text-gray-500 text-sm mb-8">Please enter the administrative credentials to modify system parameters.</p>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="admin@domain.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E8973A] focus:bg-white outline-none transition-all duration-200 text-sm font-medium text-gray-900 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Superuser Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E8973A] focus:bg-white outline-none transition-all duration-200 text-sm font-medium text-gray-900 shadow-inner"
                />
              </div>

              {loginError && (
                <div className="flex items-center gap-2 text-red-600 text-xs font-semibold bg-red-50 p-3 rounded-lg border border-red-100 animate-in slide-in-from-top-1">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-[#E8973A] hover:bg-[#d4832b] text-white rounded-xl font-bold text-sm tracking-wide transition shadow-md active:scale-[0.98] flex items-center justify-center gap-2 mt-6 shadow-[#E8973A]/20 hover:shadow-lg hover:shadow-[#E8973A]/30"
              >
                Unlock Configuration
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Save Handlers
  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    settings.updateCompany({
      name: companyName,
      address: companyAddress,
      phones: companyPhones.filter(p => p.trim() !== ""),
      email: companyEmail,
      website: companyWebsite,
    });
    triggerFeedback("Company profile updated successfully!");
  };

  const handleSaveTerms = (e: React.FormEvent) => {
    e.preventDefault();
    settings.updateTerms({
      withConstruction: termsWithConstruction,
      panelsOnly: termsPanelsOnly,
      additionalAccessories: termsAdditionalAccessories,
      wastageDisclaimer: termsWastageDisclaimer,
    });
    triggerFeedback("Terms & Conditions updated successfully!");
  };

  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankForm.bankName || !bankForm.accountNo) {
      triggerFeedback("Bank Name and Account Number are required", "error");
      return;
    }
    settings.addBankDetail(bankForm);
    setBankForm({ bankName: "", branch: "", accountNo: "" });
    setShowAddBank(false);
    triggerFeedback("New bank account added!");
  };

  const handleStartEditBank = (bank: BankDetail) => {
    setEditingBankId(bank.id);
    setBankForm({ bankName: bank.bankName, branch: bank.branch, accountNo: bank.accountNo });
  };

  const handleUpdateBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBankId) {
      settings.updateBankDetail(editingBankId, bankForm);
      setEditingBankId(null);
      setBankForm({ bankName: "", branch: "", accountNo: "" });
      triggerFeedback("Bank account updated successfully!");
    }
  };

  const handleDeleteBank = (id: string) => {
    if (confirm("Are you sure you want to delete this bank account?")) {
      settings.deleteBankDetail(id);
      triggerFeedback("Bank account removed.");
    }
  };

  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetForm.label || !presetForm.value) {
      triggerFeedback("Label and Value/Description are required", "error");
      return;
    }
    settings.addPreset(presetForm);
    setPresetForm({ label: "", value: "", price: 0, mode: "simple", category: "Wall Panels" });
    setShowAddPreset(false);
    triggerFeedback("New preset created successfully!");
  };

  const handleStartEditPreset = (p: LineItemPreset) => {
    setEditingPresetId(p.id);
    setPresetForm({
      label: p.label,
      value: p.value,
      price: p.price,
      mode: p.mode,
      category: p.category
    });
  };

  const handleUpdatePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPresetId) {
      settings.updatePreset(editingPresetId, presetForm);
      setEditingPresetId(null);
      setPresetForm({ label: "", value: "", price: 0, mode: "simple", category: "Wall Panels" });
      triggerFeedback("Pricing preset updated successfully!");
    }
  };

  const handleDeletePreset = (id: string) => {
    if (confirm("Are you sure you want to delete this pricing preset?")) {
      settings.deletePreset(id);
      triggerFeedback("Pricing preset deleted.");
    }
  };

  const handleResetDefaults = () => {
    if (confirm("Are you sure you want to reset ALL settings, pricing, bank details, and presets to their factory defaults? This cannot be undone.")) {
      settings.resetToDefaults();
      // Sync local states
      setTimeout(() => {
        setCompanyName(settings.company.name);
        setCompanyAddress(settings.company.address);
        setCompanyPhones(settings.company.phones);
        setCompanyEmail(settings.company.email);
        setCompanyWebsite(settings.company.website);
        setTermsWithConstruction(settings.terms.withConstruction);
        setTermsPanelsOnly(settings.terms.panelsOnly);
        setTermsAdditionalAccessories(settings.terms.additionalAccessories);
        setTermsWastageDisclaimer(settings.terms.wastageDisclaimer);
        triggerFeedback("All settings reset to defaults successfully!");
      }, 100);
    }
  };

  // Preset Filters
  const filteredPresets = settings.presets.filter((p) => {
    const matchesSearch = p.label.toLowerCase().includes(presetSearch.toLowerCase()) ||
      p.value.toLowerCase().includes(presetSearch.toLowerCase());
    const matchesCategory = presetCategoryFilter === "all" || p.category === presetCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex min-h-screen flex-col bg-white/75 font-sans text-slate-800">
      {/* Toast Feedback */}
      {feedback && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-5 py-3.5 shadow-xl transition-all duration-300 animate-in slide-in-from-bottom-5 ${feedback.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}>
          <Check className="h-5 w-5" />
          <span className="text-sm font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-md px-4 md:px-6 py-4">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            {onBack ? (
              <button
                onClick={onBack}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-gray-200 bg-white text-gray-500 hover:text-black hover:shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : (
              <Link
                href="/"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-gray-200 bg-white text-gray-500 hover:text-black hover:shadow-sm transition-all duration-150 active:scale-95"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight md:text-2xl truncate">
                System Settings
              </h1>
              <p className="text-[10px] md:text-xs text-gray-500 truncate sm:whitespace-normal">Configure metadata, banking, and rates.</p>
            </div>
          </div>

          {/* <button
            onClick={handleResetDefaults}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 transition shadow-sm active:scale-[0.98] text-xs sm:text-sm whitespace-nowrap w-full sm:w-auto"
          >
            <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Reset Defaults
          </button> */}
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Sidebar Navigation (Tabs) */}
          <div className="lg:col-span-1">
            <nav className="flex flex-row overflow-x-auto gap-1 rounded-2xl bg-white p-2 shadow-sm border border-slate-100 lg:flex-col lg:overflow-visible">
              <button
                onClick={() => setActiveTab("company")}
                className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-xs font-semibold transition-all duration-150 whitespace-nowrap lg:w-full ${activeTab === "company"
                  ? "bg-[#E8973A]/10 text-[#E8973A]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                <Building className="h-4 w-4" />
                Company Profile
              </button>

              <button
                onClick={() => setActiveTab("banks")}
                className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-xs font-semibold transition-all duration-150 whitespace-nowrap lg:w-full ${activeTab === "banks"
                  ? "bg-[#E8973A]/10 text-[#E8973A]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                <CreditCard className="h-4 w-4" />
                Bank Accounts
              </button>

              <button
                onClick={() => setActiveTab("terms")}
                className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-xs font-semibold transition-all duration-150 whitespace-nowrap lg:w-full ${activeTab === "terms"
                  ? "bg-[#E8973A]/10 text-[#E8973A]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                <FileText className="h-4 w-4" />
                Terms & Conditions
              </button>

              <button
                onClick={() => setActiveTab("presets")}
                className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-xs font-semibold transition-all duration-150 whitespace-nowrap lg:w-full ${activeTab === "presets"
                  ? "bg-[#E8973A]/10 text-[#E8973A]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                <Briefcase className="h-4 w-4" />
                Pricing Presets
              </button>

              {/* <button
                onClick={() => setActiveTab("calculator")}
                className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-xs font-semibold transition-all duration-150 whitespace-nowrap lg:w-full ${activeTab === "calculator"
                  ? "bg-[#E8973A]/10 text-[#E8973A]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                <Sliders className="h-4 w-4" />
                Calculator Rates
              </button> */}
            </nav>
          </div>

          {/* Active Tab Panel */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 md:p-8 shadow-sm">

              {/* Tab 1: Company Profile */}
              {activeTab === "company" && (
                <form onSubmit={handleSaveCompany} className="space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Company Profile Settings</h2>
                    <p className="text-xs text-gray-500">Edit core company details printed as issuer on Invoices & Quotations.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider mb-1.5">Company Name</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#E8973A] outline-none text-sm font-medium text-black bg-white shadow-sm"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider mb-1.5">Corporate Address</label>
                      <textarea
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        rows={3}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#E8973A] outline-none text-sm font-medium text-black bg-white shadow-sm resize-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider mb-1.5">Primary Contact Email</label>
                      <input
                        type="email"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#E8973A] outline-none text-sm font-medium text-black bg-white shadow-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider mb-1.5">Website Domain</label>
                      <input
                        type="text"
                        value={companyWebsite}
                        onChange={(e) => setCompanyWebsite(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#E8973A] outline-none text-sm font-medium text-black bg-white shadow-sm"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider">Phone Numbers</label>
                        <button
                          type="button"
                          onClick={() => setCompanyPhones([...companyPhones, ""])}
                          className="flex items-center gap-1 text-[11px] font-semibold text-[#E8973A] hover:underline"
                        >
                          <Plus className="h-3 w-3" /> Add Phone
                        </button>
                      </div>
                      <div className="space-y-3">
                        {companyPhones.map((phone, pIdx) => (
                          <div key={pIdx} className="flex gap-2">
                            <input
                              type="text"
                              value={phone}
                              onChange={(e) => {
                                const newPhones = [...companyPhones];
                                newPhones[pIdx] = e.target.value;
                                setCompanyPhones(newPhones);
                              }}
                              placeholder="e.g. +94 (0) 779 437 999"
                              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#E8973A] outline-none text-sm font-medium text-black bg-white shadow-sm"
                              required
                            />
                            {companyPhones.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setCompanyPhones(companyPhones.filter((_, idx) => idx !== pIdx))}
                                className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E8973A] to-[#d4832b] px-6 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-150"
                  >
                    <Save className="h-4.5 w-4.5" />
                    Save Profile Settings
                  </button>
                </form>
              )}

              {/* Tab 2: Bank Accounts */}
              {activeTab === "banks" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Bank Details</h2>
                      <p className="text-xs text-gray-500">Manage corporate bank accounts printed on the invoices & quotations footer.</p>
                    </div>
                    {!showAddBank && !editingBankId && (
                      <button
                        onClick={() => {
                          setShowAddBank(true);
                          setBankForm({ bankName: "", branch: "", accountNo: "" });
                        }}
                        className="flex items-center gap-1.5 rounded-xl bg-[#E8973A] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#d4832b] active:scale-95 transition-all"
                      >
                        <Plus className="h-4 w-4" /> Add Account
                      </button>
                    )}
                  </div>

                  {/* Add Bank Form */}
                  {showAddBank && (
                    <form onSubmit={handleAddBank} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 animate-in slide-in-from-top-3 shadow-sm">
                      <div className="text-xs font-semibold text-slate-800 uppercase tracking-wider border-b border-slate-200/60 pb-1.5">New Bank Account</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-medium text-slate-600 uppercase mb-1">Bank Name *</label>
                          <input
                            type="text"
                            value={bankForm.bankName}
                            onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                            placeholder="e.g. Bank of Ceylon"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-black bg-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-600 uppercase mb-1">Branch Name</label>
                          <input
                            type="text"
                            value={bankForm.branch}
                            onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })}
                            placeholder="e.g. Thalawathugoda Branch"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-black bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-600 uppercase mb-1">Account Number *</label>
                          <input
                            type="text"
                            value={bankForm.accountNo}
                            onChange={(e) => setBankForm({ ...bankForm, accountNo: e.target.value })}
                            placeholder="e.g. 92112847"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-black bg-white"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddBank(false)}
                          className="px-4 py-2 text-xs font-semibold text-slate-500 rounded-lg border border-slate-200 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                        >
                          Save Account
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Edit Bank Form */}
                  {editingBankId && (
                    <form onSubmit={handleUpdateBank} className="bg-white p-5 rounded-2xl border border-amber-200 space-y-4 animate-in slide-in-from-top-3 shadow-sm">
                      <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider border-b border-amber-200 pb-1.5">Edit Bank Account</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-medium text-slate-600 uppercase mb-1">Bank Name *</label>
                          <input
                            type="text"
                            value={bankForm.bankName}
                            onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-black bg-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-600 uppercase mb-1">Branch Name</label>
                          <input
                            type="text"
                            value={bankForm.branch}
                            onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-black bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-600 uppercase mb-1">Account Number *</label>
                          <input
                            type="text"
                            value={bankForm.accountNo}
                            onChange={(e) => setBankForm({ ...bankForm, accountNo: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-black bg-white"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingBankId(null)}
                          className="px-4 py-2 text-xs font-semibold text-slate-500 rounded-lg border border-slate-200 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm"
                        >
                          Update Account
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Accounts List */}
                  <div className="space-y-3">
                    {settings.bankDetails.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm">No bank details added. Click "Add Account" to create one.</div>
                    ) : (
                      settings.bankDetails.map((bank) => (
                        <div key={bank.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all bg-white gap-3">
                          <div>
                            <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-[#E8973A]" />
                              {bank.bankName}
                            </div>
                            <div className="text-xs text-slate-500 pl-4">{bank.branch || "Head Branch"}</div>
                            <div className="text-xs text-slate-600 font-medium pl-4 mt-1">A/c No: {bank.accountNo}</div>
                          </div>
                          <div className="flex gap-2 self-end sm:self-center">
                            <button
                              onClick={() => handleStartEditBank(bank)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-black transition"
                              title="Edit account"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBank(bank.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                              title="Delete account"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Terms & Conditions */}
              {activeTab === "terms" && (
                <form onSubmit={handleSaveTerms} className="space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Terms & Conditions Settings</h2>
                    <p className="text-xs text-gray-500">Configure corporate fine print and terms rendered on Invoices and Quotations.</p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider mb-1.5">Payment Terms (With Construction)</label>
                      <input
                        type="text"
                        value={termsWithConstruction}
                        onChange={(e) => setTermsWithConstruction(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#E8973A] outline-none text-sm font-medium text-black bg-white shadow-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider mb-1.5">Payment Terms (Panels Only - No Construction)</label>
                      <input
                        type="text"
                        value={termsPanelsOnly}
                        onChange={(e) => setTermsPanelsOnly(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#E8973A] outline-none text-sm font-medium text-black bg-white shadow-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider mb-1.5">Additional Accessories clause</label>
                      <input
                        type="text"
                        value={termsAdditionalAccessories}
                        onChange={(e) => setTermsAdditionalAccessories(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#E8973A] outline-none text-sm font-medium text-black bg-white shadow-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider mb-1.5">Wastage / Sizing Disclaimer</label>
                      <textarea
                        value={termsWastageDisclaimer}
                        onChange={(e) => setTermsWastageDisclaimer(e.target.value)}
                        rows={3}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#E8973A] outline-none text-sm font-medium text-black bg-white shadow-sm resize-none"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E8973A] to-[#d4832b] px-6 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-150"
                  >
                    <Save className="h-4.5 w-4.5" />
                    Save Terms Settings
                  </button>
                </form>
              )}

              {/* Tab 4: Pricing Presets */}
              {activeTab === "presets" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Pricing Presets</h2>
                      <p className="text-xs text-gray-500">Add, edit, or delete the siding panel types and prices dynamically available in invoice selectors.</p>
                    </div>
                    {!showAddPreset && !editingPresetId && (
                      <button
                        onClick={() => {
                          setShowAddPreset(true);
                          setPresetForm({ label: "", value: "", price: 0, mode: "simple", category: "Wall Panels" });
                        }}
                        className="flex items-center gap-1.5 rounded-xl bg-[#E8973A] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#d4832b] active:scale-95 transition-all self-start sm:self-center"
                      >
                        <Plus className="h-4 w-4" /> Add Preset
                      </button>
                    )}
                  </div>

                  {/* Add Preset Form */}
                  {showAddPreset && (
                    <form onSubmit={handleAddPreset} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 animate-in slide-in-from-top-3 shadow-sm">
                      <div className="text-xs font-semibold text-slate-800 uppercase tracking-wider border-b border-slate-200/60 pb-1.5">New Pricing Preset</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-medium text-slate-600 uppercase mb-1">Preset Label *</label>
                          <input
                            type="text"
                            value={presetForm.label}
                            onChange={(e) => setPresetForm({ ...presetForm, label: e.target.value })}
                            placeholder='e.g. Wall Panels - 10ft (119")'
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-black bg-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-600 uppercase mb-1">Category *</label>
                          <select
                            value={presetForm.category}
                            onChange={(e) => setPresetForm({ ...presetForm, category: e.target.value as any })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-black bg-white"
                          >
                            <option value="Wall Panels">Wall Panels</option>
                            <option value="Ceiling Panels">Ceiling Panels</option>
                            <option value="Roofing Panels">Roofing Panels</option>
                            <option value="Other">Other / Custom</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-medium text-slate-600 uppercase mb-1">Value/Description *</label>
                          <input
                            type="text"
                            value={presetForm.value}
                            onChange={(e) => setPresetForm({ ...presetForm, value: e.target.value })}
                            placeholder='e.g. Wall Panels - Height: 10ft (119"), Width 17" (Covering 15")'
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-black bg-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-600 uppercase mb-1">Price (Rs.) *</label>
                          <input
                            type="number"
                            value={presetForm.price}
                            onChange={(e) => setPresetForm({ ...presetForm, price: parseFloat(e.target.value) || 0 })}
                            onWheel={(e) => e.currentTarget.blur()}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-black bg-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-600 uppercase mb-1">Pricing Mode *</label>
                          <select
                            value={presetForm.mode}
                            onChange={(e) => setPresetForm({ ...presetForm, mode: e.target.value as any })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-black bg-white"
                          >
                            <option value="simple">Sqft (Simple)</option>
                            <option value="hard">Panel-by-Panel (Hard)</option>
                            <option value="all">Both modes (All)</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddPreset(false)}
                          className="px-4 py-2 text-xs font-semibold text-slate-500 rounded-lg border border-slate-200 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                        >
                          Create Preset
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Edit Preset Form */}
                  {editingPresetId && (
                    <form onSubmit={handleUpdatePreset} className="bg-white p-5 rounded-2xl border border-amber-200 space-y-4 animate-in slide-in-from-top-3 shadow-sm">
                      <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider border-b border-amber-200 pb-1.5">Edit Pricing Preset</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-medium text-slate-600 uppercase mb-1">Preset Label *</label>
                          <input
                            type="text"
                            value={presetForm.label}
                            onChange={(e) => setPresetForm({ ...presetForm, label: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-black bg-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-600 uppercase mb-1">Category *</label>
                          <select
                            value={presetForm.category}
                            onChange={(e) => setPresetForm({ ...presetForm, category: e.target.value as any })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-black bg-white"
                          >
                            <option value="Wall Panels">Wall Panels</option>
                            <option value="Ceiling Panels">Ceiling Panels</option>
                            <option value="Roofing Panels">Roofing Panels</option>
                            <option value="Other">Other / Custom</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-medium text-slate-600 uppercase mb-1">Value/Description *</label>
                          <input
                            type="text"
                            value={presetForm.value}
                            onChange={(e) => setPresetForm({ ...presetForm, value: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-black bg-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-600 uppercase mb-1">Price (Rs.) *</label>
                          <input
                            type="number"
                            value={presetForm.price}
                            onChange={(e) => setPresetForm({ ...presetForm, price: parseFloat(e.target.value) || 0 })}
                            onWheel={(e) => e.currentTarget.blur()}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-black bg-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-600 uppercase mb-1">Pricing Mode *</label>
                          <select
                            value={presetForm.mode}
                            onChange={(e) => setPresetForm({ ...presetForm, mode: e.target.value as any })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-black bg-white"
                          >
                            <option value="simple">Sqft (Simple)</option>
                            <option value="hard">Panel-by-Panel (Hard)</option>
                            <option value="all">Both modes (All)</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingPresetId(null)}
                          className="px-4 py-2 text-xs font-semibold text-slate-500 rounded-lg border border-slate-200 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm"
                        >
                          Update Preset
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Search and Filter */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search presets..."
                        value={presetSearch}
                        onChange={(e) => setPresetSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#E8973A] text-black bg-white font-medium"
                      />
                    </div>
                    <select
                      value={presetCategoryFilter}
                      onChange={(e) => setPresetCategoryFilter(e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-[#E8973A] sm:w-48 text-black font-medium"
                    >
                      <option value="all">All Categories</option>
                      <option value="Wall Panels">Wall Panels</option>
                      <option value="Ceiling Panels">Ceiling Panels</option>
                      <option value="Roofing Panels">Roofing Panels</option>
                      <option value="Other">Other / Custom</option>
                    </select>
                  </div>

                  {/* Presets List */}
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                    {filteredPresets.map((preset) => (
                      <div key={preset.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl border border-slate-100 bg-white gap-3 hover:border-slate-200 hover:shadow-sm transition-all duration-150">
                        <div>
                          <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 uppercase tracking-wider">{preset.category}</span>
                            {preset.label}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 font-medium">{preset.value}</div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 font-medium capitalize">Mode: {preset.mode}</span>
                            <span className="text-xs text-slate-900 font-semibold">Rs. {preset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 self-end sm:self-center">
                          <button
                            onClick={() => handleStartEditPreset(preset)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-black transition"
                            title="Edit preset"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePreset(preset.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                            title="Delete preset"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {filteredPresets.length === 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm">No matching presets found.</div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 5: Calculator Rates */}
              {activeTab === "calculator" && (
                <div className="space-y-8 animate-in fade-in duration-200">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Calculator Rates & Sizing Prices</h2>
                    <p className="text-xs text-gray-500">Edit the pricing parameters utilized directly in the Quotation Calculator formulas.</p>
                  </div>

                  {/* Section A: Simple Sqft Rates */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#E8973A]" />
                      Simple Sqft Rates
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider mb-1.5">Wall Panels (Sqft Rate)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-medium">Rs.</span>
                          <input
                            type="number"
                            value={settings.pricingData.wall.simple.rate}
                            onChange={(e) => {
                              settings.updateSimpleRate("wall", parseFloat(e.target.value) || 0);
                              triggerFeedback("Wall panels simple rate updated!");
                            }}
                            onWheel={(e) => e.currentTarget.blur()}
                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-black bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider mb-1.5">Ceiling Panels (Sqft Rate)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-medium">Rs.</span>
                          <input
                            type="number"
                            value={settings.pricingData.ceiling.simple.rate}
                            onChange={(e) => {
                              settings.updateSimpleRate("ceiling", parseFloat(e.target.value) || 0);
                              triggerFeedback("Ceiling panels simple rate updated!");
                            }}
                            onWheel={(e) => e.currentTarget.blur()}
                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-black bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider mb-1.5">Roofing (30mm Thickness Sqft Rate)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-medium">Rs.</span>
                          <input
                            type="number"
                            value={settings.pricingData.roofing.simple.find(o => o.id === "roof-30mm")?.rate || 1450}
                            onChange={(e) => {
                              settings.updateRoofingSimpleRate("roof-30mm", parseFloat(e.target.value) || 0);
                              triggerFeedback("Roofing 30mm simple rate updated!");
                            }}
                            onWheel={(e) => e.currentTarget.blur()}
                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-black bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider mb-1.5">Roofing (40/50mm Thickness Sqft Rate)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-medium">Rs.</span>
                          <input
                            type="number"
                            value={settings.pricingData.roofing.simple.find(o => o.id === "roof-40-50mm")?.rate || 1650}
                            onChange={(e) => {
                              settings.updateRoofingSimpleRate("roof-40-50mm", parseFloat(e.target.value) || 0);
                              triggerFeedback("Roofing 40/50mm simple rate updated!");
                            }}
                            onWheel={(e) => e.currentTarget.blur()}
                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-black bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section B: Hard Panel Prices */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#E8973A]" />
                      Panel-by-Panel Sizing Prices
                    </h3>

                    {/* Wall hard panels */}
                    <div className="space-y-3">
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Wall Siding Panels</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {settings.pricingData.wall.hard.map((panel) => (
                          <div key={panel.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm relative group">
                            <div className="flex items-start justify-between mb-1.5 gap-1">
                              <label className="block text-[11px] font-semibold text-slate-800 leading-tight">{panel.heightLabel}</label>
                              <button
                                onClick={() => {
                                  if (confirm(`Permanently delete panel "${panel.heightLabel}" and any associated presets?`)) {
                                    settings.deleteHardPanel("wall", panel.id);
                                    triggerFeedback("Panel and associated presets deleted");
                                  }
                                }}
                                className="opacity-0 group-hover:opacity-100 shrink-0 flex h-5 w-5 items-center justify-center rounded bg-red-50 text-red-500 hover:bg-red-100 transition-all duration-150"
                                title="Delete panel"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-2 text-xs font-medium text-slate-400">Rs.</span>
                              <input
                                type="number"
                                value={panel.price}
                                onChange={(e) => {
                                  settings.updateHardPanel("wall", panel.id, { price: parseFloat(e.target.value) || 0 });
                                  triggerFeedback(`Wall ${panel.heightLabel} price updated!`);
                                }}
                                onWheel={(e) => e.currentTarget.blur()}
                                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white font-semibold text-black"
                              />
                            </div>

                            {/* Dynamic Dimension Control */}
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div>
                                <label className="text-[9px] font-semibold uppercase text-slate-400">Width (")</label>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={panel.actualWidth}
                                  onChange={(e) => settings.updateHardPanel("wall", panel.id, { actualWidth: parseFloat(e.target.value) || 0 })}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  className="w-full px-2 py-1 border border-slate-100 rounded bg-slate-50 text-[11px] font-medium text-slate-700"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-semibold uppercase text-slate-400">Covering (")</label>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={panel.coveringSpace}
                                  onChange={(e) => settings.updateHardPanel("wall", panel.id, { coveringSpace: parseFloat(e.target.value) || 0 })}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  className="w-full px-2 py-1 border border-slate-100 rounded bg-slate-50 text-[11px] font-medium text-slate-700"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Ceiling hard panels */}
                    <div className="space-y-3 pt-4">
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ceiling Siding Panels</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {settings.pricingData.ceiling.hard.map((panel) => (
                          <div key={panel.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm relative group">
                            <div className="flex items-start justify-between mb-1.5 gap-1">
                              <label className="block text-[11px] font-semibold text-slate-800 leading-tight">{panel.heightLabel}</label>
                              <button
                                onClick={() => {
                                  if (confirm(`Permanently delete panel "${panel.heightLabel}" and any associated presets?`)) {
                                    settings.deleteHardPanel("ceiling", panel.id);
                                    triggerFeedback("Panel and associated presets deleted");
                                  }
                                }}
                                className="opacity-0 group-hover:opacity-100 shrink-0 flex h-5 w-5 items-center justify-center rounded bg-red-50 text-red-500 hover:bg-red-100 transition-all duration-150"
                                title="Delete panel"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-2 text-xs font-medium text-slate-400">Rs.</span>
                              <input
                                type="number"
                                value={panel.price}
                                onChange={(e) => {
                                  settings.updateHardPanel("ceiling", panel.id, { price: parseFloat(e.target.value) || 0 });
                                  triggerFeedback(`Ceiling ${panel.heightLabel} price updated!`);
                                }}
                                onWheel={(e) => e.currentTarget.blur()}
                                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white font-semibold text-black"
                              />
                            </div>

                            {/* Dynamic Dimension Control */}
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div>
                                <label className="text-[9px] font-semibold uppercase text-slate-400">Width (")</label>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={panel.actualWidth}
                                  onChange={(e) => settings.updateHardPanel("ceiling", panel.id, { actualWidth: parseFloat(e.target.value) || 0 })}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  className="w-full px-2 py-1 border border-slate-100 rounded bg-slate-50 text-[11px] font-medium text-slate-700"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-semibold uppercase text-slate-400">Covering (")</label>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={panel.coveringSpace}
                                  onChange={(e) => settings.updateHardPanel("ceiling", panel.id, { coveringSpace: parseFloat(e.target.value) || 0 })}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  className="w-full px-2 py-1 border border-slate-100 rounded bg-slate-50 text-[11px] font-medium text-slate-700"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Roofing hard panels */}
                    <div className="space-y-3 pt-4">
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Roofing Siding Panels (30mm & 40mm Varieties)</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {settings.pricingData.roofing.hard.map((panel) => (
                          <div key={panel.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm relative group">
                            <div className="flex items-start justify-between mb-1.5 gap-1">
                              <label className="block text-[11px] font-semibold text-slate-800 leading-tight">{panel.heightLabel}</label>
                              <button
                                onClick={() => {
                                  if (confirm(`Permanently delete panel "${panel.heightLabel}" and any associated presets?`)) {
                                    settings.deleteHardPanel("roofing", panel.id);
                                    triggerFeedback("Panel and associated presets deleted");
                                  }
                                }}
                                className="opacity-0 group-hover:opacity-100 shrink-0 flex h-5 w-5 items-center justify-center rounded bg-red-50 text-red-500 hover:bg-red-100 transition-all duration-150"
                                title="Delete panel"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-2 text-xs font-medium text-slate-400">Rs.</span>
                              <input
                                type="number"
                                value={panel.price}
                                onChange={(e) => {
                                  settings.updateHardPanel("roofing", panel.id, { price: parseFloat(e.target.value) || 0 });
                                  triggerFeedback(`Roofing ${panel.heightLabel} price updated!`);
                                }}
                                onWheel={(e) => e.currentTarget.blur()}
                                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white font-semibold text-black"
                              />
                            </div>

                            {/* Dynamic Dimension Control */}
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div>
                                <label className="text-[9px] font-semibold uppercase text-slate-400">Width (")</label>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={panel.actualWidth}
                                  onChange={(e) => settings.updateHardPanel("roofing", panel.id, { actualWidth: parseFloat(e.target.value) || 0 })}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  className="w-full px-2 py-1 border border-slate-100 rounded bg-slate-50 text-[11px] font-medium text-slate-700"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-semibold uppercase text-slate-400">Covering (")</label>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={panel.coveringSpace}
                                  onChange={(e) => settings.updateHardPanel("roofing", panel.id, { coveringSpace: parseFloat(e.target.value) || 0 })}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  className="w-full px-2 py-1 border border-slate-100 rounded bg-slate-50 text-[11px] font-medium text-slate-700"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
