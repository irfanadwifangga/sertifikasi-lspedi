/**
 * Fungsi bantu penanganan objek error.
 *
 * TypeScript memberi tipe `unknown` pada variabel di blok `catch`, karena
 * JavaScript sesungguhnya mengizinkan nilai APA PUN dilempar — bukan hanya
 * objek `Error`. Kode seperti `error.message` karena itu tidak aman: bila yang
 * dilempar ternyata sebuah string atau angka, aplikasi justru akan gagal di
 * dalam blok penanganan errornya sendiri.
 *
 * Kedua fungsi di bawah ini memeriksa tipe nilai lebih dulu (type narrowing)
 * sebelum mengambil isinya, sehingga penanganan error tetap aman apa pun yang
 * dilempar. Bagian dari penerapan unit kompetensi "Melakukan Debugging".
 */

/**
 * Mengambil pesan yang dapat dibaca manusia dari sebuah nilai error.
 *
 * @param error    Nilai apa pun yang tertangkap pada blok `catch`.
 * @param fallback Pesan yang dipakai bila error tidak menyimpan pesan apa pun.
 * @returns Pesan error yang siap ditampilkan kepada pengguna.
 *
 * @example
 * try { ... } catch (error) { tampilkan(errorMessage(error)); }
 */
export function errorMessage(
  error: unknown,
  fallback = 'Terjadi kesalahan tak terduga.',
): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim() !== '') {
    return error;
  }
  return fallback;
}

/**
 * Mengambil stack trace dari sebuah nilai error, bila tersedia.
 *
 * Dipakai saat menulis log agar penyebab error mudah ditelusuri.
 *
 * @param error Nilai apa pun yang tertangkap pada blok `catch`.
 * @returns Teks stack trace, atau `undefined` bila nilai bukan objek Error.
 */
export function errorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}
