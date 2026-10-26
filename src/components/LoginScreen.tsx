import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Store,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  KeyRound,
  FileSpreadsheet,
  Receipt,
  Tag,
} from 'lucide-react';
import { storageService, defaultAuthCredentials } from '../services/storageService';
import { SchoolProfile } from '../types';

interface LoginScreenProps {
  school: SchoolProfile;
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ school, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      const result = storageService.login(username, password, rememberMe);
      setIsLoading(false);

      if (result.success) {
        onLoginSuccess();
      } else {
        setErrorMsg(result.message);
      }
    }, 250);
  };

  const handleFillDefault = () => {
    const creds = storageService.getAuthCredentials();
    setUsername(creds.username || defaultAuthCredentials.username);
    setPassword(creds.password || defaultAuthCredentials.password);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Decorative Background Elements */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar / Institutional Badge */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between text-slate-300 py-2 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300">
            <Store className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold tracking-wide text-slate-300">
            {school.namaSekolah || 'SD Muhammadiyah 2 Surabaya'}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Akses Terproteksi</span>
        </div>
      </header>

      {/* Central Login Card Container */}
      <main className="w-full max-w-md mx-auto my-auto relative z-10 py-6">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
          {/* Logo & School Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 mb-3 ring-4 ring-blue-50">
              <Store className="w-7 h-7" />
            </div>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Kantin<span className="text-blue-600">Ku</span>
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Kantin Sekolah
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
              Silakan masukkan username dan kata sandi untuk mengakses sistem pengelolaan kantin.
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1 font-medium leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Username Pengguna
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: admin"
                  autoComplete="username"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30"
                />
                <span className="text-xs text-slate-600 font-medium">
                  Ingat sesi di perangkat ini
                </span>
              </label>

              <button
                type="button"
                onClick={handleFillDefault}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
              >
                <KeyRound className="w-3 h-3" />
                <span>Akun Bawaan</span>
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-linear-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memeriksa Akses...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Default Credentials Card */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100/80 flex items-start justify-between gap-3">
              <div className="text-[11px] text-slate-600 min-w-0">
                <p className="font-bold text-blue-950 mb-0.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  Kredensial Login Bawaan:
                </p>
                <p className="font-mono text-[11px] text-slate-700">
                  User: <span className="font-bold text-blue-900">admin</span> &bull; Pass:{' '}
                  <span className="font-bold text-blue-900">kantin123</span>
                </p>
              </div>

              <button
                type="button"
                onClick={handleFillDefault}
                className="shrink-0 text-[10px] font-bold px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-xs"
              >
                Isi Otomatis
              </button>
            </div>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-slate-800/50 backdrop-blur-xs border border-slate-700/50 text-slate-300">
            <Receipt className="w-4 h-4 mx-auto mb-1 text-blue-400" />
            <p className="text-[10px] font-semibold truncate">Kas & POS</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/50 backdrop-blur-xs border border-slate-700/50 text-slate-300">
            <FileSpreadsheet className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
            <p className="text-[10px] font-semibold truncate">Laporan & TTD</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/50 backdrop-blur-xs border border-slate-700/50 text-slate-300">
            <Tag className="w-4 h-4 mx-auto mb-1 text-amber-400" />
            <p className="text-[10px] font-semibold truncate">Label Rak</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl mx-auto text-center text-xs text-slate-400 py-3 relative z-10 border-t border-slate-800/60 mt-auto">
        <p className="font-medium text-slate-300">
          KantinKu &copy; {new Date().getFullYear()} — {school.namaSekolah}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {school.alamat}
        </p>
      </footer>
    </div>
  );
};
