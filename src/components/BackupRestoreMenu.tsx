import React, { useState, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  HardDrive,
  ShieldCheck,
  Server,
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { KantinDatabase } from '../types';
import { formatTanggalIndo } from '../utils/formatters';

interface BackupRestoreMenuProps {
  onDataChanged: () => void;
}

export const BackupRestoreMenu: React.FC<BackupRestoreMenuProps> = ({
  onDataChanged,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const [previewData, setPreviewData] = useState<KantinDatabase | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Current stats
  const currentDb = storageService.exportFullDatabase();
  const totalKasCount = currentDb.transaksiKas?.length || 0;
  const totalBarangCount = currentDb.barang?.length || 0;
  const totalPenjualanCount = currentDb.penjualan?.length || 0;
  const totalPenyediaCount = currentDb.penyedia?.length || 0;

  // 1. Export Full Database JSON
  const handleExportData = () => {
    try {
      const fullData = storageService.exportFullDatabase();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(fullData, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      const today = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `backup_kantinku_${today}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setNotification({
        type: 'success',
        message: 'File cadangan (backup) database berhasil diunduh ke perangkat Anda!',
      });
    } catch {
      setNotification({
        type: 'error',
        message: 'Gagal mengekspor data cadangan.',
      });
    }
  };

  // 2. File Selected for Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Format file JSON tidak valid.');
        }

        setPreviewData(parsed as KantinDatabase);
        setNotification({
          type: 'info',
          message: `File cadangan terbaca. Silakan klik tombol "Pulihkan Data Sekarang" di bawah untuk menerapkan.`,
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Format JSON tidak valid';
        setNotification({
          type: 'error',
          message: `Gagal membaca file: ${errorMsg}`,
        });
      }
    };
    reader.readAsText(file);
  };

  // Confirm Restore
  const handleConfirmRestore = () => {
    if (!previewData) return;

    if (
      window.confirm(
        'PERINGATAN: Memulihkan data cadangan akan menggantikan data kas, barang, dan penyedia yang ada saat ini. Lanjutkan?'
      )
    ) {
      setIsRestoring(true);
      const res = storageService.restoreFullDatabase(previewData);
      setIsRestoring(false);

      if (res.success) {
        setNotification({
          type: 'success',
          message: res.message,
        });
        setPreviewData(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onDataChanged();
      } else {
        setNotification({
          type: 'error',
          message: res.message,
        });
      }
    }
  };

  // 3. Reset Demo Data
  const handleResetDemo = () => {
    if (
      window.confirm(
        'Apakah Anda yakin ingin mengatur ulang data ke contoh bawaan awal kantin sekolah? Semua data simulasi baru akan dibuat kembali.'
      )
    ) {
      storageService.resetToDefaultData();
      setNotification({
        type: 'success',
        message: 'Database berhasil diatur ulang ke data contoh awal kantin sekolah!',
      });
      onDataChanged();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
          <span className="p-2 bg-purple-100 text-purple-800 rounded-xl">
            <Database className="w-5 h-5" />
          </span>
          Menu Restore & Cadangkan Data (Backup / Restore)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Simpan seluruh pembukuan kas, katalog barang, data penyedia, dan riwayat penjualan kantin dalam file cadangan mandiri, atau pulihkan kapan saja.
        </p>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold border animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : notification.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : notification.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            ) : (
              <Database className="w-4 h-4 text-blue-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-700 ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Current DB Stats Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <Server className="w-4 h-4 text-purple-600" />
          Status Penyimpanan Data Lokal Saat Ini
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <span className="text-[11px] text-slate-500 block">Transaksi Kas</span>
            <span className="text-xl font-bold text-slate-800 mt-1 block">{totalKasCount}</span>
            <span className="text-[10px] text-emerald-600">Arus Masuk/Keluar</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <span className="text-[11px] text-slate-500 block">Katalog Barang</span>
            <span className="text-xl font-bold text-slate-800 mt-1 block">{totalBarangCount}</span>
            <span className="text-[10px] text-indigo-600">Item ber-Barcode</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <span className="text-[11px] text-slate-500 block">Transaksi Penjualan</span>
            <span className="text-xl font-bold text-slate-800 mt-1 block">{totalPenjualanCount}</span>
            <span className="text-[10px] text-teal-600">Struk Terbit</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <span className="text-[11px] text-slate-500 block">Mitra Penyedia</span>
            <span className="text-xl font-bold text-slate-800 mt-1 block">{totalPenyediaCount}</span>
            <span className="text-[10px] text-amber-600">Supplier Aktif</span>
          </div>
        </div>
      </div>

      {/* Action Columns: Eksport vs Import */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Eksport Backup */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">1. Eksport Cadangan Data (Backup)</h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Unduh seluruh rekaman kas, katalog barang dengan harga dan barcode, data penyedia, serta profil sekolah ke dalam file cadangan terenkripsi aman berformat <strong>.JSON</strong>.
            </p>
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Manfaat pencadangan rutin:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Dapat dipindahkan ke komputer atau laptop lain</li>
                <li>Mencegah kehilangan data saat membersihkan riwayat browser</li>
                <li>Dapat diarsipkan per minggu atau per bulan</li>
              </ul>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={handleExportData}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              Unduh File Cadangan (.JSON)
            </button>
          </div>
        </div>

        {/* 2. Import Restore */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center mb-4">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">2. Pulihkan Data (Restore)</h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Unggah file cadangan <strong>.JSON</strong> yang telah diunduh sebelumnya untuk memulihkan seluruh data aplikasi ke kondisi saat pencadangan dilakukan.
            </p>

            {/* Hidden Input File */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="mt-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-xl bg-purple-50/50 hover:bg-purple-50 text-xs font-semibold text-purple-800 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <FileCode className="w-4 h-4 text-purple-600" />
                Pilih File Cadangan dari Komputer / HP...
              </button>
            </div>

            {/* Preview Selected File */}
            {previewData && (
              <div className="mt-4 p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1.5 animate-in fade-in">
                <span className="font-bold text-xs text-purple-900 block">
                  Rincian File yang Dipilih:
                </span>
                <div className="text-[11px] text-slate-700 space-y-0.5">
                  <p>• Sekolah: {previewData.profilSekolah?.namaSekolah || '-'}</p>
                  <p>• Transaksi Kas: {previewData.transaksiKas?.length || 0} catatan</p>
                  <p>• Barang: {previewData.barang?.length || 0} item</p>
                  <p>• Penjualan: {previewData.penjualan?.length || 0} struk</p>
                  <p>• Penyedia: {previewData.penyedia?.length || 0} mitra</p>
                  {previewData.exportedAt && (
                    <p className="text-slate-500">
                      • Dicadangkan pada: {new Date(previewData.exportedAt).toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="pt-6">
            {previewData ? (
              <button
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {isRestoring ? 'Memulihkan Data...' : 'Konfirmasi & Pulihkan Data Sekarang'}
              </button>
            ) : (
              <p className="text-center text-[11px] text-slate-400 py-2">
                Pilih file terlebih dahulu sebelum memulihkan data.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Reset Demo Option */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Kembalikan ke Contoh Data Demo Kantin Sekolah
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Ingin melihat simulasi lengkap kantin sekolah lagi dengan contoh transaksi, barang, dan penyedia siap pakai?
          </p>
        </div>

        <button
          onClick={handleResetDemo}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold rounded-xl transition-colors shrink-0 shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          Atur Ulang ke Data Contoh
        </button>
      </div>
    </div>
  );
};
