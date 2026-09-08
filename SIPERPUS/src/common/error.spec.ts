import { errorMessage, errorStack } from './error';

/**
 * PENGUJIAN UNIT — fungsi bantu penanganan error
 * Unit kompetensi J.620100.033.02 "Melaksanakan Pengujian Unit Program".
 *
 * Pengujian ini memastikan penanganan error aplikasi tetap aman apa pun jenis
 * nilai yang dilempar. JavaScript mengizinkan `throw` atas nilai apa saja —
 * bukan hanya objek `Error` — sehingga blok penanganan error wajib tahan
 * terhadap masukan yang tidak terduga.
 */
describe('errorMessage', () => {
  it('mengambil pesan dari objek Error', () => {
    expect(errorMessage(new Error('Stok buku habis.'))).toBe(
      'Stok buku habis.',
    );
  });

  it('mengambil pesan dari turunan kelas Error', () => {
    class DatabaseError extends Error {}

    expect(errorMessage(new DatabaseError('Koneksi terputus.'))).toBe(
      'Koneksi terputus.',
    );
  });

  it('mengembalikan string apa adanya bila yang dilempar berupa teks', () => {
    expect(errorMessage('Terjadi error jaringan.')).toBe(
      'Terjadi error jaringan.',
    );
  });

  it('memakai pesan cadangan untuk nilai yang tidak menyimpan pesan', () => {
    const fallback = 'Terjadi kesalahan tak terduga.';

    expect(errorMessage(null)).toBe(fallback);
    expect(errorMessage(undefined)).toBe(fallback);
    expect(errorMessage(404)).toBe(fallback);
    expect(errorMessage({ code: 'X' })).toBe(fallback);
  });

  it('memakai pesan cadangan untuk string kosong atau berisi spasi saja', () => {
    expect(errorMessage('')).toBe('Terjadi kesalahan tak terduga.');
    expect(errorMessage('   ')).toBe('Terjadi kesalahan tak terduga.');
  });

  it('menghormati pesan cadangan yang ditentukan pemanggil', () => {
    expect(errorMessage(null, 'Gagal menyimpan data.')).toBe(
      'Gagal menyimpan data.',
    );
  });
});

describe('errorStack', () => {
  it('mengambil stack trace dari objek Error', () => {
    const stack = errorStack(new Error('gagal'));

    expect(typeof stack).toBe('string');
    expect(stack).toContain('Error: gagal');
  });

  it('mengembalikan undefined untuk nilai yang bukan Error', () => {
    expect(errorStack('teks biasa')).toBeUndefined();
    expect(errorStack(null)).toBeUndefined();
    expect(errorStack({ stack: 'palsu' })).toBeUndefined();
  });
});
