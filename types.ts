
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  sku: string;
  image?: string;
  lowStockThreshold: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Transaction {
  id: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'qris';
  amountPaid: number;
  change: number;
}

export type View = 'dashboard' | 'pos' | 'inventory' | 'history' | 'reports';

export interface Category {
  id: string;
  name: string;
}
