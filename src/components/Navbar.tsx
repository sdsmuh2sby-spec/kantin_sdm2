import React from 'react';
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

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  school: SchoolProfile;
  onOpenPos: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  school,
  onOpenPos,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'cash', label: 'Menu Kas', icon: <Wallet className="w-4 h-4" /> },
    { id: 'reports', label: 'Laporan Penjualan', icon: <FileText className="w-4 h-4" /> },
    { id: 'labels', label: 'Label Harga', icon: <Tag className="w-4 h-4" /> },
    { id: 'products', label: 'Master Barang', icon: <Package className="w-4 h-4" /> },
    { id: 'suppliers', label: 'Data Penyedia', icon: <Truck className="w-4 h-4" /> },
    { id: 'profile', label: 'Profil Sekolah', icon: <School className="w-4 h-4" /> },
    { id: 'restore', label: 'Restore Data', icon: <Database className="w-4 h-4" /> },
  ];

  const handleTabClick = (id: NavTab) => {
    onTabChange(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & School Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-blue-600 via-indigo-600 to-blue-800 text-white flex items-center justify-center shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base tracking-tight text-slate-900">
                  Kantin<span className="text-blue-600">Ku</span>
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Kantin Sekolah
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-[200px] sm:max-w-xs">
                {school.namaSekolah}
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold border border-blue-200/70'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action: Quick POS */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenPos}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Kasir Cepat (POS)</span>
              <span className="sm:hidden">Kasir</span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Medium Screens (tablet) Nav Scrollbar */}
        <div className="hidden md:flex xl:hidden overflow-x-auto py-2 border-t border-slate-100 gap-1 no-scrollbar">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-100 text-blue-800 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 shadow-lg animate-in slide-in-from-top-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-800 font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
