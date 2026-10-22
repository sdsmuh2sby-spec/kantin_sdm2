/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  CashTransaction,
  ProductItem,
  SaleTransaction,
  Supplier,
  SchoolProfile,
} from './types';
import { storageService } from './services/storageService';
import { Navbar, NavTab } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { CashMenu } from './components/CashMenu';
import { SalesReportsMenu } from './components/SalesReportsMenu';
import { PriceTagsMenu } from './components/PriceTagsMenu';
import { ProductsMenu } from './components/ProductsMenu';
import { SuppliersMenu } from './components/SuppliersMenu';
import { SchoolProfileMenu } from './components/SchoolProfileMenu';
import { BackupRestoreMenu } from './components/BackupRestoreMenu';
import { PosCashierModal } from './components/PosCashierModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isPosOpen, setIsPosOpen] = useState(false);
  const [initialCashOpenType, setInitialCashOpenType] = useState<'penerimaan' | 'pengeluaran' | null>(null);

  // App Data States
  const [school, setSchool] = useState<SchoolProfile>(() => storageService.getSchoolProfile());
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(() =>
    storageService.getCashTransactions()
  );
  const [products, setProducts] = useState<ProductItem[]>(() => storageService.getProducts());
  const [salesTransactions, setSalesTransactions] = useState<SaleTransaction[]>(() =>
    storageService.getSales()
  );
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => storageService.getSuppliers());

  // Reload data from local storage (used after restore/reset)
  const reloadAllData = useCallback(() => {
    setSchool(storageService.getSchoolProfile());
    setCashTransactions(storageService.getCashTransactions());
    setProducts(storageService.getProducts());
    setSalesTransactions(storageService.getSales());
    setSuppliers(storageService.getSuppliers());
  }, []);

  // Save Handlers with sync
  const handleSaveSchool = (updated: SchoolProfile) => {
    setSchool(updated);
    storageService.saveSchoolProfile(updated);
  };

  const handleSaveCash = (updated: CashTransaction[]) => {
    setCashTransactions(updated);
    storageService.saveCashTransactions(updated);
  };

  const handleSaveProducts = (updated: ProductItem[]) => {
    setProducts(updated);
    storageService.saveProducts(updated);
  };

  const handleSaveSuppliers = (updated: Supplier[]) => {
    setSuppliers(updated);
    storageService.saveSuppliers(updated);
  };

  // When a sale is completed in the POS Cashier:
  const handleCompleteSale = (
    newSale: SaleTransaction,
    newCashEntry: CashTransaction,
    updatedProducts: ProductItem[]
  ) => {
    const nextSales = [newSale, ...salesTransactions];
    const nextCash = [newCashEntry, ...cashTransactions];

    setSalesTransactions(nextSales);
    storageService.saveSales(nextSales);

    setCashTransactions(nextCash);
    storageService.saveCashTransactions(nextCash);

    setProducts(updatedProducts);
    storageService.saveProducts(updatedProducts);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        school={school}
        onOpenPos={() => setIsPosOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            cashTransactions={cashTransactions}
            salesTransactions={salesTransactions}
            products={products}
            school={school}
            onOpenPos={() => setIsPosOpen(true)}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onOpenAddCash={(type) => {
              setInitialCashOpenType(type);
              setActiveTab('cash');
            }}
          />
        )}

        {activeTab === 'cash' && (
          <CashMenu
            transactions={cashTransactions}
            onSaveTransactions={handleSaveCash}
            initialOpenType={initialCashOpenType}
            onClearInitialOpen={() => setInitialCashOpenType(null)}
          />
        )}

        {activeTab === 'reports' && (
          <SalesReportsMenu
            cashTransactions={cashTransactions}
            salesTransactions={salesTransactions}
            school={school}
          />
        )}

        {activeTab === 'labels' && (
          <PriceTagsMenu
            products={products}
            school={school}
            onOpenProductManagement={() => setActiveTab('products')}
          />
        )}

        {activeTab === 'products' && (
          <ProductsMenu
            products={products}
            suppliers={suppliers}
            onSaveProducts={handleSaveProducts}
            onNavigateToLabels={() => setActiveTab('labels')}
          />
        )}

        {activeTab === 'suppliers' && (
          <SuppliersMenu
            suppliers={suppliers}
            products={products}
            onSaveSuppliers={handleSaveSuppliers}
          />
        )}

        {activeTab === 'profile' && (
          <SchoolProfileMenu
            school={school}
            onSaveProfile={handleSaveSchool}
          />
        )}

        {activeTab === 'restore' && (
          <BackupRestoreMenu onDataChanged={reloadAllData} />
        )}
      </main>

      {/* POS Cashier Modal */}
      <PosCashierModal
        isOpen={isPosOpen}
        onClose={() => setIsPosOpen(false)}
        products={products}
        school={school}
        onCompleteSale={handleCompleteSale}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-1">
          <p className="font-semibold text-slate-700">
            KantinKu — Sistem Pengelolaan & Pembukuan Kantin Sekolah
          </p>
          <p className="text-[11px] text-slate-400">
            {school.namaSekolah} • {school.alamat}
          </p>
        </div>
      </footer>
    </div>
  );
}
