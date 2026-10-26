import React, { useState, useMemo, useEffect } from 'react';
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
  Tag,
  Settings2,
  X,
  Check,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { CashTransaction, TransactionType, CashCategories } from '../types';
import { formatRupiah, formatTanggalIndo, getTodayDateString } from '../utils/formatters';
import { storageService, defaultCashCategories } from '../services/storageService';

interface CashMenuProps {
  transactions: CashTransaction[];
  onSaveTransactions: (items: CashTransaction[]) => void;
  initialOpenType?: 'penerimaan' | 'pengeluaran' | null;
  onClearInitialOpen?: () => void;
}

export const CashMenu: React.FC<CashMenuProps> = ({
  transactions,
  onSaveTransactions,
  initialOpenType,
  onClearInitialOpen,
}) => {
  // Categories State loaded from storageService
  const [categories, setCategories] = useState<CashCategories>(() =>
    storageService.getCashCategories()
  );

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'penerimaan' | 'pengeluaran'>('all');
  const [filterKategori, setFilterKategori] = useState<string>('all');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  // Transaction Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNewCategoryInline, setIsAddingNewCategoryInline] = useState(false);
  const [newInlineCategoryName, setNewInlineCategoryName] = useState('');

  const [formData, setFormData] = useState<{
    tanggal: string;
    waktu: string;
    tipe: TransactionType;
    kategori: string;
    jumlah: string;
    keterangan: string;
    metodePembayaran: 'Tunai' | 'QRIS' | 'Transfer';
  }>({
    tanggal: getTodayDateString(),
    waktu: new Date().toTimeString().slice(0, 5),
    tipe: 'penerimaan',
    kategori: categories.penerimaan[0] || 'Penjualan Kantin',
    jumlah: '',
    keterangan: '',
    metodePembayaran: 'Tunai',
  });

  // Category Manager Modal State
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState<TransactionType>('penerimaan');
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [editingCategoryOldName, setEditingCategoryOldName] = useState<string | null>(null);
  const [editingCategoryNewName, setEditingCategoryNewName] = useState('');

  useEffect(() => {
    if (initialOpenType) {
      handleOpenAdd(initialOpenType);
      onClearInitialOpen?.();
    }
  }, [initialOpenType]);

  // Save categories helper
  const handleUpdateCategories = (updated: CashCategories) => {
    setCategories(updated);
    storageService.saveCashCategories(updated);
  };

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

  // Open modal to add
  const handleOpenAdd = (type: TransactionType) => {
    setEditingId(null);
    setIsAddingNewCategoryInline(false);
    setNewInlineCategoryName('');
    const defaultCat =
      type === 'penerimaan'
        ? categories.penerimaan[0] || 'Penjualan Kantin'
        : categories.pengeluaran[0] || 'Pembelian Bahan/Stok';

    setFormData({
      tanggal: getTodayDateString(),
      waktu: new Date().toTimeString().slice(0, 5),
      tipe: type,
      kategori: defaultCat,
      jumlah: '',
      keterangan: '',
      metodePembayaran: 'Tunai',
    });
    setIsModalOpen(true);
  };

  // Open modal to edit
  const handleOpenEdit = (t: CashTransaction) => {
    setEditingId(t.id);
    setIsAddingNewCategoryInline(false);
    setNewInlineCategoryName('');
    setFormData({
      tanggal: t.tanggal,
      waktu: t.waktu || '00:00',
      tipe: t.tipe,
      kategori: t.kategori,
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

    let finalKategori = formData.kategori;

    // If user entered a new inline category
    if (isAddingNewCategoryInline) {
      const trimmed = newInlineCategoryName.trim();
      if (!trimmed) {
        alert('Mohon masukkan nama kategori baru.');
        return;
      }
      finalKategori = trimmed;

      // Add to categories list if not existing
      const currentList = categories[formData.tipe];
      if (!currentList.includes(trimmed)) {
        const nextCategories = {
          ...categories,
          [formData.tipe]: [...currentList, trimmed],
        };
        handleUpdateCategories(nextCategories);
      }
    }

    if (editingId) {
      // Update existing
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
      // Create new
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

  // Combined list of all categories for dropdown filter
  const allCategoriesForFilter = useMemo(() => {
    const set = new Set<string>();
    categories.penerimaan.forEach((c) => set.add(c));
    categories.pengeluaran.forEach((c) => set.add(c));
    transactions.forEach((t) => set.add(t.kategori));
    return Array.from(set).sort();
  }, [categories, transactions]);

  // Count how many transactions use each category
  const categoryUsageCount = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((t) => {
      map[t.kategori] = (map[t.kategori] || 0) + 1;
    });
    return map;
  }, [transactions]);

  // Category Manager: Add Category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;

    const currentList = categories[activeCategoryTab];
    if (currentList.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      alert(`Kategori "${trimmed}" sudah ada di daftar ${activeCategoryTab === 'penerimaan' ? 'Kas Masuk' : 'Kas Keluar'}.`);
      return;
    }

    const updated: CashCategories = {
      ...categories,
      [activeCategoryTab]: [...currentList, trimmed],
    };
    handleUpdateCategories(updated);
    setNewCategoryInput('');
  };

  // Category Manager: Start Editing
  const handleStartEditCategory = (cat: string) => {
    setEditingCategoryOldName(cat);
    setEditingCategoryNewName(cat);
  };

  // Category Manager: Save Edited Category
  const handleSaveEditCategory = () => {
    if (!editingCategoryOldName) return;
    const trimmedNew = editingCategoryNewName.trim();
    if (!trimmedNew) {
      alert('Nama kategori tidak boleh kosong.');
      return;
    }

    const currentList = categories[activeCategoryTab];
    if (
      trimmedNew.toLowerCase() !== editingCategoryOldName.toLowerCase() &&
      currentList.some((c) => c.toLowerCase() === trimmedNew.toLowerCase())
    ) {
      alert(`Kategori "${trimmedNew}" sudah ada.`);
      return;
    }

    // 1. Update in category list
    const updatedList = currentList.map((c) => (c === editingCategoryOldName ? trimmedNew : c));
    const updatedCategories: CashCategories = {
      ...categories,
      [activeCategoryTab]: updatedList,
    };
    handleUpdateCategories(updatedCategories);

    // 2. Also rename in existing transactions so data stays consistent
    const affectedTxCount = categoryUsageCount[editingCategoryOldName] || 0;
    if (affectedTxCount > 0) {
      const updatedTx = transactions.map((t) =>
        t.kategori === editingCategoryOldName ? { ...t, kategori: trimmedNew } : t
      );
      onSaveTransactions(updatedTx);
    }

    // If current form has this category, update it
    if (formData.kategori === editingCategoryOldName) {
      setFormData((prev) => ({ ...prev, kategori: trimmedNew }));
    }

    setEditingCategoryOldName(null);
    setEditingCategoryNewName('');
  };

  // Category Manager: Delete Category
  const handleDeleteCategory = (catToDelete: string) => {
    const usedCount = categoryUsageCount[catToDelete] || 0;
    let confirmMsg = `Hapus kategori "${catToDelete}"?`;
    if (usedCount > 0) {
      confirmMsg = `Kategori "${catToDelete}" digunakan pada ${usedCount} transaksi kas.\n\nJika dihapus, transaksi lama tetap tersimpan, namun kategori ini tidak akan muncul lagi di pilihan baru. Lanjutkan hapus?`;
    }

    if (!window.confirm(confirmMsg)) return;

    const currentList = categories[activeCategoryTab];
    const updatedCategories: CashCategories = {
      ...categories,
      [activeCategoryTab]: currentList.filter((c) => c !== catToDelete),
    };
    handleUpdateCategories(updatedCategories);
  };

  // Category Manager: Reset to Defaults
  const handleResetCategoriesToDefault = () => {
    if (
      window.confirm(
        'Kembalikan daftar kategori kas ke pilihan standar awal? Kategori kustom yang baru ditambahkan akan terhapus dari daftar pilihan.'
      )
    ) {
      handleUpdateCategories(defaultCashCategories);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-blue-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
            <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Wallet className="w-5 h-5" />
            </span>
            Menu Kas Kantin Sekolah
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan arus kas masuk (penerimaan), kas keluar (pengeluaran), serta kelola kategori kas secara mandiri.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Button: Kelola Kategori */}
          <button
            type="button"
            onClick={() => setIsCategoryManagerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-xl transition-colors shadow-2xs"
          >
            <Settings2 className="w-4 h-4 text-blue-600" />
            <span>Kelola Kategori Kas</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAdd('penerimaan')}
            className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-xs"
          >
            <ArrowDownLeft className="w-4 h-4" />
            + Kas Masuk
          </button>

          <button
            type="button"
            onClick={() => handleOpenAdd('pengeluaran')}
            className="inline-flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-xs"
          >
            <ArrowUpRight className="w-4 h-4" />
            - Kas Keluar
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
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Penerimaan
              </span>
              <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <ArrowDownLeft className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-black text-emerald-600 mt-2">
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
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Pengeluaran
              </span>
              <span className="p-2 rounded-xl bg-rose-100 text-rose-700">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-black text-rose-600 mt-2">
              {formatRupiah(totalPengeluaran)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Belanja stok, bahan, operasional & honor
            </p>
          </div>
        </div>

        {/* Saldo Kas */}
        <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-105" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Saldo Kas Saat Ini
              </span>
              <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
                <Wallet className="w-4 h-4" />
              </span>
            </div>
            <p
              className={`text-2xl font-black mt-2 ${
                saldoKas >= 0 ? 'text-blue-700' : 'text-rose-600'
              }`}
            >
              {formatRupiah(saldoKas)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Arus kas bersih tercatat di pembukuan
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari keterangan, kategori, tanggal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Filter Tipe */}
          <div className="lg:col-span-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'penerimaan' | 'pengeluaran')}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Kategori ({allCategoriesForFilter.length})</option>
              {allCategoriesForFilter.map((kat) => (
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
              className="w-full py-2 px-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="lg:col-span-2 flex items-center gap-1">
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              title="Tanggal Akhir"
              className="w-full py-2 px-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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
              className="text-blue-600 hover:text-blue-800 font-bold hover:underline"
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
                <th className="py-3.5 px-4 w-44">Kategori</th>
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
                filteredTransactions.map((item, idx) => {
                  const isMasuk = item.tipe === 'penerimaan';
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors group text-xs"
                    >
                      <td className="py-3 px-4 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800">
                          {formatTanggalIndo(item.tanggal)}
                        </div>
                        {item.waktu && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {item.waktu} WIB
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isMasuk
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isMasuk ? (
                            <>
                              <ArrowDownLeft className="w-3 h-3" />
                              Masuk
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3 h-3" />
                              Keluar
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700 block truncate max-w-[180px]">
                          {item.kategori}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-slate-800 font-medium line-clamp-1">
                          {item.keterangan || '-'}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
                          {item.metodePembayaran || 'Tunai'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-bold">
                        <span
                          className={isMasuk ? 'text-emerald-700' : 'text-rose-600'}
                        >
                          {isMasuk ? '+' : '-'} {formatRupiah(item.jumlah)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Transaksi"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
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

      {/* Modal Add / Edit Transaction */}
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
                    {editingId
                      ? 'Edit Catatan Kas'
                      : formData.tipe === 'penerimaan'
                      ? 'Catat Kas Masuk (Penerimaan)'
                      : 'Catat Kas Keluar (Pengeluaran)'}
                  </h3>
                  <p className="text-xs opacity-90">Buku kas harian kantin sekolah</p>
                </div>
              </div>
              <button
                type="button"
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
                        kategori: categories.penerimaan[0] || 'Penjualan Kantin',
                      }));
                      setIsAddingNewCategoryInline(false);
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
                        kategori: categories.pengeluaran[0] || 'Pembelian Bahan/Stok',
                      }));
                      setIsAddingNewCategoryInline(false);
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
                    className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
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
                    className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Kategori Field with Edit & Add Category triggers */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Kategori Transaksi *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategoryTab(formData.tipe);
                      setIsCategoryManagerOpen(true);
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Settings2 className="w-3 h-3" />
                    Kelola / Edit Kategori
                  </button>
                </div>

                {!isAddingNewCategoryInline ? (
                  <div className="space-y-1.5">
                    <select
                      value={formData.kategori}
                      onChange={(e) => {
                        if (e.target.value === '__add_new__') {
                          setIsAddingNewCategoryInline(true);
                          setNewInlineCategoryName('');
                        } else {
                          setFormData({ ...formData, kategori: e.target.value });
                        }
                      }}
                      className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                    >
                      {categories[formData.tipe].map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__add_new__">+ Buat Kategori Baru Sendiri...</option>
                    </select>
                  </div>
                ) : (
                  <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-blue-900">
                        Buat Kategori Baru Sendiri
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddingNewCategoryInline(false)}
                        className="text-[11px] text-slate-500 hover:text-slate-800"
                      >
                        Batal
                      </button>
                    </div>
                    <input
                      type="text"
                      autoFocus
                      placeholder="Contoh: Honor Kebersihan / Dana Sosial Siswa"
                      value={newInlineCategoryName}
                      onChange={(e) => setNewInlineCategoryName(e.target.value)}
                      className="w-full text-xs py-2 px-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                    />
                    <p className="text-[10px] text-blue-700">
                      Kategori ini akan otomatis tersimpan ke daftar pilihan {formData.tipe === 'penerimaan' ? 'Kas Masuk' : 'Kas Keluar'}.
                    </p>
                  </div>
                )}
              </div>

              {/* Jumlah (Rp) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jumlah Uang (Rp) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    placeholder="Contoh: 50000"
                    value={formData.jumlah}
                    onChange={(e) => setFormData({ ...formData, jumlah: e.target.value })}
                    className="w-full text-sm font-bold pl-10 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Metode Pembayaran */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Tunai', 'QRIS', 'Transfer'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setFormData({ ...formData, metodePembayaran: m })}
                      className={`py-1.5 text-xs font-medium rounded-xl border text-center transition-all ${
                        formData.metodePembayaran === m
                          ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold ring-1 ring-blue-500'
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
                  Keterangan / Catatan Transaksi
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan detail rincian transaksi..."
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Submit Buttons */}
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
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all"
                >
                  {editingId ? 'Simpan Perubahan' : 'Catat Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Manager Modal ("Kelola & Edit Kategori Kas") */}
      {isCategoryManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/15">
                  <Tag className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">
                    Kelola Kategori Kas Mandiri
                  </h3>
                  <p className="text-xs text-blue-200">
                    Tambah, ubah nama, dan hapus kategori kas sesuai kebutuhan kantin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryManagerOpen(false);
                  setEditingCategoryOldName(null);
                }}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs: Penerimaan vs Pengeluaran */}
            <div className="p-3 bg-slate-100 border-b border-slate-200 shrink-0">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategoryTab('penerimaan');
                    setEditingCategoryOldName(null);
                  }}
                  className={`py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                    activeCategoryTab === 'penerimaan'
                      ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                  Kategori Kas Masuk ({categories.penerimaan.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategoryTab('pengeluaran');
                    setEditingCategoryOldName(null);
                  }}
                  className={`py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                    activeCategoryTab === 'pengeluaran'
                      ? 'bg-white text-rose-800 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 text-rose-600" />
                  Kategori Kas Keluar ({categories.pengeluaran.length})
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Add New Category Form */}
              <form onSubmit={handleAddCategory} className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  + Tambah Kategori {activeCategoryTab === 'penerimaan' ? 'Kas Masuk' : 'Kas Keluar'} Baru
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Nama kategori ${activeCategoryTab === 'penerimaan' ? 'penerimaan' : 'pengeluaran'}...`}
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    className="flex-1 text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={!newCategoryInput.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    Tambah
                  </button>
                </div>
              </form>

              {/* Category List */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                  <span>Daftar Kategori ({categories[activeCategoryTab].length})</span>
                  <span>Penggunaan Transaksi</span>
                </div>

                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {categories[activeCategoryTab].map((cat) => {
                    const isEditing = editingCategoryOldName === cat;
                    const usage = categoryUsageCount[cat] || 0;

                    return (
                      <div
                        key={cat}
                        className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 flex items-center justify-between gap-2 transition-all"
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              autoFocus
                              value={editingCategoryNewName}
                              onChange={(e) => setEditingCategoryNewName(e.target.value)}
                              className="flex-1 text-xs py-1.5 px-2.5 border border-blue-400 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                            />
                            <button
                              type="button"
                              onClick={handleSaveEditCategory}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                              title="Simpan Nama Kategori"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCategoryOldName(null)}
                              className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
                              title="Batal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  activeCategoryTab === 'penerimaan'
                                    ? 'bg-emerald-500'
                                    : 'bg-rose-500'
                                }`}
                              />
                              <span className="text-xs font-semibold text-slate-800 truncate">
                                {cat}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                                {usage} transaksi
                              </span>

                              {/* Edit Name Button */}
                              <button
                                type="button"
                                onClick={() => handleStartEditCategory(cat)}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Ubah Nama Kategori"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Hapus Kategori"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={handleResetCategoriesToDefault}
                className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset ke Kategori Standar
              </button>

              <button
                type="button"
                onClick={() => setIsCategoryManagerOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
