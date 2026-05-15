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
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Orders from './components/Orders';
import Customers from './components/Customers';
import Reports from './components/Reports';
import { InventoryItem } from './types';
import Image from 'next/image';

const mockCustomers = [
  { id: 'CUST-01', name: 'Nimal Perera', company: 'BuildTech Constructions', email: 'nimal@buildtech.lk', phone: '+94 77 123 4567', totalOrders: 12 },
  { id: 'CUST-02', name: 'Sarah Fernando', company: 'Skyline Developers', email: 'sarah@skyline.lk', phone: '+94 71 987 6543', totalOrders: 8 },
  { id: 'CUST-03', name: 'Kamal Silva', company: 'GreenEco Builders', email: 'kamal@greeneco.lk', phone: '+94 70 555 1234', totalOrders: 3 },
  { id: 'CUST-04', name: 'Tariq Ahmed', company: 'Prime Structures', email: 'tariq@prime.lk', phone: '+94 76 222 9876', totalOrders: 15 },
];

export default function InventoryDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const [items, setItems] = useState<InventoryItem[]>([]);
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
  const [orders, setOrders] = useState<any[]>([]);
  const customers = mockCustomers;

  useEffect(() => {
    const q = query(collection(db, 'orders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData: any[] = [];
      snapshot.forEach(doc => {
        ordersData.push({ id: doc.id, ...doc.data() });
      });
      // Sort orders newest first
      ordersData.sort((a, b) => new Date(b.timestamp || b.date).getTime() - new Date(a.timestamp || a.date).getTime());
      setOrders(ordersData);
    });
    return () => unsubscribe();
  }, []);

  const totalValue = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const lowStockCount = items.filter(item => item.status === 'Low Stock' || item.status === 'Out of Stock').length;

  const thisMonthRevenue = orders.reduce((acc, order) => acc + order.total, 0);

  const formatLKR = (amount: number) => `LKR ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="flex h-screen w-full bg-black text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-800 bg-black flex flex-col justify-between">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-15 h-15 rounded-full bg-white flex items-center justify-center shadow-lg shadow-[#E8973A]/20">
              <Image src="/Japan-Gedara-Logo-removebg-preview.png" alt="Logo" width={50} height={50} />
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === item.id
                  ? 'bg-gray-800 text-white shadow-sm'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
              >
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-[#E8973A]' : ''}`} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 border-t border-gray-800">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-all duration-300">
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 mt-2">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Background Gradients for Premium feel */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#E8973A]/10 via-[#E8973A]/5 to-transparent pointer-events-none z-0" />

        {/* Topbar */}
        <header className="h-20 border-b border-gray-800 px-8 flex items-center justify-between backdrop-blur-md bg-black/80 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold tracking-tight capitalize">{activeTab}</h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search everywhere..."
                className="pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#E8973A]/50 focus:border-transparent transition-all w-64 placeholder:text-gray-500"
              />
            </div>
            <button className="relative p-2 rounded-full hover:bg-gray-800 transition-colors">
              <Bell className="w-5 h-5 text-gray-400" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#E8973A] rounded-full border-2 border-[#0a0a0b]"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-gray-800">
              <div className="w-9 h-9 rounded-full bg-[#E8973A]" />
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-tight">Admin User</span>
                <span className="text-xs text-gray-500">JP Operations</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-8 z-10 relative scroll-smooth">
          {activeTab === 'dashboard' && <Dashboard thisMonthRevenue={thisMonthRevenue} totalValue={totalValue} lowStockCount={lowStockCount} orders={orders} items={items} setActiveTab={setActiveTab} formatLKR={formatLKR} />}
          {activeTab === 'inventory' && <Inventory items={items} searchQuery={searchQuery} setSearchQuery={setSearchQuery} setActiveTab={setActiveTab} setEditingPanel={setEditingPanel} handleEditPanelClick={handleEditPanelClick} handleDeletePanel={handleDeletePanel} formatLKR={formatLKR} />}
          {activeTab === 'orders' && <Orders orders={orders} setActiveTab={setActiveTab} formatLKR={formatLKR} />}
          {activeTab === 'customers' && <Customers customers={customers} setActiveTab={setActiveTab} />}
          {activeTab === 'reports' && <Reports />}
          {activeTab === 'add-panel' && <AddPanel
            initialData={editingPanel ? { ...editingPanel, size: editingPanel.size || '' } : undefined}
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
          {activeTab === 'add-order' && <AddOrder
            inventory={items}
            customers={customers}
            onBack={() => setActiveTab('orders')}
            onSave={async (newOrder) => {
              try {
                // Save to 'orders' collection in Firebase
                await addDoc(collection(db, 'orders'), { ...newOrder, timestamp: new Date().toISOString() });
                setActiveTab('orders');
                alert("Order saved successfully!");
              } catch (error) {
                console.error("Error saving order:", error);
                alert("Failed to save order.");
              }
            }}
          />}
        </div>
      </main>
    </div>
  );
}
