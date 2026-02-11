
import { Product, Transaction, Category } from './types';

const KEYS = {
  PRODUCTS: 'nexus_pos_products',
  TRANSACTIONS: 'nexus_pos_transactions',
  CATEGORIES: 'nexus_pos_categories',
};

const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Kopi Susu Gula Aren', category: 'Minuman', price: 18000, costPrice: 10000, stock: 50, sku: 'DRK001', lowStockThreshold: 10, image: 'https://picsum.photos/seed/coffee/200' },
  { id: '2', name: 'Roti Bakar Keju', category: 'Makanan', price: 15000, costPrice: 8000, stock: 25, sku: 'FOD001', lowStockThreshold: 5, image: 'https://picsum.photos/seed/bread/200' },
  { id: '3', name: 'Es Teh Manis', category: 'Minuman', price: 5000, costPrice: 1500, stock: 100, sku: 'DRK002', lowStockThreshold: 15, image: 'https://picsum.photos/seed/tea/200' },
  { id: '4', name: 'French Fries', category: 'Snack', price: 12000, costPrice: 6000, stock: 30, sku: 'SNC001', lowStockThreshold: 10, image: 'https://picsum.photos/seed/fries/200' },
];

const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Semua' },
  { id: '2', name: 'Minuman' },
  { id: '3', name: 'Makanan' },
  { id: '4', name: 'Snack' },
];

export const db = {
  getProducts: (): Product[] => {
    const data = localStorage.getItem(KEYS.PRODUCTS);
    if (!data) {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(data);
  },
  saveProducts: (products: Product[]) => {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },
  getTransactions: (): Transaction[] => {
    const data = localStorage.getItem(KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  },
  saveTransaction: (transaction: Transaction) => {
    const transactions = db.getTransactions();
    transactions.push(transaction);
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
    
    // Update stock
    const products = db.getProducts();
    transaction.items.forEach(item => {
      const p = products.find(prod => prod.id === item.id);
      if (p) p.stock -= item.quantity;
    });
    db.saveProducts(products);
  },
  getCategories: (): Category[] => {
    const data = localStorage.getItem(KEYS.CATEGORIES);
    if (!data) {
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    }
    return JSON.parse(data);
  }
};
