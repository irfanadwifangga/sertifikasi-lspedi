/**
 * Konfigurasi Jest — kerangka kerja pengujian unit.
 *
 * Unit kompetensi J.620100.033.02 "Melaksanakan Pengujian Unit Program".
 * Jalankan dengan perintah: bun run test
 */
module.exports = {
  // Semua berkas uji berada di dalam direktori src, bersebelahan dengan
  // berkas yang diujinya, sehingga mudah ditemukan saat penelusuran kode.
  rootDir: 'src',

  // Berkas yang dianggap sebagai berkas uji: *.spec.ts
  testRegex: '.*\\.spec\\.ts$',

  moduleFileExtensions: ['js', 'json', 'ts'],

  // Berkas TypeScript dikompilasi lebih dulu oleh ts-jest.
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },

  testEnvironment: 'node',

  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
};
