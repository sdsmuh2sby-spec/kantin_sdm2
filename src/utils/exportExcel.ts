import * as XLSX from 'xlsx';
import { SchoolProfile } from '../types';
import { ReportItemRow } from './exportPdf';
import { formatTanggalIndo } from './formatters';

export interface ExportExcelParams {
  title: string;
  startDate: string;
  endDate: string;
  school: SchoolProfile;
  rows: ReportItemRow[];
  totalPenerimaan: number;
  totalPengeluaran: number;
  totalLabaBersih: number;
  verificationCode: string;
  customHeaders?: string[];
  customPeriode?: string;
}

export function exportReportToExcel(params: ExportExcelParams): void {
  const {
    title,
    startDate,
    endDate,
    school,
    rows,
    totalPenerimaan,
    totalPengeluaran,
    totalLabaBersih,
    verificationCode,
    customHeaders,
    customPeriode,
  } = params;

  // Header rows
  const worksheetData: (string | number)[][] = [
    [school.namaSekolah.toUpperCase()],
    [school.alamat],
    [`Telp: ${school.telepon} | Email: ${school.email}`],
    [],
    [title.toUpperCase()],
    [
      `Periode: ${
        customPeriode ||
        (startDate === endDate
          ? formatTanggalIndo(startDate)
          : `${formatTanggalIndo(startDate)} s.d. ${formatTanggalIndo(endDate)}`)
      }`,
    ],
    [],
    ['RINGKASAN KEUANGAN'],
    ['Total Penerimaan / Omzet', totalPenerimaan],
    ['Total Pengeluaran / Biaya', totalPengeluaran],
    ['Laba Bersih Kantin', totalLabaBersih],
    [],
    customHeaders || [
      'No',
      'Tanggal',
      'Keterangan',
      'Kategori',
      'Penerimaan (Rp)',
      'Pengeluaran (Rp)',
      'Laba Bersih (Rp)',
    ],
  ];

  // Append data rows
  rows.forEach((r) => {
    worksheetData.push([
      r.no,
      formatTanggalIndo(r.tanggal),
      r.keterangan,
      r.kategori,
      r.penerimaan,
      r.pengeluaran,
      r.laba,
    ]);
  });

  // Total summary row
  worksheetData.push([
    '',
    'TOTAL',
    '',
    '',
    totalPenerimaan,
    totalPengeluaran,
    totalLabaBersih,
  ]);

  worksheetData.push([]);
  worksheetData.push(['PENGESAHAN DOKUMEN DIGITAL']);
  worksheetData.push([`Kota & Tanggal: ${school.kotaPengesahan}, ${formatTanggalIndo(new Date().toISOString().split('T')[0])}`]);
  worksheetData.push(['Penanggung Jawab: Pengelola Kantin']);
  worksheetData.push([`Kode Verifikasi Tanda Tangan: ${verificationCode}`]);
  worksheetData.push(['Status: TERVERIFIKASI DIGITAL KANTIN SEKOLAH']);

  const ws = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 18 }, // Tanggal
    { wch: 42 }, // Keterangan
    { wch: 22 }, // Kategori
    { wch: 18 }, // Penerimaan
    { wch: 18 }, // Pengeluaran
    { wch: 18 }, // Laba Bersih
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Kantin');

  const filename = `Laporan_Kantin_${startDate}_sd_${endDate}.xlsx`;
  XLSX.writeFile(wb, filename);
}
