import React, { useState } from "react";
import {
  Search,
  Plus,
  Filter,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  Box,
  X,
} from "lucide-react";
import Image from "next/image";
import { InventoryItem } from "../types";

interface InventoryProps {
  items: InventoryItem[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: string) => void;
  setEditingPanel: (panel: InventoryItem | null) => void;
  handleEditPanelClick: (item: InventoryItem) => void;
  handleDeletePanel: (item: InventoryItem) => void;
  formatLKR: (amount: number) => string;
}

export default function Inventory({
  items,
  searchQuery,
  setSearchQuery,
  setActiveTab,
  setEditingPanel,
  handleEditPanelClick,
  handleDeletePanel,
  formatLKR,
}: InventoryProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const filtered = items.filter(
    (i) =>
      `${i.design} ${i.panelType} Panel`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      i.panelId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.color || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search inventory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 w-full sm:w-64 placeholder:text-gray-600 transition-all"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-white transition-colors shrink-0">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
          <button
            onClick={() => {
              setEditingPanel(null);
              setActiveTab("add-panel");
            }}
            className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E8973A] hover:bg-[#d4832b] text-gray-900 text-sm font-medium transition-all shadow-lg shadow-[#E8973A]/20"
          >
            <Plus className="w-4 h-4" /> Add Panel
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-x-auto scrollbar-thin scrollbar-track-white scrollbar-thumb-white">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 border border-gray-100 text-gray-400">
                <Box className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                No panels found
              </h3>
              <p className="text-gray-500 text-sm mt-1 max-w-sm">
                {searchQuery
                  ? "Try a different search term."
                  : "Add your first panel to get started."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/40 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-4 font-medium tracking-wider">
                    Photo
                  </th>
                  <th className="px-5 py-4 font-medium tracking-wider">
                    Design
                  </th>
                  <th className="px-5 py-4 font-medium tracking-wider">
                    Color
                  </th>
                  <th className="px-5 py-4 font-medium tracking-wider">
                    Panel ID
                  </th>
                  <th className="px-5 py-4 font-medium tracking-wider">
                    Size / Specifications
                  </th>
                  <th className="px-5 py-4 font-medium tracking-wider text-right">
                    Qty
                  </th>
                  <th className="px-5 py-4 font-medium tracking-wider text-right">
                    Total Area (ft²)
                  </th>
                  <th className="px-5 py-4 font-medium tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-4 font-medium tracking-wider text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/40 transition-colors group"
                  >
                    {/* Photo */}
                    <td className="px-5 py-4">
                      {item.imageUrl?.trim() ? (
                        <button
                          type="button"
                          onClick={() => setPreviewImage(item.imageUrl!.trim())}
                          className="w-12 h-12 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 cursor-zoom-in hover:opacity-80 hover:ring-2 hover:ring-[#E8973A]/50 transition-all"
                          title="Click to enlarge"
                        >
                          <Image
                            src={item.imageUrl.trim()}
                            alt={item.design}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </button>
                      ) : (
                        <div className="w-12 h-12 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                          <Box className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </td>

                    {/* Design */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-900">
                        {item.design}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {item.panelType}
                      </div>
                    </td>

                    {/* Color */}
                    <td className="px-5 py-4 text-gray-600">
                      {item.color || <span className="text-gray-300">—</span>}
                    </td>

                    {/* Panel ID */}
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                        {item.panelId}
                      </span>
                    </td>

                    {/* Size / Specifications */}
                    <td className="px-5 py-4 text-gray-600">
                      {item.size || <span className="text-gray-300">—</span>}
                    </td>

                    {/* Qty */}
                    <td className="px-5 py-4 text-right font-semibold text-gray-900">
                      {item.quantity.toLocaleString()}
                    </td>

                    {/* Total Effective Area */}
                    <td className="px-5 py-4 text-right">
                      {(item as any).totalEffectiveArea != null ? (
                        <span className="font-semibold text-gray-900">
                          {Number(
                            (item as any).totalEffectiveArea,
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 4,
                          })}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          item.status === "In Stock"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : item.status === "Low Stock"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-red-50 text-red-600 border-red-200"
                        }`}
                      >
                        {item.status === "In Stock" && (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        {item.status !== "In Stock" && (
                          <AlertCircle className="w-3.5 h-3.5" />
                        )}
                        {item.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditPanelClick(item)}
                          className="p-1.5 text-gray-400 hover:text-[#E8973A] hover:bg-[#E8973A]/10 rounded-md transition-colors"
                          title="Edit Panel"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePanel(item)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete Panel"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="relative max-w-3xl max-h-[85vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={previewImage}
              alt="Panel preview"
              width={800}
              height={800}
              unoptimized
              className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
