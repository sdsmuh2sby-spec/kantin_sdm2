import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  X,
  CreditCard,
  Banknote,
  QrCode,
  Search,
  Receipt,
  User,
} from 'lucide-react';
import { ProductItem, SaleTransaction, CashTransaction, SchoolProfile } from '../types';
import { formatRupiah, getTodayDateString } from '../utils/formatters';

interface PosCashierModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  school: SchoolProfile;
  onCompleteSale: (
    sale: SaleTransaction,
    cashEntry: CashTransaction,
    updatedProducts: ProductItem[]
  ) => void;
}

export const PosCashierModal: React.FC<PosCashierModalProps> = ({
  isOpen,
  onClose,
  products,
  school,
  onCompleteSale,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Cart: productId -> quantity
  const [cart, setCart] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS' | 'Kupon Kantin'>('Tunai');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [buyerName, setBuyerName] = useState<string>('Siswa');
  const [lastCompletedSale, setLastCompletedSale] = useState<SaleTransaction | null>(null);

  if (!isOpen) return null;

  // Categories
  const categories = Array.from(new Set(products.map((p) => p.kategori))).sort();

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'all' && p.kategori !== selectedCategory) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        p.nama.toLowerCase().includes(term) ||
        p.kode.toLowerCase().includes(term) ||
        p.kategori.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Cart calculations
  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([productId, qty]) => {
        const product = products.find((p) => p.id === productId);
        if (!product || qty <= 0) return null;
        const subtotal = product.hargaJual * qty;
        const modal = product.hargaBeli * qty;
        return {
          productId: product.id,
          kode: product.kode,
          nama: product.nama,
          hargaSatuan: product.hargaJual,
          hargaModal: product.hargaBeli,
          qty,
          subtotal,
          labaKotor: subtotal - modal,
        };
      })
      .filter(Boolean) as {
        productId: string;
        kode: string;
        nama: string;
        hargaSatuan: number;
        hargaModal: number;
        qty: number;
        subtotal: number;
        labaKotor: number;
      }[];
  }, [cart, products]);

  const totalBelanja = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  }, [cartItems]);

  const totalModal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.hargaModal * item.qty, 0);
  }, [cartItems]);

  const totalQty = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.qty, 0);
  }, [cartItems]);

  const numericPaid = parseFloat(paidAmount) || 0;
  const kembalian = numericPaid >= totalBelanja ? numericPaid - totalBelanja : 0;

  // Add to cart
  const handleAddToCart = (productId: string) => {
    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  };

  // Modify cart qty
  const handleUpdateQty = (productId: string, delta: number) => {
    setCart((prev) => {
      const cur = prev[productId] || 0;
      const next = cur + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: next };
    });
  };

  // Quick money buttons
  const handleQuickPay = (nominal: number) => {
    setPaidAmount(nominal.toString());
  };

  // Submit sale
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert('Keranjang belanja masih kosong.');
      return;
    }

    if (paymentMethod === 'Tunai' && numericPaid < totalBelanja) {
      alert('Jumlah uang pembayaran tunai kurang dari total belanja.');
      return;
    }

    const today = getTodayDateString();
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 8);
    const receiptNo = `STR-${today.replace(/-/g, '')}-${String(Date.now()).slice(-4)}`;

    const saleTransaction: SaleTransaction = {
      id: `sale-${Date.now()}`,
      nomorStruk: receiptNo,
      tanggal: today,
      waktu: timeStr,
      items: cartItems,
      totalItem: totalQty,
      totalPenjualan: totalBelanja,
      totalModal: totalModal,
      labaKotor: totalBelanja - totalModal,
      metodePembayaran: paymentMethod,
      namaPembeli: buyerName || 'Siswa',
      catatan: `Kasir Kantin (${paymentMethod})`,
    };

    // Auto-create Cash Transaction
    const cashEntry: CashTransaction = {
      id: `kas-sale-${Date.now()}`,
      tanggal: today,
      waktu: timeStr.slice(0, 5),
      tipe: 'penerimaan',
      kategori: 'Penjualan Kantin',
      jumlah: totalBelanja,
      keterangan: `Penjualan ${buyerName} [${receiptNo}] - ${cartItems
        .map((i) => `${i.nama} x${i.qty}`)
        .join(', ')}`,
      metodePembayaran: paymentMethod === 'Kupon Kantin' ? 'Tunai' : paymentMethod,
      referensiId: saleTransaction.id,
      createdAt: now.toISOString(),
    };

    onCompleteSale(saleTransaction, cashEntry, products);
    setLastCompletedSale(saleTransaction);
  };

  // Reset for next order
  const handleNewOrder = () => {
    setCart({});
    setPaidAmount('');
    setLastCompletedSale(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-5xl h-[90vh] max-h-[820px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="bg-emerald-800 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-700 rounded-xl">
              <ShoppingCart className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Kasir Cepat Kantin Sekolah (POS)</h3>
              <p className="text-xs text-emerald-200">
                {school.namaSekolah} • Transaksi langsung masuk ke Laporan & Kas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Struk Screen */}
        {lastCompletedSale ? (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-slate-800">Transaksi Berhasil Dicatat!</h4>
            <p className="text-xs text-slate-500 mt-1">
              Nomor Struk: <strong>{lastCompletedSale.nomorStruk}</strong>
            </p>

            {/* Receipt Summary Box */}
            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 my-4 text-left text-xs space-y-2">
              <div className="flex justify-between font-bold border-b pb-2 text-slate-800">
                <span>Total Belanja</span>
                <span className="text-emerald-700">
                  {formatRupiah(lastCompletedSale.totalPenjualan)}
                </span>
              </div>
              <div className="space-y-1 text-slate-600">
                {lastCompletedSale.items.map((it) => (
                  <div key={it.productId} className="flex justify-between">
                    <span>
                      {it.nama} x{it.qty}
                    </span>
                    <span>{formatRupiah(it.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t flex justify-between text-slate-500 text-[11px]">
                <span>Metode: {lastCompletedSale.metodePembayaran}</span>
                <span>Kembalian: {formatRupiah(kembalian)}</span>
              </div>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={handleNewOrder}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
              >
                + Transaksi Pelanggan Berikutnya
              </button>
              <button
                onClick={onClose}
                className="px-5 py-3 border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs rounded-xl"
              >
                Selesai / Tutup
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            {/* Left: Product Catalog Selection (7 Cols) */}
            <div className="lg:col-span-7 p-4 border-r border-slate-200 flex flex-col h-full overflow-hidden bg-slate-50/50">
              {/* Search & Categories */}
              <div className="space-y-2 shrink-0 mb-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ketik nama item atau scan barcode..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Semua
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedCategory(c)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                        selectedCategory === c
                          ? 'bg-emerald-700 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Grid */}
              <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2.5 pr-1">
                {filteredProducts.map((p) => {
                  const inCartQty = cart[p.id] || 0;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleAddToCart(p.id)}
                      className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-500 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between text-left relative group select-none"
                    >
                      {inCartQty > 0 && (
                        <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                          {inCartQty}
                        </span>
                      )}
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block truncate">
                          {p.kategori}
                        </span>
                        <h4 className="font-bold text-xs text-slate-800 line-clamp-2 mt-0.5 leading-snug">
                          {p.nama}
                        </h4>
                      </div>

                      <div className="mt-3 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-700">
                          {formatRupiah(p.hargaJual)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {p.kode}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Cart & Checkout (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col h-full bg-white">
              {/* Customer Selector */}
              <div className="p-3 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0 bg-slate-50/70">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Pelanggan:</span>
                </div>
                <select
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="text-xs py-1 px-2.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-700"
                >
                  <option value="Siswa">Siswa</option>
                  <option value="Guru & Staf">Guru / Staf</option>
                  <option value="Tamu Sekolah">Tamu Sekolah</option>
                </select>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-12">
                    <ShoppingCart className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">Keranjang masih kosong</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Klik menu makanan/minuman di samping untuk menambahkan pesanan.
                    </p>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div
                      key={item.productId}
                      className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 truncate">{item.nama}</p>
                        <p className="text-[11px] text-emerald-700 font-semibold">
                          {formatRupiah(item.hargaSatuan)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.productId, -1)}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-bold text-xs">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.productId, 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-bold text-slate-900 w-16 text-right shrink-0">
                        {formatRupiah(item.subtotal)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Payment Summary Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3 shrink-0">
                {/* Total */}
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold uppercase text-slate-500">
                    Total Belanja ({totalQty} item)
                  </span>
                  <span className="text-xl font-black text-slate-900">
                    {formatRupiah(totalBelanja)}
                  </span>
                </div>

                {/* Payment Methods */}
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Tunai', 'QRIS', 'Kupon Kantin'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-1.5 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                        paymentMethod === method
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                {/* Cash Input & Quick nominals */}
                {paymentMethod === 'Tunai' && totalBelanja > 0 && (
                  <div className="space-y-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                        Rp
                      </span>
                      <input
                        type="number"
                        placeholder="Uang diterima..."
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        className="w-full text-xs font-bold pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Quick nominal buttons */}
                    <div className="flex gap-1 overflow-x-auto">
                      <button
                        type="button"
                        onClick={() => handleQuickPay(totalBelanja)}
                        className="px-2 py-1 text-[11px] font-semibold bg-white border border-slate-200 rounded hover:bg-emerald-50 text-slate-700 shrink-0"
                      >
                        Uang Pas
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickPay(10000)}
                        className="px-2 py-1 text-[11px] font-semibold bg-white border border-slate-200 rounded hover:bg-emerald-50 text-slate-700 shrink-0"
                      >
                        10rb
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickPay(20000)}
                        className="px-2 py-1 text-[11px] font-semibold bg-white border border-slate-200 rounded hover:bg-emerald-50 text-slate-700 shrink-0"
                      >
                        20rb
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickPay(50000)}
                        className="px-2 py-1 text-[11px] font-semibold bg-white border border-slate-200 rounded hover:bg-emerald-50 text-slate-700 shrink-0"
                      >
                        50rb
                      </button>
                    </div>

                    {numericPaid >= totalBelanja && (
                      <div className="flex justify-between items-center text-xs font-bold text-emerald-800 pt-1">
                        <span>Kembalian:</span>
                        <span>{formatRupiah(kembalian)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Checkout Button */}
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-40"
                >
                  Bayar & Catat Penjualan ({formatRupiah(totalBelanja)})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
