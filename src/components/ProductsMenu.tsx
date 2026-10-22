import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Tag,
  Barcode,
  Edit2,
  Trash2,
  Printer,
  TrendingUp,
  AlertCircle,
  Truck,
} from 'lucide-react';
import { ProductItem, Supplier } from '../types';
import { formatRupiah } from '../utils/formatters';
import { BarcodeRenderer } from './BarcodeRenderer';

interface ProductsMenuProps {
  products: ProductItem[];
  suppliers: Supplier[];
  onSaveProducts: (products: ProductItem[]) => void;
  onNavigateToLabels: () => void;
}

export const ProductsMenu: React.FC<ProductsMenuProps> = ({
  products,
  suppliers,
  onSaveProducts,
  onNavigateToLabels,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    kode: string;
    nama: string;
    kategori: string;
    customKategori: string;
    hargaBeli: string;
    hargaJual: string;
    penyediaId: string;
  }>({
    kode: '',
    nama: '',
    kategori: 'Makanan Berat',
    customKategori: '',
    hargaBeli: '',
    hargaJual: '',
    penyediaId: '',
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.kategori));
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== 'all' && p.kategori !== categoryFilter) return false;
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
  }, [products, categoryFilter, searchTerm]);

  // Generate random Barcode Code
  const handleGenerateBarcode = () => {
    const randomSuffix = Math.floor(1000000 + Math.random() * 9000000);
    setFormData((prev) => ({ ...prev, kode: `KNT-${randomSuffix}` }));
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    const randomSuffix = Math.floor(1000000 + Math.random() * 9000000);
    setFormData({
      kode: `KNT-${randomSuffix}`,
      nama: '',
      kategori: 'Makanan Berat',
      customKategori: '',
      hargaBeli: '',
      hargaJual: '',
      penyediaId: suppliers[0]?.id || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: ProductItem) => {
    setEditingId(p.id);
    const isStandard = categories.includes(p.kategori);
    setFormData({
      kode: p.kode,
      nama: p.nama,
      kategori: isStandard ? p.kategori : 'Lainnya',
      customKategori: isStandard ? '' : p.kategori,
      hargaBeli: p.hargaBeli.toString(),
      hargaJual: p.hargaJual.toString(),
      penyediaId: p.penyediaId || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Yakin ingin menghapus barang "${name}" dari katalog kantin?`)) {
      onSaveProducts(products.filter((p) => p.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const beli = parseFloat(formData.hargaBeli) || 0;
    const jual = parseFloat(formData.hargaJual) || 0;

    if (!formData.kode.trim()) {
      alert('Kode barcode / SKU barang harus diisi.');
      return;
    }
    if (!formData.nama.trim()) {
      alert('Nama barang harus diisi.');
      return;
    }
    if (jual <= 0) {
      alert('Harga jual satuan harus lebih dari Rp 0.');
      return;
    }

    const finalKategori =
      formData.kategori === 'Lainnya' && formData.customKategori.trim()
        ? formData.customKategori.trim()
        : formData.kategori;

    if (editingId) {
      const updated = products.map((p) =>
        p.id === editingId
          ? {
              ...p,
              kode: formData.kode.trim().toUpperCase(),
              nama: formData.nama.trim(),
              kategori: finalKategori,
              hargaBeli: beli,
              hargaJual: jual,
              penyediaId: formData.penyediaId,
            }
          : p
      );
      onSaveProducts(updated);
    } else {
      const newProd: ProductItem = {
        id: `prod-${Date.now()}`,
        kode: formData.kode.trim().toUpperCase(),
        nama: formData.nama.trim(),
        kategori: finalKategori,
        hargaBeli: beli,
        hargaJual: jual,
        penyediaId: formData.penyediaId,
      };
      onSaveProducts([newProd, ...products]);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
            <span className="p-2 bg-blue-100 text-blue-800 rounded-xl">
              <Package className="w-5 h-5" />
            </span>
            Katalog Barang & Menu Kantin Sekolah
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Daftar harga beli (modal), harga jual satuan, barcode, dan penyedia makanan/minuman sekolah.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToLabels}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors"
          >
            <Printer className="w-4 h-4" />
            Cetak Label Harga
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            + Tambah Barang Baru
          </button>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama makanan, minuman, kode barcode, kategori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 sm:w-48"
        >
          <option value="all">Semua Kategori ({products.length})</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4 w-32">Kode Barcode</th>
                <th className="py-3.5 px-4">Nama Barang</th>
                <th className="py-3.5 px-4 w-36">Kategori</th>
                <th className="py-3.5 px-4 w-28 text-right">Harga Modal</th>
                <th className="py-3.5 px-4 w-28 text-right">Harga Jual</th>
                <th className="py-3.5 px-4 w-24 text-right">Laba/pcs</th>
                <th className="py-3.5 px-4 w-36">Penyedia</th>
                <th className="py-3.5 px-4 w-20 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Tidak ada barang yang ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const supplier = suppliers.find((s) => s.id === item.penyediaId);
                  const laba = item.hargaJual - item.hargaBeli;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3.5 px-4 text-center text-xs text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs font-semibold text-slate-700">
                        {item.kode}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 text-xs block">
                          {item.nama}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                          {item.kategori}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs text-slate-500 whitespace-nowrap">
                        {formatRupiah(item.hargaBeli)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs font-bold text-slate-900 whitespace-nowrap">
                        {formatRupiah(item.hargaJual)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span
                          className={`text-xs font-semibold ${
                            laba >= 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          +{formatRupiah(laba)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 truncate max-w-[140px]">
                        {supplier?.namaPerusahaan || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Barang"
                            className="p-1 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.nama)}
                            title="Hapus Barang"
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
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

      {/* Modal Add / Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-700 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-100" />
                <h3 className="font-bold text-sm">
                  {editingId ? 'Edit Data Barang Kantin' : 'Tambah Barang Kantin Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-3.5">
              {/* Kode Barcode / SKU */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Kode Barcode / SKU *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateBarcode}
                    className="text-[11px] text-emerald-700 font-semibold hover:underline"
                  >
                    Acak Kode Baru
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Contoh: KNT-8991001"
                  value={formData.kode}
                  onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                  className="w-full text-xs font-mono py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Nama Barang */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Makanan / Minuman / Barang *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Nasi Goreng Sosis Spesial"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Kategori Barang */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Barang
                </label>
                <select
                  value={formData.kategori}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="Makanan Berat">Makanan Berat</option>
                  <option value="Snack / Jajanan">Snack / Jajanan</option>
                  <option value="Minuman">Minuman</option>
                  <option value="Buah & Sehat">Buah & Sehat</option>
                  <option value="ATK Sekolah">ATK Sekolah</option>
                  <option value="Lainnya">Lainnya...</option>
                </select>
              </div>

              {/* Harga Modal (Beli) & Harga Satuan Jual */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga Modal / Beli (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Contoh: 3000"
                    value={formData.hargaBeli}
                    onChange={(e) => setFormData({ ...formData, hargaBeli: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga Jual Satuan (Rp) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Contoh: 4000"
                    value={formData.hargaJual}
                    onChange={(e) => setFormData({ ...formData, hargaJual: e.target.value })}
                    className="w-full text-xs font-bold text-emerald-800 py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Penyedia */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mitra Penyedia
                </label>
                <select
                  value={formData.penyediaId}
                  onChange={(e) => setFormData({ ...formData, penyediaId: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="">-- Tanpa Penyedia / Buatan Sendiri --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.namaPerusahaan}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                >
                  {editingId ? 'Simpan Perubahan' : 'Tambahkan ke Katalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
