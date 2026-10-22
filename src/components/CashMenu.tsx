import React, { useState, useMemo } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  Trash2,
  Calendar,
  Layers,
  FileText,
  CreditCard,
  Edit2,
  CheckCircle,
} from 'lucide-react';
import { CashTransaction, TransactionType } from '../types';
import { formatRupiah, formatTanggalIndo, getTodayDateString } from '../utils/formatters';

interface CashMenuProps {
  transactions: CashTransaction[];
  onSaveTransactions: (items: CashTransaction[]) => void;
  initialOpenType?: 'penerimaan' | 'pengeluaran' | null;
  onClearInitialOpen?: () => void;
}

const KATEGORI_PENERIMAAN = [
  'Penjualan Kantin',
  'Penjualan Minuman',
  'Penjualan Snack/Kue',
  'Bagi Hasil Konsinyasi',
  'Modal Awal / Suntikan Kas',
  'Pendapatan Lain-lain',
];

const KATEGORI_PENGELUARAN = [
  'Pembelian Bahan/Stok',
  'Kulakan Minuman Kemasan',
  'Bagi Hasil Supplier',
  'Operasional Gas/Listrik',
  'Operasional & Kebersihan',
  'Honor Petugas Kantin',
  'Perlengkapan / Alat Kantin',
  'Pengeluaran Lain-lain',
];

export const CashMenu: React.FC<CashMenuProps> = ({
  transactions,
  onSaveTransactions,
  initialOpenType,
  onClearInitialOpen,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'penerimaan' | 'pengeluaran'>('all');
  const [filterKategori, setFilterKategori] = useState<string>('all');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    tanggal: string;
    waktu: string;
    tipe: TransactionType;
    kategori: string;
    customKategori: string;
    jumlah: string;
    keterangan: string;
    metodePembayaran: 'Tunai' | 'QRIS' | 'Transfer';
  }>({
    tanggal: getTodayDateString(),
    waktu: new Date().toTimeString().slice(0, 5),
    tipe: 'penerimaan',
    kategori: 'Penjualan Kantin',
    customKategori: '',
    jumlah: '',
    keterangan: '',
    metodePembayaran: 'Tunai',
  });

  React.useEffect(() => {
    if (initialOpenType) {
      handleOpenAdd(initialOpenType);
      onClearInitialOpen?.();
    }
  }, [initialOpenType]);

  // Calculate filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((item) => {
        if (filterType !== 'all' && item.tipe !== filterType) return false;
        if (filterKategori !== 'all' && item.kategori !== filterKategori) return false;
        if (filterStartDate && item.tanggal < filterStartDate) return false;
        if (filterEndDate && item.tanggal > filterEndDate) return false;

        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchKet = item.keterangan.toLowerCase().includes(term);
          const matchKat = item.kategori.toLowerCase().includes(term);
          const matchTgl = item.tanggal.includes(term);
          if (!matchKet && !matchKat && !matchTgl) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort descending by date, then time
        const dateA = `${a.tanggal} ${a.waktu || '00:00'}`;
        const dateB = `${b.tanggal} ${b.waktu || '00:00'}`;
        return dateB.localeCompare(dateA);
      });
  }, [transactions, filterType, filterKategori, filterStartDate, filterEndDate, searchTerm]);

  // Overall Financial Totals
  const { totalPenerimaan, totalPengeluaran, saldoKas } = useMemo(() => {
    let masuk = 0;
    let keluar = 0;
    transactions.forEach((t) => {
      if (t.tipe === 'penerimaan') masuk += t.jumlah;
      if (t.tipe === 'pengeluaran') keluar += t.jumlah;
    });
    return {
      totalPenerimaan: masuk,
      totalPengeluaran: keluar,
      saldoKas: masuk - keluar,
    };
  }, [transactions]);

  // Open modal for new entry
  const handleOpenAdd = (type: TransactionType = 'penerimaan') => {
    setEditingId(null);
    setFormData({
      tanggal: getTodayDateString(),
      waktu: new Date().toTimeString().slice(0, 5),
      tipe: type,
      kategori: type === 'penerimaan' ? KATEGORI_PENERIMAAN[0] : KATEGORI_PENGELUARAN[0],
      customKategori: '',
      jumlah: '',
      keterangan: '',
      metodePembayaran: 'Tunai',
    });
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (t: CashTransaction) => {
    setEditingId(t.id);
    const isStandardKategori =
      t.tipe === 'penerimaan'
        ? KATEGORI_PENERIMAAN.includes(t.kategori)
        : KATEGORI_PENGELUARAN.includes(t.kategori);

    setFormData({
      tanggal: t.tanggal,
      waktu: t.waktu || '00:00',
      tipe: t.tipe,
      kategori: isStandardKategori ? t.kategori : 'Lainnya',
      customKategori: isStandardKategori ? '' : t.kategori,
      jumlah: t.jumlah.toString(),
      keterangan: t.keterangan,
      metodePembayaran: t.metodePembayaran || 'Tunai',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Yakin ingin menghapus catatan kas ini?')) {
      const updated = transactions.filter((t) => t.id !== id);
      onSaveTransactions(updated);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedJumlah = parseFloat(formData.jumlah);
    if (!parsedJumlah || parsedJumlah <= 0) {
      alert('Mohon masukkan jumlah uang yang valid.');
      return;
    }

    const finalKategori =
      formData.kategori === 'Lainnya' && formData.customKategori.trim()
        ? formData.customKategori.trim()
        : formData.kategori;

    if (editingId) {
      // Update
      const updated = transactions.map((t) =>
        t.id === editingId
          ? {
              ...t,
              tanggal: formData.tanggal,
              waktu: formData.waktu,
              tipe: formData.tipe,
              kategori: finalKategori,
              jumlah: parsedJumlah,
              keterangan: formData.keterangan || '-',
              metodePembayaran: formData.metodePembayaran,
            }
          : t
      );
      onSaveTransactions(updated);
    } else {
      // Create
      const newTransaction: CashTransaction = {
        id: `kas-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        tanggal: formData.tanggal,
        waktu: formData.waktu,
        tipe: formData.tipe,
        kategori: finalKategori,
        jumlah: parsedJumlah,
        keterangan: formData.keterangan || '-',
        metodePembayaran: formData.metodePembayaran,
        createdAt: new Date().toISOString(),
      };
      onSaveTransactions([newTransaction, ...transactions]);
    }

    setIsModalOpen(false);
  };

  // Reset filters
  const handleResetFilter = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterKategori('all');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  // Unique categories list for dropdown
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => set.add(t.kategori));
    return Array.from(set).sort();
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
            <span className="p-2 bg-blue-100 text-blue-800 rounded-xl">
              <Wallet className="w-5 h-5" />
            </span>
            Menu Kas Kantin Sekolah
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan arus kas masuk (penerimaan), kas keluar (pengeluaran), dan saldo operasional kantin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenAdd('penerimaan')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition-colors shadow-xs"
          >
            <ArrowDownLeft className="w-4 h-4" />
            + Kas Masuk (Penerimaan)
          </button>
          <button
            onClick={() => handleOpenAdd('pengeluaran')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition-colors shadow-xs"
          >
            <ArrowUpRight className="w-4 h-4" />
            - Kas Keluar (Pengeluaran)
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Penerimaan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-105" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Penerimaan
              </span>
              <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <ArrowDownLeft className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-bold text-emerald-600 mt-2">
              {formatRupiah(totalPenerimaan)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Seluruh kas masuk & omzet kantin
            </p>
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-105" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Pengeluaran
              </span>
              <span className="p-2 rounded-xl bg-rose-100 text-rose-700">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-bold text-rose-600 mt-2">
              {formatRupiah(totalPengeluaran)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Belanja stok, bahan, operasional & honor
            </p>
          </div>
        </div>

        {/* Saldo Akhir Kas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-105" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Saldo Kas Saat Ini
              </span>
              <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
                <Wallet className="w-4 h-4" />
              </span>
            </div>
            <p
              className={`text-2xl font-bold mt-2 ${
                saldoKas >= 0 ? 'text-blue-700' : 'text-rose-600'
              }`}
            >
              {formatRupiah(saldoKas)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {saldoKas >= 0 ? 'Kas surplus siap pakai' : 'Kas defisit / minus'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search box */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari keterangan, kategori, tanggal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Filter Tipe */}
          <div className="lg:col-span-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'penerimaan' | 'pengeluaran')}
              className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Arus Kas</option>
              <option value="penerimaan">Penerimaan (+)</option>
              <option value="pengeluaran">Pengeluaran (-)</option>
            </select>
          </div>

          {/* Filter Kategori */}
          <div className="lg:col-span-2">
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Kategori</option>
              {allCategories.map((kat) => (
                <option key={kat} value={kat}>
                  {kat}
                </option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div className="lg:col-span-2 flex items-center gap-1">
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              title="Tanggal Awal"
              className="w-full py-2 px-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="lg:col-span-2 flex items-center gap-1">
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              title="Tanggal Akhir"
              className="w-full py-2 px-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Filter info and reset */}
        {(searchTerm || filterType !== 'all' || filterKategori !== 'all' || filterStartDate || filterEndDate) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Menampilkan {filteredTransactions.length} dari {transactions.length} transaksi kas
            </span>
            <button
              onClick={handleResetFilter}
              className="text-emerald-700 hover:text-emerald-800 font-semibold hover:underline"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4 w-32">Tanggal</th>
                <th className="py-3.5 px-4 w-28">Arus Kas</th>
                <th className="py-3.5 px-4 w-40">Kategori</th>
                <th className="py-3.5 px-4">Keterangan</th>
                <th className="py-3.5 px-4 w-28 text-center">Metode</th>
                <th className="py-3.5 px-4 w-36 text-right">Jumlah</th>
                <th className="py-3.5 px-4 w-24 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Wallet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">Belum ada transaksi kas yang sesuai</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Klik tombol Kas Masuk atau Kas Keluar di atas untuk mencatat transaksi baru.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((item, index) => {
                  const isMasuk = item.tipe === 'penerimaan';
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-3.5 px-4 text-center text-xs text-slate-400 font-mono">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800 text-xs">
                          {formatTanggalIndo(item.tanggal)}
                        </div>
                        {item.waktu && (
                          <div className="text-[11px] text-slate-400 font-mono">
                            {item.waktu} WIB
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isMasuk
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                              : 'bg-rose-50 text-rose-700 border border-rose-200/70'
                          }`}
                        >
                          {isMasuk ? (
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          )}
                          {isMasuk ? 'Penerimaan' : 'Pengeluaran'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {item.kategori}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 max-w-xs">
                        <span className="line-clamp-2 text-xs leading-relaxed">
                          {item.keterangan || '-'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                          {item.metodePembayaran || 'Tunai'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-semibold text-sm ${
                            isMasuk ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isMasuk ? '+' : '-'} {formatRupiah(item.jumlah)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Transaksi"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            title="Hapus Transaksi"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div
              className={`px-6 py-4 text-white flex items-center justify-between ${
                formData.tipe === 'penerimaan'
                  ? 'bg-linear-to-r from-emerald-600 to-teal-700'
                  : 'bg-linear-to-r from-rose-600 to-red-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-white/15 backdrop-blur-xs">
                  {formData.tipe === 'penerimaan' ? (
                    <ArrowDownLeft className="w-5 h-5" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">
                    {editingId ? 'Edit Catatan Kas' : formData.tipe === 'penerimaan' ? 'Catat Kas Masuk (Penerimaan)' : 'Catat Kas Keluar (Pengeluaran)'}
                  </h3>
                  <p className="text-xs opacity-90">Buku kas harian kantin sekolah</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Tipe Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Jenis Arus Kas *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        tipe: 'penerimaan',
                        kategori: KATEGORI_PENERIMAAN[0],
                      }));
                    }}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                      formData.tipe === 'penerimaan'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                    Penerimaan (Masuk)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        tipe: 'pengeluaran',
                        kategori: KATEGORI_PENGELUARAN[0],
                      }));
                    }}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                      formData.tipe === 'pengeluaran'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-rose-600" />
                    Pengeluaran (Keluar)
                  </button>
                </div>
              </div>

              {/* Tanggal & Waktu */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Waktu
                  </label>
                  <input
                    type="time"
                    value={formData.waktu}
                    onChange={(e) => setFormData({ ...formData, waktu: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Transaksi *
                </label>
                <select
                  value={formData.kategori}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {(formData.tipe === 'penerimaan' ? KATEGORI_PENERIMAAN : KATEGORI_PENGELUARAN).map(
                    (cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    )
                  )}
                  <option value="Lainnya">Lainnya (Ketik Manual...)</option>
                </select>
                {formData.kategori === 'Lainnya' && (
                  <input
                    type="text"
                    placeholder="Tuliskan nama kategori baru..."
                    value={formData.customKategori}
                    onChange={(e) => setFormData({ ...formData, customKategori: e.target.value })}
                    className="mt-2 w-full text-xs py-2 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                )}
              </div>

              {/* Jumlah (Rp) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jumlah Uang (Rupiah) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="500"
                    required
                    placeholder="Contoh: 50000"
                    value={formData.jumlah}
                    onChange={(e) => setFormData({ ...formData, jumlah: e.target.value })}
                    className="w-full text-sm font-semibold pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                {formData.jumlah && (
                  <p className="text-[11px] text-emerald-700 font-medium mt-1">
                    Terbilang: {formatRupiah(formData.jumlah)}
                  </p>
                )}
              </div>

              {/* Metode Pembayaran */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Metode Kas
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Tunai', 'QRIS', 'Transfer'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setFormData({ ...formData, metodePembayaran: m })}
                      className={`py-1.5 text-xs font-medium rounded-lg border text-center transition-all ${
                        formData.metodePembayaran === m
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan / Catatan Transaksi *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Belanja bahan baku risoles atau hasil omzet istirahat 1"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors ${
                    formData.tipe === 'penerimaan'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {editingId ? 'Simpan Perubahan' : 'Catat ke Buku Kas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
