import { Injectable, Logger } from '@nestjs/common';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import { Loan } from '../loan/loan.entity';
import { formatCurrency, formatDate } from '../common/date';

// Library pihak ketiga PDFMAKE dimuat dengan gaya CommonJS karena berkas
// printer-nya tidak menyediakan default export bergaya ES Module.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PdfPrinter = require('pdfmake/src/printer');

/**
 * Definisi font bawaan standar PDF (Standard 14 Fonts).
 *
 * Font ini sudah tertanam di dalam spesifikasi PDF sehingga tidak perlu
 * menyertakan berkas .ttf apa pun. Pilihan ini membuat image Docker tetap
 * ramping dan menghilangkan risiko gagal cetak akibat font tidak ditemukan.
 */
const STANDARD_FONTS = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

/** Ringkasan angka yang dicetak pada bagian atas laporan. */
export interface ReportSummary {
  totalLoans: number;
  ongoing: number;
  returned: number;
  totalFine: number;
}

/**
 * PdfService — kelas layanan pembuat berkas PDF.
 *
 * Kelas ini membungkus library pihak ketiga PDFMAKE. Bagian aplikasi lain
 * cukup memanggil {@link buildLoanReport} dan menerima Buffer PDF yang siap
 * dikirim ke peramban, tanpa perlu mengetahui detail penyusunan dokumen
 * (penerapan prinsip abstraksi).
 */
@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private readonly printer = new PdfPrinter(STANDARD_FONTS);

  /**
   * Menyusun dan mencetak Laporan Peminjaman Buku dalam format PDF.
   *
   * @param loans   Transaksi peminjaman pada periode terpilih.
   * @param summary Angka ringkasan yang dicetak di bagian atas laporan.
   * @param from    Tanggal awal periode laporan.
   * @param to      Tanggal akhir periode laporan.
   * @returns Buffer berisi berkas PDF yang sudah jadi.
   */
  async buildLoanReport(
    loans: Loan[],
    summary: ReportSummary,
    from: Date,
    to: Date,
  ): Promise<Buffer> {
    const definition = this.buildDocDefinition(loans, summary, from, to);
    const buffer = await this.render(definition);

    this.logger.log(
      `Laporan PDF dibuat: ${loans.length} transaksi, ${buffer.length} byte`,
    );
    return buffer;
  }

  /**
   * Menyusun struktur dokumen PDF (tanpa mencetaknya).
   *
   * Dipisahkan dari proses pencetakan agar mudah diuji dan diubah tampilannya.
   */
  private buildDocDefinition(
    loans: Loan[],
    summary: ReportSummary,
    from: Date,
    to: Date,
  ): TDocumentDefinitions {
    // Baris kepala tabel.
    const tableBody: unknown[][] = [
      [
        { text: 'No', style: 'th' },
        { text: 'Kode', style: 'th' },
        { text: 'Peminjam', style: 'th' },
        { text: 'Judul Buku', style: 'th' },
        { text: 'Pinjam', style: 'th' },
        { text: 'Jatuh Tempo', style: 'th' },
        { text: 'Kembali', style: 'th' },
        { text: 'Status', style: 'th' },
        { text: 'Denda', style: 'th' },
      ],
    ];

    // Pemrograman terstruktur: perulangan membangun baris tabel satu per satu.
    let number = 1;
    for (const loan of loans) {
      tableBody.push([
        { text: String(number), alignment: 'center' },
        loan.code,
        loan.borrowerName,
        loan.book?.title ?? '-',
        formatDate(loan.borrowedAt),
        formatDate(loan.dueAt),
        formatDate(loan.returnedAt),
        { text: loan.displayStatus(), alignment: 'center' },
        { text: formatCurrency(loan.fine), alignment: 'right' },
      ]);
      number += 1;
    }

    // Bila tidak ada data, tampilkan satu baris keterangan kosong.
    if (loans.length === 0) {
      tableBody.push([
        {
          text: 'Tidak ada transaksi pada periode ini.',
          colSpan: 9,
          alignment: 'center',
          italics: true,
          margin: [0, 8, 0, 8],
        },
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {},
      ]);
    }

    return {
      pageSize: 'A4',
      pageOrientation: 'landscape',
      pageMargins: [30, 70, 30, 45],
      defaultStyle: { font: 'Helvetica', fontSize: 9 },

      header: {
        margin: [30, 20, 30, 0],
        stack: [
          { text: 'PERPUSTAKAAN SIPERPUS', style: 'institution' },
          { text: 'Laporan Transaksi Peminjaman Buku', style: 'subtitle' },
          {
            canvas: [
              {
                type: 'line',
                x1: 0,
                y1: 6,
                x2: 782,
                y2: 6,
                lineWidth: 1.5,
                lineColor: '#0d6efd',
              },
            ],
          },
        ],
      },

      footer: (currentPage: number, pageCount: number) => ({
        margin: [30, 10, 30, 0],
        columns: [
          {
            text: `Dicetak pada ${formatDate(new Date())}`,
            fontSize: 8,
            color: '#6c757d',
          },
          {
            text: `Halaman ${currentPage} dari ${pageCount}`,
            alignment: 'right',
            fontSize: 8,
            color: '#6c757d',
          },
        ],
      }),

      content: [
        {
          margin: [0, 0, 0, 10],
          columns: [
            {
              width: '50%',
              text: [
                { text: 'Periode Laporan\n', style: 'label' },
                {
                  text: `${formatDate(from)} s.d. ${formatDate(to)}`,
                  bold: true,
                },
              ],
            },
            {
              width: '50%',
              alignment: 'right',
              text: [
                { text: 'Jumlah Transaksi\n', style: 'label' },
                { text: `${summary.totalLoans} transaksi`, bold: true },
              ],
            },
          ],
        },

        {
          margin: [0, 0, 0, 12],
          table: {
            widths: ['*', '*', '*', '*'],
            body: [
              [
                this.statBox('Total Transaksi', String(summary.totalLoans)),
                this.statBox('Sedang Dipinjam', String(summary.ongoing)),
                this.statBox('Sudah Kembali', String(summary.returned)),
                this.statBox('Total Denda', formatCurrency(summary.totalFine)),
              ],
            ],
          },
          layout: 'noBorders',
        },

        {
          // Ukuran huruf tabel sengaja dibuat lebih kecil daripada teks lain
          // agar kode transaksi dan tanggal muat dalam satu baris penuh.
          fontSize: 8,
          table: {
            headerRows: 1,
            widths: [20, 88, 85, '*', 66, 66, 66, 62, 52],
            body: tableBody,
          },
          layout: {
            fillColor: (rowIndex: number) => {
              if (rowIndex === 0) {
                return '#0d6efd';
              }
              return rowIndex % 2 === 0 ? '#f8f9fa' : null;
            },
            hLineColor: () => '#dee2e6',
            vLineColor: () => '#dee2e6',
          },
        },

        {
          margin: [0, 30, 0, 0],
          columns: [
            { width: '*', text: '' },
            {
              width: 200,
              alignment: 'center',
              stack: [
                { text: 'Mengetahui,', fontSize: 9 },
                { text: 'Kepala Perpustakaan', fontSize: 9 },
                { text: '\n\n\n', fontSize: 9 },
                { text: '(..................................)', fontSize: 9 },
              ],
            },
          ],
        },
      ],

      styles: {
        institution: { fontSize: 14, bold: true, color: '#0d6efd' },
        subtitle: { fontSize: 10, color: '#495057' },
        th: { bold: true, color: '#ffffff', fontSize: 8, alignment: 'center' },
        label: { fontSize: 8, color: '#6c757d' },
      },
    } as TDocumentDefinitions;
  }

  /**
   * Membentuk satu kotak statistik untuk bagian ringkasan laporan.
   *
   * @param label Keterangan angka.
   * @param value Angka yang ditampilkan.
   */
  private statBox(label: string, value: string) {
    return {
      stack: [
        { text: label, fontSize: 8, color: '#6c757d' },
        { text: value, fontSize: 14, bold: true, color: '#212529' },
      ],
      margin: [4, 6, 4, 6],
    };
  }

  /**
   * Menjalankan proses pencetakan dan mengumpulkan hasilnya menjadi Buffer.
   *
   * PDFMake bekerja dengan aliran data (stream), sehingga potongan data
   * ditampung dulu ke dalam array sebelum digabung menjadi satu Buffer utuh.
   *
   * @param definition Struktur dokumen yang akan dicetak.
   */
  private render(definition: TDocumentDefinitions): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = this.printer.createPdfKitDocument(definition);
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (error: Error) => reject(error));

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
