/* =========================================================
   Mengambil tangkapan layar seluruh halaman dan bukti fitur
   untuk lampiran laporan Tugas Praktik Demonstrasi.

   Jalankan setelah `bun run build`, dengan folder dist/ dilayani
   pada http://127.0.0.1:4399 :

     python -m http.server 4399 --directory dist
     node tools/capture-screens.mjs
   ========================================================= */
import puppeteer from 'puppeteer';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.BASE || 'http://127.0.0.1:4399';
const OUT = 'docs';
const WIDTH = 1600, HEIGHT = 860, SCALE = 1.2;   // menghasilkan berkas 1920x1032

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setCacheEnabled(false);
await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: SCALE });

/** Memaksa animasi AOS selesai supaya tidak terpotret saat masih memudar. */
async function settleAnimations() {
  await page.evaluate(() => {
    document.querySelectorAll('[data-aos]').forEach((el) => {
      el.classList.add('aos-animate');
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.transition = 'none';
    });
  });
  await pause(450);
}

/**
 * Membuka satu alamat lalu memotretnya.
 *
 * @param route   Alamat relatif terhadap BASE.
 * @param file    Nama berkas keluaran, relatif terhadap docs/.
 * @param options `before`: fungsi yang dijalankan sebelum memotret.
 */
async function capture(route, file, options = {}) {
  await page.goto(BASE + route, { waitUntil: 'networkidle0' });
  await settleAnimations();
  if (options.before) await options.before(page);
  await page.screenshot({ path: `${OUT}/${file}` });
  console.log('  ', file);
}

/** Menggulir sampai elemen berada pada posisi yang diinginkan. */
const scrollToElement = (selector, offset = 0, waitMs = 600) => async (p) => {
  await p.evaluate((s, o) => {
    const el = document.querySelector(s);
    if (el) window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - o);
  }, selector, offset);
  await pause(waitMs);
};

/** Menggulir ke bagian yang judulnya memuat sepotong teks tertentu. */
const scrollToHeading = (text, offset = 0) => async (p) => {
  await p.evaluate((t, o) => {
    const heading = [...document.querySelectorAll('h2')].find((h) => h.textContent.includes(t));
    const section = heading && heading.closest('section');
    if (section) window.scrollTo(0, window.scrollY + section.getBoundingClientRect().top - o);
  }, text, offset);
  await pause(600);
};

await mkdir(`${OUT}/Halaman Situs`, { recursive: true });
await mkdir(`${OUT}/Bukti Fitur`, { recursive: true });

console.log('Halaman situs:');
await capture('/', 'Halaman Situs/1 Beranda.png');
await capture('/profil/', 'Halaman Situs/2 Profil Sekolah.png');
await capture('/program-keahlian/', 'Halaman Situs/3 Program Keahlian.png');
await capture('/ekstrakurikuler/', 'Halaman Situs/4 Ekstrakurikuler.png', { before: scrollToElement('#daftar-ekskul', 220) });
await capture('/galeri/', 'Halaman Situs/5 Galeri.png', { before: scrollToElement('#kisi-galeri', 260) });
await capture('/berita/', 'Halaman Situs/6 Berita.png', { before: scrollToElement('#daftar-berita', 260) });
await capture('/berita/juara-lks-otomotif/', 'Halaman Situs/7 Detail Berita.png');
await capture('/kontak/', 'Halaman Situs/8 Kontak.png', { before: scrollToElement('#form-kontak', 200) });
// Server statis punya halaman galatnya sendiri; berkas Astro dibuka langsung.
await capture('/404.html', 'Halaman Situs/9 Halaman Tidak Ditemukan.png');

console.log('Bukti fitur:');
await capture('/profil/', 'Bukti Fitur/Tabel Informasi Profil Sekolah.png', { before: scrollToElement('table', 150) });
// Angka statistik dianimasikan selama 1,4 detik; tunggu sampai berhenti.
await capture('/', 'Bukti Fitur/Informasi Jumlah Guru dan Siswa.png', { before: scrollToElement('#grafik-siswa', 320, 2400) });
await capture('/', 'Bukti Fitur/Berita Kegiatan di Beranda.png', { before: scrollToHeading('Berita Kegiatan Terbaru', 90) });
await capture('/', 'Bukti Fitur/Galeri di Beranda.png', { before: scrollToHeading('Galeri Kegiatan', 90) });
await capture('/', 'Bukti Fitur/Video Profil Sekolah.png', { before: scrollToElement('#video-profil', 200) });

// Penyaring galeri: pilih kategori "Praktik".
await capture('/galeri/', 'Bukti Fitur/Penyaring Kategori Galeri.png', {
  before: async (p) => {
    await p.evaluate(() => {
      const button = [...document.querySelectorAll('.filter-galeri')]
        .find((x) => x.dataset.kategori === 'Praktik');
      if (button) button.click();
    });
    await pause(500);
    await scrollToElement('#kisi-galeri', 300)(p);
  },
});

// Lightbox GLightbox.
await capture('/galeri/', 'Bukti Fitur/Lightbox Galeri.png', {
  before: async (p) => {
    await p.evaluate(() => document.querySelector('a.item-galeri').click());
    await pause(1400);
  },
});

// Pencarian berita.
await capture('/berita/', 'Bukti Fitur/Pencarian Berita.png', {
  before: async (p) => {
    await p.click('#cari-berita');
    await p.type('#cari-berita', 'prestasi', { delay: 45 });
    await pause(600);
    await scrollToElement('#cari-berita', 200)(p);
  },
});

// Penyaring ekstrakurikuler.
await capture('/ekstrakurikuler/', 'Bukti Fitur/Penyaring Ekstrakurikuler.png', {
  before: async (p) => {
    await p.evaluate(() => {
      const button = [...document.querySelectorAll('.filter-ekskul')].filter((x) => x.dataset.kategori)[1];
      if (button) button.click();
    });
    await pause(500);
    await scrollToElement('.filter-ekskul', 210)(p);
  },
});

// Validasi formulir: kirim dalam keadaan kosong.
await capture('/kontak/', 'Bukti Fitur/Validasi Formulir Kontak.png', {
  before: async (p) => {
    await p.evaluate(() => document.querySelector('#form-kontak').requestSubmit());
    await pause(500);
    await scrollToElement('#form-kontak', 150)(p);
  },
});

// Formulir terisi benar.
await capture('/kontak/', 'Bukti Fitur/Formulir Kontak Terkirim.png', {
  before: async (p) => {
    await p.type('#nama', 'Irfana Dwi Fangga', { delay: 20 });
    await p.type('#email', 'irfana@contoh.sch.id', { delay: 20 });
    await p.select('#subjek', 'Informasi Pendaftaran');   // <select>, bukan isian teks
    await p.type('#pesan', 'Selamat siang, saya ingin menanyakan jadwal penerimaan peserta didik baru.', { delay: 8 });
    await p.evaluate(() => document.querySelector('#form-kontak').requestSubmit());
    await pause(700);
    await scrollToElement('#form-kontak', 150)(p);
  },
});

// Menu seluler: ukuran layar ponsel, menu dibuka.
await page.setViewport({ width: 430, height: 900, deviceScaleFactor: 2.4 });
await capture('/', 'Bukti Fitur/Menu Seluler.png', {
  before: async (p) => {
    await p.click('#menu-toggle');
    await pause(600);
  },
});

await browser.close();
console.log('selesai');
