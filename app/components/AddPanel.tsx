import React, { useState } from "react";
import Papa from "papaparse";
import {
  Save,
  Box,
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
}

interface AddPanelProps {
  onBack: () => void;
  onSave: (panel: PanelData, silent?: boolean) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  initialData?: PanelData;
}

const wallCeilingDesigns = [
  "Naro-Span",
  "Smart-Span",
  "Kaisei",
  "Nagarekoku",
  "Sagan",
  "Jupiter",
  "Comet",
];
const roofingDesigns = ["Corrugated", "Sirius"];

const pricingOptions: Record<string, { label: string; price: number }[]> = {
  Wall: [
    { label: '10ft (120 inch) x 17" width', price: 15230 },
    { label: '12 1/2 ft (150 inch) x 17" width', price: 19050 },
    { label: '13ft (156 inch) x 17" width', price: 19800 },
    { label: '10ft (120 inch) x 16" width', price: 14350 },
    { label: '12 1/2 ft (150 inch) x 16" width', price: 17900 },
    { label: '13ft (156 inch) x 16" width', price: 18650 },
  ],
  Ceiling: [
    { label: '7 1/2ft x 16.5" width', price: 11100 },
    { label: '10ft x 12" width', price: 10750 },
    { label: '10ft x 17" width', price: 15230 },
    { label: '12ft x 17" width', price: 18275 },
    { label: '13ft x 17" width', price: 19800 },
    { label: '10ft (120 inch) x 16" width', price: 14350 },
    { label: '12 1/2 ft (150 inch) x 16" width', price: 17900 },
    { label: '13ft (156 inch) x 16" width', price: 18650 },
  ],
  "Wall/ Ceiling": [
    { label: '7 1/2ft x 16.5" width', price: 11100 },
    { label: '10ft x 12" width', price: 10750 },
    { label: '10ft x 17" width', price: 15230 },
    { label: '12ft x 17" width', price: 18275 },
    { label: '12 1/2 ft (150 inch) x 17" width', price: 19050 },
    { label: '13ft x 17" width', price: 19800 },
    { label: '10ft (120 inch) x 16" width', price: 14350 },
    { label: '12 1/2 ft (150 inch) x 16" width', price: 17900 },
    { label: '13ft (156 inch) x 16" width', price: 18650 },
  ],
  Roofing: [
    { label: "9ft (30mm thickness)", price: 18500 },
    { label: "10ft (30mm thickness)", price: 20600 },
    { label: "10ft (40mm/50mm thickness)", price: 23400 },
    { label: "11ft (30mm thickness)", price: 22600 },
    { label: "11ft (40mm/50mm thickness)", price: 25750 },
  ],
};

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
      panelId: "WAL-NARO-XXX",
      panelType: "Wall",
      design: wallCeilingDesigns[0],
      color: "",
      size: pricingOptions["Wall"][0].label,
      price: pricingOptions["Wall"][0].price,
      quantity: 0,
      status: "In Stock",
      imageUrl: "",
      importDetails: "",
    },
  );

  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
  } | null>(null);

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

  const generatePanelId = (panel: Partial<PanelData>) => {
    let typePrefix = (panel.panelType || "WAL").substring(0, 3).toUpperCase();
    if (panel.panelType === "Wall/ Ceiling") {
      typePrefix = "WNC";
    }
    const designPrefix = (panel.design || "XXXX").substring(0, 4).toUpperCase();
    const colorPrefix = panel.color
      ? panel.color.substring(0, 3).toUpperCase()
      : "XXX";

    let sizeSuffix = "";
    if (panel.size && !panel.size.includes("Custom")) {
      const match = panel.size.match(/^(\d+(?: 1\/2)?|\d+\.\d+)ft/);
      if (match) {
        sizeSuffix = "-" + match[1].replace(" 1/2", ".5") + "FT";
      }
    }

    return `${typePrefix}-${designPrefix}-${colorPrefix}${sizeSuffix}`;
  };

  // Update the panelId whenever relevant fields change
  const updatePanelId = (newData: Partial<PanelData>) => {
    const combined = { ...formData, ...newData };
    const newId = generatePanelId(combined);
    setFormData((prev) => ({ ...prev, ...newData, panelId: newId }));
  };

  const handleSave = async () => {
    if (!formData.panelId) {
      toast({ message: "Please fill in the Panel ID.", type: "error" });
      return;
    }
    if (!formData.size) {
      toast({
        message: "Please select a specification or custom size.",
        type: "error",
      });
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
      console.error("Failed to save panel image:", error);
      toast({
        message: "Failed to upload the panel image. Please try again.",
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
    const newSizeOptions = pricingOptions[newType] || pricingOptions["Wall"];
    const newSize = newSizeOptions[0].label;
    const newPrice = newSizeOptions[0].price;

    updatePanelId({
      panelType: newType,
      design: newDesign,
      size: newSize,
      price: newPrice,
    });
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLabel = e.target.value;
    const options = pricingOptions[formData.panelType] || [];
    const selectedOption = options.find((opt) => opt.label === selectedLabel);

    updatePanelId({
      size: selectedLabel,
      price:
        selectedOption && selectedOption.price > 0
          ? selectedOption.price
          : formData.price,
    });
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

            const panelData: PanelData = {
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
              price: price,
              quantity: quantity,
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
                "photo url",
                "image url",
              ]).trim(),
              importDetails: getVal([
                "importDetails",
                "import",
                "container",
                "details",
                "notes",
                "import info",
              ]).trim(),
              panelId: "", // Will be set below
            };

            panelData.panelId = generatePanelId(panelData);

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
        // Clear the input
        e.target.value = "";
      },
      error: (error) => {
        console.error("CSV Parse Error:", error);
        toast({
          message:
            "Error parsing CSV file. Please check the format and try again.",
          type: "error",
        });
        setIsImporting(false);
      },
    });
  };

  const availableDesigns =
    formData.panelType === "Roofing" ? roofingDesigns : wallCeilingDesigns;
  const currentSizeOptions =
    pricingOptions[formData.panelType] || pricingOptions["Wall"];
  const hasImportResults = importResults !== null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4"></div>
        <div className="flex items-center gap-3">
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
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#E8973A] hover:bg-[#d4832b] text-gray-900 font-medium transition-all shadow-lg shadow-[#E8973A]/20"
          >
            <Save className="w-4 h-4" /> Save Panel
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-8 backdrop-blur-sm shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-300 pb-6">
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
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed transition-all text-sm font-medium ${isImporting ? "border-gray-600 bg-white/50 cursor-not-allowed" : "border-[#E8973A]/30 hover:border-[#E8973A] hover:bg-[#E8973A]/5 cursor-pointer"}`}
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
                  'panelType,design,color,size,price,quantity,imageUrl,importDetails\nWall,Naro-Span,White,10ft (120 inch) x 17" width,15230,100,https://example.com/photo.jpg,Imported from Japan Container #12';
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
              <div>
                <p className="text-sm font-medium">
                  Import Complete: {importResults.success} success,{" "}
                  {importResults.failed} failed
                </p>
              </div>
            </div>
            <button
              onClick={() => setImportResults(null)}
              className="p-1 hover:bg-gray-900/5 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b border-gray-200 pb-2">
              Basic Information
            </h3>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Panel ID
              </label>
              <input
                type="text"
                readOnly
                value={formData.panelId}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none text-gray-500 transition-all cursor-not-allowed"
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
                onChange={(e) => updatePanelId({ design: e.target.value })}
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
                onChange={(e) => updatePanelId({ color: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-gray-900 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Photo</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 hover:border-[#E8973A]/50 hover:bg-[#E8973A]/5 transition-all cursor-pointer">
                  <ImageIcon className="w-4 h-4 text-[#E8973A]" />
                  <span className="text-sm font-medium text-gray-700">
                    {selectedImageFile ? "Replace image" : "Choose image file"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setSelectedImageFile(file);
                    }}
                    className="hidden"
                  />
                </label>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-700">
                      {selectedImageFile
                        ? selectedImageFile.name
                        : formData.imageUrl?.trim()
                          ? "Existing image will be kept unless replaced"
                          : "No image selected"}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {selectedImageFile
                        ? "This file will be uploaded to Firebase Storage when you save."
                        : formData.imageUrl?.trim()
                          ? formData.imageUrl.trim()
                          : "Image is optional."}
                    </p>
                  </div>
                  {selectedImageFile && (
                    <button
                      type="button"
                      onClick={() => setSelectedImageFile(null)}
                      className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b border-gray-200 pb-2">
              Pricing & Stock
            </h3>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Size / Specifications
              </label>
              <select
                value={formData.size}
                onChange={handleSizeChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-gray-900 transition-all appearance-none"
              >
                {currentSizeOptions.map((opt) => (
                  <option key={opt.label} value={opt.label}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Price (LKR)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  Rs.
                </span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.price || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-gray-900 transition-all"
                />
              </div>
              {formData.size && formData.size.includes("Custom") && (
                <p className="text-xs text-gray-500/80 mt-1">
                  You selected Custom Size. Please manually enter the final
                  calculated price based on the Sqft rate.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Initial Quantity
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <Box className="w-4 h-4" />
                </span>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.quantity || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-gray-900 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as PanelData["status"],
                  })
                }
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-gray-900 transition-all appearance-none"
              >
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Import Details
              </label>
              <textarea
                placeholder="e.g. Container info, Supplier details..."
                value={formData.importDetails || ""}
                onChange={(e) =>
                  setFormData({ ...formData, importDetails: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-gray-900 transition-all resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
