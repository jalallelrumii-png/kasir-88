
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  History, 
  BarChart3, 
  Settings, 
  Menu,
  X,
  Bell,
  Search,
  Plus,
  Trash2,
  ChevronRight,
  Printer,
  CreditCard,
  Banknote,
  QrCode,
  Download
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { db } from './db';
import { Product, Transaction, CartItem, View, Category } from './types';

// --- Components ---

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
        : 'text-slate-500 hover:bg-slate-100'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const Card = ({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div 
    className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 ${className}`}
    {...props}
  >
    {children}
  </div>
);

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600"
  };

  return (
    <Card>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-500 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          {trend !== undefined && (
            <p className={`text-xs mt-2 ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {trend > 0 ? '+' : ''}{trend}% dibanding bulan lalu
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color] || 'bg-slate-50 text-slate-600'}`}>
          <Icon size={24} />
        </div>
      </div>
    </Card>
  );
};

const formatIDR = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(val);
};

// --- Main App ---

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');

  useEffect(() => {
    setProducts(db.getProducts());
    setTransactions(db.getTransactions());
    setCategories(db.getCategories());
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        if (newQty > item.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handleCheckout = (paymentMethod: 'cash' | 'card' | 'qris') => {
    if (cart.length === 0) return;

    const newTransaction: Transaction = {
      id: `TX-${Date.now()}`,
      date: new Date().toISOString(),
      items: [...cart],
      subtotal,
      tax,
      discount: 0,
      total,
      paymentMethod,
      amountPaid: total,
      change: 0
    };

    db.saveTransaction(newTransaction);
    setTransactions(db.getTransactions());
    setProducts(db.getProducts());
    setCart([]);
    alert(`Transaksi ${newTransaction.id} Berhasil!`);
  };

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = transactions
      .filter(t => t.date.startsWith(today))
      .reduce((sum, t) => sum + t.total, 0);
    
    const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
    const totalTransactions = transactions.length;
    const lowStockCount = products.filter(p => p.stock <= p.lowStockThreshold).length;

    return { todaySales, totalRevenue, totalTransactions, lowStockCount };
  }, [transactions, products]);

  const salesData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => ({
      name: date.split('-').slice(1, 3).join('/'),
      sales: transactions
        .filter(t => t.date.startsWith(date))
        .reduce((sum, t) => sum + t.total, 0)
    }));
  }, [transactions]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'Semua' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className={`bg-white border-r border-slate-100 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0">
            <Package size={20} />
          </div>
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight">Nexus<span className="text-blue-600">POS</span></span>}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarItem 
            icon={LayoutDashboard} 
            label={isSidebarOpen ? "Dashboard" : ""} 
            active={activeView === 'dashboard'} 
            onClick={() => setActiveView('dashboard')} 
          />
          <SidebarItem 
            icon={ShoppingCart} 
            label={isSidebarOpen ? "Kasir" : ""} 
            active={activeView === 'pos'} 
            onClick={() => setActiveView('pos')} 
          />
          <SidebarItem 
            icon={Package} 
            label={isSidebarOpen ? "Inventaris" : ""} 
            active={activeView === 'inventory'} 
            onClick={() => setActiveView('inventory')} 
          />
          <SidebarItem 
            icon={History} 
            label={isSidebarOpen ? "Riwayat" : ""} 
            active={activeView === 'history'} 
            onClick={() => setActiveView('history')} 
          />
          <SidebarItem 
            icon={BarChart3} 
            label={isSidebarOpen ? "Laporan" : ""} 
            active={activeView === 'reports'} 
            onClick={() => setActiveView('reports')} 
          />
        </nav>

        <div className="p-4 border-t border-slate-50 space-y-2">
           <SidebarItem 
            icon={Settings} 
            label={isSidebarOpen ? "Pengaturan" : ""} 
            active={false} 
            onClick={() => {}} 
          />
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-50 transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            {isSidebarOpen && <span>Tutup Sidebar</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 shrink-0">
          <h2 className="text-lg font-semibold text-slate-700 capitalize">
            {activeView === 'pos' ? 'Kasir' : activeView}
          </h2>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                <Bell size={20} />
              </button>
              {stats.lowStockCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">
                  {stats.lowStockCount}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3 border-l pl-4 ml-4">
              <div className="text-right">
                <p className="text-xs font-medium text-slate-400">Kasir</p>
                <p className="text-sm font-bold">Admin Utama</p>
              </div>
              <img src="https://picsum.photos/seed/admin/100" className="w-8 h-8 rounded-full ring-2 ring-slate-100" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {activeView === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="Penjualan Hari Ini" 
                  value={formatIDR(stats.todaySales)} 
                  icon={Banknote} 
                  trend={12.5} 
                  color="blue" 
                />
                <StatCard 
                  title="Total Pendapatan" 
                  value={formatIDR(stats.totalRevenue)} 
                  icon={BarChart3} 
                  trend={8.2} 
                  color="emerald" 
                />
                <StatCard 
                  title="Jumlah Transaksi" 
                  value={stats.totalTransactions} 
                  icon={History} 
                  trend={-2.1} 
                  color="amber" 
                />
                <StatCard 
                  title="Stok Menipis" 
                  value={stats.lowStockCount} 
                  icon={Package} 
                  color="rose" 
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">Tren Penjualan (7 Hari Terakhir)</h3>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesData}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          formatter={(value) => formatIDR(value as number)}
                        />
                        <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card>
                  <h3 className="font-bold text-lg mb-6">Aktivitas Terakhir</h3>
                  <div className="space-y-6">
                    {transactions.slice(-5).reverse().map(tx => (
                      <div key={tx.id} className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
                          <History size={18} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold">{tx.id}</p>
                          <p className="text-xs text-slate-400">{new Date(tx.date).toLocaleTimeString()}</p>
                        </div>
                        <p className="text-sm font-bold text-emerald-600">{formatIDR(tx.total)}</p>
                      </div>
                    ))}
                    {transactions.length === 0 && (
                      <p className="text-center text-slate-400 py-10">Belum ada transaksi</p>
                    )}
                  </div>
                  <button onClick={() => setActiveView('history')} className="w-full mt-6 py-2 text-blue-600 font-medium text-sm hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center space-x-2">
                    <span>Lihat Semua Riwayat</span>
                    <ChevronRight size={16} />
                  </button>
                </Card>
              </div>
            </div>
          )}

          {activeView === 'pos' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-[600px] animate-in fade-in duration-500">
              <div className="lg:col-span-8 flex flex-col space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Cari menu atau SKU..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.name)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                          activeCategory === cat.name 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-10">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= 0}
                      className={`group bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all text-left flex flex-col ${product.stock <= 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                    >
                      <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-slate-50 relative">
                        <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={product.name} />
                        {product.stock <= product.lowStockThreshold && product.stock > 0 && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-white text-[10px] rounded-full font-bold uppercase tracking-wider">
                            Hampir Habis
                          </div>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-800 line-clamp-1">{product.name}</h4>
                      <p className="text-xs text-slate-400 mb-2">{product.category}</p>
                      <div className="mt-auto flex justify-between items-center">
                        <span className="text-blue-600 font-bold text-sm">{formatIDR(product.price)}</span>
                        <span className="text-[10px] text-slate-400">Stok: {product.stock}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4 h-full">
                <Card className="flex flex-col h-full sticky top-0 p-0 overflow-hidden border-2 border-slate-100">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center space-x-2">
                      <ShoppingCart size={20} className="text-blue-600" />
                      <span>Keranjang</span>
                    </h3>
                    <button onClick={() => setCart([])} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center space-x-4">
                        <img src={item.image} className="w-12 h-12 rounded-lg object-cover" alt={item.name} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                          <p className="text-xs text-slate-500">{formatIDR(item.price)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => updateCartQty(item.id, -1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                          >
                            -
                          </button>
                          <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateCartQty(item.id, 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                    {cart.length === 0 && (
                      <div className="text-center py-20 flex flex-col items-center">
                        <ShoppingCart size={48} className="text-slate-200 mb-4" />
                        <p className="text-slate-400 font-medium">Keranjang masih kosong</p>
                      </div>
                    )}
                  </div>

                  <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-3">
                    <div className="flex justify-between text-slate-500 text-sm">
                      <span>Subtotal</span>
                      <span>{formatIDR(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-sm">
                      <span>Pajak (10%)</span>
                      <span>{formatIDR(tax)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
                      <span>Total</span>
                      <span>{formatIDR(total)}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-4">
                      <button 
                        onClick={() => handleCheckout('cash')}
                        disabled={cart.length === 0}
                        className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <Banknote size={20} className="mb-1 text-slate-400 group-hover:text-blue-600" />
                        <span className="text-[10px] font-bold uppercase">Tunai</span>
                      </button>
                      <button 
                        onClick={() => handleCheckout('card')}
                        disabled={cart.length === 0}
                        className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <CreditCard size={20} className="mb-1 text-slate-400 group-hover:text-blue-600" />
                        <span className="text-[10px] font-bold uppercase">Kartu</span>
                      </button>
                      <button 
                        onClick={() => handleCheckout('qris')}
                        disabled={cart.length === 0}
                        className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <QrCode size={20} className="mb-1 text-slate-400 group-hover:text-blue-600" />
                        <span className="text-[10px] font-bold uppercase">QRIS</span>
                      </button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeView === 'inventory' && (
            <div className="animate-in fade-in duration-500 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">Daftar Produk</h3>
                <button className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center space-x-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                  <Plus size={20} />
                  <span>Tambah Produk</span>
                </button>
              </div>

              <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Produk</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Kategori</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Harga Jual</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Stok</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <img src={p.image} className="w-10 h-10 rounded-lg object-cover" alt={p.name} />
                              <div>
                                <p className="font-bold text-slate-800">{p.name}</p>
                                <p className="text-xs text-slate-400">{p.sku}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg uppercase">
                              {p.category}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800">{formatIDR(p.price)}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <span className={`w-2 h-2 rounded-full ${p.stock <= p.lowStockThreshold ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                              <p className={`font-bold ${p.stock <= p.lowStockThreshold ? 'text-rose-600' : 'text-slate-800'}`}>{p.stock}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors">
                                <Settings size={18} />
                              </button>
                              <button className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeView === 'history' && (
            <div className="animate-in fade-in duration-500 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">Riwayat Transaksi</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {transactions.slice().reverse().map(tx => (
                  <Card key={tx.id} className="hover:border-blue-200 transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-blue-600 mb-1">{tx.id}</p>
                        <p className="text-xs text-slate-400">{new Date(tx.date).toLocaleString()}</p>
                      </div>
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase ${
                        tx.paymentMethod === 'cash' ? 'bg-emerald-100 text-emerald-600' : 
                        tx.paymentMethod === 'card' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                      }`}>
                        {tx.paymentMethod}
                      </span>
                    </div>

                    <div className="space-y-2 py-4 border-y border-slate-50">
                      {tx.items.slice(0, 2).map(item => (
                        <div key={item.id} className="flex justify-between text-xs text-slate-600">
                          <span>{item.quantity}x {item.name}</span>
                          <span>{formatIDR(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      {tx.items.length > 2 && (
                        <p className="text-[10px] text-slate-400">+{tx.items.length - 2} menu lainnya...</p>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-2">
                      <p className="text-xs font-medium text-slate-500">Total Transaksi</p>
                      <p className="font-bold text-slate-900">{formatIDR(tx.total)}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeView === 'reports' && (
            <div className="animate-in fade-in duration-500 space-y-8">
              <h3 className="text-2xl font-bold">Laporan Penjualan</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <h4 className="font-bold mb-6">Volume Penjualan Mingguan</h4>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <Tooltip 
                           contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                           formatter={(value) => formatIDR(value as number)}
                        />
                        <Bar dataKey="sales" fill="#2563eb" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card>
                  <h4 className="font-bold mb-6">Produk Terlaris</h4>
                  <div className="space-y-6">
                    {products.slice(0, 5).map((p, i) => (
                      <div key={p.id} className="flex items-center space-x-4">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-bold">{p.name}</p>
                          <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${100 - (i * 15)}%` }}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
