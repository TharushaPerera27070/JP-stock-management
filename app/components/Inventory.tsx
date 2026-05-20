import React from "react";
import {
  Search,
  Plus,
  Filter,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  Box,
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

        <div className="rounded-2xl border border-gray-200 bg-white backdrop-blur-sm shadow-2xl overflow-x-auto scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-700">
          <table className="w-full min-w-250 text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/40 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-medium tracking-wider">Photo</th>
                <th className="px-6 py-4 font-medium tracking-wider">
                  Product
                </th>
                <th className="px-6 py-4 font-medium tracking-wider">
                  Panel ID
                </th>
                <th className="px-6 py-4 font-medium tracking-wider">Type</th>
                <th className="px-6 py-4 font-medium tracking-wider">
                  Specifications
                </th>
                <th className="px-6 py-4 font-medium tracking-wider">Status</th>
                <th className="px-6 py-4 font-medium tracking-wider text-right">
                  Qty
                </th>
                <th className="px-6 py-4 font-medium tracking-wider text-right">
                  Price/Sqft
                </th>
                <th className="px-6 py-4 font-medium tracking-wider text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items
                .filter(
                  (i) =>
                    `${i.design} ${i.panelType} Panel`
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    i.panelId.toLowerCase().includes(searchQuery.toLowerCase()),
                )
                .map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-white transition-colors group"
                  >
                    <td className="px-6 py-4">
                      {item.imageUrl && item.imageUrl.trim() ? (
                        <div className="w-12 h-12 rounded-lg border border-gray-300 overflow-hidden bg-gray-900/50">
                          <Image
                            src={item.imageUrl.trim()}
                            alt={item.design}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg border border-gray-300 bg-white/50 flex items-center justify-center">
                          <Box className="w-6 h-6 text-gray-600" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {item.design} {item.panelType} Panel
                      </div>
                      <div className="text-gray-500 text-xs mt-0.5">
                        Updated {item.lastUpdated}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{item.panelId}</td>
                    <td className="px-6 py-4 text-gray-600">
                      <span className="px-2.5 py-1 rounded-md bg-white border border-gray-200 text-xs text-[#E8973A]">
                        {item.panelType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex flex-col gap-1">
                        <span className="px-2.5 py-1 rounded-md bg-white border border-gray-200 text-xs w-fit">
                          {item.design} ({item.color})
                        </span>
                        {item.size && (
                          <span className="text-xs text-gray-500">
                            {item.size}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          item.status === "In Stock"
                            ? "bg-gray-900/5 text-gray-600 border-gray-300/20"
                            : item.status === "Low Stock"
                              ? "bg-gray-900/5 text-gray-600 border-gray-300/20"
                              : "bg-gray-900/5 text-gray-600 border-gray-300/20"
                        }`}
                      >
                        {item.status === "In Stock" && (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        {item.status === "Low Stock" && (
                          <AlertCircle className="w-3.5 h-3.5" />
                        )}
                        {item.status === "Out of Stock" && (
                          <AlertCircle className="w-3.5 h-3.5" />
                        )}
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">
                      {formatLKR(item.price)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleEditPanelClick(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-[#E8973A] bg-white/50 hover:bg-[#E8973A]/10 border border-gray-300/50 hover:border-[#E8973A]/30 rounded-lg transition-all"
                          title="Edit Panel"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeletePanel(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-400 bg-white/50 hover:bg-red-500/10 border border-gray-300/50 hover:border-red-500/30 rounded-lg transition-all"
                          title="Delete Panel"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
