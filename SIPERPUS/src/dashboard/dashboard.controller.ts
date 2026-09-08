import { Controller, Get, Render } from '@nestjs/common';
import { BookService } from '../book/book.service';
import { LoanService } from '../loan/loan.service';

/**
 * DashboardController — pengendali HALAMAN 1 aplikasi (halaman muka).
 *
 * Controller ini tidak memiliki logika bisnis sendiri; ia hanya merangkai
 * hasil dari {@link BookService} dan {@link LoanService} menjadi satu
 * tampilan ringkasan. Ini contoh nyata prinsip REUSABILITY: service yang sama
 * dipakai ulang oleh beberapa halaman berbeda.
 */
@Controller()
export class DashboardController {
  constructor(
    private readonly bookService: BookService,
    private readonly loanService: LoanService,
  ) {}

  /**
   * HALAMAN 1 — Dashboard.
   *
   * Menyajikan kartu statistik, grafik batang peminjaman per bulan,
   * grafik lingkaran komposisi koleksi per kategori, serta daftar
   * transaksi terbaru.
   */
  @Get()
  @Render('dashboard')
  async index() {
    // Seluruh kueri dijalankan serentak agar halaman lebih cepat dimuat.
    const [bookSummary, loanSummary, byCategory, byMonth, recentLoans] =
      await Promise.all([
        this.bookService.summarize(),
        this.loanService.summarize(),
        this.bookService.countByCategory(),
        this.loanService.countByMonth(),
        this.loanService.findRecent(5),
      ]);

    return {
      title: 'Dashboard',
      menu: 'dashboard',
      bookSummary,
      loanSummary,
      recentLoans: recentLoans.map((loan) => loan.toView()),
      currentYear: new Date().getFullYear(),

      // Data grafik dikirim sebagai teks JSON supaya dapat langsung
      // dibaca oleh Chart.js di sisi peramban.
      categoryLabels: JSON.stringify(byCategory.map((row) => row.category)),
      categoryData: JSON.stringify(byCategory.map((row) => row.total)),
      monthlyData: JSON.stringify(byMonth),
    };
  }
}
