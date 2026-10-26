import React, { useState, useMemo } from 'react';
import {
  Tag,
  Printer,
  CheckSquare,
  Square,
  Search,
  Plus,
  Minus,
  Settings,
  Eye,
  Store,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ProductItem, SchoolProfile } from '../types';
import { formatRupiah, formatNumber } from '../utils/formatters';

interface PriceTagsMenuProps {
  products: ProductItem[];
  school: SchoolProfile;
  onOpenProductManagement: () => void;
}

export const PriceTagsMenu: React.FC<PriceTagsMenuProps> = ({
  products,
  school,
  onOpenProductManagement,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Selection map: productId -> count of labels to print
  const [printCopies, setPrintCopies] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    products.forEach((p) => {
      initial[p.id] = 1; // default 1 copy each
    });
    return initial;
  });

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(() =>
    products.map((p) => p.id)
  );

  // Label formatting options
  const [labelSize, setLabelSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [priceFontSize, setPriceFontSize] = useState<'besar' | 'ekstra' | 'jumbo'>('ekstra');
  const [labelTheme, setLabelTheme] = useState<'modern-blue' | 'classic' | 'minimal'>('modern-blue');
  const [showSchoolName, setShowSchoolName] = useState<boolean>(true);
  const [showCategory, setShowCategory] = useState<boolean>(true);
  const [showItemCode, setShowItemCode] = useState<boolean>(false);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
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
  }, [products, selectedCategory, searchTerm]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.kategori));
    return Array.from(set).sort();
  }, [products]);

  // Toggle select all
  const handleToggleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    }
  };

  const handleToggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSetCopies = (id: string, delta: number) => {
    setPrintCopies((prev) => {
      const cur = prev[id] || 1;
      const next = Math.max(1, Math.min(50, cur + delta));
      return { ...prev, [id]: next };
    });
  };

  // Build the flat list of items to print based on selected IDs and copies
  const printQueue = useMemo(() => {
    const queue: ProductItem[] = [];
    selectedProductIds.forEach((id) => {
      const prod = products.find((p) => p.id === id);
      if (prod) {
        const copies = printCopies[id] || 1;
        for (let i = 0; i < copies; i++) {
          queue.push(prod);
        }
      }
    });
    return queue;
  }, [products, selectedProductIds, printCopies]);

  // Handle browser print
  const handlePrint = () => {
    if (printQueue.length === 0) {
      alert('Pilih minimal satu barang untuk dicetak label harganya.');
      return;
    }
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
            <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Tag className="w-5 h-5" />
            </span>
            Menu Cetak Label Harga Barang
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Cetak stiker label harga rak dan etalase kantin dengan rincian nama item dan harga satuan siap ditempel tanpa barcode.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenProductManagement}
            className="px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200/60"
          >
            + Kelola Master Barang
          </button>
          <button
            onClick={handlePrint}
            disabled={printQueue.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-md shadow-blue-500/20 disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            Cetak {printQueue.length} Label Sekarang
          </button>
        </div>
      </div>

      {/* Grid: Controls & Selection (Left) vs Live Print Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Customizer & Product Checklist (Hidden on Print) */}
        <div className="lg:col-span-5 space-y-4 no-print">
          {/* Style & Layout Config Card */}
          <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-blue-600" />
              Pengaturan Tampilan Label
            </h3>

            {/* Label Theme Options */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Model Desain Label
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'modern-blue', label: 'Biru Modern', desc: 'Aksen Biru Mewah' },
                  { id: 'classic', label: 'Garis Rak', desc: 'Border Putus-putus' },
                  { id: 'minimal', label: 'Minimalis', desc: 'Bersih & Simpel' },
                ].map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setLabelTheme(th.id as any)}
                    className={`p-2 text-center rounded-xl border transition-all ${
                      labelTheme === th.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-xs font-bold">{th.label}</span>
                    <span className={`block text-[10px] ${labelTheme === th.id ? 'text-blue-100' : 'text-slate-400'}`}>
                      {th.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Label Size */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ukuran & Kolom Kertas
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'small', label: 'Kompak (4 Kolom)', desc: 'Kemasan Kecil' },
                  { id: 'medium', label: 'Standar (3 Kolom)', desc: 'Label Rak/Toples' },
                  { id: 'large', label: 'Besar (2 Kolom)', desc: 'Etalase Utama' },
                ].map((sz) => (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => setLabelSize(sz.id as 'small' | 'medium' | 'large')}
                    className={`p-2 text-center rounded-xl border transition-all ${
                      labelSize === sz.id
                        ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-xs font-bold">{sz.label}</span>
                    <span className={`block text-[10px] ${labelSize === sz.id ? 'text-slate-300' : 'text-slate-400'}`}>
                      {sz.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Font Size */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Ukuran Tulisan Harga
                </label>
                <span className="text-[10px] font-bold text-blue-700 uppercase bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  {priceFontSize === 'jumbo' ? 'Jumbo (Maksimal)' : priceFontSize === 'ekstra' ? 'Ekstra Besar' : 'Besar'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'besar', label: 'Besar', desc: 'Standar Jelas' },
                  { id: 'ekstra', label: 'Ekstra Besar', desc: 'Sangat Menonjol' },
                  { id: 'jumbo', label: 'Jumbo', desc: 'Maksimal / Rak' },
                ].map((pfs) => (
                  <button
                    key={pfs.id}
                    type="button"
                    onClick={() => setPriceFontSize(pfs.id as 'besar' | 'ekstra' | 'jumbo')}
                    className={`p-2 text-center rounded-xl border transition-all ${
                      priceFontSize === pfs.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-xs font-bold">{pfs.label}</span>
                    <span className={`block text-[10px] ${priceFontSize === pfs.id ? 'text-blue-100' : 'text-slate-400'}`}>
                      {pfs.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle Elements */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showSchoolName}
                  onChange={(e) => setShowSchoolName(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="font-medium">Tampilkan Nama Sekolah di Atas Label</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showCategory}
                  onChange={(e) => setShowCategory(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="font-medium">Tampilkan Kategori Barang</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showItemCode}
                  onChange={(e) => setShowItemCode(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="font-medium">Tampilkan Kode SKU Barang</span>
              </label>
            </div>
          </div>

          {/* Product Selector Card */}
          <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Pilih Barang & Jumlah Lembar
              </h3>
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                {selectedProductIds.length === filteredProducts.length
                  ? 'Batalkan Semua'
                  : 'Pilih Semua'}
              </button>
            </div>

            {/* Filter and Search */}
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-blue-400"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="py-1.5 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-blue-400"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Items List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 pr-1">
              {filteredProducts.map((p) => {
                const isChecked = selectedProductIds.includes(p.id);
                const copies = printCopies[p.id] || 1;
                return (
                  <div
                    key={p.id}
                    className={`py-2 px-2 rounded-lg flex items-center justify-between gap-2 transition-colors ${
                      isChecked ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleToggleProduct(p.id)}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-slate-800 truncate">{p.nama}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span className="font-semibold text-blue-700">{p.kategori}</span>
                          <span>•</span>
                          <span className="font-bold text-emerald-700">
                            {formatRupiah(p.hargaJual)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity counter */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSetCopies(p.id, -1)}
                        className="w-5 h-5 rounded bg-slate-200 text-slate-700 flex items-center justify-center text-xs hover:bg-slate-300 font-bold"
                        title="Kurangi lembar"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold w-5 text-center text-slate-800">{copies}</span>
                      <button
                        type="button"
                        onClick={() => handleSetCopies(p.id, 1)}
                        className="w-5 h-5 rounded bg-blue-100 text-blue-800 flex items-center justify-center text-xs hover:bg-blue-200 font-bold"
                        title="Tambah lembar"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>{selectedProductIds.length} item terpilih</span>
              <span className="font-bold text-blue-700">Total {printQueue.length} lembar label</span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Printable Sheet */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-100/90 p-4 rounded-2xl border border-blue-200/60 shadow-inner">
            <div className="flex items-center justify-between mb-3 no-print">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-blue-700 text-white">
                  <Eye className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Pratinjau Lembar Label Siap Cetak (A4 / Sticker Paper)
                </span>
              </div>
              <span className="text-[11px] text-blue-700 font-semibold">Tanpa Barcode</span>
            </div>

            {/* Printable Area - Has print-sheet class for @media print */}
            <div className="print-area bg-white p-4 rounded-xl shadow-xs border border-slate-200 min-h-[420px]">
              {printQueue.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center">
                  <Tag className="w-12 h-12 text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600">Tidak ada label yang dipilih</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Centang salah satu atau beberapa barang di sebelah kiri untuk menampilkan label harga.
                  </p>
                </div>
              ) : (
                <div
                  className={`grid gap-3.5 ${
                    labelSize === 'small'
                      ? 'grid-cols-2 sm:grid-cols-4'
                      : labelSize === 'large'
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : 'grid-cols-2 sm:grid-cols-3'
                  }`}
                >
                  {printQueue.map((item, index) => {
                    const isModern = labelTheme === 'modern-blue';
                    const isClassic = labelTheme === 'classic';

                    return (
                      <div
                        key={`${item.id}-${index}`}
                        className={`label-card relative rounded-xl flex flex-col justify-between text-center bg-white page-break-inside-avoid transition-all overflow-hidden ${
                          isModern
                            ? 'border-2 border-blue-600 shadow-sm'
                            : isClassic
                            ? 'border-2 border-dashed border-slate-400 shadow-2xs'
                            : 'border border-slate-300 shadow-xs'
                        }`}
                        style={{
                          minHeight:
                            labelSize === 'small'
                              ? priceFontSize === 'jumbo'
                                ? '145px'
                                : '135px'
                              : labelSize === 'large'
                              ? priceFontSize === 'jumbo'
                                ? '210px'
                                : '195px'
                              : priceFontSize === 'jumbo'
                              ? '175px'
                              : '160px',
                        }}
                      >
                        {/* School Name Top Header */}
                        {showSchoolName && (
                          <div
                            className={`w-full py-1 px-2 shrink-0 ${
                              isModern
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-700 border-b border-slate-200'
                            }`}
                          >
                            <span className="text-[9px] font-extrabold uppercase tracking-tight block truncate">
                              {school.namaSekolah}
                            </span>
                          </div>
                        )}

                        {/* Card Center: Large Price & Optional Badges */}
                        <div className="p-2.5 flex-1 flex flex-col justify-center items-center">
                          {/* Optional Category & Code Badges */}
                          {(showCategory || showItemCode) && (
                            <div className="flex items-center justify-center gap-1.5 flex-wrap mb-1">
                              {showCategory && (
                                <span
                                  className={`text-[8px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                                    isModern
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200/70'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {item.kategori}
                                </span>
                              )}
                              {showItemCode && (
                                <span className="text-[8px] font-mono text-slate-400">
                                  {pCode(item.kode)}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Center Price - Prominently Enlarged */}
                          <div className="text-center my-auto py-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">
                              Harga
                            </span>
                            <div className="inline-flex items-baseline justify-center gap-1 leading-none">
                              <span
                                className={`font-black uppercase ${
                                  priceFontSize === 'jumbo'
                                    ? labelSize === 'small'
                                      ? 'text-xs'
                                      : 'text-sm sm:text-base'
                                    : priceFontSize === 'ekstra'
                                    ? labelSize === 'small'
                                      ? 'text-[11px]'
                                      : 'text-xs sm:text-sm'
                                    : labelSize === 'small'
                                    ? 'text-[10px]'
                                    : 'text-xs'
                                } ${isModern ? 'text-blue-600' : 'text-slate-500'}`}
                              >
                                Rp
                              </span>
                              <span
                                className={`font-black tracking-tight leading-none ${
                                  isModern ? 'text-blue-700' : 'text-slate-950'
                                } ${
                                  priceFontSize === 'jumbo'
                                    ? labelSize === 'small'
                                      ? 'text-3xl sm:text-4xl'
                                      : labelSize === 'large'
                                      ? 'text-5xl sm:text-6xl'
                                      : 'text-4xl sm:text-5xl'
                                    : priceFontSize === 'ekstra'
                                    ? labelSize === 'small'
                                      ? 'text-2xl sm:text-3xl'
                                      : labelSize === 'large'
                                      ? 'text-4xl sm:text-5xl'
                                      : 'text-3xl sm:text-4xl'
                                    : labelSize === 'small'
                                    ? 'text-xl sm:text-2xl'
                                    : labelSize === 'large'
                                    ? 'text-3xl sm:text-4xl'
                                    : 'text-2xl sm:text-3xl'
                                }`}
                              >
                                {formatNumber(item.hargaJual)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Banner: Product Name */}
                        <div
                          className={`w-full py-2 px-2.5 shrink-0 ${
                            isModern
                              ? 'bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white'
                              : isClassic
                              ? 'bg-slate-100 text-slate-900 border-t border-slate-300'
                              : 'bg-slate-50 text-slate-900 border-t border-slate-200'
                          }`}
                        >
                          <h4
                            className={`font-black leading-snug uppercase line-clamp-2 ${
                              labelSize === 'small'
                                ? 'text-[11px]'
                                : labelSize === 'large'
                                ? 'text-sm sm:text-base'
                                : 'text-xs sm:text-sm'
                            } ${isModern ? 'text-white' : 'text-slate-900'}`}
                            title={item.nama}
                          >
                            {item.nama}
                          </h4>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function pCode(code: string): string {
  return code || '-';
}
