import React, { useState, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  BarChart3,
  ShoppingBag,
  CalendarDays,
  CalendarRange,
  ArrowRight,
  Award,
} from 'lucide-react';
import { CashTransaction, SaleTransaction, SchoolProfile } from '../types';
import {
  formatRupiah,
  formatTanggalIndo,
  formatTanggalSingkat,
  formatBulanTahunIndo,
  getTodayDateString,
  getMonthStartEnd,
} from '../utils/formatters';
import { exportReportToPdf, ReportItemRow } from '../utils/exportPdf';
import { exportReportToExcel } from '../utils/exportExcel';
import { DigitalSignatureModal } from './DigitalSignatureModal';
import { SalesAnalyticsChart } from './SalesAnalyticsChart';

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
  const [activeReportMode, setActiveReportMode] = useState<
    'rekap_harian' | 'laporan_bulanan' | 'laporan_tahunan' | 'detail_transaksi'
  >('rekap_harian');
  const [showChart, setShowChart] = useState(true);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string>('');
  const [selectedYearForMonthly, setSelectedYearForMonthly] = useState<string>('all');

  // Preset Date range selection for Daily / Detail modes
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

  // Filter transactions within range (for daily & detailed modes)
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

  // Financial Totals for Daily / Detail view
  const { totalPenerimaanDaily, totalPengeluaranDaily, totalLabaBersihDaily, marginPersenDaily } =
    useMemo(() => {
      let masuk = 0;
      let keluar = 0;
      filteredCash.forEach((c) => {
        if (c.tipe === 'penerimaan') masuk += c.jumlah;
        if (c.tipe === 'pengeluaran') keluar += c.jumlah;
      });
      const laba = masuk - keluar;
      const margin = masuk > 0 ? (laba / masuk) * 100 : 0;
      return {
        totalPenerimaanDaily: masuk,
        totalPengeluaranDaily: keluar,
        totalLabaBersihDaily: laba,
        marginPersenDaily: margin,
      };
    }, [filteredCash]);

  // =========================================================================
  // MONTHLY AGGREGATION (LAPORAN BULANAN)
  // =========================================================================
  const monthlySummary = useMemo(() => {
    const map = new Map<
      string,
      {
        bulanKey: string; // "2026-10"
        tahun: string; // "2026"
        penerimaan: number;
        pengeluaran: number;
        transaksiCount: number;
        hariSet: Set<string>;
      }
    >();

    cashTransactions.forEach((c) => {
      if (!c.tanggal) return;
      const ym = c.tanggal.slice(0, 7);
      const yr = c.tanggal.slice(0, 4);
      const cur = map.get(ym) || {
        bulanKey: ym,
        tahun: yr,
        penerimaan: 0,
        pengeluaran: 0,
        transaksiCount: 0,
        hariSet: new Set<string>(),
      };
      if (c.tipe === 'penerimaan') cur.penerimaan += c.jumlah;
      if (c.tipe === 'pengeluaran') cur.pengeluaran += c.jumlah;
      cur.transaksiCount += 1;
      cur.hariSet.add(c.tanggal);
      map.set(ym, cur);
    });

    return Array.from(map.values())
      .map((item) => ({
        bulanKey: item.bulanKey,
        tahun: item.tahun,
        namaBulan: formatBulanTahunIndo(item.bulanKey),
        penerimaan: item.penerimaan,
        pengeluaran: item.pengeluaran,
        labaBersih: item.penerimaan - item.pengeluaran,
        transaksiCount: item.transaksiCount,
        hariAktif: item.hariSet.size,
        marginPersen:
          item.penerimaan > 0
            ? ((item.penerimaan - item.pengeluaran) / item.penerimaan) * 100
            : 0,
      }))
      .sort((a, b) => b.bulanKey.localeCompare(a.bulanKey));
  }, [cashTransactions]);

  // Available Years for filter
  const availableYears = useMemo(() => {
    const set = new Set<string>();
    const currentYear = new Date().getFullYear().toString();
    set.add(currentYear);
    cashTransactions.forEach((c) => {
      if (c.tanggal) set.add(c.tanggal.slice(0, 4));
    });
    return Array.from(set).sort().reverse();
  }, [cashTransactions]);

  // Filtered Monthly Summary based on chosen year
  const filteredMonthlySummary = useMemo(() => {
    if (selectedYearForMonthly === 'all') return monthlySummary;
    return monthlySummary.filter((m) => m.tahun === selectedYearForMonthly);
  }, [monthlySummary, selectedYearForMonthly]);

  // Monthly KPI Totals
  const monthlyTotals = useMemo(() => {
    let masuk = 0;
    let keluar = 0;
    let bestMonth = '-';
    let bestMonthOmzet = 0;

    filteredMonthlySummary.forEach((m) => {
      masuk += m.penerimaan;
      keluar += m.pengeluaran;
      if (m.penerimaan > bestMonthOmzet) {
        bestMonthOmzet = m.penerimaan;
        bestMonth = m.namaBulan;
      }
    });

    const laba = masuk - keluar;
    const avgOmzet =
      filteredMonthlySummary.length > 0 ? masuk / filteredMonthlySummary.length : 0;
    const margin = masuk > 0 ? (laba / masuk) * 100 : 0;

    return {
      totalPenerimaan: masuk,
      totalPengeluaran: keluar,
      totalLabaBersih: laba,
      marginPersen: margin,
      avgOmzet,
      bestMonth,
      bestMonthOmzet,
    };
  }, [filteredMonthlySummary]);

  // =========================================================================
  // YEARLY AGGREGATION (LAPORAN TAHUNAN)
  // =========================================================================
  const yearlySummary = useMemo(() => {
    const map = new Map<
      string,
      {
        tahun: string;
        penerimaan: number;
        pengeluaran: number;
        transaksiCount: number;
        bulanSet: Set<string>;
        hariSet: Set<string>;
        monthlyMap: Map<string, number>;
      }
    >();

    cashTransactions.forEach((c) => {
      if (!c.tanggal) return;
      const yr = c.tanggal.slice(0, 4);
      const ym = c.tanggal.slice(0, 7);
      const cur = map.get(yr) || {
        tahun: yr,
        penerimaan: 0,
        pengeluaran: 0,
        transaksiCount: 0,
        bulanSet: new Set<string>(),
        hariSet: new Set<string>(),
        monthlyMap: new Map<string, number>(),
      };

      if (c.tipe === 'penerimaan') {
        cur.penerimaan += c.jumlah;
        cur.monthlyMap.set(ym, (cur.monthlyMap.get(ym) || 0) + c.jumlah);
      }
      if (c.tipe === 'pengeluaran') {
        cur.pengeluaran += c.jumlah;
      }
      cur.transaksiCount += 1;
      cur.bulanSet.add(ym);
      cur.hariSet.add(c.tanggal);
      map.set(yr, cur);
    });

    return Array.from(map.values())
      .map((item) => {
        let bestMonth = '-';
        let bestMonthOmzet = 0;
        item.monthlyMap.forEach((omzet, ym) => {
          if (omzet > bestMonthOmzet) {
            bestMonthOmzet = omzet;
            bestMonth = formatBulanTahunIndo(ym);
          }
        });

        return {
          tahun: item.tahun,
          penerimaan: item.penerimaan,
          pengeluaran: item.pengeluaran,
          labaBersih: item.penerimaan - item.pengeluaran,
          transaksiCount: item.transaksiCount,
          bulanAktif: item.bulanSet.size,
          hariAktif: item.hariSet.size,
          marginPersen:
            item.penerimaan > 0
              ? ((item.penerimaan - item.pengeluaran) / item.penerimaan) * 100
              : 0,
          bulanTerbaik: bestMonth,
          omzetBulanTerbaik: bestMonthOmzet,
        };
      })
      .sort((a, b) => b.tahun.localeCompare(a.tahun));
  }, [cashTransactions]);

  // Yearly KPI Totals
  const yearlyTotals = useMemo(() => {
    let masuk = 0;
    let keluar = 0;
    let bestYear = '-';
    let bestYearOmzet = 0;

    yearlySummary.forEach((y) => {
      masuk += y.penerimaan;
      keluar += y.pengeluaran;
      if (y.penerimaan > bestYearOmzet) {
        bestYearOmzet = y.penerimaan;
        bestYear = `Tahun ${y.tahun}`;
      }
    });

    const laba = masuk - keluar;
    const avgOmzetPerYear = yearlySummary.length > 0 ? masuk / yearlySummary.length : 0;
    const margin = masuk > 0 ? (laba / masuk) * 100 : 0;

    return {
      totalPenerimaan: masuk,
      totalPengeluaran: keluar,
      totalLabaBersih: laba,
      marginPersen: margin,
      avgOmzetPerYear,
      bestYear,
      bestYearOmzet,
    };
  }, [yearlySummary]);

  // Dynamic active totals based on active report mode
  const activeTotals = useMemo(() => {
    if (activeReportMode === 'laporan_bulanan') {
      return {
        penerimaan: monthlyTotals.totalPenerimaan,
        pengeluaran: monthlyTotals.totalPengeluaran,
        laba: monthlyTotals.totalLabaBersih,
        margin: monthlyTotals.marginPersen,
      };
    }
    if (activeReportMode === 'laporan_tahunan') {
      return {
        penerimaan: yearlyTotals.totalPenerimaan,
        pengeluaran: yearlyTotals.totalPengeluaran,
        laba: yearlyTotals.totalLabaBersih,
        margin: yearlyTotals.marginPersen,
      };
    }
    return {
      penerimaan: totalPenerimaanDaily,
      pengeluaran: totalPengeluaranDaily,
      laba: totalLabaBersihDaily,
      margin: marginPersenDaily,
    };
  }, [
    activeReportMode,
    monthlyTotals,
    yearlyTotals,
    totalPenerimaanDaily,
    totalPengeluaranDaily,
    totalLabaBersihDaily,
    marginPersenDaily,
  ]);

  // Drill down from monthly to daily
  const handleDrillDownToDaily = (bulanKey: string) => {
    const bounds = getMonthStartEnd(bulanKey);
    setStartDate(bounds.start);
    setEndDate(bounds.end);
    setActiveReportMode('rekap_harian');
  };

  // Drill down from yearly to monthly
  const handleDrillDownToMonthly = (tahun: string) => {
    setSelectedYearForMonthly(tahun);
    setActiveReportMode('laporan_bulanan');
  };

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
    const raw = `${school.namaSekolah}-${activeReportMode}-${startDate}-${endDate}-${activeTotals.laba}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    return `KNT-V${startDate.replace(/-/g, '')}-${hex}`;
  }, [school, activeReportMode, startDate, endDate, activeTotals.laba]);

  // Generate mini QR for in-page display
  React.useEffect(() => {
    const payload = JSON.stringify({
      dokumen:
        activeReportMode === 'laporan_bulanan'
          ? 'Laporan Penjualan Bulanan Kantin'
          : activeReportMode === 'laporan_tahunan'
          ? 'Laporan Penjualan Tahunan Kantin'
          : 'Laporan Penjualan Harian Kantin',
      sekolah: school.namaSekolah,
      mode: activeReportMode,
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
  }, [school, activeReportMode, verificationCode]);

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
    } else if (activeReportMode === 'laporan_bulanan') {
      return filteredMonthlySummary.map((m, idx) => ({
        no: idx + 1,
        tanggal: m.namaBulan,
        keterangan: `Rekapitulasi Bulanan (${m.transaksiCount} transaksi, ${m.hariAktif} hari aktif)`,
        kategori: 'Rekap Bulanan',
        penerimaan: m.penerimaan,
        pengeluaran: m.pengeluaran,
        laba: m.labaBersih,
      }));
    } else if (activeReportMode === 'laporan_tahunan') {
      return yearlySummary.map((y, idx) => ({
        no: idx + 1,
        tanggal: `Tahun ${y.tahun}`,
        keterangan: `Rekapitulasi Tahunan (${y.bulanAktif} bulan aktif, ${y.transaksiCount} transaksi)`,
        kategori: 'Rekap Tahunan',
        penerimaan: y.penerimaan,
        pengeluaran: y.pengeluaran,
        laba: y.labaBersih,
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
  }, [activeReportMode, dailySummary, filteredMonthlySummary, yearlySummary, filteredCash]);

  // Report export titles and headers
  const exportMeta = useMemo(() => {
    if (activeReportMode === 'laporan_bulanan') {
      return {
        title: 'Laporan Rekapitulasi Penjualan & Laba Bersih Bulanan Kantin',
        customHeaders: [
          'No',
          'Bulan / Periode',
          'Keterangan',
          'Kategori',
          'Penerimaan (Rp)',
          'Pengeluaran (Rp)',
          'Laba Bersih (Rp)',
        ],
        customPeriode:
          selectedYearForMonthly === 'all'
            ? 'Seluruh Tahun Tersimpan'
            : `Tahun ${selectedYearForMonthly}`,
      };
    }
    if (activeReportMode === 'laporan_tahunan') {
      return {
        title: 'Laporan Rekapitulasi Penjualan & Laba Bersih Tahunan Kantin',
        customHeaders: [
          'No',
          'Tahun',
          'Keterangan',
          'Kategori',
          'Penerimaan (Rp)',
          'Pengeluaran (Rp)',
          'Laba Bersih (Rp)',
        ],
        customPeriode: 'Akumulasi Seluruh Periode Tahunan',
      };
    }
    if (activeReportMode === 'detail_transaksi') {
      return {
        title: 'Laporan Rincian Transaksi Buku Kas & Penjualan Kantin',
        customHeaders: [
          'No',
          'Tanggal',
          'Keterangan',
          'Kategori',
          'Penerimaan (Rp)',
          'Pengeluaran (Rp)',
          'Laba Bersih (Rp)',
        ],
        customPeriode:
          startDate === endDate
            ? formatTanggalIndo(startDate)
            : `${formatTanggalIndo(startDate)} s.d. ${formatTanggalIndo(endDate)}`,
      };
    }
    return {
      title: 'Laporan Rekapitulasi Penjualan & Laba Bersih Harian Kantin',
      customHeaders: [
        'No',
        'Tanggal',
        'Keterangan',
        'Kategori',
        'Penerimaan (Rp)',
        'Pengeluaran (Rp)',
        'Laba Bersih (Rp)',
      ],
      customPeriode:
        startDate === endDate
          ? formatTanggalIndo(startDate)
          : `${formatTanggalIndo(startDate)} s.d. ${formatTanggalIndo(endDate)}`,
    };
  }, [activeReportMode, selectedYearForMonthly, startDate, endDate]);

  // Handle Export PDF
  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await exportReportToPdf({
        title: exportMeta.title,
        subtitle: `Sekolah: ${school.namaSekolah}`,
        startDate,
        endDate,
        school,
        rows: reportRows,
        totalPenerimaan: activeTotals.penerimaan,
        totalPengeluaran: activeTotals.pengeluaran,
        totalLabaBersih: activeTotals.laba,
        verificationCode,
        customHeaders: exportMeta.customHeaders,
        customPeriode: exportMeta.customPeriode,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Export Excel
  const handleExportExcel = () => {
    try {
      exportReportToExcel({
        title: exportMeta.title,
        startDate,
        endDate,
        school,
        rows: reportRows,
        totalPenerimaan: activeTotals.penerimaan,
        totalPengeluaran: activeTotals.pengeluaran,
        totalLabaBersih: activeTotals.laba,
        verificationCode,
        customHeaders: exportMeta.customHeaders,
        customPeriode: exportMeta.customPeriode,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
              <span className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                <FileText className="w-5 h-5" />
              </span>
              Laporan Penjualan & Rekapitulasi Keuangan
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Ringkasan data harian, laporan bulanan, dan tahunan otomatis dengan analisis laba bersih dan tanda tangan digital.
            </p>
          </div>

          {/* Action & Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {(activeReportMode === 'rekap_harian' || activeReportMode === 'detail_transaksi') && (
              <button
                type="button"
                onClick={() => setShowChart(!showChart)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all shadow-xs cursor-pointer ${
                  showChart
                    ? 'bg-blue-50 text-blue-800 border-blue-200 ring-1 ring-blue-300/40'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>{showChart ? 'Tutup Grafik' : 'Grafik Statistik'}</span>
              </button>
            )}

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Ekspor Excel (.xlsx)
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Memproses PDF...' : 'Ekspor PDF (Resmi)'}
            </button>
          </div>
        </div>

        {/* Dynamic Filters depending on mode */}
        {activeReportMode === 'laporan_bulanan' ? (
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                <CalendarDays className="w-4 h-4 text-indigo-600" />
                Pilih Tahun Laporan Bulanan:
              </span>
              <select
                value={selectedYearForMonthly}
                onChange={(e) => setSelectedYearForMonthly(e.target.value)}
                className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Tahun ({availableYears.length} Tahun)</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    Tahun {yr}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-400">Pintasan:</span>
              <button
                type="button"
                onClick={() => setSelectedYearForMonthly('all')}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors ${
                  selectedYearForMonthly === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua
              </button>
              {availableYears.slice(0, 3).map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setSelectedYearForMonthly(yr)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors ${
                    selectedYearForMonthly === yr
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>
        ) : activeReportMode === 'laporan_tahunan' ? (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <CalendarRange className="w-4 h-4 text-purple-600" />
              <span className="font-semibold">
                Laporan Komparasi Kinerja Penjualan Antar Tahun
              </span>
              <span className="text-slate-400">({yearlySummary.length} Tahun Terdata)</span>
            </div>
            <span className="text-[11px] text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md font-semibold border border-purple-200">
              Akumulasi Multi-Tahun
            </span>
          </div>
        ) : (
          /* Date Filters & Presets for Daily and Detail modes */
          <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Quick presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Pilih Periode:
              </span>
              <button
                type="button"
                onClick={() => handleSelectPreset('today')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 transition-colors"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('yesterday')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 transition-colors"
              >
                Kemarin
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('week')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 transition-colors"
              >
                7 Hari Terakhir
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('month')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-50 text-blue-800 font-semibold border border-blue-200"
              >
                Bulan Ini
              </button>
              <button
                type="button"
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
        )}
      </div>

      {/* Financial Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Penerimaan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>
              {activeReportMode === 'laporan_bulanan'
                ? 'OMZET BULANAN TERPILIH'
                : activeReportMode === 'laporan_tahunan'
                ? 'TOTAL OMZET TAHUNAN'
                : 'TOTAL PENERIMAAN / OMZET'}
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ArrowDownLeft className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">
            {formatRupiah(activeTotals.penerimaan)}
          </p>
          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
            <span>
              {activeReportMode === 'laporan_bulanan'
                ? `${filteredMonthlySummary.length} bulan terhitung`
                : activeReportMode === 'laporan_tahunan'
                ? `${yearlySummary.length} tahun periode`
                : `${filteredCash.filter((c) => c.tipe === 'penerimaan').length} transaksi kas masuk`}
            </span>
          </p>
        </div>

        {/* Total Pengeluaran */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>
              {activeReportMode === 'laporan_bulanan'
                ? 'PENGELUARAN BULANAN'
                : activeReportMode === 'laporan_tahunan'
                ? 'TOTAL BIAYA TAHUNAN'
                : 'TOTAL BIAYA / PENGELUARAN'}
            </span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">
            {formatRupiah(activeTotals.pengeluaran)}
          </p>
          <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
            <span>
              {activeReportMode === 'laporan_bulanan'
                ? `Biaya operasional & kulakan`
                : activeReportMode === 'laporan_tahunan'
                ? `Akumulasi biaya seluruh periode`
                : `${filteredCash.filter((c) => c.tipe === 'pengeluaran').length} transaksi pengeluaran`}
            </span>
          </p>
        </div>

        {/* Laba Bersih */}
        <div className="bg-linear-to-br from-blue-900 via-blue-800 to-indigo-900 text-white p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-100">
            <span>
              {activeReportMode === 'laporan_bulanan'
                ? 'LABA BERSIH BULANAN'
                : activeReportMode === 'laporan_tahunan'
                ? 'LABA BERSIH TAHUNAN'
                : 'LABA BERSIH PERIODE INI'}
            </span>
            <span className="p-1.5 rounded-lg bg-white/20 text-white">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{formatRupiah(activeTotals.laba)}</p>
          <p className="text-xs text-blue-100/90 mt-1">
            Margin Keuntungan: <strong>{activeTotals.margin.toFixed(1)}%</strong>
          </p>
        </div>

        {/* Tanda Tangan Digital Card */}
        <div
          onClick={() => setIsSignModalOpen(true)}
          className="bg-slate-900 text-white p-4 rounded-2xl shadow-xs cursor-pointer hover:bg-slate-800 transition-colors flex items-center justify-between gap-3 group"
        >
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Tanda Tangan Digital Pengesahan
            </div>
            <p className="text-xs font-medium text-slate-300">
              Oleh: <strong className="text-white">Pengelola Kantin</strong>
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              Kode: {verificationCode.slice(0, 14)}...
            </p>
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

      {/* Statistical Sales Analytics Chart (visible in daily/detail mode) */}
      {showChart &&
        (activeReportMode === 'rekap_harian' || activeReportMode === 'detail_transaksi') && (
          <SalesAnalyticsChart
            dailySummary={dailySummary}
            cashTransactions={filteredCash}
            salesTransactions={filteredSales}
            startDate={startDate}
            endDate={endDate}
          />
        )}

      {/* Top Selling Quick Insight (only in daily/detail mode) */}
      {(activeReportMode === 'rekap_harian' || activeReportMode === 'detail_transaksi') &&
        topItems.length > 0 && (
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
                  <h4
                    className="font-semibold text-xs text-slate-800 mt-1 truncate"
                    title={item.nama}
                  >
                    {item.nama}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{formatRupiah(item.totalRp)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* ========================================================================= */}
      {/* TABLE SECTION WITH 4 REPORT MODES (HARIAN, BULANAN, TAHUNAN, DETAIL)       */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 px-5 pt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 sm:gap-6">
            {/* Tab 1: Rekap Harian */}
            <button
              type="button"
              onClick={() => setActiveReportMode('rekap_harian')}
              className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeReportMode === 'rekap_harian'
                  ? 'border-blue-700 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Rekap Harian ({dailySummary.length})
            </button>

            {/* Tab 2: Laporan Bulanan (New Feature) */}
            <button
              type="button"
              onClick={() => setActiveReportMode('laporan_bulanan')}
              className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeReportMode === 'laporan_bulanan'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarDays className="w-4 h-4 text-indigo-600" />
              Laporan Bulanan ({filteredMonthlySummary.length})
            </button>

            {/* Tab 3: Laporan Tahunan (New Feature) */}
            <button
              type="button"
              onClick={() => setActiveReportMode('laporan_tahunan')}
              className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeReportMode === 'laporan_tahunan'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarRange className="w-4 h-4 text-purple-600" />
              Laporan Tahunan ({yearlySummary.length})
            </button>

            {/* Tab 4: Rincian Transaksi */}
            <button
              type="button"
              onClick={() => setActiveReportMode('detail_transaksi')}
              className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeReportMode === 'detail_transaksi'
                  ? 'border-blue-700 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              Rincian Transaksi ({filteredCash.length})
            </button>
          </div>

          <div className="pb-3 text-xs text-slate-500 hidden md:block">
            {activeReportMode === 'laporan_bulanan' ? (
              <span>
                Filter: <strong>{selectedYearForMonthly === 'all' ? 'Seluruh Tahun' : `Tahun ${selectedYearForMonthly}`}</strong>
              </span>
            ) : activeReportMode === 'laporan_tahunan' ? (
              <span>
                Komparasi: <strong>Seluruh Tahun Operasional</strong>
              </span>
            ) : (
              <span>
                Periode: <strong>{formatTanggalIndo(startDate)}</strong> s.d.{' '}
                <strong>{formatTanggalIndo(endDate)}</strong>
              </span>
            )}
          </div>
        </div>

        {/* TAB 1: REKAP HARIAN */}
        {activeReportMode === 'rekap_harian' && (
          <div className="overflow-x-auto">
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
                      {formatRupiah(totalPenerimaanDaily)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-rose-700">
                      {formatRupiah(totalPengeluaranDaily)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-teal-800 text-sm">
                      {formatRupiah(totalLabaBersihDaily)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* TAB 2: LAPORAN BULANAN (FITUR RINGKASAN DATA BULANAN) */}
        {activeReportMode === 'laporan_bulanan' && (
          <div className="p-4 sm:p-6 space-y-5">
            {/* Mini Summary Cards for Monthly */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                  Rata-rata Omzet / Bulan
                </span>
                <p className="text-lg font-black text-slate-800">
                  {formatRupiah(monthlyTotals.avgOmzet)}
                </p>
                <p className="text-[10px] text-slate-500">
                  Dari total {filteredMonthlySummary.length} bulan yang aktif tercatat
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  Bulan dengan Omzet Tertinggi
                </span>
                <p className="text-lg font-black text-emerald-800 truncate" title={monthlyTotals.bestMonth}>
                  {monthlyTotals.bestMonth !== '-' ? monthlyTotals.bestMonth : 'Belum Ada'}
                </p>
                <p className="text-[10px] text-emerald-700 font-semibold">
                  {monthlyTotals.bestMonthOmzet > 0
                    ? `Puncak: ${formatRupiah(monthlyTotals.bestMonthOmzet)}`
                    : '-'}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Tingkat Keuntungan Rata-rata
                </span>
                <p className="text-lg font-black text-indigo-900">
                  {monthlyTotals.marginPersen.toFixed(1)}% Margin
                </p>
                <p className="text-[10px] text-slate-500">
                  Akumulasi laba bersih dibanding penerimaan
                </p>
              </div>
            </div>

            {/* Monthly Breakdown Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                    <th className="py-3.5 px-4 w-40">Bulan & Tahun</th>
                    <th className="py-3.5 px-4 w-28 text-center">Hari Aktif</th>
                    <th className="py-3.5 px-4 w-28 text-center">Transaksi</th>
                    <th className="py-3.5 px-4 w-36 text-right">Penerimaan (Omzet)</th>
                    <th className="py-3.5 px-4 w-36 text-right">Pengeluaran (Biaya)</th>
                    <th className="py-3.5 px-4 w-36 text-right">Laba Bersih</th>
                    <th className="py-3.5 px-4 w-24 text-right">Margin %</th>
                    <th className="py-3.5 px-4 w-32 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredMonthlySummary.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Tidak ada data transaksi bulanan yang cocok dengan filter tahun ini.
                      </td>
                    </tr>
                  ) : (
                    filteredMonthlySummary.map((m, idx) => (
                      <tr key={m.bulanKey} className="hover:bg-indigo-50/40 transition-colors">
                        <td className="py-3.5 px-4 text-center text-xs text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-bold text-slate-900 text-xs block">
                            {m.namaBulan}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{m.bulanKey}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-700">
                            {m.hariAktif} Hari
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold">
                            {m.transaksiCount}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-emerald-700 font-black whitespace-nowrap text-xs">
                          +{formatRupiah(m.penerimaan)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-rose-700 font-semibold whitespace-nowrap text-xs">
                          -{formatRupiah(m.pengeluaran)}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span
                            className={`font-black text-xs ${
                              m.labaBersih >= 0 ? 'text-indigo-900' : 'text-rose-600'
                            }`}
                          >
                            {formatRupiah(m.labaBersih)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-xs font-bold text-slate-600">
                          {m.marginPersen.toFixed(1)}%
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleDrillDownToDaily(m.bulanKey)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            <span>Rekap Harian</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredMonthlySummary.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100 font-black border-t-2 border-indigo-200 text-xs text-slate-800">
                      <td colSpan={4} className="py-3.5 px-4 text-right uppercase tracking-wider">
                        TOTAL REKAPITULASI BULANAN :
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-700">
                        {formatRupiah(monthlyTotals.totalPenerimaan)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-rose-700">
                        {formatRupiah(monthlyTotals.totalPengeluaran)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-indigo-950 text-sm">
                        {formatRupiah(monthlyTotals.totalLabaBersih)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-700">
                        {monthlyTotals.marginPersen.toFixed(1)}%
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: LAPORAN TAHUNAN (FITUR RINGKASAN DATA TAHUNAN) */}
        {activeReportMode === 'laporan_tahunan' && (
          <div className="p-4 sm:p-6 space-y-5">
            {/* Multi-Year Overview Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-purple-50/50 p-4 rounded-xl border border-purple-100">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                  Rata-rata Omzet / Tahun
                </span>
                <p className="text-lg font-black text-slate-800">
                  {formatRupiah(yearlyTotals.avgOmzetPerYear)}
                </p>
                <p className="text-[10px] text-slate-500">
                  Rerata tahunan dari seluruh data kas & penjualan
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  Tahun Omzet Tertinggi
                </span>
                <p className="text-lg font-black text-emerald-800">
                  {yearlyTotals.bestYear !== '-' ? yearlyTotals.bestYear : 'Belum Ada'}
                </p>
                <p className="text-[10px] text-emerald-700 font-semibold">
                  {yearlyTotals.bestYearOmzet > 0
                    ? `Puncak: ${formatRupiah(yearlyTotals.bestYearOmzet)}`
                    : '-'}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Total Akumulasi Laba Seluruh Tahun
                </span>
                <p className="text-lg font-black text-purple-950">
                  {formatRupiah(yearlyTotals.totalLabaBersih)}
                </p>
                <p className="text-[10px] text-slate-500">
                  Margin akumulasi rata-rata: {yearlyTotals.marginPersen.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Yearly Breakdown Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-purple-800 text-white text-xs font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                    <th className="py-3.5 px-4 w-32">Tahun</th>
                    <th className="py-3.5 px-4 w-32 text-center">Bulan Aktif</th>
                    <th className="py-3.5 px-4 w-32 text-center">Hari Operasional</th>
                    <th className="py-3.5 px-4 w-28 text-center">Jml Transaksi</th>
                    <th className="py-3.5 px-4 w-36 text-right">Total Omzet</th>
                    <th className="py-3.5 px-4 w-36 text-right">Total Biaya</th>
                    <th className="py-3.5 px-4 w-36 text-right">Laba Bersih</th>
                    <th className="py-3.5 px-4 w-24 text-right">Margin %</th>
                    <th className="py-3.5 px-4 w-44">Bulan Terbaik</th>
                    <th className="py-3.5 px-4 w-32 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {yearlySummary.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        Belum ada data transaksi tahunan yang dapat diakumulasi.
                      </td>
                    </tr>
                  ) : (
                    yearlySummary.map((y, idx) => (
                      <tr key={y.tahun} className="hover:bg-purple-50/40 transition-colors">
                        <td className="py-3.5 px-4 text-center text-xs text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-black text-purple-900 text-sm">
                            Tahun {y.tahun}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-bold">
                            {y.bulanAktif} Bulan
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-600">
                          {y.hariAktif} Hari
                        </td>
                        <td className="py-3.5 px-4 text-center text-xs font-bold text-slate-700">
                          {y.transaksiCount}
                        </td>
                        <td className="py-3.5 px-4 text-right text-emerald-700 font-black whitespace-nowrap text-xs">
                          +{formatRupiah(y.penerimaan)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-rose-700 font-semibold whitespace-nowrap text-xs">
                          -{formatRupiah(y.pengeluaran)}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span
                            className={`font-black text-xs ${
                              y.labaBersih >= 0 ? 'text-purple-900' : 'text-rose-600'
                            }`}
                          >
                            {formatRupiah(y.labaBersih)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-xs font-bold text-slate-600">
                          {y.marginPersen.toFixed(1)}%
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <span className="font-semibold text-slate-800">{y.bulanTerbaik}</span>
                          {y.omzetBulanTerbaik > 0 && (
                            <span className="block text-[10px] text-emerald-600 font-bold">
                              ({formatRupiah(y.omzetBulanTerbaik)})
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleDrillDownToMonthly(y.tahun)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            <span>Buka Bulan</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {yearlySummary.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100 font-black border-t-2 border-purple-200 text-xs text-slate-800">
                      <td colSpan={5} className="py-3.5 px-4 text-right uppercase tracking-wider">
                        TOTAL AKUMULASI SELURUH TAHUN :
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-700">
                        {formatRupiah(yearlyTotals.totalPenerimaan)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-rose-700">
                        {formatRupiah(yearlyTotals.totalPengeluaran)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-purple-950 text-sm">
                        {formatRupiah(yearlyTotals.totalLabaBersih)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-700">
                        {yearlyTotals.marginPersen.toFixed(1)}%
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: RINCIAN TRANSAKSI LENGKAP */}
        {activeReportMode === 'detail_transaksi' && (
          <div className="overflow-x-auto">
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
          </div>
        )}

        {/* Footer info with Digital Signature Verification Card */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                Tanda Tangan Digital Pengesahan Laporan Resmi
              </p>
              <p className="text-[11px] text-slate-500">
                Terverifikasi secara digital untuk <strong>{school.namaSekolah}</strong> ({exportMeta.title})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSignModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
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
        reportTitle={exportMeta.title}
        startDate={startDate}
        endDate={endDate}
        verificationCode={verificationCode}
      />
    </div>
  );
};
