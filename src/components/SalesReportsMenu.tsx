import React, { useState, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  PieChart,
  ShoppingBag,
} from 'lucide-react';
import { CashTransaction, SaleTransaction, SchoolProfile } from '../types';
import {
  formatRupiah,
  formatTanggalIndo,
  formatTanggalSingkat,
  getTodayDateString,
  getMonthStartEnd,
} from '../utils/formatters';
import { exportReportToPdf, ReportItemRow } from '../utils/exportPdf';
import { exportReportToExcel } from '../utils/exportExcel';
import { DigitalSignatureModal } from './DigitalSignatureModal';

interface SalesReportsMenuProps {
  cashTransactions: CashTransaction[];
  salesTransactions: SaleTransaction[];
  school: SchoolProfile;
}

export const SalesReportsMenu: React.FC<SalesReportsMenuProps> = ({
  cashTransactions,
  salesTransactions,
  school,
}) => {
  // Current month bounds
  const currentMonthBounds = useMemo(() => getMonthStartEnd(), []);

  const [startDate, setStartDate] = useState<string>(currentMonthBounds.start);
  const [endDate, setEndDate] = useState<string>(getTodayDateString());
  const [activeReportMode, setActiveReportMode] = useState<'rekap_harian' | 'detail_transaksi'>('rekap_harian');
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string>('');

  // Preset Date range selection
  const handleSelectPreset = (preset: 'today' | 'yesterday' | 'week' | 'month' | 'last_month') => {
    const today = getTodayDateString();
    const d = new Date();

    if (preset === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'yesterday') {
      const yest = new Date(d);
      yest.setDate(d.getDate() - 1);
      const yStr = yest.toISOString().split('T')[0];
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === 'week') {
      const past7 = new Date(d);
      past7.setDate(d.getDate() - 6);
      setStartDate(past7.toISOString().split('T')[0]);
      setEndDate(today);
    } else if (preset === 'month') {
      const { start, end } = getMonthStartEnd();
      setStartDate(start);
      setEndDate(end > today ? today : end);
    } else if (preset === 'last_month') {
      const lastMonth = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      const yearMonth = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
      const { start, end } = getMonthStartEnd(yearMonth);
      setStartDate(start);
      setEndDate(end);
    }
  };

  // Filter transactions within range
  const filteredCash = useMemo(() => {
    return cashTransactions.filter((c) => c.tanggal >= startDate && c.tanggal <= endDate);
  }, [cashTransactions, startDate, endDate]);

  const filteredSales = useMemo(() => {
    return salesTransactions.filter((s) => s.tanggal >= startDate && s.tanggal <= endDate);
  }, [salesTransactions, startDate, endDate]);

  // Aggregate daily records
  const dailySummary = useMemo(() => {
    const map = new Map<
      string,
      {
        tanggal: string;
        penerimaan: number;
        pengeluaran: number;
        transaksiCount: number;
        keteranganSummary: string[];
      }
    >();

    // Process Cash
    filteredCash.forEach((c) => {
      const cur = map.get(c.tanggal) || {
        tanggal: c.tanggal,
        penerimaan: 0,
        pengeluaran: 0,
        transaksiCount: 0,
        keteranganSummary: [],
      };
      if (c.tipe === 'penerimaan') {
        cur.penerimaan += c.jumlah;
      } else {
        cur.pengeluaran += c.jumlah;
      }
      cur.transaksiCount += 1;
      if (c.keterangan && cur.keteranganSummary.length < 3) {
        cur.keteranganSummary.push(c.keterangan);
      }
      map.set(c.tanggal, cur);
    });

    const list = Array.from(map.values()).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    return list.map((item) => ({
      ...item,
      labaBersih: item.penerimaan - item.pengeluaran,
    }));
  }, [filteredCash]);

  // Financial Totals
  const { totalPenerimaan, totalPengeluaran, totalLabaBersih, marginPersen } = useMemo(() => {
    let masuk = 0;
    let keluar = 0;
    filteredCash.forEach((c) => {
      if (c.tipe === 'penerimaan') masuk += c.jumlah;
      if (c.tipe === 'pengeluaran') keluar += c.jumlah;
    });
    const laba = masuk - keluar;
    const margin = masuk > 0 ? (laba / masuk) * 100 : 0;
    return {
      totalPenerimaan: masuk,
      totalPengeluaran: keluar,
      totalLabaBersih: laba,
      marginPersen: margin,
    };
  }, [filteredCash]);

  // Top Selling Items from POS sales in range
  const topItems = useMemo(() => {
    const itemMap = new Map<
      string,
      { nama: string; qty: number; totalRp: number; labaKotor: number }
    >();

    filteredSales.forEach((s) => {
      s.items.forEach((item) => {
        const cur = itemMap.get(item.nama) || {
          nama: item.nama,
          qty: 0,
          totalRp: 0,
          labaKotor: 0,
        };
        cur.qty += item.qty;
        cur.totalRp += item.subtotal;
        cur.labaKotor += item.labaKotor;
        itemMap.set(item.nama, cur);
      });
    });

    return Array.from(itemMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [filteredSales]);

  // Generate Verification Code for Signature
  const verificationCode = useMemo(() => {
    const raw = `${school.namaSekolah}-${startDate}-${endDate}-${totalLabaBersih}-${school.nipStafKantin}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    return `KNT-V${startDate.replace(/-/g, '')}-${hex}`;
  }, [school, startDate, endDate, totalLabaBersih]);

  // Generate mini QR for in-page display
  React.useEffect(() => {
    const payload = JSON.stringify({
      dokumen: 'Laporan Penjualan Kantin',
      sekolah: school.namaSekolah,
      staf: school.namaStafKantin,
      nip: school.nipStafKantin,
      periode: `${startDate} s.d ${endDate}`,
      kodeVerifikasi: verificationCode,
      status: 'TERVERIFIKASI_DIGITAL',
    });

    QRCode.toDataURL(payload, {
      margin: 1,
      width: 140,
      color: {
        dark: '#1e40af',
        light: '#ffffff',
      },
    })
      .then(setQrPreviewUrl)
      .catch(console.error);
  }, [school, startDate, endDate, verificationCode]);

  // Prepare table rows for export
  const reportRows: ReportItemRow[] = useMemo(() => {
    if (activeReportMode === 'rekap_harian') {
      return dailySummary.map((d, idx) => ({
        no: idx + 1,
        tanggal: d.tanggal,
        keterangan: `Rekapitulasi Penjualan & Kas Harian (${d.transaksiCount} transaksi)`,
        kategori: 'Rekap Harian',
        penerimaan: d.penerimaan,
        pengeluaran: d.pengeluaran,
        laba: d.labaBersih,
      }));
    } else {
      return filteredCash.map((c, idx) => ({
        no: idx + 1,
        tanggal: c.tanggal,
        keterangan: c.keterangan || '-',
        kategori: c.kategori,
        penerimaan: c.tipe === 'penerimaan' ? c.jumlah : 0,
        pengeluaran: c.tipe === 'pengeluaran' ? c.jumlah : 0,
        laba: c.tipe === 'penerimaan' ? c.jumlah : -c.jumlah,
      }));
    }
  }, [activeReportMode, dailySummary, filteredCash]);

  // Handle Export PDF
  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await exportReportToPdf({
        title:
          activeReportMode === 'rekap_harian'
            ? 'Laporan Rekapitulasi Penjualan & Laba Bersih Kantin'
            : 'Laporan Rincian Arus Kas & Penjualan Kantin',
        subtitle: `Sekolah: ${school.namaSekolah}`,
        startDate,
        endDate,
        school,
        rows: reportRows,
        totalPenerimaan,
        totalPengeluaran,
        totalLabaBersih,
        verificationCode,
      });
    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Export Excel
  const handleExportExcel = () => {
    try {
      exportReportToExcel({
        title:
          activeReportMode === 'rekap_harian'
            ? 'Laporan Rekapitulasi Penjualan & Laba Bersih Kantin'
            : 'Laporan Rincian Arus Kas & Penjualan Kantin',
        startDate,
        endDate,
        school,
        rows: reportRows,
        totalPenerimaan,
        totalPengeluaran,
        totalLabaBersih,
        verificationCode,
      });
    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor file Excel.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Date Range Picker */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
              <span className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                <FileText className="w-5 h-5" />
              </span>
              Laporan Penjualan & Rekapitulasi Laba Bersih
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Pantau omzet berkala, biaya pengeluaran, dan laba bersih kantin dengan tanda tangan digital resmi.
            </p>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 rounded-xl transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Ekspor Excel (.xlsx)
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Memproses PDF...' : 'Ekspor PDF (Resmi)'}
            </button>
          </div>
        </div>

        {/* Date Filters & Presets */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Pilih Periode:
            </span>
            <button
              onClick={() => handleSelectPreset('today')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 transition-colors"
            >
              Hari Ini
            </button>
            <button
              onClick={() => handleSelectPreset('yesterday')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 transition-colors"
            >
              Kemarin
            </button>
            <button
              onClick={() => handleSelectPreset('week')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 transition-colors"
            >
              7 Hari Terakhir
            </button>
            <button
              onClick={() => handleSelectPreset('month')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-50 text-blue-800 font-semibold border border-blue-200"
            >
              Bulan Ini
            </button>
            <button
              onClick={() => handleSelectPreset('last_month')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 transition-colors"
            >
              Bulan Kemarin
            </button>
          </div>

          {/* Custom Date Pickers */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Dari:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs bg-transparent focus:outline-hidden font-medium text-slate-800"
              />
            </div>
            <span className="text-slate-400 text-xs">s/d</span>
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Sampai:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs bg-transparent focus:outline-hidden font-medium text-slate-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Financial Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Penerimaan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>TOTAL PENERIMAAN / OMZET</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ArrowDownLeft className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">{formatRupiah(totalPenerimaan)}</p>
          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
            <span>{filteredCash.filter((c) => c.tipe === 'penerimaan').length} transaksi kas masuk</span>
          </p>
        </div>

        {/* Total Pengeluaran */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>TOTAL BIAYA / PENGELUARAN</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">{formatRupiah(totalPengeluaran)}</p>
          <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
            <span>{filteredCash.filter((c) => c.tipe === 'pengeluaran').length} transaksi pengeluaran</span>
          </p>
        </div>

        {/* Laba Bersih */}
        <div className="bg-linear-to-br from-blue-900 via-blue-800 to-indigo-900 text-white p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-100">
            <span>LABA BERSIH PERIODE INI</span>
            <span className="p-1.5 rounded-lg bg-white/20 text-white">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{formatRupiah(totalLabaBersih)}</p>
          <p className="text-xs text-blue-100/90 mt-1">
            {totalLabaBersih >= 0 ? 'Kondisi Keuangan Sehat / Untung' : 'Perlu Evaluasi Pengeluaran'}
          </p>
        </div>

        {/* Margin & QR Tanda Tangan Banner */}
        <div
          onClick={() => setIsSignModalOpen(true)}
          className="bg-slate-900 text-white p-4 rounded-2xl shadow-xs cursor-pointer hover:bg-slate-800 transition-colors flex items-center justify-between gap-3 group"
        >
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Tanda Tangan Digital Staf
            </div>
            <p className="text-xs font-medium text-slate-300">
              Oleh: <strong className="text-white">{school.namaStafKantin}</strong>
            </p>
            <p className="text-[10px] text-slate-400 font-mono">Kode: {verificationCode.slice(0, 14)}...</p>
            <span className="inline-block text-[11px] text-blue-300 font-semibold group-hover:underline">
              Klik untuk Verifikasi QR →
            </span>
          </div>

          <div className="shrink-0 bg-white p-1 rounded-lg border border-blue-500 shadow-xs">
            {qrPreviewUrl ? (
              <img src={qrPreviewUrl} alt="QR Tanda Tangan" className="w-16 h-16 object-contain" />
            ) : (
              <div className="w-16 h-16 bg-slate-200 animate-pulse rounded" />
            )}
          </div>
        </div>
      </div>

      {/* Top Selling Quick Insight */}
      {topItems.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-700" />
              Item Jajanan & Makanan Terlaris Periode Ini
            </h3>
            <span className="text-xs text-slate-400">Berdasarkan data kasir kantin</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {topItems.map((item, idx) => (
              <div key={item.nama} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400">#{idx + 1}</span>
                  <span className="text-xs font-bold text-emerald-700">{item.qty} terjual</span>
                </div>
                <h4 className="font-semibold text-xs text-slate-800 mt-1 truncate" title={item.nama}>
                  {item.nama}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{formatRupiah(item.totalRp)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table Section with Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Sub Navigation */}
        <div className="border-b border-slate-200 px-5 pt-4 flex items-center justify-between gap-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveReportMode('rekap_harian')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
                activeReportMode === 'rekap_harian'
                  ? 'border-blue-700 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Rekapitulasi Laba Bersih Per Hari ({dailySummary.length} Hari)
            </button>
            <button
              onClick={() => setActiveReportMode('detail_transaksi')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
                activeReportMode === 'detail_transaksi'
                  ? 'border-blue-700 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Rincian Transaksi Lengkap ({filteredCash.length} Baris)
            </button>
          </div>

          <div className="pb-3 text-xs text-slate-500 hidden sm:block">
            Periode: <strong>{formatTanggalIndo(startDate)}</strong> s.d.{' '}
            <strong>{formatTanggalIndo(endDate)}</strong>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {activeReportMode === 'rekap_harian' ? (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4 w-36">Tanggal</th>
                  <th className="py-3.5 px-4">Ringkasan Aktivitas Hari Tersebut</th>
                  <th className="py-3.5 px-4 w-28 text-center">Jml Transaksi</th>
                  <th className="py-3.5 px-4 w-36 text-right">Penerimaan</th>
                  <th className="py-3.5 px-4 w-36 text-right">Pengeluaran</th>
                  <th className="py-3.5 px-4 w-36 text-right">Laba Bersih Harian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailySummary.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Tidak ada aktivitas kas / penjualan pada rentang tanggal yang dipilih.
                    </td>
                  </tr>
                ) : (
                  dailySummary.map((row, idx) => (
                    <tr key={row.tanggal} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center text-xs text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 text-xs block">
                          {formatTanggalIndo(row.tanggal)}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatTanggalSingkat(row.tanggal)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        {row.keteranganSummary.length > 0
                          ? row.keteranganSummary.join(', ')
                          : 'Aktivitas kantin normal'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                          {row.transaksiCount}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-700 font-semibold whitespace-nowrap text-xs">
                        +{formatRupiah(row.penerimaan)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-rose-700 font-semibold whitespace-nowrap text-xs">
                        -{formatRupiah(row.pengeluaran)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-bold text-xs ${
                            row.labaBersih >= 0 ? 'text-teal-700' : 'text-rose-600'
                          }`}
                        >
                          {formatRupiah(row.labaBersih)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {dailySummary.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100/80 font-bold border-t border-slate-300 text-xs text-slate-800">
                    <td colSpan={4} className="py-3.5 px-4 text-right uppercase tracking-wider">
                      TOTAL PERIODE TERPILIH :
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-700">
                      {formatRupiah(totalPenerimaan)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-rose-700">
                      {formatRupiah(totalPengeluaran)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-teal-800 text-sm">
                      {formatRupiah(totalLabaBersih)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4 w-32">Tanggal</th>
                  <th className="py-3.5 px-4 w-36">Kategori</th>
                  <th className="py-3.5 px-4">Keterangan</th>
                  <th className="py-3.5 px-4 w-32 text-right">Penerimaan</th>
                  <th className="py-3.5 px-4 w-32 text-right">Pengeluaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCash.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Tidak ada transaksi pada rentang tanggal ini.
                    </td>
                  </tr>
                ) : (
                  filteredCash.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center text-xs text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-700 font-medium">
                        {formatTanggalIndo(item.tanggal)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {item.kategori}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700">
                        {item.keterangan || '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-700 font-medium whitespace-nowrap text-xs">
                        {item.tipe === 'penerimaan' ? `+${formatRupiah(item.jumlah)}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-rose-700 font-medium whitespace-nowrap text-xs">
                        {item.tipe === 'pengeluaran' ? `-${formatRupiah(item.jumlah)}` : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info with Digital Signature Verification Card */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                Tanda Tangan Digital Pengesahan Laporan
              </p>
              <p className="text-[11px] text-slate-500">
                Disahkan oleh <strong>{school.namaStafKantin}</strong> ({school.jabatanStaf}) • {school.kotaPengesahan}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSignModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              Periksa Detail QR TTD Digital
            </button>
          </div>
        </div>
      </div>

      {/* Modal Digital Signature */}
      <DigitalSignatureModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        school={school}
        reportTitle={
          activeReportMode === 'rekap_harian'
            ? 'Rekapitulasi Laba Bersih Penjualan Kantin'
            : 'Rincian Buku Kas Kantin'
        }
        startDate={startDate}
        endDate={endDate}
        verificationCode={verificationCode}
      />
    </div>
  );
};
