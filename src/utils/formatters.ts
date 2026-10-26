/**
 * Utilities for formatting Currency, Indonesian Dates, and Numbers
 */

export const formatRupiah = (value: number | string | undefined | null): string => {
  const num = typeof value === 'string' ? parseFloat(value) || 0 : value ?? 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatNumber = (value: number | undefined | null): string => {
  const num = value ?? 0;
  return new Intl.NumberFormat('id-ID').format(num);
};

export const MONTH_NAMES_INDO = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const formatBulanTahunIndo = (yearMonth: string): string => {
  if (!yearMonth) return '-';
  const parts = yearMonth.split('-');
  if (parts.length >= 2) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${MONTH_NAMES_INDO[monthIdx]} ${year}`;
    }
  }
  return yearMonth;
};

export const formatTanggalIndo = (dateStr: string): string => {
  if (!dateStr) return '-';
  if (dateStr.startsWith('Tahun ') || MONTH_NAMES_INDO.some((m) => dateStr.includes(m))) {
    return dateStr;
  }
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date);
    }
    if (parts.length === 2) {
      return formatBulanTahunIndo(dateStr);
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
};

export const formatTanggalSingkat = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getMonthStartEnd = (yearMonth?: string): { start: string; end: string } => {
  const now = new Date();
  const y = yearMonth ? parseInt(yearMonth.split('-')[0], 10) : now.getFullYear();
  const m = yearMonth ? parseInt(yearMonth.split('-')[1], 10) - 1 : now.getMonth();
  
  const startDate = new Date(y, m, 1);
  const endDate = new Date(y, m + 1, 0);

  const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-01`;
  const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
  
  return { start: startStr, end: endStr };
};
