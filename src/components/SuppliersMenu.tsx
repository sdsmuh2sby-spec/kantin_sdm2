import React, { useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  Phone,
  MessageSquare,
  Search,
  Building,
  User,
  MapPin,
  Trash2,
  Edit2,
  PackageCheck,
  CheckCircle,
} from 'lucide-react';
import { Supplier, ProductItem } from '../types';

interface SuppliersMenuProps {
  suppliers: Supplier[];
  products: ProductItem[];
  onSaveSuppliers: (suppliers: Supplier[]) => void;
}

export const SuppliersMenu: React.FC<SuppliersMenuProps> = ({
  suppliers,
  products,
  onSaveSuppliers,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    namaPerusahaan: string;
    namaPic: string;
    nomorTelepon: string;
    alamat: string;
    kategoriProduk: string;
    keterangan: string;
    statusKerjasama: 'Aktif' | 'Konsinyasi' | 'Nonaktif';
  }>({
    namaPerusahaan: '',
    namaPic: '',
    nomorTelepon: '',
    alamat: '',
    kategoriProduk: '',
    keterangan: '',
    statusKerjasama: 'Aktif',
  });

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    if (!searchTerm.trim()) return suppliers;
    const term = searchTerm.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.namaPerusahaan.toLowerCase().includes(term) ||
        s.namaPic.toLowerCase().includes(term) ||
        s.nomorTelepon.includes(term) ||
        s.kategoriProduk.toLowerCase().includes(term)
    );
  }, [suppliers, searchTerm]);

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      namaPerusahaan: '',
      namaPic: '',
      nomorTelepon: '',
      alamat: '',
      kategoriProduk: '',
      keterangan: '',
      statusKerjasama: 'Aktif',
    });
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (s: Supplier) => {
    setEditingId(s.id);
    setFormData({
      namaPerusahaan: s.namaPerusahaan,
      namaPic: s.namaPic,
      nomorTelepon: s.nomorTelepon,
      alamat: s.alamat || '',
      kategoriProduk: s.kategoriProduk || '',
      keterangan: s.keterangan || '',
      statusKerjasama: s.statusKerjasama || 'Aktif',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Yakin ingin menghapus penyedia "${name}"?`)) {
      onSaveSuppliers(suppliers.filter((s) => s.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaPerusahaan.trim()) {
      alert('Nama perusahaan/penyedia wajib diisi.');
      return;
    }
    if (!formData.namaPic.trim()) {
      alert('Nama PIC (Person in Charge) wajib diisi.');
      return;
    }
    if (!formData.nomorTelepon.trim()) {
      alert('Nomor telepon wajib diisi.');
      return;
    }

    if (editingId) {
      const updated = suppliers.map((s) =>
        s.id === editingId ? { ...s, ...formData } : s
      );
      onSaveSuppliers(updated);
    } else {
      const newSup: Supplier = {
        id: `sup-${Date.now()}`,
        ...formData,
      };
      onSaveSuppliers([...suppliers, newSup]);
    }

    setIsModalOpen(false);
  };

  // Helper to format WhatsApp link
  const getWhatsAppLink = (phone: string) => {
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    }
    return `https://wa.me/${cleaned}`;
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
            <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Truck className="w-5 h-5" />
            </span>
            Menu Data Penyedia (Supplier Kantin)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola mitra pengirim makanan, roti, snack, bento sehat, dan perlengkapan kantin sekolah.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          + Tambah Penyedia Baru
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama perusahaan, nama PIC, nomor telepon, atau produk..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-all"
          />
        </div>
      </div>

      {/* Supplier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
            <Truck className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">Belum ada data penyedia yang cocok</p>
            <p className="text-xs text-slate-400 mt-1">
              Tambahkan data mitra penyedia makanan / minuman kantin sekolah dengan tombol di atas.
            </p>
          </div>
        ) : (
          filteredSuppliers.map((supplier) => {
            const suppliedProducts = products.filter((p) => p.penyediaId === supplier.id);

            return (
              <div
                key={supplier.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-amber-400 transition-all group"
              >
                <div>
                  {/* Top Bar with Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        supplier.statusKerjasama === 'Konsinyasi'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : supplier.statusKerjasama === 'Nonaktif'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {supplier.statusKerjasama || 'Aktif'}
                    </span>

                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(supplier)}
                        title="Edit Penyedia"
                        className="p-1 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(supplier.id, supplier.namaPerusahaan)}
                        title="Hapus Penyedia"
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Company Name */}
                  <h3 className="font-bold text-base text-slate-900 leading-tight">
                    {supplier.namaPerusahaan}
                  </h3>

                  {/* PIC & Phone */}
                  <div className="mt-3 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        PIC: <strong className="text-slate-800">{supplier.namaPic}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-slate-800 font-semibold">
                        {supplier.nomorTelepon}
                      </span>
                    </div>

                    {supplier.alamat && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] text-slate-500 line-clamp-2">
                          {supplier.alamat}
                        </span>
                      </div>
                    )}

                    {supplier.kategoriProduk && (
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                          Kategori Produk:
                        </span>
                        <p className="text-xs text-slate-700 font-medium">
                          {supplier.kategoriProduk}
                        </p>
                      </div>
                    )}

                    {supplier.keterangan && (
                      <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                        &quot;{supplier.keterangan}&quot;
                      </p>
                    )}

                    {suppliedProducts.length > 0 && (
                      <div className="pt-1 text-[11px] text-slate-500">
                        <span className="text-emerald-700 font-semibold">
                          {suppliedProducts.length} barang terdaftar
                        </span>{' '}
                        dalam katalog kantin.
                      </div>
                    )}
                  </div>
                </div>

                {/* WhatsApp & Call Action Buttons */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
                  <a
                    href={getWhatsAppLink(supplier.nomorTelepon)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    WhatsApp PIC
                  </a>
                  <a
                    href={`tel:${supplier.nomorTelepon}`}
                    className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    title="Hubungi Telepon"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add/Edit Supplier */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-linear-to-r from-amber-600 to-amber-700 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-100" />
                <h3 className="font-bold text-sm">
                  {editingId ? 'Edit Data Penyedia' : 'Tambah Data Penyedia Baru'}
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
              {/* Nama Perusahaan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Perusahaan / Toko Mitra *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: CV Berkah Boga Sejahtera"
                  value={formData.namaPerusahaan}
                  onChange={(e) => setFormData({ ...formData, namaPerusahaan: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Nama PIC */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama PIC (Penanggung Jawab / Kontak) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bpk. H. Bambang Hartono"
                  value={formData.namaPic}
                  onChange={(e) => setFormData({ ...formData, namaPic: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Nomor Telepon */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Telepon / WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 081234567890"
                  value={formData.nomorTelepon}
                  onChange={(e) => setFormData({ ...formData, nomorTelepon: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Kategori Produk */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Produk yang Disuplai
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Roti, Nasi Bento, Snack, atau Minuman"
                  value={formData.kategoriProduk}
                  onChange={(e) => setFormData({ ...formData, kategoriProduk: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Status Kerjasama */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Kerjasama
                </label>
                <select
                  value={formData.statusKerjasama}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      statusKerjasama: e.target.value as 'Aktif' | 'Konsinyasi' | 'Nonaktif',
                    })
                  }
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  <option value="Aktif">Aktif (Beli Putus / Kulakan)</option>
                  <option value="Konsinyasi">Konsinyasi (Bagi Hasil / Titip Jual)</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              {/* Alamat */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Penyedia
                </label>
                <input
                  type="text"
                  placeholder="Alamat kantor / gudang supplier"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Jadwal Pengiriman
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Pengiriman setiap jam 06.30 WIB..."
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
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
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors"
                >
                  {editingId ? 'Simpan Perubahan' : 'Tambah Penyedia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
