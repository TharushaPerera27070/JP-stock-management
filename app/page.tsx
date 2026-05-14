"use client";

import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Plus, Filter, MoreHorizontal, 
  TrendingUp, AlertCircle, CheckCircle2, Box, 
  Users, Settings, LogOut, Trash2, Edit2, LayoutDashboard,
  ShoppingCart, BarChart3, Bell, ArrowUpRight, Clock,
  FileText, Download, Building2, Phone, Mail
} from 'lucide-react';
import { collection, onSnapshot, query, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import AddPanel from './components/AddPanel';
import AddCustomer from './components/AddCustomer';
import AddOrder from './components/AddOrder';

type ItemStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

interface InventoryItem {
  id: string;
  panelId: string;
  panelType: string;
  design: string;
  color: string;
  quantity: number;
  price: number;
  status: ItemStatus;
  lastUpdated: string;
}

const mockInventory: InventoryItem[] = [];

const mockOrders = [
  { id: 'ORD-1024', customer: 'BuildTech Constructions', date: '2026-05-14', items: 250, total: 1912500, status: 'Processing' },
  { id: 'ORD-1023', customer: 'Skyline Developers', date: '2026-05-12', items: 120, total: 675000, status: 'Delivered' },
  { id: 'ORD-1022', customer: 'GreenEco Builders', date: '2026-05-10', items: 45, total: 344250, status: 'Pending' },
  { id: 'ORD-1021', customer: 'Prime Structures', date: '2026-05-09', items: 500, total: 4750000, status: 'Delivered' },
];

const mockCustomers = [
  { id: 'CUST-01', name: 'Nimal Perera', company: 'BuildTech Constructions', email: 'nimal@buildtech.lk', phone: '+94 77 123 4567', totalOrders: 12 },
  { id: 'CUST-02', name: 'Sarah Fernando', company: 'Skyline Developers', email: 'sarah@skyline.lk', phone: '+94 71 987 6543', totalOrders: 8 },
  { id: 'CUST-03', name: 'Kamal Silva', company: 'GreenEco Builders', email: 'kamal@greeneco.lk', phone: '+94 70 555 1234', totalOrders: 3 },
  { id: 'CUST-04', name: 'Tariq Ahmed', company: 'Prime Structures', email: 'tariq@prime.lk', phone: '+94 76 222 9876', totalOrders: 15 },
];

export default function InventoryDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [items, setItems] = useState<InventoryItem[]>(mockInventory);
  const [editingPanel, setEditingPanel] = useState<InventoryItem | null>(null);

  const handleDeletePanel = async (item: InventoryItem) => {
    if (confirm(`Are you sure you want to delete this ${item.design} ${item.panelType} Panel?`)) {
      try {
        const docId = item.panelType === 'Wall/ Ceiling' ? 'WallnCeiling' : item.panelType;
        await deleteDoc(doc(db, 'panels', docId, 'items', item.id));
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Error deleting panel");
      }
    }
  };

  const handleEditPanelClick = (item: InventoryItem) => {
    setEditingPanel(item);
    setActiveTab('add-panel');
  };

  useEffect(() => {
    const types = ['Wall', 'Roofing', 'Ceiling', 'WallnCeiling'];
    const unsubscribes: (() => void)[] = [];
    const allItems: Record<string, InventoryItem[]> = {};

    types.forEach(type => {
      const q = query(collection(db, 'panels', type, 'items'));
      const unsub = onSnapshot(q, (snapshot) => {
        const typeItems: InventoryItem[] = [];
        snapshot.forEach(doc => {
          typeItems.push({ id: doc.id, ...doc.data() } as InventoryItem);
        });
        allItems[type] = typeItems;
        // Merge all arrays into one for the dashboard display
        const merged = Object.values(allItems).flat();
        setItems(merged);
      });
      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);
  const orders = mockOrders;
  const customers = mockCustomers;

  const totalValue = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const lowStockCount = items.filter(item => item.status === 'Low Stock' || item.status === 'Out of Stock').length;
  
  const thisMonthRevenue = orders.reduce((acc, order) => acc + order.total, 0);

  const formatLKR = (amount: number) => `LKR ${amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

  const renderDashboard = () => (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-zinc-400 font-medium">Total Revenue</span>
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-bold tracking-tighter">{formatLKR(thisMonthRevenue)}</h3>
            <p className="text-sm text-emerald-400 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +15.3% this month
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-zinc-400 font-medium">Stock Value</span>
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-bold tracking-tighter">{formatLKR(totalValue)}</h3>
            <p className="text-sm text-zinc-500 mt-2">Current inventory worth</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-500" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-zinc-400 font-medium">Active Orders</span>
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-bold tracking-tighter">12</h3>
            <p className="text-sm text-amber-400 mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" /> 4 pending fulfillment
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all duration-500" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-zinc-400 font-medium">Low Stock Alerts</span>
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-bold tracking-tighter">{lowStockCount}</h3>
            <p className="text-sm text-rose-400 mt-2 flex items-center gap-1">
              Panels require restock
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Recent Orders</h3>
            <button onClick={() => setActiveTab('orders')} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View All <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {orders.slice(0,3).map(order => (
              <div key={order.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{order.customer}</h4>
                    <p className="text-xs text-zinc-500">{order.id} • {order.items} sqm</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatLKR(order.total)}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                    order.status === 'Delivered' ? 'bg-emerald-500/20 text-emerald-400' :
                    order.status === 'Processing' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Low Stock Panels</h3>
            <button onClick={() => setActiveTab('inventory')} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View Inventory <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {items.filter(i => i.status !== 'In Stock').map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{item.design} {item.panelType} Panel</h4>
                    <p className="text-xs text-zinc-500">ID: {item.panelId}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="font-bold text-rose-400">{item.quantity} Sqft</div>
                  <span className="text-xs text-rose-500 mt-1">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderInventory = () => (
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
                <th className="px-6 py-4 font-medium tracking-wider">Design & Color</th>
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
                    <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-xs">
                      {item.design} ({item.color})
                    </span>
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

  const renderOrders = () => (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search orders..." 
              className="pl-9 pr-4 py-2 bg-[#0a0a0b] border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-64 placeholder:text-zinc-600 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-sm font-medium hover:bg-white/5 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
        <button onClick={() => setActiveTab('add-order')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-500/20">
          <Plus className="w-4 h-4" /> Create Order
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden shadow-2xl">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-black/40 text-zinc-400 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 font-medium tracking-wider">Order ID</th>
              <th className="px-6 py-4 font-medium tracking-wider">Customer</th>
              <th className="px-6 py-4 font-medium tracking-wider">Date</th>
              <th className="px-6 py-4 font-medium tracking-wider">Status</th>
              <th className="px-6 py-4 font-medium tracking-wider text-right">Items (sqm)</th>
              <th className="px-6 py-4 font-medium tracking-wider text-right">Total Amount</th>
              <th className="px-6 py-4 font-medium tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 font-medium text-indigo-400">{order.id}</td>
                <td className="px-6 py-4 text-white">{order.customer}</td>
                <td className="px-6 py-4 text-zinc-400">{order.date}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                    order.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    order.status === 'Processing' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-zinc-300">{order.items}</td>
                <td className="px-6 py-4 text-right font-medium text-white">{formatLKR(order.total)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-md transition-colors">
                      <FileText className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-md transition-colors">
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

  const renderCustomers = () => (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search customers..." 
              className="pl-9 pr-4 py-2 bg-[#0a0a0b] border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-64 placeholder:text-zinc-600 transition-all"
            />
          </div>
        </div>
        <button onClick={() => setActiveTab('add-customer')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-500/20">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {customers.map((customer) => (
          <div key={customer.id} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{customer.name}</h3>
                  <p className="text-zinc-400 text-sm flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3.5 h-3.5" /> {customer.company}
                  </p>
                </div>
              </div>
              <button className="text-zinc-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Mail className="w-4 h-4 text-zinc-500" /> {customer.email}
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Phone className="w-4 h-4 text-zinc-500" /> {customer.phone}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
              <span className="text-sm text-zinc-400">Total Orders</span>
              <span className="font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full text-sm">
                {customer.totalOrders}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="max-w-7xl mx-auto flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20">
        <BarChart3 className="w-10 h-10 text-indigo-400" />
      </div>
      <h2 className="text-3xl font-bold mb-4">Advanced Analytics Coming Soon</h2>
      <p className="text-zinc-400 max-w-md text-lg mb-8">
        We are building comprehensive sales reports, stock predictions, and profit margin analysis for your sandwich panels.
      </p>
      <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-all">
        <Download className="w-4 h-4" /> Download Basic CSV Report
      </button>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-[#0a0a0b] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-[#0a0a0b] flex flex-col justify-between">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">JP Stock</h1>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'inventory', label: 'Inventory', icon: Box },
              { id: 'orders', label: 'Orders', icon: ShoppingCart },
              { id: 'customers', label: 'Customers', icon: Users },
              { id: 'reports', label: 'Reports', icon: BarChart3 },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === item.id 
                    ? 'bg-white/10 text-white shadow-sm' 
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-indigo-400' : ''}`} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 border-t border-white/10">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-white/5 hover:text-white transition-all duration-300">
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 mt-2">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Background Gradients for Premium feel */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none z-0" />
        
        {/* Topbar */}
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between backdrop-blur-md bg-[#0a0a0b]/80 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold tracking-tight capitalize">{activeTab}</h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search everywhere..." 
                className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all w-64 placeholder:text-zinc-500"
              />
            </div>
            <button className="relative p-2 rounded-full hover:bg-white/10 transition-colors">
              <Bell className="w-5 h-5 text-zinc-400" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-[#0a0a0b]"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-white/10">
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-pink-500 to-orange-400" />
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-tight">Admin User</span>
                <span className="text-xs text-zinc-500">JP Operations</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-8 z-10 relative scroll-smooth">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'inventory' && renderInventory()}
          {activeTab === 'orders' && renderOrders()}
          {activeTab === 'customers' && renderCustomers()}
          {activeTab === 'reports' && renderReports()}
          {activeTab === 'add-panel' && <AddPanel 
            initialData={editingPanel || undefined}
            onBack={() => { setActiveTab('inventory'); setEditingPanel(null); }} 
            onSave={async (newPanel) => {
            const date = new Date().toISOString().split('T')[0];
            try {
              const docId = newPanel.panelType === 'Wall/ Ceiling' ? 'WallnCeiling' : newPanel.panelType;
              if (editingPanel) {
                const oldDocId = editingPanel.panelType === 'Wall/ Ceiling' ? 'WallnCeiling' : editingPanel.panelType;
                if (oldDocId === docId) {
                  // Type didn't change, update the existing document
                  await updateDoc(doc(db, 'panels', docId, 'items', editingPanel.id), { ...newPanel, lastUpdated: date });
                } else {
                  // Type changed, move document to new subcollection
                  await deleteDoc(doc(db, 'panels', oldDocId, 'items', editingPanel.id));
                  await addDoc(collection(db, 'panels', docId, 'items'), { ...newPanel, lastUpdated: date });
                }
              } else {
                // New document
                await addDoc(collection(db, 'panels', docId, 'items'), { ...newPanel, lastUpdated: date });
              }
              setActiveTab('inventory');
              setEditingPanel(null);
            } catch (error) {
              console.error("Error saving document: ", error);
              alert("Error saving panel");
            }
          }} />}
          {activeTab === 'add-customer' && <AddCustomer onBack={() => setActiveTab('customers')} />}
          {activeTab === 'add-order' && <AddOrder onBack={() => setActiveTab('orders')} />}
        </div>
      </main>
    </div>
  );
}
