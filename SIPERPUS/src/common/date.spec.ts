import {
  addDays,
  diffInDays,
  endOfDay,
  formatCurrency,
  formatDate,
  formatIsoDate,
  startOfDay,
} from './date';

/**
 * PENGUJIAN UNIT — fungsi bantu tanggal dan format angka
 * Unit kompetensi J.620100.033.02 "Melaksanakan Pengujian Unit Program".
 *
 * Fungsi-fungsi di berkas `date.ts` dipakai berulang kali oleh entitas,
 * service, tampilan, dan pembuat PDF. Karena itu kebenarannya diuji tersendiri
 * agar satu kesalahan kecil tidak merambat ke seluruh aplikasi.
 */
describe('Fungsi bantu tanggal', () => {
  it('menormalkan tanggal ke pukul 00:00:00', () => {
    const result = startOfDay(new Date('2026-08-25T17:42:31'));

    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getDate()).toBe(25);
  });

  it('menormalkan tanggal ke detik terakhir hari tersebut', () => {
    const result = endOfDay(new Date('2026-08-25T09:00:00'));

    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getDate()).toBe(25);
  });

  it('menambah hari tanpa mengubah objek tanggal masukan', () => {
    const original = new Date('2026-08-25');
    const result = addDays(original, 7);

    expect(formatIsoDate(result)).toBe('2026-09-01');
    expect(formatIsoDate(original)).toBe('2026-08-25'); // masukan tetap utuh
  });

  it('menerima penambahan hari bernilai negatif', () => {
    const result = addDays(new Date('2026-08-25'), -30);

    expect(formatIsoDate(result)).toBe('2026-07-26');
  });

  it('menghitung selisih hari antara dua tanggal', () => {
    expect(diffInDays(new Date('2026-08-01'), new Date('2026-08-08'))).toBe(7);
  });

  it('menghasilkan selisih nol untuk tanggal yang sama', () => {
    expect(diffInDays(new Date('2026-08-01'), new Date('2026-08-01'))).toBe(0);
  });

  it('menghasilkan selisih negatif bila urutan tanggal terbalik', () => {
    expect(diffInDays(new Date('2026-08-08'), new Date('2026-08-01'))).toBe(-7);
  });

  it('menghitung selisih dengan benar melewati pergantian tahun', () => {
    expect(diffInDays(new Date('2026-12-28'), new Date('2027-01-04'))).toBe(7);
  });
});

describe('Fungsi format tampilan', () => {
  it('memformat tanggal ke gaya penulisan Indonesia', () => {
    expect(formatDate(new Date('2026-08-25'))).toBe('25 Agustus 2026');
    expect(formatDate(new Date('2026-01-01'))).toBe('1 Januari 2026');
  });

  it('menampilkan tanda hubung untuk tanggal yang kosong', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDate(undefined)).toBe('-');
  });

  it('memformat tanggal ke format ISO singkat untuk input HTML', () => {
    expect(formatIsoDate(new Date('2026-08-05'))).toBe('2026-08-05');
    expect(formatIsoDate(null)).toBe('');
  });

  it('memformat angka menjadi mata uang Rupiah dengan pemisah ribuan', () => {
    expect(formatCurrency(0)).toBe('Rp 0');
    expect(formatCurrency(1000)).toBe('Rp 1.000');
    expect(formatCurrency(15000)).toBe('Rp 15.000');
    expect(formatCurrency(1250000)).toBe('Rp 1.250.000');
  });

  it('memperlakukan nilai kosong sebagai nol rupiah', () => {
    expect(formatCurrency(undefined as unknown as number)).toBe('Rp 0');
  });
});
