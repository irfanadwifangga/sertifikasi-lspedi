// Modul `hbs` mengekspor satu objek instance bergaya CommonJS, sehingga harus
// diimpor sebagai default import — bukan sebagai namespace (`import * as`).
import hbs from 'hbs';
import { formatCurrency, formatDate, formatIsoDate } from './date';

/**
 * registerHbsHelpers — mendaftarkan seluruh helper kustom Handlebars.
 *
 * Helper adalah fungsi kecil yang dapat dipanggil langsung dari berkas
 * templat `.hbs`. Dengan memusatkan format tanggal, rupiah, dan warna lencana
 * di sini, seluruh halaman menampilkan data dengan gaya yang seragam dan
 * logika format tidak tersebar di banyak berkas (prinsip DRY).
 */
export function registerHbsHelpers(): void {
  /**
   * Membandingkan dua nilai. Contoh pemakaian:
   * `{{#if (eq mode 'edit')}} ... {{/if}}`
   */
  hbs.registerHelper('eq', (a: unknown, b: unknown) => a === b);

  /** Kebalikan dari `eq`. */
  hbs.registerHelper('ne', (a: unknown, b: unknown) => a !== b);

  /** Memeriksa apakah sebuah angka lebih besar dari angka lain. */
  hbs.registerHelper('gt', (a: number, b: number) => Number(a) > Number(b));

  /** Menambah satu pada sebuah angka, dipakai untuk penomoran tabel. */
  hbs.registerHelper('inc', (value: number) => Number(value) + 1);

  /** Mengalikan dua angka, dipakai menghitung perkiraan denda di tampilan. */
  hbs.registerHelper('multiply', (a: number, b: number) => Number(a) * Number(b));

  /** Memformat tanggal ke gaya Indonesia, contoh: "25 Agustus 2026". */
  hbs.registerHelper('formatDate', (value: Date) => formatDate(value));

  /** Memformat tanggal ke format YYYY-MM-DD untuk atribut value input. */
  hbs.registerHelper('isoDate', (value: Date) => formatIsoDate(value));

  /** Memformat angka menjadi mata uang Rupiah. */
  hbs.registerHelper('currency', (value: number) => formatCurrency(value));

  /**
   * Menentukan kelas warna Bootstrap untuk lencana status transaksi.
   *
   * @param status Teks status: "Dipinjam", "Dikembalikan", atau "Terlambat".
   */
  hbs.registerHelper('statusColor', (status: string) => {
    switch (status) {
      case 'Dikembalikan':
        return 'success';
      case 'Terlambat':
        return 'danger';
      case 'Dipinjam':
        return 'warning';
      default:
        return 'secondary';
    }
  });

  /**
   * Menentukan kelas warna Bootstrap untuk lencana kategori buku.
   */
  hbs.registerHelper('categoryColor', (category: string) => {
    switch (category) {
      case 'Teknologi':
        return 'primary';
      case 'Sains':
        return 'info';
      case 'Sejarah':
        return 'warning';
      case 'Fiksi':
        return 'success';
      default:
        return 'secondary';
    }
  });

  /**
   * Menentukan kelas warna untuk indikator ketersediaan stok buku.
   */
  hbs.registerHelper('stockColor', (available: number) => {
    if (Number(available) === 0) {
      return 'danger';
    }
    return Number(available) <= 1 ? 'warning' : 'success';
  });
}
