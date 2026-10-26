import {
  CashTransaction,
  CashCategories,
  ProductItem,
  SaleTransaction,
  Supplier,
  SchoolProfile,
  KantinDatabase,
  AuthCredentials,
  AuthSession,
} from '../types';
import { getTodayDateString } from '../utils/formatters';

const STORAGE_KEYS = {
  SCHOOL: 'kantinku_school_profile',
  CASH: 'kantinku_cash_transactions',
  CASH_CATEGORIES: 'kantinku_cash_categories',
  PRODUCTS: 'kantinku_products',
  PRODUCT_CATEGORIES: 'kantinku_product_categories',
  SALES: 'kantinku_sales',
  SUPPLIERS: 'kantinku_suppliers',
  AUTH_CREDS: 'kantinku_auth_credentials',
  AUTH_SESSION: 'kantinku_auth_session',
};

export const defaultProductCategories: string[] = [
  'Makanan Berat',
  'Snack / Jajanan',
  'Minuman',
  'Buah & Sehat',
  'ATK Sekolah',
];

export const defaultAuthCredentials: AuthCredentials = {
  username: 'admin',
  password: 'kantin123',
  namaPengguna: 'Pengelola Kantin',
};

export const defaultCashCategories: CashCategories = {
  penerimaan: [
    'Penjualan Kantin',
    'Penjualan Minuman',
    'Penjualan Snack/Kue',
    'Bagi Hasil Konsinyasi',
    'Modal Awal / Suntikan Kas',
    'Pendapatan Lain-lain',
  ],
  pengeluaran: [
    'Pembelian Bahan/Stok',
    'Kulakan Minuman Kemasan',
    'Bagi Hasil Supplier',
    'Operasional Gas/Listrik',
    'Operasional & Kebersihan',
    'Honor Petugas Kantin',
    'Perlengkapan / Alat Kantin',
    'Pengeluaran Lain-lain',
  ],
};

// Default School Profile based on environment & Surabaya context
export const defaultSchoolProfile: SchoolProfile = {
  namaSekolah: 'SD Muhammadiyah 2 Surabaya',
  npsn: '20532189',
  alamat: 'Jl. Pucang Anom No. 84, Kec. Gubeng, Kota Surabaya, Jawa Timur 60282',
  telepon: '(031) 5032890 / 0812-3456-7890',
  email: 'sds.muh2sby@gmail.com',
  kepalaSekolah: 'Dra. Hj. Wahyuni, M.Pd.',
  namaStafKantin: 'Pengelola Kantin',
  nipStafKantin: '-',
  jabatanStaf: 'Pengelola Kantin',
  kotaPengesahan: 'Surabaya',
  catatanKop: 'Kantin Ramah Anak & Sehat Berprestasi',
};

export const defaultSuppliers: Supplier[] = [
  {
    id: 'sup-1',
    namaPerusahaan: 'CV Berkah Boga Sejahtera',
    namaPic: 'Bpk. H. Bambang Hartono',
    nomorTelepon: '081234567890',
    alamat: 'Jl. Manyar Sabrangan No. 12, Surabaya',
    kategoriProduk: 'Snack Tradisional & Roti Sehat',
    keterangan: 'Jadwal drop roti dan risol setiap hari pukul 06.30 WIB. Sistem konsinyasi mingguan.',
    statusKerjasama: 'Aktif',
  },
  {
    id: 'sup-2',
    namaPerusahaan: 'Dapur Bunda Barokah',
    namaPic: 'Ibu Hj. Siti Rahayu',
    nomorTelepon: '085712345678',
    alamat: 'Jl. Kertajaya Indah V No. 4, Surabaya',
    kategoriProduk: 'Makanan Berat / Nasi Bento Sehat',
    keterangan: 'Penyedia bento nasi kuning dan nasi ayam teriyaki non-MSG untuk siswa.',
    statusKerjasama: 'Aktif',
  },
  {
    id: 'sup-3',
    namaPerusahaan: 'PT Sumber Susu & Segar Segar',
    namaPic: 'Mas Agus Tri Prasetyo',
    nomorTelepon: '082198765432',
    alamat: 'Ruko Ngagel Jaya Selatan No. 18, Surabaya',
    kategoriProduk: 'Minuman Kemasan & Susu UHT',
    keterangan: 'Pengiriman dua kali seminggu setiap Selasa & Jumat.',
    statusKerjasama: 'Aktif',
  },
  {
    id: 'sup-4',
    namaPerusahaan: 'Koperasi Guru & Karyawan Sejahtera',
    namaPic: 'Bpk. Ahmad Wahyudi, S.E.',
    nomorTelepon: '081345678912',
    alamat: 'Ruang Koperasi Lt. 1 Gedung Sekolah',
    kategoriProduk: 'ATK Siswa & Kupon Kantin Digital',
    keterangan: 'Kebutuhan perlengkapan pensil, penghapus, dan buku tulis darurat.',
    statusKerjasama: 'Aktif',
  },
];

export const defaultProducts: ProductItem[] = [
  {
    id: 'prod-1',
    kode: 'KNT-8991001',
    nama: 'Nasi Kuning Bento Komplit',
    kategori: 'Makanan Berat',
    hargaBeli: 8000,
    hargaJual: 11000,
    stok: 35,
    satuan: 'Porsi',
    penyediaId: 'sup-2',
  },
  {
    id: 'prod-2',
    kode: 'KNT-8991002',
    nama: 'Risol Mayo Telur Keju',
    kategori: 'Snack / Jajanan',
    hargaBeli: 2500,
    hargaJual: 3500,
    stok: 45,
    satuan: 'Pcs',
    penyediaId: 'sup-1',
  },
  {
    id: 'prod-3',
    kode: 'KNT-8991003',
    nama: 'Donat Coklat Meises Manis',
    kategori: 'Snack / Jajanan',
    hargaBeli: 2200,
    hargaJual: 3000,
    stok: 40,
    satuan: 'Pcs',
    penyediaId: 'sup-1',
  },
  {
    id: 'prod-4',
    kode: 'KNT-8991004',
    nama: 'Susu UHT Coklat / Strawberry 125ml',
    kategori: 'Minuman',
    hargaBeli: 3600,
    hargaJual: 4500,
    stok: 50,
    satuan: 'Kotak',
    penyediaId: 'sup-3',
  },
  {
    id: 'prod-5',
    kode: 'KNT-8991005',
    nama: 'Es Teh Manis Melati Cup',
    kategori: 'Minuman',
    hargaBeli: 1200,
    hargaJual: 3000,
    stok: 60,
    satuan: 'Cup',
    penyediaId: 'sup-1',
  },
  {
    id: 'prod-6',
    kode: 'KNT-8991006',
    nama: 'Jus Mangga / Jambu Murni',
    kategori: 'Minuman',
    hargaBeli: 3500,
    hargaJual: 5000,
    stok: 25,
    satuan: 'Cup',
    penyediaId: 'sup-2',
  },
  {
    id: 'prod-7',
    kode: 'KNT-8991007',
    nama: 'Lemper Ayam Kukus Daun',
    kategori: 'Snack / Jajanan',
    hargaBeli: 2200,
    hargaJual: 3000,
    stok: 30,
    satuan: 'Pcs',
    penyediaId: 'sup-1',
  },
  {
    id: 'prod-8',
    kode: 'KNT-8991008',
    nama: 'Buku Tulis Garis 38 Lembar & Pensil 2B',
    kategori: 'ATK Sekolah',
    hargaBeli: 3500,
    hargaJual: 5000,
    stok: 25,
    satuan: 'Set',
    penyediaId: 'sup-4',
  },
];

// Helper to generate sample transactions relative to current date
const generateInitialTransactions = () => {
  const today = getTodayDateString();
  const d = new Date();
  
  // Yesterday
  const dYest = new Date(d);
  dYest.setDate(d.getDate() - 1);
  const yestStr = dYest.toISOString().split('T')[0];

  // 3 days ago
  const d3 = new Date(d);
  d3.setDate(d.getDate() - 3);
  const d3Str = d3.toISOString().split('T')[0];

  // 5 days ago
  const d5 = new Date(d);
  d5.setDate(d.getDate() - 5);
  const d5Str = d5.toISOString().split('T')[0];

  const cashList: CashTransaction[] = [
    {
      id: 'kas-1',
      tanggal: d5Str,
      waktu: '07:15',
      tipe: 'pengeluaran',
      kategori: 'Pembelian Bahan/Stok',
      jumlah: 320000,
      keterangan: 'Kulakan susu kotak & minuman dingin dari PT Sumber Susu',
      metodePembayaran: 'Transfer',
      createdAt: `${d5Str}T07:15:00`,
    },
    {
      id: 'kas-2',
      tanggal: d5Str,
      waktu: '13:00',
      tipe: 'penerimaan',
      kategori: 'Penjualan Kantin',
      jumlah: 485000,
      keterangan: 'Hasil penjualan makanan & snack jam istirahat 1 & 2',
      metodePembayaran: 'Tunai',
      createdAt: `${d5Str}T13:00:00`,
    },
    {
      id: 'kas-3',
      tanggal: d3Str,
      waktu: '08:00',
      tipe: 'pengeluaran',
      kategori: 'Operasional & Kebersihan',
      jumlah: 45000,
      keterangan: 'Beli sabun cuci piring, tisu makan, dan kantong sampah ramah lingkungan',
      metodePembayaran: 'Tunai',
      createdAt: `${d3Str}T08:00:00`,
    },
    {
      id: 'kas-4',
      tanggal: d3Str,
      waktu: '13:30',
      tipe: 'penerimaan',
      kategori: 'Penjualan Kantin',
      jumlah: 560000,
      keterangan: 'Penerimaan omzet penjualan kantin hari Rabu',
      metodePembayaran: 'Tunai',
      createdAt: `${d3Str}T13:30:00`,
    },
    {
      id: 'kas-5',
      tanggal: yestStr,
      waktu: '07:30',
      tipe: 'pengeluaran',
      kategori: 'Pembelian Bahan/Stok',
      jumlah: 180000,
      keterangan: 'Belanja bahan es teh (gula pasir, teh melati, es batu kristal higienis)',
      metodePembayaran: 'Tunai',
      createdAt: `${yestStr}T07:30:00`,
    },
    {
      id: 'kas-6',
      tanggal: yestStr,
      waktu: '13:45',
      tipe: 'penerimaan',
      kategori: 'Penjualan Kantin',
      jumlah: 620000,
      keterangan: 'Rekap penjualan tunai & QRIS istirahat sekolah',
      metodePembayaran: 'Tunai',
      createdAt: `${yestStr}T13:45:00`,
    },
    {
      id: 'kas-7',
      tanggal: today,
      waktu: '06:45',
      tipe: 'pengeluaran',
      kategori: 'Operasional & Gas',
      jumlah: 22000,
      keterangan: 'Refill gas elpiji 3kg untuk kompor kantin',
      metodePembayaran: 'Tunai',
      createdAt: `${today}T06:45:00`,
    },
    {
      id: 'kas-8',
      tanggal: today,
      waktu: '10:30',
      tipe: 'penerimaan',
      kategori: 'Penjualan Kantin',
      jumlah: 375000,
      keterangan: 'Penjualan istirahat pertama (Bento, Risol & Minuman)',
      metodePembayaran: 'Tunai',
      createdAt: `${today}T10:30:00`,
    },
  ];

  const salesList: SaleTransaction[] = [
    {
      id: 'sale-1',
      nomorStruk: `STR-${yestStr.replace(/-/g, '')}-001`,
      tanggal: yestStr,
      waktu: '09:30:15',
      items: [
        {
          productId: 'prod-1',
          kode: 'KNT-8991001',
          nama: 'Nasi Kuning Bento Komplit',
          hargaSatuan: 11000,
          hargaModal: 8000,
          qty: 15,
          subtotal: 165000,
          labaKotor: 45000,
        },
        {
          productId: 'prod-2',
          kode: 'KNT-8991002',
          nama: 'Risol Mayo Telur Keju',
          hargaSatuan: 3500,
          hargaModal: 2500,
          qty: 20,
          subtotal: 70000,
          labaKotor: 20000,
        },
        {
          productId: 'prod-5',
          kode: 'KNT-8991005',
          nama: 'Es Teh Manis Melati Cup',
          hargaSatuan: 3000,
          hargaModal: 1200,
          qty: 25,
          subtotal: 75000,
          labaKotor: 45000,
        },
      ],
      totalItem: 60,
      totalPenjualan: 310000,
      totalModal: 200000,
      labaKotor: 110000,
      metodePembayaran: 'Tunai',
      namaPembeli: 'Siswa Kelas 4 - 6',
      catatan: 'Istirahat Pagi',
    },
    {
      id: 'sale-2',
      nomorStruk: `STR-${yestStr.replace(/-/g, '')}-002`,
      tanggal: yestStr,
      waktu: '12:15:20',
      items: [
        {
          productId: 'prod-3',
          kode: 'KNT-8991003',
          nama: 'Donat Coklat Meises Manis',
          hargaSatuan: 3000,
          hargaModal: 2200,
          qty: 18,
          subtotal: 54000,
          labaKotor: 14400,
        },
        {
          productId: 'prod-4',
          kode: 'KNT-8991004',
          nama: 'Susu UHT Coklat / Strawberry 125ml',
          hargaSatuan: 4500,
          hargaModal: 3600,
          qty: 16,
          subtotal: 72000,
          labaKotor: 14400,
        },
        {
          productId: 'prod-6',
          kode: 'KNT-8991006',
          nama: 'Jus Mangga / Jambu Murni',
          hargaSatuan: 5000,
          hargaModal: 3500,
          qty: 12,
          subtotal: 60000,
          labaKotor: 18000,
        },
      ],
      totalItem: 46,
      totalPenjualan: 186000,
      totalModal: 139200,
      labaKotor: 46800,
      metodePembayaran: 'QRIS',
      namaPembeli: 'Guru & Karyawan',
      catatan: 'Istirahat Siang',
    },
    {
      id: 'sale-3',
      nomorStruk: `STR-${today.replace(/-/g, '')}-001`,
      tanggal: today,
      waktu: '09:40:00',
      items: [
        {
          productId: 'prod-1',
          kode: 'KNT-8991001',
          nama: 'Nasi Kuning Bento Komplit',
          hargaSatuan: 11000,
          hargaModal: 8000,
          qty: 12,
          subtotal: 132000,
          labaKotor: 36000,
        },
        {
          productId: 'prod-2',
          kode: 'KNT-8991002',
          nama: 'Risol Mayo Telur Keju',
          hargaSatuan: 3500,
          hargaModal: 2500,
          qty: 25,
          subtotal: 87500,
          labaKotor: 25000,
        },
        {
          productId: 'prod-5',
          kode: 'KNT-8991005',
          nama: 'Es Teh Manis Melati Cup',
          hargaSatuan: 3000,
          hargaModal: 1200,
          qty: 22,
          subtotal: 66000,
          labaKotor: 39600,
        },
        {
          productId: 'prod-4',
          kode: 'KNT-8991004',
          nama: 'Susu UHT Coklat / Strawberry 125ml',
          hargaSatuan: 4500,
          hargaModal: 3600,
          qty: 10,
          subtotal: 45000,
          labaKotor: 9000,
        },
      ],
      totalItem: 69,
      totalPenjualan: 330500,
      totalModal: 220900,
      labaKotor: 109600,
      metodePembayaran: 'Tunai',
      namaPembeli: 'Siswa & Guru',
      catatan: 'Penjualan Istirahat 1',
    },
  ];

  return { cashList, salesList };
};

export const storageService = {
  // School Profile
  getSchoolProfile: (): SchoolProfile => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SCHOOL);
      if (!data) return defaultSchoolProfile;
      const parsed = JSON.parse(data);
      if (
        !parsed.namaStafKantin ||
        parsed.namaStafKantin.toLowerCase().includes('nurul hidayati')
      ) {
        parsed.namaStafKantin = 'Pengelola Kantin';
        parsed.jabatanStaf = 'Pengelola Kantin';
        localStorage.setItem(STORAGE_KEYS.SCHOOL, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return defaultSchoolProfile;
    }
  },
  saveSchoolProfile: (profile: SchoolProfile): void => {
    localStorage.setItem(STORAGE_KEYS.SCHOOL, JSON.stringify(profile));
  },

  // Cash Transactions
  getCashTransactions: (): CashTransaction[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CASH);
      if (data) return JSON.parse(data);
      const initial = generateInitialTransactions().cashList;
      localStorage.setItem(STORAGE_KEYS.CASH, JSON.stringify(initial));
      return initial;
    } catch {
      return [];
    }
  },
  saveCashTransactions: (transactions: CashTransaction[]): void => {
    localStorage.setItem(STORAGE_KEYS.CASH, JSON.stringify(transactions));
  },

  // Products
  getProducts: (): ProductItem[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (data) return JSON.parse(data);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(defaultProducts));
      return defaultProducts;
    } catch {
      return defaultProducts;
    }
  },
  saveProducts: (products: ProductItem[]): void => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  // Product Categories (Master Kategori Barang)
  getProductCategories: (): string[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCT_CATEGORIES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // Populate defaults merged with existing products
      const prods = storageService.getProducts();
      const set = new Set<string>(defaultProductCategories);
      prods.forEach((p) => {
        if (p.kategori && p.kategori.trim()) set.add(p.kategori.trim());
      });
      const list = Array.from(set);
      localStorage.setItem(STORAGE_KEYS.PRODUCT_CATEGORIES, JSON.stringify(list));
      return list;
    } catch {
      return defaultProductCategories;
    }
  },
  saveProductCategories: (categories: string[]): void => {
    localStorage.setItem(STORAGE_KEYS.PRODUCT_CATEGORIES, JSON.stringify(categories));
  },

  // Sales Transactions
  getSales: (): SaleTransaction[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SALES);
      if (data) return JSON.parse(data);
      const initial = generateInitialTransactions().salesList;
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(initial));
      return initial;
    } catch {
      return [];
    }
  },
  saveSales: (sales: SaleTransaction[]): void => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  },

  // Suppliers
  getSuppliers: (): Supplier[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
      if (data) return JSON.parse(data);
      localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(defaultSuppliers));
      return defaultSuppliers;
    } catch {
      return defaultSuppliers;
    }
  },
  saveSuppliers: (suppliers: Supplier[]): void => {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
  },

  // Cash Categories
  getCashCategories: (): CashCategories => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CASH_CATEGORIES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed?.penerimaan) && Array.isArray(parsed?.pengeluaran)) {
          return parsed;
        }
      }
      localStorage.setItem(STORAGE_KEYS.CASH_CATEGORIES, JSON.stringify(defaultCashCategories));
      return defaultCashCategories;
    } catch {
      return defaultCashCategories;
    }
  },
  saveCashCategories: (categories: CashCategories): void => {
    localStorage.setItem(STORAGE_KEYS.CASH_CATEGORIES, JSON.stringify(categories));
  },

  // Full Database Backup Export
  exportFullDatabase: (): KantinDatabase => {
    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      profilSekolah: storageService.getSchoolProfile(),
      transaksiKas: storageService.getCashTransactions(),
      barang: storageService.getProducts(),
      kategoriProduk: storageService.getProductCategories(),
      penjualan: storageService.getSales(),
      penyedia: storageService.getSuppliers(),
      kategoriKas: storageService.getCashCategories(),
      kredensial: storageService.getAuthCredentials(),
    };
  },

  // Full Database Restore Import
  restoreFullDatabase: (data: KantinDatabase): { success: boolean; message: string } => {
    try {
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'Format file tidak valid atau kosong.' };
      }

      if (data.profilSekolah) storageService.saveSchoolProfile(data.profilSekolah);
      if (Array.isArray(data.transaksiKas)) storageService.saveCashTransactions(data.transaksiKas);
      if (Array.isArray(data.barang)) storageService.saveProducts(data.barang);
      if (Array.isArray(data.kategoriProduk)) storageService.saveProductCategories(data.kategoriProduk);
      if (Array.isArray(data.penjualan)) storageService.saveSales(data.penjualan);
      if (Array.isArray(data.penyedia)) storageService.saveSuppliers(data.penyedia);
      if (data.kategoriKas && Array.isArray(data.kategoriKas.penerimaan) && Array.isArray(data.kategoriKas.pengeluaran)) {
        storageService.saveCashCategories(data.kategoriKas);
      }
      if (data.kredensial && data.kredensial.username && data.kredensial.password) {
        storageService.saveAuthCredentials(data.kredensial);
      }

      return { success: true, message: 'Data kantin berhasil dipulihkan secara lengkap!' };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Kesalahan internal';
      return { success: false, message: `Gagal memulihkan data: ${errorMsg}` };
    }
  },

  // Authentication & Web Access Security
  getAuthCredentials: (): AuthCredentials => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTH_CREDS);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.username && parsed.password) {
          return parsed;
        }
      }
      localStorage.setItem(STORAGE_KEYS.AUTH_CREDS, JSON.stringify(defaultAuthCredentials));
      return defaultAuthCredentials;
    } catch {
      return defaultAuthCredentials;
    }
  },

  saveAuthCredentials: (creds: AuthCredentials): void => {
    localStorage.setItem(
      STORAGE_KEYS.AUTH_CREDS,
      JSON.stringify({ ...creds, updatedAt: new Date().toISOString() })
    );
  },

  getSession: (): AuthSession | null => {
    try {
      const local = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (local) return JSON.parse(local);
      const session = sessionStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (session) return JSON.parse(session);
      return null;
    } catch {
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    const session = storageService.getSession();
    return !!session && !!session.username;
  },

  login: (
    usernameInput: string,
    passwordInput: string,
    rememberMe = true
  ): { success: boolean; message: string } => {
    const creds = storageService.getAuthCredentials();
    const cleanUser = usernameInput.trim();
    const cleanPass = passwordInput.trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, message: 'Username dan kata sandi wajib diisi.' };
    }

    if (
      cleanUser.toLowerCase() === creds.username.toLowerCase() &&
      cleanPass === creds.password
    ) {
      const sessionData: AuthSession = {
        username: creds.username,
        loggedInAt: new Date().toISOString(),
      };

      if (rememberMe) {
        localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(sessionData));
        sessionStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      } else {
        sessionStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(sessionData));
        localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      }

      return { success: true, message: 'Login berhasil!' };
    }

    return {
      success: false,
      message: 'Username atau kata sandi yang Anda masukkan salah. Silakan coba lagi.',
    };
  },

  logout: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      sessionStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    } catch {
      // ignore
    }
  },

  changePassword: (
    currentPass: string,
    newPass?: string,
    newUsername?: string
  ): { success: boolean; message: string } => {
    const creds = storageService.getAuthCredentials();

    if (currentPass !== creds.password) {
      return { success: false, message: 'Kata sandi saat ini tidak cocok.' };
    }

    const trimmedUser = newUsername ? newUsername.trim() : '';
    if (newUsername !== undefined && (!trimmedUser || trimmedUser.length < 3)) {
      return { success: false, message: 'Username minimal 3 karakter.' };
    }

    const targetUser = trimmedUser || creds.username;
    let targetPass = creds.password;

    const hasNewPass = newPass && newPass.trim().length > 0;
    if (hasNewPass) {
      if (newPass.trim().length < 4) {
        return {
          success: false,
          message: 'Kata sandi baru minimal 4 karakter demi keamanan.',
        };
      }
      targetPass = newPass.trim();
    }

    const updatedCreds: AuthCredentials = {
      username: targetUser,
      password: targetPass,
      namaPengguna: creds.namaPengguna || 'Pengelola Kantin',
      updatedAt: new Date().toISOString(),
    };

    storageService.saveAuthCredentials(updatedCreds);

    // Update active session with new username if changed
    const currentSession = storageService.getSession();
    if (currentSession) {
      const updatedSession: AuthSession = {
        username: updatedCreds.username,
        loggedInAt: currentSession.loggedInAt,
      };
      if (localStorage.getItem(STORAGE_KEYS.AUTH_SESSION)) {
        localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(updatedSession));
      }
      if (sessionStorage.getItem(STORAGE_KEYS.AUTH_SESSION)) {
        sessionStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(updatedSession));
      }
    }

    if (hasNewPass && targetUser !== creds.username) {
      return { success: true, message: 'Username dan kata sandi berhasil diperbarui!' };
    } else if (hasNewPass) {
      return { success: true, message: 'Kata sandi berhasil diperbarui!' };
    } else {
      return { success: true, message: 'Username akun berhasil diperbarui!' };
    }
  },

  // Reset to Demo Data
  resetToDefaultData: (): void => {
    const { cashList, salesList } = generateInitialTransactions();
    storageService.saveSchoolProfile(defaultSchoolProfile);
    storageService.saveProducts(defaultProducts);
    storageService.saveSuppliers(defaultSuppliers);
    storageService.saveCashTransactions(cashList);
    storageService.saveSales(salesList);
    storageService.saveCashCategories(defaultCashCategories);
    storageService.saveAuthCredentials(defaultAuthCredentials);
  },
};
