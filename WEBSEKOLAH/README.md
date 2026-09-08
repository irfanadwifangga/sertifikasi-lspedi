# Website Sekolah — SMK Wira Teknologi Nusantara

Tugas Praktik Demonstrasi **FR.IA.02**
Skema Sertifikasi **Junior Web Developer** — 02/SKM/DID/VII/2024
LSP Entrepreneur Digital Indonesia

> Seluruh data sekolah pada proyek ini **fiktif**, dibuat khusus sebagai bahan
> demonstrasi. Ubah `src/data/sekolah.json` untuk mengganti isinya.

---

## Menjalankan

```bash
bun install
bun run dev
```

Buka <http://localhost:4321>.

Untuk membangun versi produksi:

```bash
bun run build && bun run preview
```

---

## Susunan Berkas

```
src/
├─ pages/            satu berkas = satu halaman (routing berbasis berkas)
│  ├─ index.astro              Beranda
│  ├─ profil.astro             Profil Sekolah + Tabel Informasi
│  ├─ program-keahlian.astro   Program Keahlian
│  ├─ ekstrakurikuler.astro    Ekstrakurikuler
│  ├─ galeri.astro             Galeri
│  ├─ berita.astro             Daftar Berita
│  ├─ berita/[slug].astro      Detail berita (dibangun otomatis dari data)
│  ├─ kontak.astro             Kontak
│  └─ 404.astro                Halaman tidak ditemukan
├─ components/       bagian yang dipakai berulang
│  ├─ Navbar.astro             Menu utama interaktif
│  ├─ Footer.astro
│  ├─ HeaderHalaman.astro      Kepala halaman + remah roti
│  ├─ Judul.astro              Kepala tiap bagian
│  ├─ KartuBerita.astro
│  ├─ Statistik.astro          Angka guru/siswa + grafik Chart.js
│  └─ VideoProfil.astro        Pemutar video profil
├─ layouts/
│  └─ Layout.astro             Kerangka bersama seluruh halaman
├─ data/             seluruh isi situs, terpisah dari kode
│  ├─ sekolah.json
│  ├─ berita.json
│  ├─ ekstrakurikuler.json
│  └─ galeri.json
├─ utils/
│  └─ format.ts                Fungsi bantu tanggal, angka, dan pengurutan
└─ styles/
   └─ global.css               Token warna dan komponen dasar
```

---

## Halaman

| # | Halaman | Alamat |
|---|---|---|
| 1 | Beranda | `/` |
| 2 | Profil Sekolah | `/profil` |
| 3 | Program Keahlian | `/program-keahlian` |
| 4 | Ekstrakurikuler | `/ekstrakurikuler` |
| 5 | Galeri | `/galeri` |
| 6 | Berita | `/berita` |
| 7 | Detail Berita | `/berita/{slug}` |
| 8 | Kontak | `/kontak` |
| — | Halaman tidak ditemukan | `/404` |

---

## Pemenuhan Ketentuan Soal

| Ketentuan | Pemenuhan |
|---|---|
| Website sekolah dengan UI interaktif pada menu halaman utama | Navbar berubah latar saat digulir, menandai halaman aktif, dan punya menu hamburger di layar sempit |
| Menu utama: Beranda, Profil Sekolah, Ekstrakurikuler, Galeri, dll | Tujuh menu utama, daftarnya ditulis sekali di `Navbar.astro` |
| Halaman utama memuat berita kegiatan, galeri, dan jumlah guru/siswa | Tiga bagian tersedia di `index.astro` |
| Setiap menu utama memiliki halaman tersendiri | Satu berkas `.astro` per halaman di `src/pages/` |
| Tabel Informasi Profil Sekolah pada menu Profil Sekolah | Tabel 22 baris di `/profil`, dibangun lewat perulangan data |

---

## Pemetaan Unit Kompetensi

| Kode Unit | Judul | Bukti dalam kode |
|---|---|---|
| J.620100.005.02 | Mengimplementasikan user interface | Navbar responsif, penyaring kategori, lightbox, animasi gulir, validasi form |
| J.620100.010.01 | Perintah eksekusi berbasis teks, grafik, dan multimedia | Teks dari JSON; grafik Chart.js pada `<canvas>` dan ilustrasi SVG; multimedia lewat `<video>` di `VideoProfil.astro` |
| J.620100.015.01 | Menyusun fungsi/berkas dalam organisasi yang rapi | Pemisahan `pages` / `components` / `layouts` / `data` / `utils` / `styles` |
| J.620100.016.01 | Menulis kode sesuai guidelines dan best practices | Penamaan konsisten, komentar TSDoc, gambar diberi `alt`, `<table>` memakai `scope`, animasi menghormati `prefers-reduced-motion` |
| J.620100.017.02 | Mengimplementasikan pemrograman terstruktur | Fungsi murni di `utils/format.ts`; perulangan `map` untuk tabel, kartu, dan menu |
| J.620100.019.02 | Menggunakan library atau komponen pre-existing | Astro, Tailwind CSS, Swiper, GLightbox, AOS, Chart.js |

---

## Library Pihak Ketiga

| Library | Versi | Kegunaan |
|---|---|---|
| Astro | 7.3 | Kerangka kerja situs, routing berbasis berkas |
| Tailwind CSS | 4.3 | Sistem penataan tampilan |
| Swiper | 14.2 | Pergantian gambar sampul pada beranda |
| GLightbox | 3.3 | Memperbesar foto galeri |
| AOS | 2.3 | Animasi saat elemen masuk layar |
| Chart.js | 4.5 | Grafik komposisi peserta didik |

---

## Laporan Tugas Praktik Demonstrasi

Laporan lengkap beserta lampiran tangkapan layar ada di
`docs/Laporan_TPD_WEBSEKOLAH.pdf` (29 halaman, 21 gambar).

| Berkas | Isi |
|---|---|
| `docs/DOKUMENTASI.md` | Naskah laporan |
| `docs/Halaman Situs/` | Tangkapan layar sembilan halaman |
| `docs/Bukti Fitur/` | Tangkapan layar bukti tiap fitur |
| `tools/capture-screens.mjs` | Mengambil ulang seluruh tangkapan layar |
| `tools/buat-laporan.py` | Menyusun ulang berkas PDF-nya |

Membuat ulang laporannya:

```bash
bun run build
python -m http.server 4399 --directory dist   # jendela lain
node tools/capture-screens.mjs
python tools/buat-laporan.py
```

---

## Berkas Media

Video profil sekolah ada di `public/video/profil-sekolah.mp4` — 20,5 detik,
1920x1080, 60 fps. Gambar posternya, `public/img/video-poster.jpg`, diambil
dari salah satu frame video itu sendiri.

Sumber videonya bukan rekaman kamera melainkan animasi web di `motion/`:

- `motion/index.html` — satu berkas mandiri, bisa dibuka dengan klik dua
  kali. Tambahkan `?debug=1` di alamatnya untuk memunculkan panel scrub.
- `tools/snap.mjs` — memotret detik-detik tertentu untuk diperiksa.
- `tools/export-frames.mjs` — merender tiap frame jadi PNG.

Untuk membuat ulang berkas MP4-nya (butuh `bun add -d puppeteer` dan ffmpeg):

```
URL="file:///<path>/motion/index.html?clean=1" OUT=frames node tools/export-frames.mjs
ffmpeg -framerate 60 -i frames/f%05d.png -c:v libx264 -preset slow -crf 20        -pix_fmt yuv420p -movflags +faststart public/video/profil-sekolah.mp4
```

Seluruh gambar berita dan galeri saat ini berupa ilustrasi SVG yang dihasilkan
otomatis. Ganti berkas di `public/img/` dengan foto asli bila tersedia,
memakai nama berkas yang sama.
