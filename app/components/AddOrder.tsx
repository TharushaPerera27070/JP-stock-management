import React from 'react';
import { ArrowLeft, Save, Plus, Search } from 'lucide-react';

interface AddOrderProps {
  onBack: () => void;
}

export default function AddOrder({ onBack }: AddOrderProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold">Create New Order</h2>
            <p className="text-zinc-400 text-sm">Draft a new sales order for a customer</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-all shadow-lg shadow-indigo-500/20">
          <Save className="w-4 h-4" /> Save Order
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
            <h3 className="text-lg font-medium border-b border-white/10 pb-4 mb-4">Order Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Customer</label>
                <select className="w-full px-4 py-2.5 bg-[#0a0a0b] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white transition-all appearance-none">
                  <option value="">Select a Customer...</option>
                  <option value="1">BuildTech Constructions</option>
                  <option value="2">Skyline Developers</option>
                  <option value="3">GreenEco Builders</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Order Date</label>
                <input type="date" className="w-full px-4 py-2.5 bg-[#0a0a0b] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white transition-all [color-scheme:dark]" />
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h3 className="text-lg font-medium">Order Items</h3>
              <button className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300">
                <Plus className="w-4 h-4" /> Add Panel
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Item Row 1 */}
              <div className="flex items-end gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-sm text-zinc-500">Panel</label>
                  <select className="w-full px-4 py-2 bg-[#0a0a0b] border border-white/10 rounded-lg text-sm text-white">
                    <option>PU Wall Sandwich Panel (50mm)</option>
                    <option>EPS Roof Sandwich Panel (75mm)</option>
                  </select>
                </div>
                <div className="w-24 space-y-2">
                  <label className="text-sm text-zinc-500">Qty (sqm)</label>
                  <input type="number" defaultValue="50" className="w-full px-4 py-2 bg-[#0a0a0b] border border-white/10 rounded-lg text-sm text-white text-right" />
                </div>
                <div className="w-32 space-y-2">
                  <label className="text-sm text-zinc-500">Price/sqm</label>
                  <input type="text" readOnly value="7,650.00" className="w-full px-4 py-2 bg-[#0a0a0b]/50 border border-white/10 rounded-lg text-sm text-zinc-400 text-right" />
                </div>
                <div className="w-32 space-y-2">
                  <label className="text-sm text-zinc-500">Total (LKR)</label>
                  <input type="text" readOnly value="382,500.00" className="w-full px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-sm text-indigo-400 font-medium text-right" />
                </div>
              </div>

              {/* Item Row 2 */}
              <div className="flex items-end gap-4">
                <div className="flex-1 space-y-2">
                  <select className="w-full px-4 py-2 bg-[#0a0a0b] border border-white/10 rounded-lg text-sm text-white">
                    <option>EPS Roof Sandwich Panel (75mm)</option>
                    <option>PU Wall Sandwich Panel (50mm)</option>
                  </select>
                </div>
                <div className="w-24 space-y-2">
                  <input type="number" defaultValue="20" className="w-full px-4 py-2 bg-[#0a0a0b] border border-white/10 rounded-lg text-sm text-white text-right" />
                </div>
                <div className="w-32 space-y-2">
                  <input type="text" readOnly value="5,625.00" className="w-full px-4 py-2 bg-[#0a0a0b]/50 border border-white/10 rounded-lg text-sm text-zinc-400 text-right" />
                </div>
                <div className="w-32 space-y-2">
                  <input type="text" readOnly value="112,500.00" className="w-full px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-sm text-indigo-400 font-medium text-right" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Summary */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-xl h-fit sticky top-24">
          <h3 className="text-lg font-medium border-b border-white/10 pb-4 mb-4">Summary</h3>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-zinc-400 text-sm">
              <span>Subtotal</span>
              <span>LKR 495,000.00</span>
            </div>
            <div className="flex justify-between text-zinc-400 text-sm">
              <span>Tax (0%)</span>
              <span>LKR 0.00</span>
            </div>
            <div className="flex justify-between text-zinc-400 text-sm">
              <span>Delivery</span>
              <span>LKR 15,000.00</span>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 flex justify-between items-center">
            <span className="font-medium text-white">Total</span>
            <span className="text-2xl font-bold text-indigo-400">LKR 510,000.00</span>
          </div>

          <div className="mt-8 space-y-2">
            <label className="text-sm font-medium text-zinc-400">Status</label>
            <select className="w-full px-4 py-2.5 bg-[#0a0a0b] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white transition-all appearance-none">
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </div>

      </div>
    </div>
  );
}
