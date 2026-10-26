import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { SchoolProfile } from '../types';
import { formatRupiah, formatTanggalIndo } from './formatters';

export interface ReportItemRow {
  no: number;
  tanggal: string;
  keterangan: string;
  kategori: string;
  penerimaan: number;
  pengeluaran: number;
  laba: number;
}

export interface ExportPdfParams {
  title: string;
  subtitle: string;
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

export async function exportReportToPdf(params: ExportPdfParams): Promise<void> {
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

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Kop Surat Sekolah
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(school.namaSekolah.toUpperCase(), pageWidth / 2, 16, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(school.alamat, pageWidth / 2, 22, { align: 'center' });
  doc.text(
    `Telp: ${school.telepon} | Email: ${school.email} | NPSN: ${school.npsn || '-'}`,
    pageWidth / 2,
    27,
    { align: 'center' }
  );

  // Garis Kop Ganda
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.8);
  doc.line(14, 31, pageWidth - 14, 31);
  doc.setLineWidth(0.2);
  doc.line(14, 32.5, pageWidth - 14, 32.5);

  // 2. Judul Laporan
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(title.toUpperCase(), pageWidth / 2, 41, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const periodeText =
    customPeriode ||
    (startDate === endDate
      ? `Tanggal: ${formatTanggalIndo(startDate)}`
      : `Periode: ${formatTanggalIndo(startDate)} s.d. ${formatTanggalIndo(endDate)}`);
  doc.text(periodeText, pageWidth / 2, 46, { align: 'center' });

  // 3. Ringkasan Finansial Card
  const boxY = 51;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, boxY, pageWidth - 28, 18, 2, 2, 'FD');

  const colWidth = (pageWidth - 28) / 3;

  // Penerimaan
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL PENERIMAAN / OMZET', 14 + colWidth * 0.5, boxY + 6, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text(formatRupiah(totalPenerimaan), 14 + colWidth * 0.5, boxY + 13, { align: 'center' });

  // Pengeluaran
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL BIAYA / PENGELUARAN', 14 + colWidth * 1.5, boxY + 6, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(239, 68, 68); // red-500
  doc.text(formatRupiah(totalPengeluaran), 14 + colWidth * 1.5, boxY + 13, { align: 'center' });

  // Laba Bersih
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('ESTIMASI LABA BERSIH', 14 + colWidth * 2.5, boxY + 6, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const labaColor = totalLabaBersih >= 0 ? [5, 150, 105] : [220, 38, 38];
  doc.setTextColor(labaColor[0], labaColor[1], labaColor[2]);
  doc.text(formatRupiah(totalLabaBersih), 14 + colWidth * 2.5, boxY + 13, { align: 'center' });

  // 4. Tabel Detail
  const tableData = rows.map((r) => [
    r.no.toString(),
    formatTanggalIndo(r.tanggal),
    r.keterangan,
    r.kategori,
    formatRupiah(r.penerimaan),
    formatRupiah(r.pengeluaran),
    formatRupiah(r.laba),
  ]);

  // Tambahkan baris total
  tableData.push([
    '',
    'TOTAL KESELURUHAN',
    '',
    '',
    formatRupiah(totalPenerimaan),
    formatRupiah(totalPengeluaran),
    formatRupiah(totalLabaBersih),
  ]);

  autoTable(doc, {
    startY: boxY + 23,
    head: [customHeaders || ['No', 'Tanggal', 'Keterangan', 'Kategori', 'Penerimaan', 'Pengeluaran', 'Laba Bersih']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 64, 175], // blue-700
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 26 },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 26, halign: 'right' },
      6: { cellWidth: 26, halign: 'right' },
    },
    didParseCell: (data) => {
      // Style the last total row
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249];
      }
    },
    margin: { left: 14, right: 14, bottom: 45 },
  });

  // 5. Tanda Tangan Digital dengan QR Code
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastTableY = (doc as any).lastAutoTable?.finalY || 180;
  let signatureY = lastTableY + 12;

  // Cek jika halaman tidak cukup muat tanda tangan, buat halaman baru
  if (signatureY > doc.internal.pageSize.getHeight() - 48) {
    doc.addPage();
    signatureY = 20;
  }

  const todayIndo = formatTanggalIndo(new Date().toISOString().split('T')[0]);
  const signColX = pageWidth - 75;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(todayIndo, signColX + 30, signatureY, { align: 'center' });
  doc.text('Pengesahan Dokumen Digital', signColX + 30, signatureY + 4.5, { align: 'center' });
  doc.text(school.namaSekolah, signColX + 30, signatureY + 8.5, { align: 'center' });

  // Generate QR Code data URL
  const qrPayload = JSON.stringify({
    aplikasi: 'KantinKu Digital Signature',
    sekolah: school.namaSekolah,
    dokumen: title,
    periode: `${startDate} s.d ${endDate}`,
    tanggalSah: todayIndo,
    kodeVerifikasi: verificationCode,
    status: 'TERVERIFIKASI DIGITAL KANTIN SEKOLAH',
  });

  try {
    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 140,
      color: {
        dark: '#1e40af', // blue-800
        light: '#ffffff',
      },
    });

    const qrSize = 22;
    doc.addImage(qrDataUrl, 'PNG', signColX + 19, signatureY + 11, qrSize, qrSize);

    // Keterangan QR
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Scan untuk verifikasi keabsahan', signColX + 30, signatureY + 36, { align: 'center' });
    doc.text(`Kode: ${verificationCode.slice(0, 16)}`, signColX + 30, signatureY + 39, { align: 'center' });
  } catch {
    // Fallback jika QR bermasalah
    doc.rect(signColX + 10, signatureY + 11, 40, 20);
    doc.text('[Tanda Tangan Digital]', signColX + 30, signatureY + 22, { align: 'center' });
  }

  // Pengesahan Resmi Sekolah (tanpa nama staf personal)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(school.namaSekolah, signColX + 30, signatureY + 45, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Kantin Sekolah Terverifikasi', signColX + 30, signatureY + 49, { align: 'center' });

  // Catatan Kaki Dokumen
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  const footerText = `Dokumen ini diterbitkan secara elektronik oleh Sistem Informasi KantinKu ${school.namaSekolah}. Valid tanpa cap basah.`;
  doc.text(footerText, 14, doc.internal.pageSize.getHeight() - 8);

  // Unduh File
  const filename = `Laporan_Kantin_${startDate}_sd_${endDate}.pdf`;
  doc.save(filename);
}
