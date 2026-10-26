import React, { useState, useEffect } from 'react';
import {
  School,
  MapPin,
  Save,
  CheckCircle2,
  Building,
  Eye,
  EyeOff,
  Lock,
  User,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Shield,
  UserCheck,
} from 'lucide-react';
import { SchoolProfile } from '../types';
import { storageService } from '../services/storageService';

interface SchoolProfileMenuProps {
  school: SchoolProfile;
  onSaveProfile: (profile: SchoolProfile) => void;
  onCredentialsUpdated?: () => void;
}

export const SchoolProfileMenu: React.FC<SchoolProfileMenuProps> = ({
  school,
  onSaveProfile,
  onCredentialsUpdated,
}) => {
  // 1. School Data State (2 fields: Nama Sekolah & Alamat)
  const [namaSekolah, setNamaSekolah] = useState(school.namaSekolah || '');
  const [alamat, setAlamat] = useState(school.alamat || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // 2. Auth Credentials State (Username & Password editing)
  const [currentUsername, setCurrentUsername] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Load existing credentials on mount
  useEffect(() => {
    const creds = storageService.getAuthCredentials();
    setCurrentUsername(creds.username || 'admin');
    setEditUsername(creds.username || 'admin');
  }, []);

  // Handler for Saving School Profile
  const handleSubmitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');

    if (!namaSekolah.trim()) {
      setProfileError('Nama sekolah tidak boleh kosong.');
      return;
    }
    if (!alamat.trim()) {
      setProfileError('Alamat sekolah tidak boleh kosong.');
      return;
    }

    onSaveProfile({
      ...school,
      namaSekolah: namaSekolah.trim(),
      alamat: alamat.trim(),
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  // Handler for Updating Username & Password
  const handleSubmitCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!currentPassword) {
      setAuthError('Masukkan kata sandi saat ini untuk verifikasi keamanan.');
      return;
    }

    if (!editUsername.trim() || editUsername.trim().length < 3) {
      setAuthError('Username tidak boleh kosong (minimal 3 karakter).');
      return;
    }

    // Check if updating password
    if (newPassword || confirmPassword) {
      if (newPassword.length < 4) {
        setAuthError('Kata sandi baru minimal 4 karakter.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setAuthError('Konfirmasi kata sandi baru tidak cocok.');
        return;
      }
    }

    const result = storageService.changePassword(
      currentPassword,
      newPassword ? newPassword : undefined,
      editUsername.trim()
    );

    if (result.success) {
      setAuthSuccess(result.message);
      setCurrentUsername(editUsername.trim());
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (onCredentialsUpdated) onCredentialsUpdated();

      setTimeout(() => {
        setAuthSuccess('');
      }, 4000);
    } else {
      setAuthError(result.message);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
            <span className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
              <School className="w-5 h-5" />
            </span>
            Profil Sekolah & Pengaturan Akun
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Atur identitas resmi sekolah dan kelola username serta password untuk keamanan akses ke aplikasi web KantinKu.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl">
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Akun: <strong className="text-blue-900">{currentUsername}</strong></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Section */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Data Profil Sekolah (2 Fields: Nama & Alamat) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  1. Form Data Sekolah
                </h3>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                2 Bidang Informasi
              </span>
            </div>

            {profileError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <div className="flex-1 font-medium">{profileError}</div>
              </div>
            )}

            {savedSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <div className="flex-1 font-medium">Profil sekolah berhasil diperbarui dan disimpan!</div>
              </div>
            )}

            <form onSubmit={handleSubmitProfile} className="space-y-4">
              {/* Field 1: Nama Sekolah */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  1. Nama Sekolah <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <School className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={namaSekolah}
                    onChange={(e) => setNamaSekolah(e.target.value)}
                    placeholder="Contoh: SD Muhammadiyah 2 Surabaya"
                    className="w-full text-sm font-medium py-2.5 pl-10 pr-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-hidden transition-all bg-slate-50/40 focus:bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Nama sekolah akan tercantum pada struk kasir, kop dokumen, dan label harga.
                </p>
              </div>

              {/* Field 2: Alamat Sekolah */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  2. Alamat Sekolah <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3.5 pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    placeholder="Contoh: Jl. Pucang Anom No. 84, Kec. Gubeng, Kota Surabaya, Jawa Timur 60282"
                    className="w-full text-xs font-medium py-2.5 pl-10 pr-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-hidden transition-all bg-slate-50/40 focus:bg-white leading-relaxed"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Alamat lengkap lokasi sekolah atau unit kantin.
                </p>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow transition-all active:scale-[0.99] cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Simpan Data Sekolah
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Pengaturan Username & Password Akses Web */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-blue-50 text-blue-600">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    2. Edit Username & Password Akses Web
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Ubah akun pengguna atau kata sandi untuk login ke web KantinKu
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Akses Terproteksi
              </span>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <div className="flex-1 font-medium">{authError}</div>
              </div>
            )}

            {authSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <div className="flex-1 font-medium">{authSuccess}</div>
              </div>
            )}

            <form onSubmit={handleSubmitCredentials} className="space-y-4">
              {/* Username Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username Pengguna <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="Contoh: admin atau kantin"
                    className="w-full text-sm font-medium py-2.5 pl-10 pr-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-hidden transition-all bg-slate-50/40 focus:bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Username yang digunakan untuk masuk ke sistem (saat ini: <strong>{currentUsername}</strong>).
                </p>
              </div>

              {/* Current Password (Security Verification) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kata Sandi Saat Ini <span className="text-rose-500">*</span>
                  <span className="font-normal text-slate-400 ml-1">(Verifikasi Keamanan)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan kata sandi yang sedang aktif"
                    className="w-full text-sm font-medium py-2.5 pl-10 pr-11 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-hidden transition-all bg-slate-50/40 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label={showCurrentPass ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Diperlukan setiap kali memperbarui username atau kata sandi demi keamanan.
                </p>
              </div>

              {/* New Password & Confirmation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kata Sandi Baru <span className="font-normal text-slate-400">(Opsional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Shield className="w-4 h-4" />
                    </div>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 4 karakter"
                      className="w-full text-xs sm:text-sm font-medium py-2.5 pl-10 pr-10 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-hidden transition-all bg-slate-50/40 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Kosongkan jika hanya ingin mengganti username.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ulangi Sandi Baru
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Shield className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang sandi baru"
                      className="w-full text-xs sm:text-sm font-medium py-2.5 pl-10 pr-10 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-hidden transition-all bg-slate-50/40 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Pastikan kedua sandi baru sama persis.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow transition-all active:scale-[0.99] cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  Perbarui Username & Password
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Previews & Account Status */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card: Account Security Status */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Status Akun & Akses Web
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                Terproteksi
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Username Login:</span>
                <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {currentUsername}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Peran Akun:</span>
                <span className="font-semibold text-slate-700">Pengelola Kantin</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Status Sesi:</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Aktif & Masuk
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Kredensial di atas diperlukan setiap kali pengguna membuka aplikasi web di browser.
            </p>
          </div>

          {/* Card: Pratinjau Identitas Sekolah */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Eye className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Pratinjau Identitas Sekolah
              </h3>
            </div>

            <div className="p-5 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 rounded-2xl border border-blue-100/80 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <School className="w-6 h-6" />
              </div>

              <div>
                <span className="inline-block px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold uppercase rounded-full mb-1">
                  Kantin Sekolah
                </span>
                <h4 className="font-extrabold text-base text-slate-900 leading-tight">
                  {namaSekolah || 'NAMA SEKOLAH BELUM DIATUR'}
                </h4>
              </div>

              <div className="pt-1 flex items-start justify-center gap-1.5 text-slate-600 text-xs">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <p className="leading-snug max-w-xs">
                  {alamat || 'Alamat lengkap sekolah belum diatur'}
                </p>
              </div>
            </div>

            {/* Preview on Receipt Header */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Tampilan Pada Header Struk Kasir & Dokumen:
              </p>
              <div className="bg-white p-3.5 rounded-lg border border-dashed border-slate-300 text-center font-mono text-[11px] text-slate-700 space-y-1">
                <p className="font-bold text-xs text-slate-900 uppercase">
                  {namaSekolah || 'NAMA SEKOLAH'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {alamat || 'Alamat Sekolah'}
                </p>
                <div className="border-b border-slate-200 my-1" />
                <p className="text-[9px] text-slate-400 italic">
                  *** KANTIN KU - STRUK PEMBELIAN ***
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
