export type TransactionType = 'penerimaan' | 'pengeluaran';

export interface CashCategories {
  penerimaan: string[];
  pengeluaran: string[];
}

export interface CashTransaction {
  id: string;
  tanggal: string; // YYYY-MM-DD
  waktu?: string; // HH:mm
  tipe: TransactionType;
  kategori: string;
  jumlah: number;
  keterangan: string;
  metodePembayaran?: 'Tunai' | 'QRIS' | 'Transfer';
  referensiId?: string; // ID transaksi penjualan jika terhubung otomatis
  createdAt: string;
}

export interface ProductItem {
  id: string;
  kode: string; // Barcode / SKU
  nama: string;
  kategori: string;
  hargaBeli: number; // Harga modal
  hargaJual: number; // Harga satuan untuk label
  stok?: number;
  satuan?: string;
  penyediaId?: string;
  gambar?: string;
}

export interface SaleItem {
  productId: string;
  kode: string;
  nama: string;
  hargaSatuan: number;
  hargaModal: number;
  qty: number;
  subtotal: number;
  labaKotor: number;
}

export interface SaleTransaction {
  id: string;
  nomorStruk: string;
  tanggal: string; // YYYY-MM-DD
  waktu: string; // HH:mm:ss
  items: SaleItem[];
  totalItem: number;
  totalPenjualan: number;
  totalModal: number;
  labaKotor: number;
  metodePembayaran: 'Tunai' | 'QRIS' | 'Kupon Kantin';
  namaPembeli?: string; // Siswa / Guru / Staf
  catatan?: string;
}

export interface Supplier {
  id: string;
  namaPerusahaan: string;
  namaPic: string;
  nomorTelepon: string;
  alamat: string;
  kategoriProduk: string;
  keterangan?: string;
  statusKerjasama?: 'Aktif' | 'Konsinyasi' | 'Nonaktif';
}

export interface SchoolProfile {
  namaSekolah: string;
  npsn?: string;
  alamat: string;
  telepon: string;
  email: string;
  kepalaSekolah: string;
  namaStafKantin: string;
  nipStafKantin: string;
  jabatanStaf: string; // Staf Pengelola Kantin / Bendahara Kantin
  kotaPengesahan: string;
  logoUrl?: string;
  catatanKop?: string;
}

export interface DigitalSignatureInfo {
  namaStaf: string;
  nipStaf: string;
  jabatan: string;
  sekolah: string;
  tanggalTtd: string;
  nomorDokumen: string;
  kodeVerifikasi: string;
  keterangan: string;
}

export interface AuthCredentials {
  username: string;
  password: string;
  namaPengguna?: string;
  updatedAt?: string;
}

export interface AuthSession {
  username: string;
  loggedInAt: string;
}

export interface KantinDatabase {
  version: string;
  exportedAt: string;
  profilSekolah: SchoolProfile;
  transaksiKas: CashTransaction[];
  barang: ProductItem[];
  kategoriProduk?: string[];
  penjualan: SaleTransaction[];
  penyedia: Supplier[];
  kategoriKas?: CashCategories;
  kredensial?: AuthCredentials;
}
