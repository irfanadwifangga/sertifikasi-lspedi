import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { Loan } from '../loan/loan.entity';
import { formatCurrency, formatDate } from '../common/date';
import { errorStack } from '../common/error';

/**
 * MailService — kelas layanan pengiriman surel.
 *
 * Kelas ini membungkus library pihak ketiga NODEMAILER. Seluruh bagian
 * aplikasi yang perlu mengirim surel cukup memanggil method di sini, tanpa
 * perlu tahu bagaimana koneksi SMTP dibangun — inilah bentuk nyata prinsip
 * enkapsulasi sekaligus abstraksi.
 *
 * Pada lingkungan Docker, surel dikirim ke container MAILPIT yang berperan
 * sebagai server SMTP lokal. Kotak masuknya dapat dibuka di
 * http://localhost:8025 sehingga hasil pengiriman bisa diperagakan tanpa
 * memerlukan koneksi internet sama sekali.
 *
 * Penerapan konsep OOP: mengimplementasikan interface `OnModuleInit` milik
 * NestJS agar koneksi SMTP dibangun satu kali saja saat aplikasi dinyalakan.
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Membangun objek transporter SMTP ketika modul selesai dimuat.
   */
  onModuleInit(): void {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST') ?? 'localhost',
      port: Number(this.configService.get<string>('MAIL_PORT') ?? 1025),
      secure: false,
      ignoreTLS: true,
    });

    this.logger.log('Transporter SMTP siap digunakan.');
  }

  /**
   * Mengirim satu surel.
   *
   * Error pengiriman sengaja ditangkap dan hanya dicatat ke log, tidak
   * dilempar ulang, supaya kegagalan server surel tidak ikut menggagalkan
   * transaksi peminjaman yang datanya sudah tersimpan di basis data.
   *
   * @param to      Alamat surel penerima.
   * @param subject Judul surel.
   * @param html    Isi surel dalam format HTML.
   * @returns `true` bila surel berhasil dikirim.
   */
  private async send(
    to: string,
    subject: string,
    html: string,
  ): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from:
          this.configService.get<string>('MAIL_FROM') ??
          'SIPERPUS <no-reply@siperpus.local>',
        to,
        subject,
        html,
      });

      this.logger.log(`Surel terkirim ke ${to}: ${subject}`);
      return true;
    } catch (error) {
      this.logger.error(`Gagal mengirim surel ke ${to}`, errorStack(error));
      return false;
    }
  }

  /**
   * Mengirim bukti peminjaman kepada peminjam.
   *
   * @param loan Transaksi peminjaman lengkap dengan relasi bukunya.
   */
  async sendLoanReceipt(loan: Loan): Promise<boolean> {
    const body = this.wrapTemplate(
      'Bukti Peminjaman Buku',
      `
      <p>Halo <b>${loan.borrowerName}</b>,</p>
      <p>Peminjaman buku Anda telah kami catat dengan rincian berikut:</p>
      <table cellpadding="6" style="border-collapse:collapse;font-size:14px">
        <tr><td>Kode Transaksi</td><td><b>${loan.code}</b></td></tr>
        <tr><td>Judul Buku</td><td><b>${loan.book?.title ?? '-'}</b></td></tr>
        <tr><td>Pengarang</td><td>${loan.book?.author ?? '-'}</td></tr>
        <tr><td>Tanggal Pinjam</td><td>${formatDate(loan.borrowedAt)}</td></tr>
        <tr><td>Jatuh Tempo</td><td><b style="color:#c0392b">${formatDate(loan.dueAt)}</b></td></tr>
      </table>
      <p>Mohon kembalikan buku selambat-lambatnya pada tanggal jatuh tempo untuk
      menghindari denda keterlambatan.</p>
      `,
    );

    return this.send(
      loan.borrowerEmail,
      `[SIPERPUS] Bukti Peminjaman ${loan.code}`,
      body,
    );
  }

  /**
   * Mengirim surel pengingat kepada sejumlah peminjam yang terlambat.
   *
   * @param loans Daftar transaksi yang akan dikirimi pengingat.
   * @returns Banyaknya surel yang berhasil dikirim.
   */
  async sendOverdueReminders(loans: Loan[]): Promise<number> {
    let succeeded = 0;

    // Pemrograman terstruktur: perulangan dengan akumulator penghitung.
    for (const loan of loans) {
      const lateDays = loan.overdueDays();
      const estimatedFine = lateDays * this.finePerDay();

      const body = this.wrapTemplate(
        'Pengingat Pengembalian Buku',
        `
        <p>Halo <b>${loan.borrowerName}</b>,</p>
        <p>Buku yang Anda pinjam telah melewati batas waktu pengembalian.</p>
        <table cellpadding="6" style="border-collapse:collapse;font-size:14px">
          <tr><td>Kode Transaksi</td><td><b>${loan.code}</b></td></tr>
          <tr><td>Judul Buku</td><td><b>${loan.book?.title ?? '-'}</b></td></tr>
          <tr><td>Jatuh Tempo</td><td>${formatDate(loan.dueAt)}</td></tr>
          <tr><td>Keterlambatan</td><td><b style="color:#c0392b">${lateDays} hari</b></td></tr>
          <tr><td>Perkiraan Denda</td><td><b style="color:#c0392b">${formatCurrency(estimatedFine)}</b></td></tr>
        </table>
        <p>Mohon segera kembalikan buku tersebut ke perpustakaan.</p>
        `,
      );

      const sent = await this.send(
        loan.borrowerEmail,
        `[SIPERPUS] Pengingat Pengembalian ${loan.code}`,
        body,
      );

      if (sent) {
        succeeded += 1;
      }
    }

    return succeeded;
  }

  /**
   * Membungkus isi surel dengan kerangka HTML yang seragam.
   *
   * @param heading Judul yang tampil pada kepala surel.
   * @param body    Potongan HTML isi surel.
   */
  private wrapTemplate(heading: string, body: string): string {
    return `
      <div style="font-family:Segoe UI,Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <div style="background:#0d6efd;color:#fff;padding:16px 20px">
          <h2 style="margin:0;font-size:18px">SIPERPUS</h2>
          <div style="font-size:12px;opacity:.9">Sistem Informasi Peminjaman Buku</div>
        </div>
        <div style="padding:20px;color:#212529">
          <h3 style="margin-top:0">${heading}</h3>
          ${body}
        </div>
        <div style="background:#f8f9fa;padding:12px 20px;font-size:12px;color:#6c757d">
          Surel ini dikirim otomatis oleh sistem, mohon tidak dibalas.
        </div>
      </div>
    `;
  }

  /** Membaca tarif denda per hari dari konfigurasi lingkungan. */
  private finePerDay(): number {
    return Number(this.configService.get<string>('DENDA_PER_HARI') ?? 1000);
  }
}
