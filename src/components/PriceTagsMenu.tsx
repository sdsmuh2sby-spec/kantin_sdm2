import React, { useState, useMemo } from 'react';
import {
  Tag,
  Printer,
  Barcode,
  QrCode,
  CheckSquare,
  Square,
  Search,
  Plus,
  Minus,
  Settings,
  Sparkles,
  School,
  Eye,
} from 'lucide-react';
import { ProductItem, SchoolProfile } from '../types';
import { formatRupiah } from '../utils/formatters';
import { BarcodeRenderer } from './BarcodeRenderer';

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
  const [barcodeType, setBarcodeType] = useState<'barcode' | 'qrcode'>('barcode');
  const [labelSize, setLabelSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showSchoolName, setShowSchoolName] = useState<boolean>(true);
  const [showBarcodeText, setShowBarcodeText] = useState<boolean>(true);

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
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
            <span className="p-2 bg-indigo-100 text-indigo-800 rounded-xl">
              <Tag className="w-5 h-5" />
            </span>
            Menu Cetak Label Harga & Barcode Barang
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Cetak stiker label harga rak dan kemasan dengan barcode/QR code, rincian nama item, dan harga satuan siap ditempel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenProductManagement}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            + Kelola Master Barang
          </button>
          <button
            onClick={handlePrint}
            disabled={printQueue.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs disabled:opacity-50"
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
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-indigo-600" />
              Pengaturan Label Cetak
            </h3>

            {/* Barcode Format */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBarcodeType('barcode')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  barcodeType === 'barcode'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-800 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Barcode className="w-4 h-4" />
                Barcode 1D (Code128)
              </button>
              <button
                type="button"
                onClick={() => setBarcodeType('qrcode')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  barcodeType === 'qrcode'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-800 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <QrCode className="w-4 h-4" />
                QR Code 2D
              </button>
            </div>

            {/* Label Size */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ukuran Label
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'small', label: 'Kompak (4 Kolom)', desc: 'Kemasan Kecil' },
                  { id: 'medium', label: 'Standar (3 Kolom)', desc: 'Label Rak' },
                  { id: 'large', label: 'Besar (2 Kolom)', desc: 'Display Meja' },
                ].map((sz) => (
                  <button
                    key={sz.id}
                    onClick={() => setLabelSize(sz.id as 'small' | 'medium' | 'large')}
                    className={`p-2 text-center rounded-xl border transition-all ${
                      labelSize === sz.id
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-xs font-bold">{sz.label}</span>
                    <span className="block text-[10px] opacity-80">{sz.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle Elements */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSchoolName}
                  onChange={(e) => setShowSchoolName(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Tampilkan Header Nama Sekolah di Atas Label</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBarcodeText}
                  onChange={(e) => setShowBarcodeText(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Tampilkan Teks Kode SKU/Barcode di Bawah Barcode</span>
              </label>
            </div>
          </div>

          {/* Product Selector Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Pilih Barang & Jumlah Lembar
              </h3>
              <button
                onClick={handleToggleSelectAll}
                className="text-xs text-indigo-600 font-semibold hover:underline"
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
                  placeholder="Cari item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="py-1.5 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
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
                      isChecked ? 'bg-indigo-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleToggleProduct(p.id)}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-slate-800 truncate">{p.nama}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span className="font-mono">{p.kode}</span>
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
                        className="w-5 h-5 rounded bg-slate-200 text-slate-700 flex items-center justify-center text-xs hover:bg-slate-300"
                      >
                        -
                      </button>
                      <span className="text-xs font-semibold w-5 text-center">{copies}</span>
                      <button
                        type="button"
                        onClick={() => handleSetCopies(p.id, 1)}
                        className="w-5 h-5 rounded bg-slate-200 text-slate-700 flex items-center justify-center text-xs hover:bg-slate-300"
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
              <span className="font-bold text-indigo-600">Total {printQueue.length} stiker label</span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Printable Sheet */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-100/90 p-4 rounded-2xl border border-slate-300/70 shadow-inner">
            <div className="flex items-center justify-between mb-3 no-print">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-slate-800 text-white">
                  <Eye className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Pratinjau Lembar Label Siap Cetak (Print Preview)
                </span>
              </div>
              <span className="text-[11px] text-slate-500">Kertas A4 / Kertas Stiker Label</span>
            </div>

            {/* Printable Area - Has print-sheet class for @media print */}
            <div className="print-area bg-white p-4 rounded-xl shadow-xs border border-slate-200 min-h-[420px]">
              {printQueue.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center">
                  <Tag className="w-12 h-12 text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600">Tidak ada label yang dipilih</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Centang salah satu atau semua barang di sebelah kiri untuk melihat tampilan label harga.
                  </p>
                </div>
              ) : (
                <div
                  className={`grid gap-3 ${
                    labelSize === 'small'
                      ? 'grid-cols-2 sm:grid-cols-4'
                      : labelSize === 'large'
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : 'grid-cols-2 sm:grid-cols-3'
                  }`}
                >
                  {printQueue.map((item, index) => (
                    <div
                      key={`${item.id}-${index}`}
                      className="label-card border-2 border-dashed border-slate-300 rounded-lg p-2.5 flex flex-col items-center justify-between text-center bg-white page-break-inside-avoid shadow-2xs hover:border-indigo-400 transition-colors"
                      style={{
                        minHeight: labelSize === 'small' ? '120px' : labelSize === 'large' ? '170px' : '140px',
                      }}
                    >
                      {/* School Name Top Header */}
                      {showSchoolName && (
                        <div className="w-full border-b border-slate-200 pb-1 mb-1">
                          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight block truncate">
                            {school.namaSekolah}
                          </span>
                        </div>
                      )}

                      {/* Product Name */}
                      <div className="w-full mb-1">
                        <h4
                          className={`font-extrabold text-slate-900 leading-tight uppercase line-clamp-2 ${
                            labelSize === 'small' ? 'text-[11px]' : 'text-xs'
                          }`}
                          title={item.nama}
                        >
                          {item.nama}
                        </h4>
                      </div>

                      {/* Barcode / QR Code */}
                      <div className="my-1 w-full flex justify-center overflow-hidden">
                        <BarcodeRenderer
                          value={item.kode}
                          type={barcodeType}
                          displayValue={showBarcodeText}
                          width={labelSize === 'small' ? 1.2 : 1.5}
                          height={labelSize === 'small' ? 28 : labelSize === 'large' ? 44 : 34}
                          fontSize={9}
                        />
                      </div>

                      {/* Price Badge */}
                      <div className="w-full pt-1 border-t border-slate-200 mt-1">
                        <span className="text-[9px] text-slate-500 font-semibold uppercase block">
                          Harga Satuan
                        </span>
                        <div
                          className={`font-black text-emerald-800 tracking-tight leading-none ${
                            labelSize === 'small'
                              ? 'text-sm'
                              : labelSize === 'large'
                              ? 'text-xl'
                              : 'text-base'
                          }`}
                        >
                          {formatRupiah(item.hargaJual)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
