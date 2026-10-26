import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { ShieldCheck, CheckCircle2, Copy, Check, X, School, Calendar } from 'lucide-react';
import { SchoolProfile } from '../types';
import { formatTanggalIndo } from '../utils/formatters';

interface DigitalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: SchoolProfile;
  reportTitle: string;
  startDate: string;
  endDate: string;
  verificationCode: string;
}

export const DigitalSignatureModal: React.FC<DigitalSignatureModalProps> = ({
  isOpen,
  onClose,
  school,
  reportTitle,
  startDate,
  endDate,
  verificationCode,
}) => {
  const [qrSrc, setQrSrc] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (isOpen) {
      const payload = JSON.stringify({
        dokumen: reportTitle,
        sekolah: school.namaSekolah,
        alamat: school.alamat,
        periode: `${startDate} s.d ${endDate}`,
        tanggalPengesahan: today,
        kodeVerifikasi: verificationCode,
        keabsahan: 'ASLI_TERVERIFIKASI_KANTIN',
      });

      QRCode.toDataURL(payload, {
        margin: 1,
        width: 220,
        color: {
          dark: '#1e40af',
          light: '#ffffff',
        },
      })
        .then((url) => setQrSrc(url))
        .catch(console.error);
    }
  }, [isOpen, school, reportTitle, startDate, endDate, verificationCode, today]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(verificationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-linear-to-r from-blue-700 via-blue-800 to-indigo-800 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
              <ShieldCheck className="w-6 h-6 text-blue-100" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Tanda Tangan Digital Resmi</h3>
              <p className="text-xs text-blue-100/90">Verifikasi Integritas Laporan Kantin Sekolah</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Badge verified */}
          <div className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 py-2.5 px-4 rounded-xl font-medium text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Dokumen Terautentikasi & Sah Secara Digital</span>
          </div>

          {/* QR code and details */}
          <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="shrink-0 bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs flex flex-col items-center">
              {qrSrc ? (
                <img src={qrSrc} alt="QR Code TTD Digital" className="w-32 h-32 object-contain" />
              ) : (
                <div className="w-32 h-32 bg-slate-100 animate-pulse rounded" />
              )}
              <span className="text-[10px] text-slate-500 font-mono mt-1">Scan QR untuk verifikasi</span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 flex-1">
              <div className="flex items-start gap-2">
                <School className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-slate-900">{school.namaSekolah}</span>
                  <span className="text-[11px] text-slate-500 leading-snug">{school.alamat}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                <Calendar className="w-4 h-4 text-indigo-700 shrink-0" />
                <span>Pengesahan: {formatTanggalIndo(today)}</span>
              </div>
            </div>
          </div>

          {/* Verification Code Box */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">
              Kode Hash Verifikasi Dokumen
            </label>
            <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-100 rounded-lg border border-slate-200 font-mono text-xs text-slate-700">
              <span className="truncate select-all font-medium">{verificationCode}</span>
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-sans font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Tersalin' : 'Salin'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              QR code ini dicantumkan pada cetakan laporan PDF dan fisik untuk menjamin keabsahan pertanggungjawaban dana kantin.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
