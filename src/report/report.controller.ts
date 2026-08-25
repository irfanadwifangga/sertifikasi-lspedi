import { Controller, Get, Post, Query, Render, Res } from '@nestjs/common';
import { Response } from 'express';
import { LoanService } from '../loan/loan.service';
import { MailService } from '../mail/mail.service';
import { PdfService } from './pdf.service';
import { addDays, formatCurrency, formatIsoDate } from '../common/date';

/**
 * ReportController — pengendali HALAMAN 7 aplikasi (Laporan & Cetak).
 *
 * Halaman ini menjadi tempat berkumpulnya dua library pihak ketiga:
 *  - PDFMAKE    untuk mencetak Laporan Peminjaman dalam format PDF.
 *  - NODEMAILER untuk mengirim surel pengingat massal kepada peminjam
 *               yang terlambat mengembalikan buku.
 */
@Controller('reports')
export class ReportController {
  constructor(
    private readonly loanService: LoanService,
    private readonly pdfService: PdfService,
    private readonly mailService: MailService,
  ) {}

  /**
   * HALAMAN 7 — Laporan Peminjaman.
   *
   * Menampilkan pratinjau laporan sesuai periode yang dipilih, lengkap dengan
   * tombol cetak PDF dan tombol kirim pengingat.
   *
   * @param from    Tanggal awal periode (format YYYY-MM-DD).
   * @param to      Tanggal akhir periode (format YYYY-MM-DD).
   * @param success Pesan notifikasi hasil operasi sebelumnya.
   */
  @Get()
  @Render('report/index')
  async index(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('success') success?: string,
  ) {
    const { startDate, endDate } = this.resolvePeriod(from, to);

    const loans = await this.loanService.findByPeriod(startDate, endDate);
    const overdue = await this.loanService.findOverdue();
    const summary = this.summarize(loans);

    return {
      title: 'Laporan Peminjaman',
      menu: 'reports',
      loans: loans.map((loan) => loan.toView()),
      summary,
      totalFineFormatted: formatCurrency(summary.totalFine),
      overdueCount: overdue.length,
      from: formatIsoDate(startDate),
      to: formatIsoDate(endDate),
      success,
    };
  }

  /**
   * Mencetak laporan menjadi berkas PDF dan mengunduhnya ke peramban.
   *
   * Respons dikirim sebagai `application/pdf` dengan header
   * `Content-Disposition: attachment`, sehingga peramban langsung menawarkan
   * kotak dialog penyimpanan berkas.
   */
  @Get('pdf')
  async downloadPdf(
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const { startDate, endDate } = this.resolvePeriod(from, to);

    const loans = await this.loanService.findByPeriod(startDate, endDate);
    const summary = this.summarize(loans);

    const file = await this.pdfService.buildLoanReport(
      loans,
      summary,
      startDate,
      endDate,
    );

    const fileName = `laporan-peminjaman-${formatIsoDate(startDate)}-sd-${formatIsoDate(endDate)}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': file.length,
    });
    return res.end(file);
  }

  /**
   * Mengirim surel pengingat kepada SELURUH peminjam yang terlambat.
   */
  @Post('send-reminders')
  async sendReminders(@Res() res: Response) {
    const overdue = await this.loanService.findOverdue();

    if (overdue.length === 0) {
      return res.redirect(
        '/reports?success=' +
          encodeURIComponent(
            'Tidak ada peminjam yang terlambat. Tidak ada surel yang dikirim.',
          ),
      );
    }

    const sent = await this.mailService.sendOverdueReminders(overdue);

    return res.redirect(
      '/reports?success=' +
        encodeURIComponent(
          `${sent} dari ${overdue.length} surel pengingat berhasil dikirim. Buka http://localhost:8025 untuk melihat kotak masuk.`,
        ),
    );
  }

  // ----- Method bantu privat ------------------------------------------------

  /**
   * Menentukan rentang periode laporan.
   *
   * Bila pengguna belum memilih periode, sistem memakai nilai bawaan
   * 30 hari terakhir sampai hari ini.
   *
   * @param from Teks tanggal awal dari query string.
   * @param to   Teks tanggal akhir dari query string.
   */
  private resolvePeriod(
    from?: string,
    to?: string,
  ): { startDate: Date; endDate: Date } {
    const today = new Date();

    const startDate = from ? new Date(`${from}T00:00:00`) : addDays(today, -30);
    const endDate = to ? new Date(`${to}T23:59:59`) : today;

    // Jaga-jaga bila pengguna membalik urutan tanggal.
    if (startDate > endDate) {
      return { startDate: endDate, endDate: startDate };
    }
    return { startDate, endDate };
  }

  /**
   * Menghitung ringkasan angka dari sekumpulan transaksi.
   *
   * @param loans Transaksi pada periode terpilih.
   */
  private summarize(loans: { status: string; fine: number }[]) {
    let ongoing = 0;
    let returned = 0;
    let totalFine = 0;

    for (const loan of loans) {
      if (loan.status === 'Dipinjam') {
        ongoing += 1;
      } else {
        returned += 1;
      }
      totalFine += loan.fine;
    }

    return { totalLoans: loans.length, ongoing, returned, totalFine };
  }
}
