import React from 'react';
import { TrendingUp, Package, ShoppingCart, Clock, AlertCircle, ArrowUpRight, FileText } from 'lucide-react';
import { InventoryItem, OrderData } from '../types';

interface DashboardProps {
  thisMonthRevenue: number;
  totalValue: number;
  lowStockCount: number;
  orders: OrderData[];
  items: InventoryItem[];
  setActiveTab: (tab: string) => void;
  formatLKR: (amount: number) => string;
}

export default function Dashboard({ thisMonthRevenue, totalValue, lowStockCount, orders, items, setActiveTab, formatLKR }: DashboardProps) {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-gray-200 backdrop-blur-sm flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#E8973A]/10 rounded-full blur-2xl group-hover:bg-[#E8973A]/20 transition-all duration-500" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-gray-500 font-medium">Total Revenue</span>
            <div className="p-2 rounded-lg bg-[#E8973A]/20 text-[#E8973A]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-bold tracking-tighter">{formatLKR(thisMonthRevenue)}</h3>
            <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +15.3% this month
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-gray-200 backdrop-blur-sm flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-gray-900/5 rounded-full blur-2xl group-hover:bg-gray-900/10 transition-all duration-500" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-gray-500 font-medium">Stock Value</span>
            <div className="p-2 rounded-lg bg-gray-900/10 text-gray-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-bold tracking-tighter">{formatLKR(totalValue)}</h3>
            <p className="text-sm text-gray-500 mt-2">Current inventory worth</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-gray-200 backdrop-blur-sm flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-gray-900/5 rounded-full blur-2xl group-hover:bg-gray-900/10 transition-all duration-500" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-gray-500 font-medium">Active Orders</span>
            <div className="p-2 rounded-lg bg-gray-900/10 text-gray-600">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-bold tracking-tighter">{orders.filter(o => o.status !== 'Delivered').length}</h3>
            <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" /> pending fulfillment
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-gray-200 backdrop-blur-sm flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-gray-900/5 rounded-full blur-2xl group-hover:bg-gray-900/10 transition-all duration-500" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-gray-500 font-medium">Low Stock Alerts</span>
            <div className="p-2 rounded-lg bg-gray-900/10 text-gray-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-bold tracking-tighter">{lowStockCount}</h3>
            <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
              Panels require restock
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-gray-200 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Recent Orders</h3>
            <button onClick={() => setActiveTab('orders')} className="text-sm text-[#E8973A] hover:text-[#E8973A] flex items-center gap-1">
              View All <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {orders.slice(0,3).map(order => (
              <div key={order.id} className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-200 hover:bg-white transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#E8973A]/20 flex items-center justify-center text-[#E8973A]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{order.customer}</h4>
                    <p className="text-xs text-gray-500">
                      {order.timestamp 
                        ? new Date(order.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        : '--:--'} • {order.items} Sqft
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatLKR(order.total)}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                    order.status === 'Delivered' ? 'bg-gray-900/10 text-gray-600' :
                    order.status === 'Processing' ? 'bg-gray-900/10 text-gray-600' :
                    'bg-gray-900/10 text-gray-600'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-gray-200 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Low Stock Panels</h3>
            <button onClick={() => setActiveTab('inventory')} className="text-sm text-[#E8973A] hover:text-[#E8973A] flex items-center gap-1">
              View Inventory <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {items.filter(i => i.status !== 'In Stock').map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-gray-300/10 hover:bg-gray-900/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-900/10 flex items-center justify-center text-gray-600">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{item.design} {item.panelType} Panel</h4>
                    <p className="text-xs text-gray-500">ID: {item.panelId}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="font-bold text-gray-600">{item.quantity} Sqft</div>
                  <span className="text-xs text-gray-500 mt-1">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
