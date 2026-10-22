import React, { useMemo } from 'react';
import {
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  ShoppingCart,
  Wallet,
  AlertTriangle,
  Clock,
  Calendar,
  Sparkles,
  ArrowRight,
  Plus,
  Package,
  Printer,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import {
  CashTransaction,
  ProductItem,
  SaleTransaction,
  SchoolProfile,
} from '../types';
import {
  formatRupiah,
  formatTanggalIndo,
  getTodayDateString,
} from '../utils/formatters';

interface DashboardProps {
  cashTransactions: CashTransaction[];
  salesTransactions: SaleTransaction[];
  products: ProductItem[];
  school: SchoolProfile;
  onOpenPos: () => void;
  onNavigateToTab: (
    tab: 'cash' | 'reports' | 'labels' | 'products' | 'suppliers' | 'profile' | 'restore'
  ) => void;
  onOpenAddCash: (type: 'penerimaan' | 'pengeluaran') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  cashTransactions,
  salesTransactions,
  products,
  school,
  onOpenPos,
  onNavigateToTab,
  onOpenAddCash,
}) => {
  const today = getTodayDateString();

  // Compute Yesterday string for comparison
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Filter today's transactions
  const todayCash = useMemo(() => {
    return cashTransactions.filter((c) => c.tanggal === today);
  }, [cashTransactions, today]);

  const yesterdayCash = useMemo(() => {
    return cashTransactions.filter((c) => c.tanggal === yesterdayStr);
  }, [cashTransactions, yesterdayStr]);

  const todaySales = useMemo(() => {
    return salesTransactions.filter((s) => s.tanggal === today);
  }, [salesTransactions, today]);

  // Today's Stats
  const {
    todayIncome,
    todayExpense,
    todayNetProfit,
    todayTxCount,
    yesterdayIncome,
    incomeComparisonPercent,
  } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    let txCount = todayCash.length;

    todayCash.forEach((c) => {
      if (c.tipe === 'penerimaan') inc += c.jumlah;
      if (c.tipe === 'pengeluaran') exp += c.jumlah;
    });

    let yInc = 0;
    yesterdayCash.forEach((c) => {
      if (c.tipe === 'penerimaan') yInc += c.jumlah;
    });

    let compPercent = 0;
    if (yInc > 0) {
      compPercent = Math.round(((inc - yInc) / yInc) * 100);
    }

    return {
      todayIncome: inc,
      todayExpense: exp,
      todayNetProfit: inc - exp,
      todayTxCount: txCount,
      yesterdayIncome: yInc,
      incomeComparisonPercent: compPercent,
    };
  }, [todayCash, yesterdayCash]);

  // Today's Recent activities (merged latest 5 cash and sales)
  const recentActivities = useMemo(() => {
    return [...todayCash]
      .sort((a, b) => (b.waktu || '00:00').localeCompare(a.waktu || '00:00'))
      .slice(0, 5);
  }, [todayCash]);

  // Top selling items today
  const topItemsToday = useMemo(() => {
    const map = new Map<string, { nama: string; qty: number; total: number }>();
    todaySales.forEach((sale) => {
      sale.items.forEach((item) => {
        const cur = map.get(item.nama) || { nama: item.nama, qty: 0, total: 0 };
        cur.qty += item.qty;
        cur.total += item.subtotal;
        map.set(item.nama, cur);
      });
    });
    return Array.from(map.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 4);
  }, [todaySales]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-linear-to-r from-blue-950 via-blue-900 to-indigo-950 rounded-3xl p-6 text-white shadow-md relative overflow-hidden border border-blue-800/40">
        {/* Subtle decorative circles */}
        <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-blue-500/10 pointer-events-none" />
        <div className="absolute right-32 -bottom-12 w-36 h-36 rounded-full bg-indigo-500/10 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-blue-300" />
              <span>{formatTanggalIndo(today)}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="text-white font-medium">Kantin Buka</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Dashboard Operasional Kantin
            </h2>
            <p className="text-sm text-blue-100/80 max-w-xl">
              Ringkasan performa penjualan, arus kas masuk, pengeluaran bahan, dan laba bersih hari ini di{' '}
              <strong className="text-white">{school.namaSekolah}</strong>.
            </p>
          </div>

          {/* Quick Action POS Button */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenPos}
              className="inline-flex items-center gap-2 px-5 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-900/30 transition-transform active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              Buka Kasir Cepat (POS)
            </button>
          </div>
        </div>
      </div>

      {/* 4 Primary Statistical Cards for TODAY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Pendapatan Hari Ini */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Pendapatan
            </span>
            <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <ArrowDownLeft className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tracking-tight">
              {formatRupiah(todayIncome)}
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              {yesterdayIncome > 0 ? (
                <span
                  className={`inline-flex items-center font-bold px-1.5 py-0.5 rounded ${
                    incomeComparisonPercent >= 0
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {incomeComparisonPercent >= 0 ? '+' : ''}
                  {incomeComparisonPercent}%
                </span>
              ) : (
                <span className="text-slate-400">Hari ini</span>
              )}
              <span className="text-slate-500 truncate">
                {yesterdayIncome > 0 ? 'vs kemarin' : 'Arus kas masuk hari ini'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Total Pengeluaran Hari Ini */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-rose-300 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Pengeluaran
            </span>
            <span className="p-2.5 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight">
              {formatRupiah(todayExpense)}
            </p>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <span>Belanja stok, gas & operasional hari ini</span>
            </p>
          </div>
        </div>

        {/* 3. Laba Bersih Hari Ini */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-blue-300 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Laba Bersih Hari Ini
            </span>
            <span
              className={`p-2.5 rounded-xl transition-transform group-hover:scale-110 ${
                todayNetProfit >= 0
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <p
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                todayNetProfit >= 0 ? 'text-blue-700' : 'text-rose-600'
              }`}
            >
              {formatRupiah(todayNetProfit)}
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span
                className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                  todayNetProfit >= 0
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {todayNetProfit >= 0 ? 'Surplus Laba' : 'Defisit'}
              </span>
              <span className="text-slate-500">Pendapatan - Beban</span>
            </div>
          </div>
        </div>

        {/* 4. Jumlah Transaksi Hari Ini */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-indigo-300 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Jumlah Transaksi
            </span>
            <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              {todayTxCount}{' '}
              <span className="text-sm font-semibold text-slate-400">Catatan</span>
            </p>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <span className="font-semibold text-emerald-700">
                {todayCash.filter((c) => c.tipe === 'penerimaan').length} masuk
              </span>{' '}
              •{' '}
              <span className="font-semibold text-rose-600">
                {todayCash.filter((c) => c.tipe === 'pengeluaran').length} keluar
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Middle Section: Quick Actions + Top Selling Today */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick Actions (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Pintasan Aksi Cepat Kantin
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => onOpenAddCash('penerimaan')}
                className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/70 rounded-xl text-left transition-all flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-700" />
                  <Plus className="w-3.5 h-3.5 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="mt-2">
                  <span className="block font-bold text-xs">+ Kas Masuk</span>
                  <span className="text-[10px] text-emerald-700/80">Catat penerimaan kas</span>
                </div>
              </button>

              <button
                onClick={() => onOpenAddCash('pengeluaran')}
                className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200/70 rounded-xl text-left transition-all flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between">
                  <ArrowUpRight className="w-4 h-4 text-rose-700" />
                  <Plus className="w-3.5 h-3.5 text-rose-500 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="mt-2">
                  <span className="block font-bold text-xs">- Kas Keluar</span>
                  <span className="text-[10px] text-rose-700/80">Belanja & operasional</span>
                </div>
              </button>

              <button
                onClick={() => onNavigateToTab('labels')}
                className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/70 rounded-xl text-left transition-all flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between">
                  <Printer className="w-4 h-4 text-indigo-700" />
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="mt-2">
                  <span className="block font-bold text-xs">Cetak Label Harga</span>
                  <span className="text-[10px] text-indigo-700/80">Barcode & price tag</span>
                </div>
              </button>

              <button
                onClick={() => onNavigateToTab('reports')}
                className="p-3 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200/70 rounded-xl text-left transition-all flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between">
                  <FileText className="w-4 h-4 text-teal-700" />
                  <ArrowRight className="w-3.5 h-3.5 text-teal-500 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="mt-2">
                  <span className="block font-bold text-xs">Laporan & Ekspor</span>
                  <span className="text-[10px] text-teal-700/80">PDF ber-QR & Excel</span>
                </div>
              </button>
            </div>
          </div>

          {/* Ringkasan Menu & Barang Kantin Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-600" />
                Ringkasan Menu & Barang Kantin
              </h3>
              <button
                onClick={() => onNavigateToTab('products')}
                className="text-[11px] text-emerald-700 font-semibold hover:underline"
              >
                Lihat Semua
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  Total Menu Terdaftar
                </span>
                <span className="text-xl font-bold text-slate-800 mt-1 block">
                  {products.length} Menu
                </span>
                <span className="text-[10px] text-emerald-700">Siap dijual di kantin</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  Cetak Barcode
                </span>
                <span className="text-xl font-bold text-indigo-700 mt-1 block">
                  {products.filter((p) => p.kode).length} Item
                </span>
                <span className="text-[10px] text-indigo-600">Ber-SKU & Kode Barcode</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Semua menu kantin siap dicetak label harga satuan dan discan di kasir.</span>
            </p>
          </div>
        </div>

        {/* Right Section: Today's Recent Transactions & Top Selling (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Recent Cash Transactions Today */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                  <Clock className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-sm text-slate-800">
                  Aktivitas Kas Masuk & Keluar Hari Ini
                </h3>
              </div>
              <button
                onClick={() => onNavigateToTab('cash')}
                className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1"
              >
                Buku Kas Lengkap <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentActivities.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Wallet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-600">Belum ada transaksi kas hari ini.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Gunakan tombol Kas Masuk atau Kasir POS untuk mencatat penjualan.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentActivities.map((act) => {
                  const isMasuk = act.tipe === 'penerimaan';
                  return (
                    <div
                      key={act.id}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 rounded-lg px-1 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`p-2 rounded-xl shrink-0 ${
                            isMasuk ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {isMasuk ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {act.keterangan || act.kategori}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span className="font-medium text-slate-600">{act.kategori}</span>
                            <span>•</span>
                            <span>{act.waktu || '00:00'} WIB</span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-extrabold whitespace-nowrap shrink-0 ${
                          isMasuk ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {isMasuk ? '+' : '-'} {formatRupiah(act.jumlah)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Selling Items Today */}
          {topItemsToday.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-emerald-600" />
                  Jajanan Terlaris Hari Ini
                </h3>
                <span className="text-[11px] text-slate-400">
                  {todaySales.length} struk kasir terbit
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {topItemsToday.map((item, idx) => (
                  <div key={item.nama} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400">#{idx + 1}</span>
                    <h4 className="font-bold text-xs text-slate-800 truncate mt-0.5">{item.nama}</h4>
                    <div className="mt-1 flex items-baseline justify-between text-xs">
                      <span className="font-bold text-emerald-700">{item.qty} terjual</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formatRupiah(item.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
