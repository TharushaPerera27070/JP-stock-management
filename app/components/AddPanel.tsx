import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Box } from 'lucide-react';

export interface PanelData {
  panelId: string;
  panelType: string;
  design: string;
  color: string;
  size: string;
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

const pricingOptions: Record<string, { label: string, price: number }[]> = {
  'Wall': [
    { label: '10ft (120 inch) x 17" width', price: 15230 },
    { label: '12 1/2 ft (150 inch) x 17" width', price: 18900 },
    { label: '13ft (156 inch) x 17" width', price: 19800 },
    { label: '10ft (120 inch) x 16" width', price: 14350 },
    { label: '12 1/2 ft (150 inch) x 16" width', price: 17900 },
    { label: '13ft (156 inch) x 16" width', price: 18650 },

  ],
  'Ceiling': [
    { label: '7 1/2ft x 16.5" width', price: 11100 },
    { label: '10ft x 12" width', price: 10750 },
    { label: '10ft x 17" width', price: 15230 },
    { label: '12ft x 17" width', price: 18275 },
    { label: '13ft x 17" width', price: 19800 },
    { label: '10ft (120 inch) x 16" width', price: 14350 },
    { label: '12 1/2 ft (150 inch) x 16" width', price: 17900 },
    { label: '13ft (156 inch) x 16" width', price: 18650 },

  ],
  'Wall/ Ceiling': [
    { label: '7 1/2ft x 16.5" width', price: 11100 },
    { label: '10ft x 12" width', price: 10750 },
    { label: '10ft x 17" width', price: 15230 },
    { label: '12ft x 17" width', price: 18275 },
    { label: '12 1/2 ft (150 inch) x 17" width', price: 18900 },
    { label: '13ft x 17" width', price: 19800 },
    { label: '10ft (120 inch) x 16" width', price: 14350 },
    { label: '12 1/2 ft (150 inch) x 16" width', price: 17900 },
    { label: '13ft (156 inch) x 16" width', price: 18650 },

  ],
  'Roofing': [
    { label: '9ft (30mm thickness)', price: 18500 },
    { label: '10ft (30mm thickness)', price: 20600 },
    { label: '10ft (40mm/50mm thickness)', price: 23400 },
    { label: '11ft (30mm thickness)', price: 22600 },
    { label: '11ft (40mm/50mm thickness)', price: 25750 },

  ]
};

export default function AddPanel({ onBack, onSave, initialData }: AddPanelProps) {
  const [formData, setFormData] = useState<PanelData>(initialData || {
    panelId: 'WAL-NARO-XXX',
    panelType: 'Wall',
    design: wallCeilingDesigns[0],
    color: '',
    size: pricingOptions['Wall'][0].label,
    price: pricingOptions['Wall'][0].price,
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

    // Add a size hint to the ID to distinguish identical colors but different lengths
    let sizeSuffix = '';
    if (formData.size && !formData.size.includes('Custom')) {
      const match = formData.size.match(/^(\d+(?: 1\/2)?|\d+\.\d+)ft/);
      if (match) {
        sizeSuffix = '-' + match[1].replace(' 1/2', '.5') + 'FT';
      }
    }

    setFormData(prev => ({
      ...prev,
      panelId: `${typePrefix}-${designPrefix}-${colorPrefix}${sizeSuffix}`
    }));
  }, [formData.panelType, formData.design, formData.color, formData.size]);

  const handleSave = () => {
    if (!formData.panelId) {
      alert('Please fill in the Panel ID.');
      return;
    }
    if (!formData.size) {
      alert('Please select a specification or custom size.');
      return;
    }
    onSave(formData);
  };

  const handlePanelTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    const newDesign = (newType === 'Roofing') ? roofingDesigns[0] : wallCeilingDesigns[0];
    const newSizeOptions = pricingOptions[newType] || pricingOptions['Wall'];
    const newSize = newSizeOptions[0].label;
    const newPrice = newSizeOptions[0].price;

    setFormData({
      ...formData,
      panelType: newType,
      design: newDesign,
      size: newSize,
      price: newPrice
    });
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLabel = e.target.value;
    const options = pricingOptions[formData.panelType] || [];
    const selectedOption = options.find(opt => opt.label === selectedLabel);

    setFormData({
      ...formData,
      size: selectedLabel,
      price: selectedOption && selectedOption.price > 0 ? selectedOption.price : formData.price
    });
  };

  const availableDesigns = (formData.panelType === 'Roofing') ? roofingDesigns : wallCeilingDesigns;
  const currentSizeOptions = pricingOptions[formData.panelType] || pricingOptions['Wall'];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold">{initialData ? 'Edit Panel' : 'Add New Panel'}</h2>
            <p className="text-gray-400 text-sm">{initialData ? 'Update panel details and stock' : 'Add a new sandwich panel to your inventory'}</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#E8973A] hover:bg-[#d4832b] text-white font-medium transition-all shadow-lg shadow-[#E8973A]/20"
        >
          <Save className="w-4 h-4" /> Save Panel
        </button>
      </div>

      <div className="bg-gray-800 border border-gray-800 rounded-2xl p-8 backdrop-blur-sm shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b border-gray-800 pb-2">Basic Information</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Panel ID</label>
              <input
                type="text"
                readOnly
                value={formData.panelId}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-800 rounded-xl focus:outline-none text-gray-400 transition-all cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Panel Type</label>
              <select
                value={formData.panelType}
                onChange={handlePanelTypeChange}
                className="w-full px-4 py-2.5 bg-black border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-white transition-all appearance-none"
              >
                <option value="Wall">Wall</option>
                <option value="Roofing">Roofing</option>
                <option value="Ceiling">Ceiling</option>
                <option value="Wall/ Ceiling">Wall/ Ceiling</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Design</label>
              <select
                value={formData.design}
                onChange={(e) => setFormData({ ...formData, design: e.target.value })}
                className="w-full px-4 py-2.5 bg-black border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-white transition-all appearance-none"
              >
                {availableDesigns.map(design => (
                  <option key={design} value={design}>{design}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Color</label>
              <input
                type="text"
                placeholder="e.g. White, Grey"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-4 py-2.5 bg-black border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-white transition-all"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b border-gray-800 pb-2">Pricing & Stock</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Size / Specifications</label>
              <select
                value={formData.size}
                onChange={handleSizeChange}
                className="w-full px-4 py-2.5 bg-black border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-white transition-all appearance-none"
              >
                {currentSizeOptions.map(opt => (
                  <option key={opt.label} value={opt.label}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Price (LKR)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Rs.</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-12 pr-4 py-2.5 bg-black border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-white transition-all"
                />
              </div>
              {formData.size && formData.size.includes('Custom') && (
                <p className="text-xs text-gray-500/80 mt-1">
                  You selected Custom Size. Please manually enter the final calculated price based on the Sqft rate.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Initial Quantity</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <Box className="w-4 h-4" />
                </span>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.quantity || ''}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full pl-12 pr-4 py-2.5 bg-black border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-2.5 bg-black border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-white transition-all appearance-none"
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
