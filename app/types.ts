export type ItemStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export interface InventoryItem {
  id: string;
  panelId: string;
  panelType: string;
  design: string;
  color: string;
  size?: string;
  quantity: number;
  price: number;
  status: ItemStatus;
  lastUpdated: string;
  imageUrl?: string;
  importDetails?: string;
}
export interface OrderLineItem {
  inventoryId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface OrderData {
  id?: string;
  invoiceNo?: string;
  customer: string;
  date: string;
  items: number;
  total: number;
  status: 'Pending' | 'Processing' | 'Delivered';
  lineItems: OrderLineItem[];
  deliveryFee: number;
  timestamp?: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  totalOrders: number;
}
