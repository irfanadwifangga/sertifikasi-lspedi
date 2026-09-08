import { ValueTransformer } from 'typeorm';

/** Nama bulan dalam Bahasa Indonesia, dipakai oleh {@link formatDate}. */
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

/** Jumlah milidetik dalam satu hari penuh. */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Memotong komponen jam/menit/detik dari sebuah tanggal.
 *
 * Diperlukan agar perhitungan selisih hari tidak terpengaruh jam berapa
 * transaksi dilakukan.
 *
 * @param date Tanggal yang akan dinormalkan.
 * @returns Objek Date baru pada pukul 00:00:00.
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Menghasilkan tanggal yang sama pada detik terakhir hari tersebut.
 *
 * Dipakai sebagai batas atas ketika memfilter data "sepanjang hari ini".
 *
 * @param date Tanggal yang akan dinormalkan.
 * @returns Objek Date baru pada pukul 23:59:59.999.
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Menambahkan sejumlah hari pada sebuah tanggal.
 *
 * @param date  Tanggal awal.
 * @param days  Banyaknya hari yang ditambahkan (boleh negatif).
 * @returns Objek Date baru; parameter masukan tidak diubah (immutable).
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Menghitung selisih hari antara dua tanggal.
 *
 * @param start Tanggal yang lebih awal.
 * @param end   Tanggal yang lebih akhir.
 * @returns Selisih dalam satuan hari (bernilai negatif bila end < start).
 */
export function diffInDays(start: Date, end: Date): number {
  const diffMs = startOfDay(end).getTime() - startOfDay(start).getTime();
  return Math.round(diffMs / MS_PER_DAY);
}

/**
 * Memformat tanggal ke gaya penulisan Indonesia, contoh: "25 Agustus 2026".
 *
 * @param date Tanggal yang akan diformat (boleh null).
 * @returns Teks tanggal, atau tanda "-" bila masukan kosong.
 */
export function formatDate(date: Date | null | undefined): string {
  if (!date) {
    return '-';
  }
  const d = new Date(date);
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Memformat tanggal ke format ISO singkat (YYYY-MM-DD) untuk input HTML.
 *
 * @param date Tanggal yang akan diformat.
 * @returns Teks tanggal berformat ISO, atau string kosong bila masukan kosong.
 */
export function formatIsoDate(date: Date | null | undefined): string {
  if (!date) {
    return '';
  }
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/**
 * Memformat bilangan menjadi mata uang Rupiah, contoh: "Rp 15.000".
 *
 * @param value Nominal dalam satuan rupiah.
 */
export function formatCurrency(value: number): string {
  const amount = Math.round(value || 0);
  return 'Rp ' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * DateTransformer — jembatan konversi antara kolom `date` milik PostgreSQL
 * (yang dibaca sebagai string "YYYY-MM-DD") dan objek `Date` milik JavaScript.
 *
 * Penerapan konsep OOP: objek ini mengimplementasikan kontrak `ValueTransformer`
 * milik TypeORM, sehingga proses konversi cukup ditulis satu kali lalu dipakai
 * ulang oleh setiap kolom bertipe tanggal.
 */
export const DateTransformer: ValueTransformer = {
  to: (value: Date | null): Date | null => value ?? null,
  from: (value: string | Date | null): Date | null => {
    if (!value) {
      return null;
    }
    return value instanceof Date ? value : new Date(`${value}T00:00:00`);
  },
};
