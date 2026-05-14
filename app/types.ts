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
}
