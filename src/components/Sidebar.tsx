import React, { useState } from 'react';
import {
  LayoutDashboard,
  Wallet,
  FileText,
  Tag,
  Package,
  Truck,
  School,
  Database,
  ShoppingCart,
  Store,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  LogOut,
  KeyRound,
  UserCheck,
} from 'lucide-react';
import { SchoolProfile } from '../types';

export type NavTab =
  | 'dashboard'
  | 'cash'
  | 'reports'
  | 'labels'
  | 'products'
  | 'suppliers'
  | 'profile'
  | 'restore';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  school: SchoolProfile;
  onOpenPos: () => void;
  currentUsername?: string;
  onOpenChangePassword?: () => void;
  onLogout?: () => void;
}

interface NavItemDef {
  id: NavTab;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  school,
  onOpenPos,
  currentUsername = 'admin',
  onOpenChangePassword,
  onLogout,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const mainNavItems: NavItemDef[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      sublabel: 'Ringkasan & Statistik',
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'cash',
      label: 'Menu Kas',
      sublabel: 'Penerimaan & Pengeluaran',
      icon: <Wallet className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'reports',
      label: 'Laporan Penjualan',
      sublabel: 'Harian, Bulanan & QR TTD',
      icon: <FileText className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'labels',
      label: 'Label Harga',
      sublabel: 'Cetak Label Rak & Etalase',
      icon: <Tag className="w-5 h-5 shrink-0" />,
    },
  ];

  const dataNavItems: NavItemDef[] = [
    {
      id: 'products',
      label: 'Master Barang',
      sublabel: 'Daftar Menu & Harga Jual',
      icon: <Package className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'suppliers',
      label: 'Data Penyedia',
      sublabel: 'Kontak Rekanan & Titipan',
      icon: <Truck className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'profile',
      label: 'Profil Sekolah',
      sublabel: 'Nama & Alamat Lembaga',
      icon: <School className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'restore',
      label: 'Restore Data',
      sublabel: 'Ekspor & Impor Cadangan',
      icon: <Database className="w-5 h-5 shrink-0" />,
    },
  ];

  const handleSelectTab = (id: NavTab) => {
    onTabChange(id);
    setMobileOpen(false);
  };

  const renderNavGroup = (items: NavItemDef[], title: string) => (
    <div className="space-y-1">
      <div className="px-3 pt-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
        {title}
      </div>
      {items.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleSelectTab(item.id)}
            className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all ${
              isActive
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25 ring-1 ring-blue-500'
                : 'text-slate-600 hover:text-blue-900 hover:bg-blue-50/80 font-medium'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                }`}
              >
                {item.icon}
              </span>
              <div className="min-w-0 truncate">
                <p className={`text-xs leading-tight truncate ${isActive ? 'text-white' : 'text-slate-800 group-hover:text-blue-950'}`}>
                  {item.label}
                </p>
                <p
                  className={`text-[10px] leading-tight truncate mt-0.5 ${
                    isActive ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  {item.sublabel}
                </p>
              </div>
            </div>
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform ${
                isActive ? 'text-blue-200 translate-x-0.5' : 'text-slate-300 opacity-0 group-hover:opacity-100'
              }`}
            />
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Mobile Top Header (Hidden on Desktop) */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-blue-100 px-4 py-3 flex items-center justify-between no-print shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-sm tracking-tight text-slate-900">
                Kantin<span className="text-blue-600">Ku</span>
              </h1>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Kantin Sekolah
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium truncate max-w-[180px]">
              {school.namaSekolah}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenPos}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Kasir</span>
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Keluar dari akun"
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              aria-label="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="Buka Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs no-print transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Vertical Sidebar: Fixed on Desktop, Slide-over Drawer on Mobile */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-30 h-screen w-72 lg:w-64 xl:w-72 bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 no-print transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Branding & Close button for mobile */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-black text-base tracking-tight text-slate-900">
                    Kantin<span className="text-blue-600">Ku</span>
                  </h1>
                  <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    v1.0
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-blue-600 truncate max-w-[150px]">
                  Kantin Sekolah
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* School Name Card */}
          <div className="mt-3.5 p-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-100/80">
            <div className="flex items-center gap-2">
              <School className="w-3.5 h-3.5 text-blue-700 shrink-0" />
              <p className="text-[11px] font-bold text-blue-950 truncate">
                {school.namaSekolah}
              </p>
            </div>
            <p className="text-[10px] text-slate-500 truncate mt-0.5 pl-5.5">
              {school.alamat}
            </p>
          </div>

          {/* Quick Kasir Cepat Button */}
          <div className="mt-3">
            <button
              type="button"
              onClick={() => {
                onOpenPos();
                setMobileOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-linear-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-blue-600/20 hover:shadow-lg transition-all active:scale-[0.98]"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Kasir Cepat (POS)</span>
            </button>
          </div>
        </div>

        {/* Middle: Vertical Navigation Menu Links */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 no-scrollbar">
          {renderNavGroup(mainNavItems, 'Menu Utama Kantin')}
          {renderNavGroup(dataNavItems, 'Master Data & Pengaturan')}
        </div>

        {/* Bottom: User Session & Actions */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/80 space-y-2">
          {/* Active User Card */}
          <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {currentUsername}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium truncate">
                    Pengelola Kantin
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Aktif
              </span>
            </div>

            {/* Quick Action Buttons: Ganti Sandi & Keluar */}
            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-100">
              {onOpenChangePassword && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenChangePassword();
                    setMobileOpen(false);
                  }}
                  className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50/80 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                >
                  <KeyRound className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                  <span>Sandi</span>
                </button>
              )}

              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onLogout();
                  }}
                  className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                >
                  <LogOut className="w-3 h-3 text-rose-500" />
                  <span>Keluar</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Sistem Kantin Terproteksi Sandi</span>
          </div>
        </div>
      </aside>
    </>
  );
};
