import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import {
  Save,
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import { useDialog } from "./Dialog";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";

export interface PanelData {
  panelId: string;
  panelType: string;
  design: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  imageUrl?: string;
  importDetails?: string;
  // New fields
  width?: number;
  height?: number;
  effectiveArea?: number;
  totalEffectiveArea?: number;
}

interface AddPanelProps {
  onBack: () => void;
  onSave: (panel: PanelData, silent?: boolean) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  initialData?: PanelData;
}

const wallCeilingDesigns = [
  "Narrow-Span",
  "Smart-Span",
  "Normal Span Pattern",
  "Kaisei",
  "Nagarekoku",
  "Sagan",
  "Jupiter",
  "Comet",
  "Lapis",
  "Modern Cube Pattern",
  "Random Layer Pattern",
  "Trewood",
  "Wood Pattern 1",
  "Stucco",
  "Stucco 2",
  "Stucco 2 Double",
  "Shadow Pattern",
  "Shadow Line",
  "Lapis V5",
  "Brick Pattern 1",
  "Brick Pattern 2",
  "Large Pattern",
  "Luster",
  "Slender Stone",
  "Diagonal Pattern",
  "Pyroxine",
  "Flow Border",
  "Denver",
  "Brio Wave",
  "Stylish Line",
  "Precious Wood Pattern",
  "Limestone",
  "Coastline H",
  "Coastline Double",
  "Plain Shape",
  "Trace",
  "Masonry",
  "Wood Pattern 2",
  "Plain Single",
  "Plain Double",
  "Tree Bark Double",
  "Excellent",
  "Quattro Span",
  "Jupiter Cypress",
  "Cloud Pattern",
];
const roofingDesigns = ["Corrugated", "Sirius"];

export default function AddPanel({
  onBack,
  onSave,
  onDelete,
  initialData,
}: AddPanelProps) {
  const { confirm, toast } = useDialog();
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<PanelData>(
    initialData || {
      panelId: "",
      panelType: "Wall",
      design: wallCeilingDesigns[0],
      color: "",
      size: "",
      price: 0,
      quantity: 0,
      status: "In Stock",
      imageUrl: "",
      importDetails: "",
      width: undefined,
      height: undefined,
      effectiveArea: undefined,
      totalEffectiveArea: undefined,
    },
  );

  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
  } | null>(null);

  // Auto-calculate size string from width and height (both in inches)
  useEffect(() => {
    const w = Number(formData.width) || 0;
    const h = Number(formData.height) || 0;
    if (w > 0 && h > 0) {
      setFormData((prev) => ({ ...prev, size: `${h}" x ${w}"` }));
    } else if (w > 0) {
      setFormData((prev) => ({ ...prev, size: `${w}"` }));
    } else if (h > 0) {
      setFormData((prev) => ({ ...prev, size: `${h}"` }));
    } else {
      setFormData((prev) => ({ ...prev, size: "" }));
    }
  }, [formData.width, formData.height]);

  // Recalculate total effective area whenever effectiveArea or quantity changes
  useEffect(() => {
    const ea = Number(formData.effectiveArea) || 0;
    const qty = Number(formData.quantity) || 0;
    const total = parseFloat((ea * qty).toFixed(4));
    setFormData((prev) => ({ ...prev, totalEffectiveArea: total }));
  }, [formData.effectiveArea, formData.quantity]);

  const uploadPanelImage = async (panelId: string) => {
    if (!selectedImageFile) {
      return formData.imageUrl?.trim() || "";
    }
    const safeFileName = selectedImageFile.name.replace(
      /[^a-zA-Z0-9._-]/g,
      "_",
    );
    const imageRef = ref(
      storage,
      `panel-images/${panelId}/${Date.now()}-${safeFileName}`,
    );
    await uploadBytes(imageRef, selectedImageFile);
    return getDownloadURL(imageRef);
  };

  const handleSave = async () => {
    if (!formData.panelId.trim()) {
      toast({ message: "Please enter a Panel ID.", type: "error" });
      return;
    }

    setIsSaving(true);
    try {
      const imageUrl = await uploadPanelImage(formData.panelId);
      await onSave({
        ...formData,
        color: formData.color.trim(),
        imageUrl,
        importDetails: formData.importDetails?.trim(),
      });
      setFormData((prev) => ({ ...prev, imageUrl }));
      setSelectedImageFile(null);
    } catch (error) {
      console.error("Failed to save panel:", error);
      toast({
        message: "Failed to save panel. Please try again.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePanelTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    const newDesign =
      newType === "Roofing" ? roofingDesigns[0] : wallCeilingDesigns[0];
    setFormData((prev) => ({ ...prev, panelType: newType, design: newDesign }));
  };

  const handleNumberField = (field: keyof PanelData, value: string) => {
    const parsed = value === "" ? undefined : parseFloat(value);
    setFormData((prev) => ({ ...prev, [field]: parsed }));
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResults(null);
    setImportProgress(0);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as Record<string, string>[];
        let successCount = 0;
        let failedCount = 0;

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const getVal = (keys: string[]) => {
            const foundKey = Object.keys(row).find((k) =>
              keys.some((key) => k.toLowerCase().trim() === key.toLowerCase()),
            );
            return foundKey ? row[foundKey] : "";
          };

          try {
            const price =
              parseFloat(getVal(["price", "rate", "unit price", "cost"])) || 0;
            const quantity =
              parseInt(
                getVal(["quantity", "qty", "stock", "initial quantity"]),
              ) || 0;
            const effectiveArea =
              parseFloat(getVal(["effectiveArea", "effective area", "area"])) ||
              0;

            const panelData: PanelData = {
              panelId: getVal(["panelId", "panel id", "id"]),
              panelType: (getVal(["panelType", "type", "category"]) ||
                "Wall") as PanelData["panelType"],
              design: getVal(["design", "pattern", "style", "item"]),
              color: getVal(["color", "colour", "shade"]),
              size: getVal([
                "size",
                "spec",
                "specifications",
                "length",
                "dims",
              ]),
              price,
              quantity,
              effectiveArea,
              totalEffectiveArea: parseFloat(
                (effectiveArea * quantity).toFixed(4),
              ),
              width: parseFloat(getVal(["width"])) || undefined,
              height: parseFloat(getVal(["height"])) || undefined,
              status:
                (getVal(["status"]) as PanelData["status"]) ||
                (quantity > 10
                  ? "In Stock"
                  : quantity > 0
                    ? "Low Stock"
                    : "Out of Stock"),
              imageUrl: getVal([
                "imageUrl",
                "photo",
                "image",
                "picture",
              ]).trim(),
              importDetails: getVal([
                "importDetails",
                "import",
                "container",
                "details",
                "notes",
              ]).trim(),
            };

            await onSave(panelData, true);
            successCount++;
          } catch (error) {
            console.error("Failed to import row:", row, error);
            failedCount++;
          }
          setImportProgress(Math.round(((i + 1) / rows.length) * 100));
        }

        setImportResults({ success: successCount, failed: failedCount });
        setIsImporting(false);
        e.target.value = "";
      },
      error: (error) => {
        console.error("CSV Parse Error:", error);
        toast({
          message: "Error parsing CSV file. Please check the format.",
          type: "error",
        });
        setIsImporting(false);
      },
    });
  };

  const availableDesigns =
    formData.panelType === "Roofing" ? roofingDesigns : wallCeilingDesigns;
  const hasImportResults = importResults !== null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Actions */}
      <div className="flex items-center justify-end gap-3">
        {initialData && onDelete && (
          <button
            onClick={async () => {
              const ok = await confirm({
                title: "Delete Panel",
                message:
                  "Are you sure you want to permanently delete this panel? This cannot be undone.",
                confirmLabel: "Delete",
                variant: "danger",
              });
              if (ok) {
                try {
                  await onDelete();
                  onBack();
                } catch (error) {
                  console.error("Delete failed:", error);
                  toast({
                    message: "Failed to delete panel. Please try again.",
                    type: "error",
                  });
                }
              }
            }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium transition-all border border-red-500/20"
          >
            <Trash2 className="w-4 h-4" /> Delete Panel
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving || isImporting}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#E8973A] hover:bg-[#d4832b] text-gray-900 font-medium transition-all shadow-lg shadow-[#E8973A]/20 disabled:opacity-60"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? "Saving..." : "Save Panel"}
        </button>
      </div>

      {/* Bulk Import */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-8 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#E8973A]/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-[#E8973A]" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Bulk Import Panels</h3>
              <p className="text-sm text-gray-500">
                Upload a CSV file to add multiple panels at once
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed transition-all text-sm font-medium ${isImporting ? "border-gray-300 cursor-not-allowed opacity-60" : "border-[#E8973A]/30 hover:border-[#E8973A] hover:bg-[#E8973A]/5 cursor-pointer"}`}
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#E8973A]" />
                  Importing... {importProgress}%
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-[#E8973A]" />
                  Select CSV File
                </>
              )}
              <input
                type="file"
                accept=".csv"
                onChange={handleBulkUpload}
                disabled={isImporting}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                const csvContent =
                  'panelId,panelType,design,color,size,width,height,effectiveArea,price,quantity,imageUrl,importDetails\nWAL-NARO-WHT,Wall,Naro-Span,White,10ft x 17",10,17,1.0625,15230,100,https://example.com/photo.jpg,Container #12';
                const blob = new Blob([csvContent], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "panel_template.csv";
                link.click();
              }}
              className="text-xs text-[#E8973A] hover:underline flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> Template
            </button>
          </div>
        </div>

        {hasImportResults && importResults && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between ${importResults.failed > 0 ? "bg-red-500/10 border border-red-500/20" : "bg-emerald-500/10 border border-emerald-500/20"}`}
          >
            <div className="flex items-center gap-3">
              {importResults.failed > 0 ? (
                <AlertCircle className="w-5 h-5 text-red-400" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              )}
              <p className="text-sm font-medium">
                Import Complete: {importResults.success} success,{" "}
                {importResults.failed} failed
              </p>
            </div>
            <button
              onClick={() => setImportResults(null)}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-gray-700 border-b border-gray-200 pb-2">
              Basic Information
            </h3>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Panel ID <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. WAL-NARO-WHT-10FT"
                value={formData.panelId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, panelId: e.target.value }))
                }
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-gray-900 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Panel Type
              </label>
              <select
                value={formData.panelType}
                onChange={handlePanelTypeChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-gray-900 transition-all appearance-none"
              >
                <option value="Wall">Wall</option>
                <option value="Roofing">Roofing</option>
                <option value="Ceiling">Ceiling</option>
                <option value="Wall/ Ceiling">Wall/ Ceiling</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Design
              </label>
              <select
                value={formData.design}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, design: e.target.value }))
                }
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-gray-900 transition-all appearance-none"
              >
                {availableDesigns.map((design) => (
                  <option key={design} value={design}>
                    {design}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Color</label>
              <input
                type="text"
                placeholder="e.g. White, Grey"
                value={formData.color}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, color: e.target.value }))
                }
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-gray-900 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Photo</label>
              <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 hover:border-[#E8973A]/50 hover:bg-[#E8973A]/5 transition-all cursor-pointer">
                <ImageIcon className="w-4 h-4 text-[#E8973A]" />
                <span className="text-sm font-medium text-gray-700">
                  {selectedImageFile
                    ? selectedImageFile.name
                    : "Choose image file"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setSelectedImageFile(e.target.files?.[0] || null)
                  }
                  className="hidden"
                />
              </label>
              {(selectedImageFile || formData.imageUrl?.trim()) && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs text-gray-500">
                  <span className="truncate">
                    {selectedImageFile
                      ? "Will upload on save"
                      : "Existing image kept unless replaced"}
                  </span>
                  {selectedImageFile && (
                    <button
                      type="button"
                      onClick={() => setSelectedImageFile(null)}
                      className="shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Import Details
              </label>
              <textarea
                placeholder="e.g. Container info, supplier details..."
                value={formData.importDetails || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    importDetails: e.target.value,
                  }))
                }
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-gray-900 transition-all resize-none"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-gray-700 border-b border-gray-200 pb-2">
              Dimensions & Pricing
            </h3>

            {/* Width & Height */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">
                  Width (in)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={formData.width ?? ""}
                  onChange={(e) => handleNumberField("width", e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-gray-900 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">
                  Height (in)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={formData.height ?? ""}
                  onChange={(e) => handleNumberField("height", e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-gray-900 transition-all"
                />
              </div>
            </div>

            {/* Size — auto-calculated */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Size / Specifications
              </label>
              <div className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium min-h-11 flex items-center">
                {formData.size || (
                  <span className="text-gray-400 italic">
                    Auto-calculated from Width x Height
                  </span>
                )}
              </div>
            </div>

            {/* Effective Area */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Effective Area (ft²)
              </label>
              <input
                type="number"
                placeholder="0.0000"
                min="0"
                step="0.0001"
                value={formData.effectiveArea ?? ""}
                onChange={(e) =>
                  handleNumberField("effectiveArea", e.target.value)
                }
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-gray-900 transition-all"
              />
              <p className="text-xs text-gray-400">
                Enter the effective coverage area per panel unit
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Price (LKR)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  Rs.
                </span>
                <input
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={formData.price || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      price: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-gray-900 transition-all"
                />
              </div>
            </div>

            <h3 className="text-base font-semibold text-gray-700 border-b border-gray-200 pb-2 pt-2">
              Stock
            </h3>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Initial Quantity
              </label>
              <input
                type="number"
                placeholder="0"
                min="0"
                value={formData.quantity || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    quantity: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-gray-900 transition-all"
              />
            </div>

            {/* Total Effective Area — computed, read-only */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Total Effective Area (ft²)
              </label>
              <div className="w-full px-4 py-2.5 bg-[#E8973A]/5 border border-[#E8973A]/20 rounded-xl text-gray-900 font-semibold text-lg">
                {(formData.totalEffectiveArea ?? 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}{" "}
                ft²
              </div>
              <p className="text-xs text-gray-400">
                Effective Area × Quantity ={" "}
                {(Number(formData.effectiveArea) || 0).toFixed(4)} ×{" "}
                {formData.quantity || 0}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value as PanelData["status"],
                  }))
                }
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-gray-900 transition-all appearance-none"
              >
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
