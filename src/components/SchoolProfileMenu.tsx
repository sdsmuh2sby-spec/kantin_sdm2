import React, { useState } from 'react';
import {
  School,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  Building,
  Save,
  CheckCircle2,
  FileSignature,
  FileText,
} from 'lucide-react';
import { SchoolProfile } from '../types';

interface SchoolProfileMenuProps {
  school: SchoolProfile;
  onSaveProfile: (profile: SchoolProfile) => void;
}

export const SchoolProfileMenu: React.FC<SchoolProfileMenuProps> = ({
  school,
  onSaveProfile,
}) => {
  const [formData, setFormData] = useState<SchoolProfile>({ ...school });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaSekolah.trim()) {
      alert('Nama sekolah tidak boleh kosong.');
      return;
    }
    if (!formData.alamat.trim()) {
      alert('Alamat sekolah tidak boleh kosong.');
      return;
    }

    onSaveProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
            <span className="p-2 bg-blue-100 text-blue-800 rounded-xl">
              <School className="w-5 h-5" />
            </span>
            Menu Profil Sekolah & Pengelola Kantin
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Data identitas sekolah, alamat, dan pejabat pengelola kantin untuk kop laporan keuangan dan tanda tangan digital.
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Perubahan profil berhasil disimpan!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              Identitas Sekolah
            </h3>

            {/* Nama Sekolah */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Sekolah *
              </label>
              <input
                type="text"
                required
                value={formData.namaSekolah}
                onChange={(e) => setFormData({ ...formData, namaSekolah: e.target.value })}
                placeholder="Contoh: SD Muhammadiyah 2 Surabaya"
                className="w-full text-sm font-medium py-2.5 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* NPSN */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NPSN (Nomor Pokok Sekolah Nasional)
              </label>
              <input
                type="text"
                value={formData.npsn || ''}
                onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                placeholder="Contoh: 20532189"
                className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Alamat Lengkap */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Lengkap Sekolah *
              </label>
              <textarea
                rows={3}
                required
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                placeholder="Contoh: Jl. Pucang Anom No. 84, Kec. Gubeng, Kota Surabaya, Jawa Timur 60282"
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Telepon & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Telepon / WhatsApp Sekolah
                </label>
                <input
                  type="text"
                  value={formData.telepon}
                  onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                  placeholder="(031) 5032890"
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Email Sekolah
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="sds.muh2sby@gmail.com"
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Kepala Sekolah */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Kepala Sekolah
              </label>
              <input
                type="text"
                value={formData.kepalaSekolah}
                onChange={(e) => setFormData({ ...formData, kepalaSekolah: e.target.value })}
                placeholder="Nama Kepala Sekolah beserta gelar"
                className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <h3 className="text-sm font-bold text-slate-800 border-t border-slate-100 pt-4 pb-1 flex items-center gap-2">
              <FileSignature className="w-4 h-4 text-emerald-600" />
              Pejabat Penandatangan Laporan Kantin
            </h3>

            {/* Nama Staf & NIP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Staf Penanggung Jawab Kantin *
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaStafKantin}
                  onChange={(e) => setFormData({ ...formData, namaStafKantin: e.target.value })}
                  placeholder="Contoh: Nurul Hidayati, S.Pd."
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIP / NBM / ID Staf
                </label>
                <input
                  type="text"
                  value={formData.nipStafKantin}
                  onChange={(e) => setFormData({ ...formData, nipStafKantin: e.target.value })}
                  placeholder="Contoh: 19870514 201201 2 005"
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Jabatan & Kota */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jabatan Pengelola *
                </label>
                <input
                  type="text"
                  required
                  value={formData.jabatanStaf}
                  onChange={(e) => setFormData({ ...formData, jabatanStaf: e.target.value })}
                  placeholder="Contoh: Kepala Pengelola Kantin Sehat"
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kota Pengesahan *
                </label>
                <input
                  type="text"
                  required
                  value={formData.kotaPengesahan}
                  onChange={(e) => setFormData({ ...formData, kotaPengesahan: e.target.value })}
                  placeholder="Contoh: Surabaya"
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Slogan Kop */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Slogan / Keterangan Tambahan Kantin
              </label>
              <input
                type="text"
                value={formData.catatanKop || ''}
                onChange={(e) => setFormData({ ...formData, catatanKop: e.target.value })}
                placeholder="Contoh: Kantin Ramah Anak, Bersih & Halal"
                className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                Simpan Profil Sekolah
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Official Kop Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              Pratinjau Kop Laporan Resmi
            </h3>

            {/* Document Kop Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
              <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                {formData.namaSekolah || 'NAMA SEKOLAH'}
              </h4>
              <p className="text-[11px] text-slate-600 leading-snug">
                {formData.alamat || 'Alamat Sekolah Belum Diatur'}
              </p>
              <p className="text-[10px] text-slate-500">
                Telp: {formData.telepon || '-'} | Email: {formData.email || '-'}
              </p>
              {formData.npsn && (
                <p className="text-[10px] text-slate-400 font-mono">NPSN: {formData.npsn}</p>
              )}

              {/* Garis Kop Ganda */}
              <div className="pt-2">
                <div className="h-0.5 bg-slate-800 w-full mb-0.5" />
                <div className="h-px bg-slate-400 w-full" />
              </div>
            </div>

            {/* Pengesahan Staf Card Preview */}
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs text-slate-700 space-y-2">
              <span className="font-bold text-[11px] uppercase tracking-wider text-emerald-800 block">
                Format Pengesahan Laporan Digital:
              </span>
              <p className="text-right text-[11px] text-slate-600">
                {formData.kotaPengesahan || 'Kota'}, [Tanggal Hari Ini]
              </p>
              <div className="text-right">
                <p className="font-semibold text-slate-800">{formData.jabatanStaf}</p>
                <div className="inline-block my-2 p-2 bg-white rounded border border-emerald-300 text-center">
                  <span className="text-[9px] font-mono text-emerald-700 block">
                    [ QR Code Digital Signature ]
                  </span>
                </div>
                <p className="font-bold text-slate-900">{formData.namaStafKantin}</p>
                <p className="text-[11px] text-slate-500 font-mono">
                  NIP/NBM: {formData.nipStafKantin || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
