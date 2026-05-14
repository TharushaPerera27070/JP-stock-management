import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Box } from 'lucide-react';

export interface PanelData {
  panelId: string;
  panelType: string;
  design: string;
  color: string;
  price: number;
  quantity: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

interface AddPanelProps {
  onBack: () => void;
  onSave: (panel: PanelData) => void;
  initialData?: PanelData;
}

const wallCeilingDesigns = ["Naro-Span", "Smart-Span", "Kaisei", "Nagarekoku", "Sagan", "Jupiter", "Comet"];
const roofingDesigns = ["Corrugated", "Sirius"];

export default function AddPanel({ onBack, onSave, initialData }: AddPanelProps) {
  const [formData, setFormData] = useState<PanelData>(initialData || {
    panelId: 'WAL-NARO-XXX',
    panelType: 'Wall',
    design: wallCeilingDesigns[0],
    color: '',
    price: 0,
    quantity: 0,
    status: 'In Stock'
  });

  useEffect(() => {
    let typePrefix = formData.panelType.substring(0, 3).toUpperCase();
    if (formData.panelType === 'Wall/ Ceiling') {
      typePrefix = 'WNC';
    }
    const designPrefix = formData.design.substring(0, 4).toUpperCase();
    const colorPrefix = formData.color ? formData.color.substring(0, 3).toUpperCase() : 'XXX';

    setFormData(prev => ({
      ...prev,
      panelId: `${typePrefix}-${designPrefix}-${colorPrefix}`
    }));
  }, [formData.panelType, formData.design, formData.color]);

  const handleSave = () => {
    if (!formData.panelId) {
      alert('Please fill in the Panel ID.');
      return;
    }
    onSave(formData);
  };

  const handlePanelTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    const newDesign = (newType === 'Roofing') ? roofingDesigns[0] : wallCeilingDesigns[0];

    setFormData({
      ...formData,
      panelType: newType,
      design: newDesign
    });
  };

  const availableDesigns = (formData.panelType === 'Roofing') ? roofingDesigns : wallCeilingDesigns;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold">{initialData ? 'Edit Panel' : 'Add New Panel'}</h2>
            <p className="text-zinc-400 text-sm">{initialData ? 'Update panel details and stock' : 'Add a new sandwich panel to your inventory'}</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-all shadow-lg shadow-indigo-500/20"
        >
          <Save className="w-4 h-4" /> Save Panel
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b border-white/10 pb-2">Basic Information</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Panel ID</label>
              <input
                type="text"
                readOnly
                value={formData.panelId}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none text-zinc-400 transition-all cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Panel Type</label>
              <select
                value={formData.panelType}
                onChange={handlePanelTypeChange}
                className="w-full px-4 py-2.5 bg-[#0a0a0b] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white transition-all appearance-none"
              >
                <option value="Wall">Wall</option>
                <option value="Roofing">Roofing</option>
                <option value="Ceiling">Ceiling</option>
                <option value="Wall/ Ceiling">Wall/ Ceiling</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Design</label>
              <select
                value={formData.design}
                onChange={(e) => setFormData({ ...formData, design: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#0a0a0b] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white transition-all appearance-none"
              >
                {availableDesigns.map(design => (
                  <option key={design} value={design}>{design}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Color</label>
              <input
                type="text"
                placeholder="e.g. White, Grey"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#0a0a0b] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white transition-all"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b border-white/10 pb-2">Pricing & Stock</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Price per Sqft (LKR)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">Rs.</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-12 pr-4 py-2.5 bg-[#0a0a0b] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Initial Quantity</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Box className="w-4 h-4" />
                </span>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.quantity || ''}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full pl-12 pr-4 py-2.5 bg-[#0a0a0b] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-2.5 bg-[#0a0a0b] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white transition-all appearance-none"
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
