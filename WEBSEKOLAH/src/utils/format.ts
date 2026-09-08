/**
 * Kumpulan fungsi bantu pemformatan.
 *
 * Seluruh fungsi di berkas ini bersifat MURNI: hasilnya hanya bergantung pada
 * masukannya, tidak menyentuh apa pun di luar dirinya. Karena dikumpulkan di
 * satu tempat, aturan penulisan tanggal dan angka di seluruh situs dijamin
 * seragam — penerapan unit "menyusun fungsi dalam organisasi yang rapi"
 * sekaligus "mengimplementasikan pemrograman terstruktur".
 *
 * Penamaan: nama fungsi, parameter, dan variabel memakai Bahasa Inggris
 * mengikuti konvensi penulisan kode. Penjelasan dan seluruh teks yang tampil
 * kepada pengguna tetap Bahasa Indonesia.
 */

/** Nama bulan dalam Bahasa Indonesia. */
const MONTH_NAMES = [
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

/**
 * Mengubah tanggal ISO menjadi gaya penulisan Indonesia.
 *
 * @param isoDate Tanggal berformat "YYYY-MM-DD".
 * @returns Contoh: "1 September 2026". Mengembalikan tanda "-" bila kosong,
 *          atau teks aslinya bila tanggalnya tidak dapat dibaca.
 *
 * @example
 * formatDate('2026-09-01'); // "1 September 2026"
 */
export function formatDate(isoDate: string): string {
  if (!isoDate) return '-';

  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;

  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Menyisipkan pemisah ribuan pada sebuah bilangan.
 *
 * @param value Bilangan yang akan diformat.
 * @returns Contoh: 1250 menjadi "1.250".
 */
export function formatNumber(value: number): string {
  return Math.round(value || 0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Memotong teks yang terlalu panjang dan menambahkan elipsis.
 *
 * Pemotongan dilakukan pada batas kata terdekat agar tidak memutus kata
 * di tengah-tengah.
 *
 * @param text      Teks sumber.
 * @param maxLength Jumlah karakter maksimum.
 */
export function truncateText(text: string, maxLength = 120): string {
  if (text.length <= maxLength) return text;

  const sliced = text.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(' ');

  return `${sliced.slice(0, lastSpace > 0 ? lastSpace : maxLength)}…`;
}

/**
 * Mengurutkan daftar berita dari yang paling baru.
 *
 * Salinan array dibuat lebih dulu agar data aslinya tidak ikut berubah.
 *
 * Catatan: nama properti `tanggal` sengaja dipertahankan dalam Bahasa
 * Indonesia karena mengikuti struktur berkas data pada `src/data/`.
 *
 * @param items Daftar berita yang memiliki properti `tanggal`.
 */
export function sortByNewest<T extends { tanggal: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime(),
  );
}

/**
 * Mengelompokkan sekumpulan data berdasarkan salah satu propertinya.
 *
 * Dipakai halaman Galeri untuk menyusun tombol penyaring kategori secara
 * otomatis, tanpa perlu menulis daftar kategori secara manual.
 *
 * @param items Data yang akan dikelompokkan.
 * @param key   Nama properti yang dijadikan kunci pengelompokan.
 */
export function groupBy<T extends Record<string, any>>(
  items: T[],
  key: keyof T,
): Record<string, T[]> {
  const result: Record<string, T[]> = {};

  for (const item of items) {
    const groupKey = String(item[key]);
    if (!result[groupKey]) result[groupKey] = [];
    result[groupKey].push(item);
  }

  return result;
}
