import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Sparkles,
  Info,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { CashTransaction, SaleTransaction } from '../types';
import { formatRupiah, formatTanggalIndo, formatTanggalSingkat } from '../utils/formatters';

interface DailyDataPoint {
  tanggal: string;
  penerimaan: number;
  pengeluaran: number;
  labaBersih: number;
  transaksiCount: number;
}

interface SalesAnalyticsChartProps {
  dailySummary: DailyDataPoint[];
  cashTransactions: CashTransaction[];
  salesTransactions: SaleTransaction[];
  startDate: string;
  endDate: string;
}

export const SalesAnalyticsChart: React.FC<SalesAnalyticsChartProps> = ({
  dailySummary,
  cashTransactions,
  salesTransactions,
  startDate,
  endDate,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'trend' | 'categories' | 'payments'>('trend');
  const [trendMetric, setTrendMetric] = useState<'all' | 'penerimaan' | 'laba'>('all');
  const [hoveredPoint, setHoveredPoint] = useState<DailyDataPoint | null>(null);

  // Chronologically sorted daily points (oldest to newest for proper left-to-right timeline)
  const chronologicalDaily = useMemo(() => {
    return [...dailySummary].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }, [dailySummary]);

  // Key KPI Statistics
  const stats = useMemo(() => {
    if (chronologicalDaily.length === 0) {
      return {
        avgOmzet: 0,
        peakDay: null as DailyDataPoint | null,
        lowestDay: null as DailyDataPoint | null,
        totalOmzet: 0,
        totalBiaya: 0,
        totalLaba: 0,
        margin: 0,
      };
    }

    let totalOmzet = 0;
    let totalBiaya = 0;
    let peakDay = chronologicalDaily[0];
    let lowestDay = chronologicalDaily[0];

    chronologicalDaily.forEach((d) => {
      totalOmzet += d.penerimaan;
      totalBiaya += d.pengeluaran;
      if (d.penerimaan > peakDay.penerimaan) peakDay = d;
      if (d.penerimaan < lowestDay.penerimaan && d.penerimaan > 0) lowestDay = d;
    });

    const daysCount = chronologicalDaily.length || 1;
    const avgOmzet = totalOmzet / daysCount;
    const totalLaba = totalOmzet - totalBiaya;
    const margin = totalOmzet > 0 ? (totalLaba / totalOmzet) * 100 : 0;

    return {
      avgOmzet,
      peakDay,
      lowestDay,
      totalOmzet,
      totalBiaya,
      totalLaba,
      margin,
    };
  }, [chronologicalDaily]);

  // Max value calculation for chart scaling
  const maxBarValue = useMemo(() => {
    if (chronologicalDaily.length === 0) return 100000;
    let max = 0;
    chronologicalDaily.forEach((d) => {
      if (d.penerimaan > max) max = d.penerimaan;
      if (d.pengeluaran > max) max = d.pengeluaran;
    });
    return max > 0 ? max * 1.15 : 100000; // 15% headroom
  }, [chronologicalDaily]);

  // Breakdown by Cash Categories
  const categoryBreakdown = useMemo(() => {
    const penerimaanMap = new Map<string, number>();
    const pengeluaranMap = new Map<string, number>();

    cashTransactions.forEach((c) => {
      const kat = c.kategori || 'Lain-lain';
      if (c.tipe === 'penerimaan') {
        penerimaanMap.set(kat, (penerimaanMap.get(kat) || 0) + c.jumlah);
      } else {
        pengeluaranMap.set(kat, (pengeluaranMap.get(kat) || 0) + c.jumlah);
      }
    });

    const sortEntries = (m: Map<string, number>, total: number) => {
      return Array.from(m.entries())
        .map(([name, totalRp]) => ({
          name,
          totalRp,
          percent: total > 0 ? (totalRp / total) * 100 : 0,
        }))
        .sort((a, b) => b.totalRp - a.totalRp);
    };

    return {
      penerimaan: sortEntries(penerimaanMap, stats.totalOmzet),
      pengeluaran: sortEntries(pengeluaranMap, stats.totalBiaya),
    };
  }, [cashTransactions, stats.totalOmzet, stats.totalBiaya]);

  // Payment Methods Breakdown
  const paymentBreakdown = useMemo(() => {
    const payMap = new Map<string, { count: number; total: number }>();

    salesTransactions.forEach((s) => {
      const method = s.metodePembayaran || 'Tunai';
      const cur = payMap.get(method) || { count: 0, total: 0 };
      cur.count += 1;
      cur.total += s.totalPenjualan;
      payMap.set(method, cur);
    });

    // Also include cash transactions if no POS sales recorded
    if (salesTransactions.length === 0) {
      cashTransactions.forEach((c) => {
        if (c.tipe === 'penerimaan') {
          const method = c.metodePembayaran || 'Tunai';
          const cur = payMap.get(method) || { count: 0, total: 0 };
          cur.count += 1;
          cur.total += c.jumlah;
          payMap.set(method, cur);
        }
      });
    }

    let grandTotal = 0;
    payMap.forEach((v) => {
      grandTotal += v.total;
    });

    return Array.from(payMap.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      total: data.total,
      percent: grandTotal > 0 ? (data.total / grandTotal) * 100 : 0,
    }));
  }, [salesTransactions, cashTransactions]);

  // Palettes for categories
  const categoryColors = [
    'bg-blue-600 text-blue-600 border-blue-500',
    'bg-emerald-600 text-emerald-600 border-emerald-500',
    'bg-amber-500 text-amber-500 border-amber-500',
    'bg-purple-600 text-purple-600 border-purple-500',
    'bg-rose-500 text-rose-500 border-rose-500',
    'bg-indigo-600 text-indigo-600 border-indigo-500',
    'bg-teal-600 text-teal-600 border-teal-500',
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Top Header & Tabs */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/60 to-white">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-100/70 text-blue-700">
              <BarChart3 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base text-slate-800">
                Grafik Statistik & Tren Penjualan
              </h3>
              <p className="text-xs text-slate-500">
                Visualisasi dinamika pendapatan, laba harian, dan distribusi keuangan kantin
              </p>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/70 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveChartTab('trend')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeChartTab === 'trend'
                ? 'bg-white text-blue-700 shadow-xs ring-1 ring-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Tren Harian</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChartTab('categories')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeChartTab === 'categories'
                ? 'bg-white text-blue-700 shadow-xs ring-1 ring-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5" />
            <span>Kategori Menu</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChartTab('payments')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeChartTab === 'payments'
                ? 'bg-white text-blue-700 shadow-xs ring-1 ring-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Metode Bayar</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-slate-50/50 border-b border-slate-100 text-xs">
        <div className="bg-white p-3 rounded-xl border border-slate-200/70">
          <span className="text-[11px] font-medium text-slate-400">Rata-rata Omzet / Hari</span>
          <p className="text-base font-extrabold text-blue-900 mt-0.5">
            {formatRupiah(Math.round(stats.avgOmzet))}
          </p>
          <span className="text-[10px] text-slate-500">
            Dari {chronologicalDaily.length} hari aktif
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/70">
          <span className="text-[11px] font-medium text-slate-400">Hari Penjualan Tertinggi</span>
          <p className="text-base font-extrabold text-emerald-700 mt-0.5">
            {stats.peakDay ? formatRupiah(stats.peakDay.penerimaan) : 'Rp 0'}
          </p>
          <span className="text-[10px] text-slate-500 truncate block">
            {stats.peakDay ? formatTanggalSingkat(stats.peakDay.tanggal) : '-'}
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/70">
          <span className="text-[11px] font-medium text-slate-400">Margin Laba Bersih</span>
          <p className={`text-base font-extrabold mt-0.5 ${stats.margin >= 0 ? 'text-blue-700' : 'text-rose-600'}`}>
            {stats.margin.toFixed(1)}%
          </p>
          <span className="text-[10px] text-slate-500">
            {stats.margin >= 0 ? 'Efisiensi laba sehat' : 'Biaya melampaui omzet'}
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200/70">
          <span className="text-[11px] font-medium text-slate-400">Total Transaksi Kasir</span>
          <p className="text-base font-extrabold text-slate-800 mt-0.5">
            {salesTransactions.length > 0 ? salesTransactions.length : cashTransactions.length} Struk
          </p>
          <span className="text-[10px] text-slate-500">
            Periode terpilih
          </span>
        </div>
      </div>

      {/* Main Chart Canvas Area */}
      <div className="p-5">
        {/* TAB 1: TREN HARIAN (BAR CHART INTERAKTIF) */}
        {activeChartTab === 'trend' && (
          <div className="space-y-4">
            {/* Filter Sub-Toggles & Legends */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Tampilan Grafik:</span>
                <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setTrendMetric('all')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      trendMetric === 'all'
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semua (Omzet & Biaya)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrendMetric('penerimaan')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      trendMetric === 'penerimaan'
                        ? 'bg-emerald-600 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Hanya Omzet
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrendMetric('laba')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      trendMetric === 'laba'
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Hanya Laba Bersih
                  </button>
                </div>
              </div>

              {/* Legends */}
              <div className="flex items-center gap-3 text-xs text-slate-600">
                {(trendMetric === 'all' || trendMetric === 'penerimaan') && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-blue-600" />
                    <span>Penerimaan (Omzet)</span>
                  </div>
                )}
                {trendMetric === 'all' && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-rose-500" />
                    <span>Pengeluaran (Biaya)</span>
                  </div>
                )}
                {(trendMetric === 'all' || trendMetric === 'laba') && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                    <span>Laba Bersih</span>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Bar Chart Canvas */}
            {chronologicalDaily.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <BarChart3 className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">Tidak ada data transaksi pada periode ini</p>
                <p className="text-xs text-slate-400 mt-1">Ubah rentang tanggal di atas untuk melihat statistik</p>
              </div>
            ) : (
              <div className="relative">
                {/* Y-Axis Guidelines & Bar Graph Container */}
                <div className="h-72 w-full pt-6 pb-8 flex items-end gap-2 sm:gap-3 overflow-x-auto border-b border-slate-200 relative select-none">
                  {/* Grid background lines */}
                  <div className="absolute inset-x-0 top-6 bottom-8 pointer-events-none flex flex-col justify-between">
                    <div className="border-b border-dashed border-slate-200 flex items-center justify-between text-[10px] text-slate-400 pr-1">
                      <span>{formatRupiah(maxBarValue)}</span>
                    </div>
                    <div className="border-b border-dashed border-slate-200 flex items-center justify-between text-[10px] text-slate-400 pr-1">
                      <span>{formatRupiah(maxBarValue * 0.66)}</span>
                    </div>
                    <div className="border-b border-dashed border-slate-200 flex items-center justify-between text-[10px] text-slate-400 pr-1">
                      <span>{formatRupiah(maxBarValue * 0.33)}</span>
                    </div>
                    <div className="border-b border-slate-200 flex items-center justify-between text-[10px] text-slate-400 pr-1">
                      <span>Rp 0</span>
                    </div>
                  </div>

                  {/* Bars for Each Day */}
                  {chronologicalDaily.map((d) => {
                    const omzetHeight = Math.min(100, Math.max(4, (d.penerimaan / maxBarValue) * 100));
                    const biayaHeight = Math.min(100, Math.max(4, (d.pengeluaran / maxBarValue) * 100));
                    const labaHeight = Math.min(
                      100,
                      Math.max(4, (Math.abs(d.labaBersih) / maxBarValue) * 100)
                    );
                    const isHovered = hoveredPoint?.tanggal === d.tanggal;

                    return (
                      <div
                        key={d.tanggal}
                        onMouseEnter={() => setHoveredPoint(d)}
                        onMouseLeave={() => setHoveredPoint(null)}
                        className={`flex-1 min-w-[38px] max-w-[64px] h-full flex flex-col justify-end items-center group relative cursor-pointer z-10 transition-transform ${
                          isHovered ? 'scale-105' : ''
                        }`}
                      >
                        {/* Bar Cluster */}
                        <div className="w-full flex items-end justify-center gap-1 h-full pb-1">
                          {/* Omzet Bar */}
                          {(trendMetric === 'all' || trendMetric === 'penerimaan') && (
                            <div
                              style={{ height: `${omzetHeight}%` }}
                              className={`w-full rounded-t-md transition-all duration-300 ${
                                isHovered
                                  ? 'bg-blue-700 shadow-md shadow-blue-500/30'
                                  : 'bg-blue-500 hover:bg-blue-600'
                              }`}
                            />
                          )}

                          {/* Biaya Bar */}
                          {trendMetric === 'all' && (
                            <div
                              style={{ height: `${biayaHeight}%` }}
                              className={`w-full rounded-t-md transition-all duration-300 ${
                                isHovered
                                  ? 'bg-rose-600 shadow-md shadow-rose-500/30'
                                  : 'bg-rose-400 hover:bg-rose-500'
                              }`}
                            />
                          )}

                          {/* Laba Bar */}
                          {trendMetric === 'laba' && (
                            <div
                              style={{ height: `${labaHeight}%` }}
                              className={`w-full rounded-t-md transition-all duration-300 ${
                                d.labaBersih >= 0
                                  ? 'bg-emerald-500 hover:bg-emerald-600'
                                  : 'bg-rose-500 hover:bg-rose-600'
                              }`}
                            />
                          )}
                        </div>

                        {/* Date Label under bar */}
                        <div className="text-[10px] text-slate-500 font-medium whitespace-nowrap mt-1 text-center">
                          {d.tanggal.slice(8, 10)}/{d.tanggal.slice(5, 7)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Floating Detail Card on Hover */}
                {hoveredPoint && (
                  <div className="mt-3 p-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-white">
                        {formatTanggalIndo(hoveredPoint.tanggal)}
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                        {hoveredPoint.transaksiCount} Transaksi
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                        <span className="text-slate-400">Omzet:</span>
                        <strong className="text-white">{formatRupiah(hoveredPoint.penerimaan)}</strong>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                        <span className="text-slate-400">Biaya:</span>
                        <strong className="text-white">{formatRupiah(hoveredPoint.pengeluaran)}</strong>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        <span className="text-slate-400">Laba Bersih:</span>
                        <strong className={hoveredPoint.labaBersih >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {formatRupiah(hoveredPoint.labaBersih)}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DISTRIBUSI KATEGORI (BREAKDOWN BARS) */}
        {activeChartTab === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kategori Penerimaan */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Sumber Penerimaan / Omzet
                  </h4>
                </div>
                <span className="text-xs font-bold text-emerald-700">
                  {formatRupiah(stats.totalOmzet)}
                </span>
              </div>

              {categoryBreakdown.penerimaan.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Belum ada data penerimaan</p>
              ) : (
                <div className="space-y-3">
                  {categoryBreakdown.penerimaan.map((item, idx) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700 truncate pr-2">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-slate-800">{formatRupiah(item.totalRp)}</span>
                          <span className="text-[10px] font-semibold text-slate-500 w-10 text-right">
                            {item.percent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, item.percent)}%` }}
                          className={`h-full rounded-full ${
                            idx === 0
                              ? 'bg-blue-600'
                              : idx === 1
                              ? 'bg-emerald-500'
                              : idx === 2
                              ? 'bg-amber-500'
                              : 'bg-indigo-500'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Kategori Pengeluaran */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-rose-600" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Alokasi Pengeluaran / Biaya
                  </h4>
                </div>
                <span className="text-xs font-bold text-rose-700">
                  {formatRupiah(stats.totalBiaya)}
                </span>
              </div>

              {categoryBreakdown.pengeluaran.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Belum ada data pengeluaran</p>
              ) : (
                <div className="space-y-3">
                  {categoryBreakdown.pengeluaran.map((item, idx) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700 truncate pr-2">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-slate-800">{formatRupiah(item.totalRp)}</span>
                          <span className="text-[10px] font-semibold text-slate-500 w-10 text-right">
                            {item.percent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, item.percent)}%` }}
                          className={`h-full rounded-full ${
                            idx === 0
                              ? 'bg-rose-500'
                              : idx === 1
                              ? 'bg-amber-500'
                              : idx === 2
                              ? 'bg-purple-500'
                              : 'bg-slate-500'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: METODE PEMBAYARAN */}
        {activeChartTab === 'payments' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {paymentBreakdown.length === 0 ? (
              <div className="col-span-3 text-center py-8 text-xs text-slate-400">
                Belum ada transaksi penjualan dengan metode pembayaran
              </div>
            ) : (
              paymentBreakdown.map((pay) => (
                <div
                  key={pay.method}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                      {pay.method}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {pay.percent.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-lg font-black text-slate-900 mt-1">
                    {formatRupiah(pay.total)}
                  </p>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, pay.percent)}%` }}
                      className="h-full bg-blue-600 rounded-full"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {pay.count} Transaksi terproses
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
