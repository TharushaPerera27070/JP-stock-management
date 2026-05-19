import React from 'react';
import { Search, Plus, Filter, FileText, Edit2 } from 'lucide-react';

import { OrderData } from '../types';

interface OrdersProps {
  orders: OrderData[];
  setActiveTab: (tab: string) => void;
  formatLKR: (amount: number) => string;
}

export default function Orders({ orders, setActiveTab, formatLKR }: OrdersProps) {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search orders..."
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 w-full sm:w-64 placeholder:text-gray-600 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-white transition-colors shrink-0">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
        <button onClick={() => setActiveTab('add-order')} className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E8973A] hover:bg-[#d4832b] text-gray-900 text-sm font-medium transition-all shadow-lg shadow-[#E8973A]/20">
          <Plus className="w-4 h-4" /> Create Order
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white backdrop-blur-sm overflow-hidden shadow-2xl">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50/40 text-gray-500 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-medium tracking-wider">Time</th>
              <th className="px-6 py-4 font-medium tracking-wider">Customer</th>
              <th className="px-6 py-4 font-medium tracking-wider">Date</th>
              <th className="px-6 py-4 font-medium tracking-wider">Status</th>
              <th className="px-6 py-4 font-medium tracking-wider text-right">Items (Qty)</th>
              <th className="px-6 py-4 font-medium tracking-wider text-right">Total Amount</th>
              <th className="px-6 py-4 font-medium tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-white transition-colors group">
                <td className="px-6 py-4 font-medium text-[#E8973A]">
                  {order.timestamp 
                    ? new Date(order.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : '--:--'}
                </td>
                <td className="px-6 py-4 text-gray-900">{order.customer}</td>
                <td className="px-6 py-4 text-gray-500">{order.date}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${order.status === 'Delivered' ? 'bg-gray-900/5 text-gray-600 border-gray-300/20' :
                      order.status === 'Processing' ? 'bg-gray-900/5 text-gray-600 border-gray-300/20' :
                        'bg-gray-900/5 text-gray-600 border-gray-300/20'
                    }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-gray-600">{order.items}</td>
                <td className="px-6 py-4 text-right font-medium text-gray-900">{formatLKR(order.total)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-gray-500 hover:text-[#E8973A] hover:bg-[#E8973A]/10 rounded-md transition-colors">
                      <FileText className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-gray-500 hover:text-[#E8973A] hover:bg-[#E8973A]/10 rounded-md transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
