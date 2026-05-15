import React, { useState } from 'react';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';

export interface OrderLineItem {
  inventoryId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface OrderData {
  customer: string;
  date: string;
  items: number; // Total quantity
  total: number; // Final total
  status: 'Pending' | 'Processing' | 'Delivered';
  lineItems: OrderLineItem[];
  deliveryFee: number;
}

interface AddOrderProps {
  onBack: () => void;
  onSave: (order: OrderData) => void;
  inventory: any[]; // The InventoryItem[] from page.tsx
  customers: any[]; // The customer list
}

export default function AddOrder({ onBack, onSave, inventory, customers }: AddOrderProps) {
  const [formData, setFormData] = useState<OrderData>({
    customer: '',
    date: new Date().toISOString().split('T')[0],
    items: 0,
    total: 0,
    status: 'Pending',
    lineItems: [],
    deliveryFee: 15000
  });

  const handleAddLineItem = () => {
    setFormData(prev => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        { inventoryId: '', name: '', quantity: 1, price: 0, total: 0 }
      ]
    }));
  };

  const handleRemoveLineItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index)
    }));
  };

  const handleLineItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.lineItems];
    const item = newItems[index];

    if (field === 'inventoryId') {
      const invItem = inventory.find(i => i.id === value);
      item.inventoryId = value as string;
      if (invItem) {
        item.name = `${invItem.design} ${invItem.panelType} Panel ${invItem.size ? `(${invItem.size})` : ''}`;
        item.price = invItem.price;
      }
    } else if (field === 'quantity') {
      item.quantity = Number(value);
    } else if (field === 'price') {
      item.price = Number(value);
    }

    item.total = item.quantity * item.price;
    newItems[index] = item;
    
    setFormData(prev => ({ ...prev, lineItems: newItems }));
  };

  const calculateSubtotal = () => {
    return formData.lineItems.reduce((acc, item) => acc + item.total, 0);
  };

  const calculateTotalQty = () => {
    return formData.lineItems.reduce((acc, item) => acc + item.quantity, 0);
  };

  const handleSave = () => {
    if (!formData.customer) {
      alert("Please select a customer.");
      return;
    }
    if (formData.lineItems.length === 0 || !formData.lineItems[0].inventoryId) {
      alert("Please add at least one valid item to the order.");
      return;
    }

    const subtotal = calculateSubtotal();
    const finalData: OrderData = {
      ...formData,
      items: calculateTotalQty(),
      total: subtotal + formData.deliveryFee
    };

    onSave(finalData);
  };

  const subtotal = calculateSubtotal();
  const finalTotal = subtotal + formData.deliveryFee;

  const formatLKR = (amount: number) => `LKR ${amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold">Create New Order</h2>
            <p className="text-gray-400 text-sm">Draft a new sales order for a customer</p>
          </div>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#E8973A] hover:bg-[#d4832b] text-white font-medium transition-all shadow-lg shadow-[#E8973A]/20">
          <Save className="w-4 h-4" /> Save Order
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-800 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
            <h3 className="text-lg font-medium border-b border-gray-800 pb-4 mb-4">Order Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Customer</label>
                <input 
                  type="text"
                  placeholder="Enter customer name..."
                  value={formData.customer}
                  onChange={(e) => setFormData({...formData, customer: e.target.value})}
                  className="w-full px-4 py-2.5 bg-black border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-white transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Order Date</label>
                <input 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-2.5 bg-black border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-white transition-all [color-scheme:dark]" 
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
              <h3 className="text-lg font-medium">Order Items</h3>
              <button onClick={handleAddLineItem} className="flex items-center gap-2 text-sm text-[#E8973A] hover:text-[#E8973A]">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.lineItems.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No items added yet. Click "Add Item" to start.
                </div>
              )}
              {formData.lineItems.map((item, index) => (
                <div key={index} className="flex items-end gap-4 p-3 bg-gray-800 rounded-xl border border-gray-800 relative group">
                  <div className="flex-1 space-y-2">
                    <label className="text-xs text-gray-500">Panel</label>
                    <select 
                      value={item.inventoryId}
                      onChange={(e) => handleLineItemChange(index, 'inventoryId', e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-sm text-white"
                    >
                      <option value="">Select Panel...</option>
                      {inventory.map((inv: any) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.design} {inv.panelType} {inv.size ? `(${inv.size})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-20 space-y-2">
                    <label className="text-xs text-gray-500">Qty</label>
                    <input 
                      type="number" 
                      value={item.quantity || ''}
                      onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-sm text-white text-right" 
                    />
                  </div>
                  <div className="w-28 space-y-2">
                    <label className="text-xs text-gray-500">Price/Sqft</label>
                    <input 
                      type="number" 
                      value={item.price || ''}
                      onChange={(e) => handleLineItemChange(index, 'price', e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-sm text-gray-300 text-right" 
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <label className="text-xs text-gray-500">Total (LKR)</label>
                    <input type="text" readOnly value={item.total.toLocaleString()} className="w-full px-3 py-2 bg-[#E8973A]/10 border border-[#E8973A]/20 rounded-lg text-sm text-[#E8973A] font-medium text-right" />
                  </div>
                  <button 
                    onClick={() => handleRemoveLineItem(index)}
                    className="absolute -right-2 -top-2 p-1.5 bg-gray-800/10 text-gray-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-800/20"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Summary */}
        <div className="bg-gray-800 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl h-fit sticky top-24">
          <h3 className="text-lg font-medium border-b border-gray-800 pb-4 mb-4">Summary</h3>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-gray-400 text-sm">
              <span>Subtotal</span>
              <span>{formatLKR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-400 text-sm">
              <span>Tax (0%)</span>
              <span>LKR 0.00</span>
            </div>
            <div className="flex justify-between text-gray-400 text-sm items-center">
              <span>Delivery</span>
              <div className="flex items-center gap-1 w-24">
                <span className="text-xs">Rs.</span>
                <input 
                  type="number" 
                  value={formData.deliveryFee || ''}
                  onChange={(e) => setFormData({...formData, deliveryFee: Number(e.target.value)})}
                  className="w-full px-2 py-1 bg-black border border-gray-800 rounded text-right text-sm"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-4 flex justify-between items-center">
            <span className="font-medium text-white">Total</span>
            <span className="text-2xl font-bold text-[#E8973A]">{formatLKR(finalTotal)}</span>
          </div>

          <div className="mt-8 space-y-2">
            <label className="text-sm font-medium text-gray-400">Status</label>
            <select 
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value as any})}
              className="w-full px-4 py-2.5 bg-black border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 text-white transition-all appearance-none"
            >
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        </div>

      </div>
    </div>
  );
}
