import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Tag,
  Edit2,
  Trash2,
  Printer,
  Check,
  X,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Layers,
  FolderEdit,
} from 'lucide-react';
import { ProductItem, Supplier } from '../types';
import { formatRupiah } from '../utils/formatters';
import { storageService, defaultProductCategories } from '../services/storageService';

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
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Categories list state loaded from storageService
  const [categories, setCategories] = useState<string[]>(() => {
    return storageService.getProductCategories();
  });

  // Product Add / Edit Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productFormError, setProductFormError] = useState<string | null>(null);

  // Form Data
  const [formData, setFormData] = useState<{
    kode: string;
    nama: string;
    kategori: string;
    isCustomCategory: boolean;
    customKategoriInput: string;
    hargaBeli: string;
    hargaJual: string;
    penyediaId: string;
  }>({
    kode: '',
    nama: '',
    kategori: categories[0] || 'Makanan Berat',
    isCustomCategory: false,
    customKategoriInput: '',
    hargaBeli: '',
    hargaJual: '',
    penyediaId: '',
  });

  // Category Manager Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categorySuccess, setCategorySuccess] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<{
    oldName: string;
    newName: string;
  } | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Product Delete Confirmation Modal State
  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null);

  // Sync categories if products contain categories not yet in list
  useMemo(() => {
    let hasNew = false;
    const catSet = new Set<string>(categories);
    products.forEach((p) => {
      if (p.kategori && p.kategori.trim() && !catSet.has(p.kategori.trim())) {
        catSet.add(p.kategori.trim());
        hasNew = true;
      }
    });
    if (hasNew) {
      const merged = Array.from(catSet);
      setCategories(merged);
      storageService.saveProductCategories(merged);
    }
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
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

  // Product Count per Category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach((c) => {
      counts[c] = 0;
    });
    products.forEach((p) => {
      counts[p.kategori] = (counts[p.kategori] || 0) + 1;
    });
    return counts;
  }, [products, categories]);

  // Generate random Barcode Code
  const handleGenerateBarcode = () => {
    const randomSuffix = Math.floor(1000000 + Math.random() * 9000000);
    setFormData((prev) => ({ ...prev, kode: `KNT-${randomSuffix}` }));
  };

  // Open Add Product Modal
  const handleOpenAddProduct = () => {
    setEditingId(null);
    setProductFormError(null);
    const randomSuffix = Math.floor(1000000 + Math.random() * 9000000);
    setFormData({
      kode: `KNT-${randomSuffix}`,
      nama: '',
      kategori: categories[0] || 'Makanan Berat',
      isCustomCategory: false,
      customKategoriInput: '',
      hargaBeli: '',
      hargaJual: '',
      penyediaId: suppliers[0]?.id || '',
    });
    setIsProductModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (p: ProductItem) => {
    setEditingId(p.id);
    setProductFormError(null);
    const inList = categories.includes(p.kategori);
    setFormData({
      kode: p.kode,
      nama: p.nama,
      kategori: inList ? p.kategori : categories[0] || 'Makanan Berat',
      isCustomCategory: !inList,
      customKategoriInput: inList ? '' : p.kategori,
      hargaBeli: p.hargaBeli.toString(),
      hargaJual: p.hargaJual.toString(),
      penyediaId: p.penyediaId || '',
    });
    setIsProductModalOpen(true);
  };

  // Save Product (Create or Edit)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setProductFormError(null);

    const beli = parseFloat(formData.hargaBeli) || 0;
    const jual = parseFloat(formData.hargaJual) || 0;

    if (!formData.kode.trim()) {
      setProductFormError('Kode barcode / SKU barang harus diisi.');
      return;
    }
    if (!formData.nama.trim()) {
      setProductFormError('Nama makanan / minuman / barang harus diisi.');
      return;
    }
    if (jual <= 0) {
      setProductFormError('Harga jual satuan harus lebih dari Rp 0.');
      return;
    }

    // Determine final category
    let finalKategori = formData.isCustomCategory
      ? formData.customKategoriInput.trim()
      : formData.kategori;

    if (!finalKategori) {
      finalKategori = 'Umum';
    }

    // If new custom category, add to saved categories list
    if (!categories.includes(finalKategori)) {
      const updatedCategories = [...categories, finalKategori];
      setCategories(updatedCategories);
      storageService.saveProductCategories(updatedCategories);
    }

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

    setIsProductModalOpen(false);
  };

  // Confirm Delete Product
  const handleConfirmDeleteProduct = () => {
    if (productToDelete) {
      onSaveProducts(products.filter((p) => p.id !== productToDelete.id));
      setProductToDelete(null);
    }
  };

  // ---------------- CATEGORY MANAGEMENT ACTIONS ----------------

  // Add new category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryError(null);
    const trimmed = newCategoryInput.trim();

    if (!trimmed) {
      setCategoryError('Nama kategori baru tidak boleh kosong.');
      return;
    }
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setCategoryError(`Kategori "${trimmed}" sudah ada di dalam daftar.`);
      return;
    }

    const updated = [...categories, trimmed];
    setCategories(updated);
    storageService.saveProductCategories(updated);
    setNewCategoryInput('');
    setCategorySuccess(`Kategori "${trimmed}" berhasil ditambahkan.`);
    setTimeout(() => setCategorySuccess(null), 3000);
  };

  // Update existing category name (cascade to products)
  const handleSaveRenameCategory = (oldName: string, newName: string) => {
    setCategoryError(null);
    const trimmed = newName.trim();

    if (!trimmed) {
      setCategoryError('Nama kategori tidak boleh kosong.');
      return;
    }
    if (
      trimmed.toLowerCase() !== oldName.toLowerCase() &&
      categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())
    ) {
      setCategoryError(`Kategori "${trimmed}" sudah ada.`);
      return;
    }

    // 1. Update in categories list
    const updatedCategories = categories.map((c) => (c === oldName ? trimmed : c));
    setCategories(updatedCategories);
    storageService.saveProductCategories(updatedCategories);

    // 2. Cascade rename to existing products
    const affectedCount = products.filter((p) => p.kategori === oldName).length;
    if (affectedCount > 0) {
      const updatedProducts = products.map((p) =>
        p.kategori === oldName ? { ...p, kategori: trimmed } : p
      );
      onSaveProducts(updatedProducts);
    }

    // 3. Update categoryFilter if active
    if (categoryFilter === oldName) {
      setCategoryFilter(trimmed);
    }

    setEditingCategory(null);
    setCategorySuccess(
      `Kategori "${oldName}" berhasil diubah menjadi "${trimmed}" (${affectedCount} barang diselaraskan).`
    );
    setTimeout(() => setCategorySuccess(null), 3500);
  };

  // Delete category with safe cascade
  const handleConfirmDeleteCategory = (catToDelete: string) => {
    setCategoryError(null);
    const affectedCount = products.filter((p) => p.kategori === catToDelete).length;

    // Remove from category list
    const updatedCategories = categories.filter((c) => c !== catToDelete);
    setCategories(updatedCategories);
    storageService.saveProductCategories(updatedCategories);

    // If products use this category, reassign them to fallback
    if (affectedCount > 0) {
      const fallback = updatedCategories[0] || 'Umum';
      const updatedProducts = products.map((p) =>
        p.kategori === catToDelete ? { ...p, kategori: fallback } : p
      );
      onSaveProducts(updatedProducts);
      setCategorySuccess(
        `Kategori "${catToDelete}" dihapus. Sebanyak ${affectedCount} barang dipindahkan ke kategori "${fallback}".`
      );
    } else {
      setCategorySuccess(`Kategori "${catToDelete}" berhasil dihapus.`);
    }

    if (categoryFilter === catToDelete) {
      setCategoryFilter('all');
    }

    setCategoryToDelete(null);
    setTimeout(() => setCategorySuccess(null), 3500);
  };

  // Reset categories to default
  const handleResetCategoriesToDefault = () => {
    const set = new Set<string>(defaultProductCategories);
    products.forEach((p) => {
      if (p.kategori?.trim()) set.add(p.kategori.trim());
    });
    const list = Array.from(set);
    setCategories(list);
    storageService.saveProductCategories(list);
    setCategorySuccess('Daftar kategori dikembalikan ke konfigurasi standar kantin.');
    setTimeout(() => setCategorySuccess(null), 3000);
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
            Kelola master barang kantin, kategori custom yang dapat diedit sendiri, harga modal, harga jual, dan mitra penyedia.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Button Kelola Kategori */}
          <button
            type="button"
            onClick={() => {
              setCategoryError(null);
              setCategorySuccess(null);
              setIsCategoryModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors shadow-2xs"
          >
            <FolderEdit className="w-4 h-4 text-indigo-600" />
            Kelola Kategori ({categories.length})
          </button>

          {/* Button Cetak Label Harga */}
          <button
            type="button"
            onClick={onNavigateToLabels}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors"
          >
            <Printer className="w-4 h-4" />
            Cetak Label Harga
          </button>

          {/* Button Tambah Barang Baru */}
          <button
            type="button"
            onClick={handleOpenAddProduct}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Barang Baru
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama makanan, minuman, barcode, atau kategori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-slate-500 whitespace-nowrap hidden sm:inline">
            Kategori:
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-full sm:w-56 font-medium text-slate-700"
          >
            <option value="all">Semua Kategori ({products.length} Barang)</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c} ({categoryCounts[c] || 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4 w-32">Kode Barang</th>
                <th className="py-3.5 px-4">Nama Barang</th>
                <th className="py-3.5 px-4 w-36">Kategori</th>
                <th className="py-3.5 px-4 w-28 text-right">Harga Modal</th>
                <th className="py-3.5 px-4 w-28 text-right">Harga Jual</th>
                <th className="py-3.5 px-4 w-24 text-right">Laba/pcs</th>
                <th className="py-3.5 px-4 w-36">Penyedia</th>
                <th className="py-3.5 px-4 w-24 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600 text-sm">Tidak ada barang yang ditemukan</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Silakan sesuaikan kata kunci pencarian atau tambah barang baru.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((item, idx) => {
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
                        <span className="font-bold text-slate-900 text-xs block">
                          {item.nama}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2 py-0.5 rounded-md font-semibold">
                          <Tag className="w-3 h-3 text-indigo-500" />
                          {item.kategori}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs text-slate-500 whitespace-nowrap">
                        {formatRupiah(item.hargaBeli)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs font-black text-slate-900 whitespace-nowrap">
                        {formatRupiah(item.hargaJual)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span
                          className={`text-xs font-bold ${
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
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditProduct(item)}
                            title="Edit Barang"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setProductToDelete(item)}
                            title="Hapus Barang"
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

      {/* ======================================================== */}
      {/* MODAL 1: KELOLA KATEGORI BARANG (EDIT SENDIRI)           */}
      {/* ======================================================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="bg-indigo-700 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderEdit className="w-5 h-5 text-indigo-100" />
                <div>
                  <h3 className="font-bold text-sm">Kelola Kategori Master Barang</h3>
                  <p className="text-[11px] text-indigo-100">
                    Tambah, edit nama, atau hapus kategori barang kantin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Feedback Alerts */}
              {categoryError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{categoryError}</span>
                </div>
              )}
              {categorySuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>{categorySuccess}</span>
                </div>
              )}

              {/* Form Tambah Kategori Baru */}
              <form onSubmit={handleAddCategory} className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Tambah Kategori Baru
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Contoh: Aneka Gorengan, Paket Bento, Es Segar..."
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    className="flex-1 text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-slate-50 focus:bg-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah
                  </button>
                </div>
              </form>

              {/* Daftar Kategori Yang Ada */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Daftar Kategori Tersimpan ({categories.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleResetCategoriesToDefault}
                    className="text-[11px] text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                    title="Kembalikan ke kategori default"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Standar
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                  {categories.map((cat) => {
                    const count = categoryCounts[cat] || 0;
                    const isEditing = editingCategory?.oldName === cat;

                    return (
                      <div
                        key={cat}
                        className="p-3 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between gap-2"
                      >
                        {isEditing ? (
                          <div className="flex-1 flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editingCategory.newName}
                              onChange={(e) =>
                                setEditingCategory({
                                  ...editingCategory,
                                  newName: e.target.value,
                                })
                              }
                              autoFocus
                              className="flex-1 text-xs py-1.5 px-2.5 border border-indigo-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleSaveRenameCategory(
                                  editingCategory.oldName,
                                  editingCategory.newName
                                )
                              }
                              className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                              title="Simpan Perubahan Kategori"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCategory(null)}
                              className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                              title="Batal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="p-1 bg-indigo-50 text-indigo-600 rounded-md">
                                <Tag className="w-3.5 h-3.5" />
                              </span>
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {cat}
                              </span>
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                                {count} barang
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingCategory({ oldName: cat, newName: cat })
                                }
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Edit Nama Kategori"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => setCategoryToDelete(cat)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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

              {/* Informative Tip */}
              <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-[11px] text-blue-800 flex items-start gap-2">
                <Layers className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Otomatis Sinkron:</strong> Jika Anda mengubah nama kategori, semua barang yang terdaftar di kategori tersebut akan otomatis diperbarui dan label harga langsung tersinkronisasi.
                </span>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1B: KONFIRMASI HAPUS KATEGORI                      */}
      {/* ======================================================== */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Hapus Kategori "{categoryToDelete}"?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {categoryCounts[categoryToDelete] > 0
                  ? `Kategori ini memiliki ${categoryCounts[categoryToDelete]} barang. Barang-barang ini akan otomatis dialihkan ke kategori default.`
                  : 'Kategori ini belum memiliki barang dan dapat dihapus dengan aman.'}
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteCategory(categoryToDelete)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Ya, Hapus Kategori
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: TAMBAH / EDIT BARANG                            */}
      {/* ======================================================== */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-blue-600 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-100" />
                <h3 className="font-bold text-sm">
                  {editingId ? 'Edit Data Barang Kantin' : 'Tambah Barang Kantin Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Form Validation Error Banner */}
              {productFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{productFormError}</span>
                </div>
              )}

              {/* Kode Barcode / SKU */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Kode Barcode / SKU *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateBarcode}
                    className="text-[11px] text-blue-600 font-bold hover:underline"
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
                  className="w-full text-xs font-mono py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
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
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Kategori Barang (Pilih dari List atau Ketik Sendiri) */}
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-600" />
                    Kategori Barang
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        isCustomCategory: !formData.isCustomCategory,
                      })
                    }
                    className="text-[11px] text-indigo-600 font-bold hover:underline"
                  >
                    {formData.isCustomCategory
                      ? 'Pilih dari Daftar'
                      : '+ Ketik Kategori Baru'}
                  </button>
                </div>

                {formData.isCustomCategory ? (
                  <div>
                    <input
                      type="text"
                      placeholder="Ketik nama kategori baru..."
                      value={formData.customKategoriInput}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customKategoriInput: e.target.value,
                        })
                      }
                      className="w-full text-xs py-2 px-3 border border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                      autoFocus
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Kategori baru ini akan otomatis disimpan ke daftar master kategori.
                    </p>
                  </div>
                ) : (
                  <select
                    value={formData.kategori}
                    onChange={(e) =>
                      setFormData({ ...formData, kategori: e.target.value })
                    }
                    className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
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
                    className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
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
                    className="w-full text-xs font-bold text-blue-800 py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Laba per pcs preview */}
              {parseFloat(formData.hargaJual) > 0 && (
                <div className="text-right text-xs">
                  <span className="text-slate-500">Estimasi Laba Kotor: </span>
                  <span className="font-bold text-emerald-700">
                    {formatRupiah(
                      (parseFloat(formData.hargaJual) || 0) -
                        (parseFloat(formData.hargaBeli) || 0)
                    )}
                    /pcs
                  </span>
                </div>
              )}

              {/* Mitra Penyedia */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mitra Penyedia
                </label>
                <select
                  value={formData.penyediaId}
                  onChange={(e) => setFormData({ ...formData, penyediaId: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
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
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
                >
                  {editingId ? 'Simpan Perubahan' : 'Tambahkan ke Katalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: KONFIRMASI HAPUS BARANG                         */}
      {/* ======================================================== */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Hapus Barang "{productToDelete.nama}"?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Barang ini akan dihapus dari katalog kantin dan tidak lagi muncul di menu kasir.
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
