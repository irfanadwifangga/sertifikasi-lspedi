import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { errorStack } from '../error';

/**
 * AllExceptionsFilter — penangkap error terpusat (global exception handler).
 *
 * Kelas ini merupakan bukti penerapan unit kompetensi "Melakukan Debugging":
 * setiap error yang tidak tertangani di lapisan mana pun akan singgah di sini
 * untuk dicatat ke log — dengan bobot yang dibedakan: kesalahan sisi permintaan
 * (4xx) cukup sebagai peringatan satu baris, sedangkan kesalahan sisi server
 * (5xx) dicatat lengkap beserta stack trace-nya. Setelah itu error
 * ditampilkan kepada pengguna sebagai halaman error yang ramah — bukan sebagai
 * stack trace mentah yang membingungkan.
 *
 * Penerapan konsep OOP: implementasi kontrak `ExceptionFilter` (interface).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  /** Judul dan keterangan berbahasa Indonesia untuk tiap kode status HTTP. */
  private static readonly STATUS_MESSAGES: Record<
    number,
    { heading: string; message: string }
  > = {
    400: {
      heading: 'Permintaan Tidak Valid',
      message:
        'Data yang dikirim tidak dapat diproses. Silakan periksa kembali isian Anda.',
    },
    401: {
      heading: 'Belum Masuk',
      message: 'Anda perlu masuk terlebih dahulu untuk membuka halaman ini.',
    },
    403: {
      heading: 'Akses Ditolak',
      message: 'Anda tidak memiliki izin untuk membuka halaman ini.',
    },
    404: {
      heading: 'Halaman Tidak Ditemukan',
      message: 'Alamat yang Anda tuju tidak tersedia pada sistem ini.',
    },
    405: {
      heading: 'Cara Akses Tidak Sesuai',
      message: 'Halaman ini tidak dapat diakses dengan cara tersebut.',
    },
    500: {
      heading: 'Terjadi Kesalahan pada Server',
      message:
        'Sistem sedang mengalami gangguan. Silakan coba beberapa saat lagi.',
    },
  };

  /**
   * Pola pesan bawaan framework yang berbahasa Inggris dan tidak layak
   * ditampilkan kepada pengguna akhir.
   */
  private static readonly FRAMEWORK_MESSAGE_PATTERNS = [
    /^Cannot (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/i,
    /^Validation failed/i,
    /^Internal Server Error$/i,
    /^Forbidden resource$/i,
    /^(Bad Request|Not Found|Unauthorized|Forbidden)$/i,
  ];

  /**
   * Menangani seluruh exception yang lolos sampai ke lapisan terluar.
   *
   * @param exception Objek error yang dilempar aplikasi.
   * @param host      Konteks eksekusi yang menyimpan request & response.
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Tentukan kode status: pakai status asli bila HttpException,
    // selain itu anggap sebagai error internal server.
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const { heading, message } = this.buildMessage(status, exception);

    // Log memakai pesan ASLI (bukan pesan yang sudah diperhalus), sebab log
    // ditujukan untuk penelusuran teknis, bukan untuk dibaca pengguna.
    const rawMessage =
      exception instanceof HttpException
        ? exception.message
        : String(exception);
    const summary = `[${status}] ${request.method} ${request.url} -> ${rawMessage}`;

    // Bobot pencatatan log dibedakan menurut jenis errornya.
    //
    // Status 4xx berarti kesalahan berasal dari sisi PERMINTAAN (alamat salah
    // ketik, data tidak valid, berkas tidak ada) — server sendiri baik-baik
    // saja. Error semacam ini cukup dicatat sebagai peringatan satu baris,
    // tanpa stack trace, supaya log tidak dipenuhi informasi yang tidak
    // menunjukkan masalah apa pun.
    //
    // Status 5xx berarti kesalahan benar-benar terjadi di dalam server, dan
    // di sinilah stack trace lengkap justru sangat dibutuhkan saat debugging.
    if (status < HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.warn(summary);
    } else {
      this.logger.error(summary, errorStack(exception));
    }

    response.status(status).render('error', {
      title: heading,
      status,
      heading,
      message,
      path: request.url,
    });
  }

  /**
   * Menyusun judul dan keterangan error yang layak dibaca pengguna akhir.
   *
   * Dua hal yang dijaga di sini:
   *
   *  1. **Bahasa yang seragam.** Pesan bawaan framework berbahasa Inggris
   *     (misalnya "Cannot GET /alamat-salah") tidak ditampilkan, melainkan
   *     diganti keterangan berbahasa Indonesia. Pesan yang ditulis sendiri
   *     oleh aplikasi tetap dipakai apa adanya karena sudah informatif,
   *     contohnya "Transaksi dengan ID 99 tidak ditemukan."
   *
   *  2. **Kerahasiaan detail internal.** Error 5xx TIDAK PERNAH menampilkan
   *     pesan aslinya, sebab isinya dapat memuat nama tabel, potongan kueri
   *     SQL, atau jalur berkas di server. Pengguna hanya menerima keterangan
   *     umum, sementara rinciannya tersimpan di log.
   *
   * @param status    Kode status HTTP yang akan dikirim.
   * @param exception Objek error aslinya.
   */
  private buildMessage(
    status: number,
    exception: unknown,
  ): { heading: string; message: string } {
    const fallback = AllExceptionsFilter.STATUS_MESSAGES[status] ?? {
      heading: 'Terjadi Kesalahan',
      message: 'Permintaan Anda tidak dapat diproses saat ini.',
    };

    if (
      status >= HttpStatus.INTERNAL_SERVER_ERROR ||
      !(exception instanceof HttpException)
    ) {
      return fallback;
    }

    const rawMessage = (exception.message ?? '').trim();
    const fromFramework =
      AllExceptionsFilter.FRAMEWORK_MESSAGE_PATTERNS.some((pattern) =>
        pattern.test(rawMessage),
      );

    if (rawMessage === '' || fromFramework) {
      return fallback;
    }
    return { heading: fallback.heading, message: rawMessage };
  }
}
