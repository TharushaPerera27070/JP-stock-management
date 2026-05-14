import React from 'react';
import { Search, Plus, Filter, CheckCircle2, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import { InventoryItem } from '../types';

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
  formatLKR
}: InventoryProps) {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search inventory..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-[#0a0a0b] border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-64 placeholder:text-zinc-600 transition-all"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-sm font-medium hover:bg-white/5 transition-colors">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
          <button onClick={() => { setEditingPanel(null); setActiveTab('add-panel'); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-500/20">
            <Plus className="w-4 h-4" /> Add Panel
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden shadow-2xl">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black/40 text-zinc-400 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-medium tracking-wider">Product</th>
                <th className="px-6 py-4 font-medium tracking-wider">Panel ID</th>
                <th className="px-6 py-4 font-medium tracking-wider">Type</th>
                <th className="px-6 py-4 font-medium tracking-wider">Specifications</th>
                <th className="px-6 py-4 font-medium tracking-wider">Status</th>
                <th className="px-6 py-4 font-medium tracking-wider text-right">Qty</th>
                <th className="px-6 py-4 font-medium tracking-wider text-right">Price/Sqft</th>
                <th className="px-6 py-4 font-medium tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.filter(i => `${i.design} ${i.panelType} Panel`.toLowerCase().includes(searchQuery.toLowerCase()) || i.panelId.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{item.design} {item.panelType} Panel</div>
                    <div className="text-zinc-500 text-xs mt-0.5">Updated {item.lastUpdated}</div>
                  </td>
                  <td className="px-6 py-4 text-zinc-300">{item.panelId}</td>
                  <td className="px-6 py-4 text-zinc-300">
                    <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-xs text-indigo-300">
                      {item.panelType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-300">
                    <div className="flex flex-col gap-1">
                      <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-xs w-fit">
                        {item.design} ({item.color})
                      </span>
                      {item.size && (
                        <span className="text-xs text-zinc-500">{item.size}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      item.status === 'In Stock' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      item.status === 'Low Stock' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {item.status === 'In Stock' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {item.status === 'Low Stock' && <AlertCircle className="w-3.5 h-3.5" />}
                      {item.status === 'Out of Stock' && <AlertCircle className="w-3.5 h-3.5" />}
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 text-right text-zinc-300">
                    {formatLKR(item.price)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditPanelClick(item)} className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-md transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeletePanel(item)} className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-md transition-colors">
                        <Trash2 className="w-4 h-4" />
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
