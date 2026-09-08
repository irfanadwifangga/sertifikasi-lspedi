# DOKUMENTASI KODE PROGRAM

**Website Sekolah — SMK Wira Teknologi Nusantara**

| | |
|---|---|
| Skema Sertifikasi | Junior Web Developer |
| Nomor Skema | 02/SKM/DID/VII/2024 |
| Formulir | FR.IA.02 — Tugas Praktik Demonstrasi |
| Nama Asesi | Irfana Dwi Fangga |
| Nama Asesor | Yosep Kurniawan, ST — No. Reg 000.002992.2021 |
| Tanggal | 14 September 2026 |
| Durasi | 3 Jam |
| Repository | https://github.com/irfanadwifangga/sertifikasi-lspedi |

> Seluruh data sekolah pada proyek ini bersifat **fiktif** dan dibuat khusus
> sebagai bahan demonstrasi. Penandanya ditulis terbuka pada bidang
> `_keterangan` di dalam `src/data/sekolah.json`, sehingga tidak ada klaim
> yang menyesatkan mengenai institusi nyata mana pun.

---

## 1. Ringkasan Situs

Situs ini adalah profil sebuah sekolah menengah kejuruan bidang teknologi.
Pengunjung dapat menelusuri identitas sekolah, tiga program keahlian yang
dibuka, kegiatan ekstrakurikuler, dokumentasi foto, berita kegiatan, serta
mengirim pertanyaan lewat formulir kontak.

Seluruh halaman dibangun sebagai **situs statis**: pada saat proses
`build`, setiap halaman dirender lebih dulu menjadi berkas HTML biasa.
Tidak ada basis data dan tidak ada proses di sisi peladen ketika pengunjung
membuka situs, sehingga halaman tampil seketika dan dapat dititipkan pada
peladen berkas statis mana pun.

| Angka | Nilai |
|---|---|
| Halaman yang dapat diakses | 9 rute (8 menu + halaman galat) |
| Berkas sumber | 23 berkas (`.astro`, `.ts`, `.css`, `.json`) |
| Baris kode | ± 3.034 baris di luar berkas data |
| Berkas data | 4 berkas JSON |
| Komponen yang dipakai ulang | 7 komponen |
| Library pre-existing | 6 library |

Isi situs sepenuhnya dipisahkan dari kode tampilan. Menambah satu berita,
satu foto galeri, atau satu ekstrakurikuler cukup dilakukan dengan menyunting
berkas JSON di `src/data/` — tanpa menyentuh satu baris pun kode tampilan.

---

## 2. Pemenuhan Ketentuan Soal

Lima langkah kerja yang diminta pada skenario tugas beserta letak
pemenuhannya di dalam kode.

| No | Ketentuan Soal | Pemenuhan | Berkas |
|---|---|---|---|
| 1 | Website sekolah dengan user interface yang interaktif pada menu-menu di halaman utama | Menu utama berubah latar dan warna teks saat halaman digulir, menandai halaman yang sedang dibuka, serta berubah menjadi menu hamburger pada layar sempit | `components/Navbar.astro` |
| 2 | Pada halaman utama terdapat menu utama seperti Beranda, Profil Sekolah, Ekstrakurikuler, Galeri dll | Tujuh menu utama. Daftarnya ditulis sekali sebagai array lalu dirender berulang, sehingga menu layar lebar dan menu seluler tidak pernah berbeda isi | `components/Navbar.astro` |
| 3 | Pada halaman utama terdapat berita kegiatan sekolah, galeri dan informasi jumlah guru dan siswa | Tiga bagian tersedia di beranda: tiga berita terbaru, enam cuplikan galeri, dan bagian angka guru/siswa berikut grafik lingkarannya | `pages/index.astro`, `components/Statistics.astro` |
| 4 | Setiap Menu utama memiliki halaman tersendiri | Satu berkas `.astro` untuk satu halaman, memakai routing berbasis berkas | `src/pages/` |
| 5 | Terdapat Tabel Informasi Profil Sekolah pada menu utama Profil Sekolah | Tabel 22 baris berisi identitas, alamat, kontak, dan data pokok sekolah, dibangun lewat perulangan atas array | `pages/profil.astro` |

---

## 3. Dokumentasi Program

### a. Tools Software Pemrograman yang Digunakan

| Perangkat | Versi | Kegunaan |
|---|---|---|
| Visual Studio Code | — | Penyunting kode |
| Bun | 1.x | Pengelola paket dan penjalan skrip |
| Node.js | 24.x | Lingkungan jalan untuk proses build |
| Google Chrome | — | Pengujian tampilan dan alat pengembang |
| Astro Dev Toolbar | bawaan Astro | Audit aksesibilitas dan performa saat pengembangan |
| Git | — | Pengelolaan versi |
| ffmpeg | 9.0.1 | Penggabungan frame menjadi berkas video profil |

### b. Bahasa Pemrograman yang Digunakan

| Bahasa | Peran dalam proyek |
|---|---|
| **TypeScript** | Seluruh logika: fungsi bantu di `utils/format.ts`, skrip sisi peramban pada setiap halaman, dan tipe data komponen. Dipilih agar kesalahan tipe tertangkap sebelum program dijalankan. |
| **HTML** | Struktur halaman, ditulis di dalam berkas `.astro`. Ditulis semantik: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<table>` beserta `<thead>`/`<tbody>` dan atribut `scope`. |
| **CSS** | Penataan tampilan lewat Tailwind CSS, dilengkapi token warna dan komponen dasar di `styles/global.css`. |
| **JSON** | Penyimpanan seluruh isi situs, terpisah dari kode. |

### c. Library, Komponen Pre-Existing, dan Framework yang Digunakan

| Library | Versi | Kegunaan | Dipakai di |
|---|---|---|---|
| **Astro** | 7.3 | Kerangka kerja situs, routing berbasis berkas, render statis | seluruh proyek |
| **Tailwind CSS** | 4.3 | Sistem penataan tampilan berbasis kelas utilitas | seluruh proyek |
| **Swiper** | 14.2 | Pergantian gambar sampul pada beranda, lengkap dengan titik navigasi dan gerak sentuh | `pages/index.astro` |
| **GLightbox** | 3.3 | Memperbesar foto galeri tanpa berpindah halaman | `pages/galeri.astro`, `pages/index.astro` |
| **AOS** | 2.3 | Animasi elemen saat masuk layar | `layouts/Layout.astro` |
| **Chart.js** | 4.5 | Grafik lingkaran komposisi peserta didik pada elemen `<canvas>` | `components/Statistics.astro` |

Keenam library dipasang lewat pengelola paket, bukan disalin ke dalam
proyek, sehingga versinya terkunci di `package.json` dan `bun.lock` serta
dapat dipasang ulang persis sama oleh siapa pun.

### d. Dokumen Kode Program yang Dibuat

#### A. Halaman (`src/pages/`)

| Berkas | Alamat | Isi |
|---|---|---|
| `index.astro` | `/` | Beranda: sampul bergambar, ringkasan sekolah, program keahlian, statistik guru/siswa, video profil, berita terbaru, cuplikan galeri, ajakan |
| `profil.astro` | `/profil` | Visi, misi, sambutan kepala sekolah, sejarah, sarana, dan **Tabel Informasi Profil Sekolah** |
| `program-keahlian.astro` | `/program-keahlian` | Tiga program keahlian beserta kompetensi dan prospek lulusannya |
| `ekstrakurikuler.astro` | `/ekstrakurikuler` | Enam kegiatan, disaring berdasarkan kategori |
| `galeri.astro` | `/galeri` | Sembilan foto, disaring berdasarkan kategori, diperbesar lewat lightbox |
| `berita.astro` | `/berita` | Enam berita, diurutkan dari terbaru, dengan pencarian langsung |
| `berita/[slug].astro` | `/berita/{slug}` | Halaman detail berita, dibangun otomatis satu per berita |
| `kontak.astro` | `/kontak` | Alamat, jam layanan, tanya jawab, dan formulir kontak bervalidasi |
| `404.astro` | `/404` | Halaman ketika alamat tidak ditemukan |

#### B. Komponen yang Dipakai Ulang (`src/components/`)

| Berkas | Tanggung jawab |
|---|---|
| `Navbar.astro` | Menu utama: penanda halaman aktif, perubahan latar saat digulir, menu hamburger |
| `Footer.astro` | Kaki halaman: identitas, tautan cepat, kontak, jam layanan |
| `PageHeader.astro` | Kepala halaman dalam beserta remah roti (breadcrumb) |
| `SectionTitle.astro` | Kepala tiap bagian, agar jaraknya seragam di seluruh halaman |
| `NewsCard.astro` | Satu kartu berita, dipakai di beranda maupun halaman berita |
| `Statistics.astro` | Angka guru/siswa yang menghitung naik dan grafik Chart.js |
| `ProfileVideo.astro` | Pemutar video profil dengan tombol putar buatan sendiri |

#### C. Kerangka dan Sumber Daya Lain

| Berkas | Tanggung jawab |
|---|---|
| `layouts/Layout.astro` | Kerangka bersama seluruh halaman: `<head>`, meta SEO, pemasangan AOS |
| `utils/format.ts` | Lima fungsi murni: tanggal, angka, pemotongan teks, pengurutan, pengelompokan |
| `styles/global.css` | Token warna dan komponen dasar |
| `data/*.json` | Seluruh isi situs |
| `motion/index.html` | Sumber animasi video profil |
| `tools/*.mjs` | Alat bantu: potret layar, render frame video |

---

## 4. Menyusun Berkas dalam Organisasi yang Rapi

> Unit **J.620100.015.01** — Menyusun fungsi, file atau sumber daya
> pemrograman yang lain dalam organisasi yang rapi.

Berkas tidak dikelompokkan berdasarkan halaman, melainkan berdasarkan
**peran**. Satu berkas hanya menjawab satu pertanyaan.

```
src/
├─ pages/          "halaman apa saja yang ada?"      satu berkas = satu alamat
├─ components/     "bagian mana yang dipakai ulang?"
├─ layouts/        "apa yang sama di semua halaman?"
├─ data/           "apa isinya?"                     tanpa kode sama sekali
├─ utils/          "perhitungan apa yang berulang?"  fungsi murni, tanpa DOM
└─ styles/         "seperti apa rupanya?"
```

Tiga aturan yang dipegang konsisten:

1. **Isi tidak pernah ditulis di dalam kode tampilan.** Berita, foto, dan
   ekstrakurikuler seluruhnya dibaca dari JSON. Akibatnya menambah berita
   tidak berisiko merusak tampilan, karena tampilannya tidak disentuh.
2. **Yang muncul lebih dari sekali menjadi komponen.** Kartu berita muncul
   di dua halaman namun kodenya hanya ada satu.
3. **Perhitungan dipisahkan dari tampilan.** `utils/format.ts` tidak
   mengenal DOM sama sekali sehingga bisa dipakai dari halaman mana pun.

Berkas gambar dan media mengikuti aturan penamaan yang sama:
`public/img/berita-*.svg`, `galeri-*.svg`, dan `public/video/`.

---

## 5. Menulis Kode Sesuai Guidelines dan Best Practices

> Unit **J.620100.016.01** — Menulis kode dengan prinsip sesuai guidelines
> dan best practices.

### 5.1 Penamaan

Pengenal (nama fungsi, variabel, dan berkas) ditulis dalam **Bahasa
Inggris**, sedangkan komentar dan seluruh isi yang dibaca pengunjung ditulis
dalam **Bahasa Indonesia**. Pemisahan ini disengaja: kode mengikuti kebiasaan
umum pemrograman, sementara isinya tetap sesuai pembaca situs.

Dua hal sengaja tetap Bahasa Indonesia karena keduanya bukan pengenal
program:

1. **Nama bidang pada berkas data**, misalnya `judul`, `tanggal`, dan
   `kategori`. Batasan generik `{ tanggal: string }` pada `sortByNewest`
   ikut mempertahankannya, dan alasannya ditulis di dalam kode.
2. **Nama `id` dan kelas pada HTML**, misalnya `#form-kontak` dan
   `.item-galeri`. Keduanya milik markup dan dirujuk dari CSS maupun
   berkas gaya, sehingga diperlakukan seperti nama berkas gambar.

### 5.2 Komentar

Setiap berkas dibuka dengan komentar yang menjelaskan perannya, dan setiap
fungsi memakai komentar bergaya TSDoc berisi tujuan, parameter, dan alasan
di balik keputusan yang tidak jelas dengan sendirinya. Komentar menjelaskan
**mengapa**, bukan mengulang **apa** yang sudah terbaca dari kode.

### 5.3 Aksesibilitas

| Praktik | Penerapan |
|---|---|
| Teks alternatif | Seluruh `<img>` memiliki `alt`; gambar hiasan diberi `alt` kosong agar dilewati pembaca layar |
| Struktur tabel | `<table>` memakai `<thead>`, `<tbody>`, dan `scope="col"`/`scope="row"` |
| Label formulir | Setiap isian punya `<label for="...">`; kotak pencarian memakai label `sr-only` |
| Tombol ikon | Diberi `aria-label`, misalnya tombol menu dan tombol putar video |
| Status menu | Tombol hamburger memakai `aria-expanded` yang ikut berubah |
| Gerak | Seluruh animasi dimatikan bila peramban menyalakan `prefers-reduced-motion` |
| Kontras | Warna teks di atas latar gelap maupun terang diperiksa agar tetap terbaca |

### 5.4 Performa

| Praktik | Penerapan |
|---|---|
| Pemuatan gambar | Gambar di bawah lipatan memakai `loading="lazy"`; gambar sampul memakai `loading="eager"` dan `fetchpriority="high"` |
| Ukuran gambar | Setiap `<img>` diberi `width` dan `height` agar tata letak tidak melompat saat gambar termuat |
| Video | Memakai `preload="none"` sehingga 4,7 MB berkas video tidak ikut diunduh sebelum pengunjung menekan putar |
| Pekerjaan tertunda | Grafik dan animasi angka baru dijalankan ketika elemennya benar-benar masuk layar, memakai `IntersectionObserver` |
| Pencarian | Penyaringan berita ditunda sepersekian detik (*debounce*) agar tidak dijalankan pada setiap ketukan tombol |

---

## 6. Penerapan Pemrograman Terstruktur

> Unit **J.620100.017.02** — Mengimplementasikan pemrograman terstruktur.

Pemrograman terstruktur diterapkan dengan memecah pekerjaan menjadi
fungsi-fungsi kecil yang jelas masukan dan keluarannya, lalu menyusun
tampilan lewat perulangan alih-alih penulisan berulang.

### 6.1 Fungsi murni pada `utils/format.ts`

Kelima fungsi berikut tidak menyentuh DOM, tidak membaca jam sistem, dan
tidak mengubah data yang diterimanya. Masukan yang sama selalu menghasilkan
keluaran yang sama.

| Fungsi | Tugas |
|---|---|
| `formatDate` | Mengubah `2026-08-19` menjadi `19 Agustus 2026` |
| `formatNumber` | Menyisipkan titik pemisah ribuan |
| `truncateText` | Memotong teks pada batas kata terdekat, bukan di tengah kata |
| `sortByNewest` | Mengurutkan berita dari terbaru; menyalin array lebih dulu agar data asli tidak berubah |
| `groupBy` | Mengelompokkan data berdasarkan satu bidang, dipakai menghitung isi tiap kategori galeri |

### 6.2 Perulangan menggantikan penulisan berulang

Tabel 22 baris, kartu berita, tile program keahlian, daftar menu, dan
seluruh penyaring kategori dibangun lewat `map` atas sebuah array. Tidak ada
satu pun daftar yang ditulis manual satu per satu.

### 6.3 Percabangan yang dipusatkan

Keputusan tampilan diletakkan pada satu tempat, bukan disebar. Contohnya
warna lencana kategori berita ditentukan lewat satu objek pemetaan yang
memiliki nilai cadangan, sehingga kategori baru tidak membuat tampilan rusak.

---

## 7. Perintah Eksekusi Berbasis Teks, Grafik, dan Multimedia

> Unit **J.620100.010.01** — Menerapkan perintah eksekusi bahasa pemrograman
> berbasis teks, grafik, dan multimedia.

### 7.1 Teks

Seluruh teks situs dibaca dari berkas JSON lalu diolah sebelum ditampilkan:
tanggal diubah ke bentuk Indonesia, angka diberi pemisah ribuan, dan
ringkasan berita dipotong pada batas kata agar tinggi seluruh kartu dalam
satu baris tetap sama.

### 7.2 Grafik

Dua jenis grafik dipakai:

1. **Grafik lingkaran Chart.js** pada elemen `<canvas>`, menampilkan
   komposisi 512 peserta didik laki-laki dan 386 perempuan, lengkap dengan
   keterangan persentase saat kursor menyentuh potongannya.
2. **Ilustrasi SVG** yang dihasilkan sendiri untuk sampul berita, foto
   galeri, foto kepala sekolah, dan logo. Seluruhnya berupa vektor sehingga
   tetap tajam pada ukuran berapa pun dan berukuran berkas sangat kecil.

### 7.3 Multimedia

Elemen `<video>` pada beranda memutar video profil sekolah berdurasi 20,5
detik, resolusi 1920×1080, 60 gambar per detik. Pemutarnya dilengkapi tombol
putar buatan sendiri yang menyembunyikan dirinya saat video berjalan dan
muncul kembali saat video dijeda.

Videonya bukan hasil rekaman kamera, melainkan **dibuat sendiri sebagai
animasi web** pada `motion/index.html`: enam adegan yang menyampaikan tahun
berdiri, identitas, program keahlian, jumlah peserta didik, jumlah mitra
industri, dan tagline sekolah. Seluruh gerakannya adalah fungsi dari waktu
timeline — tidak ada satu pun nilai acak atau pembacaan jam sistem —
sehingga setiap kali dirender hasilnya identik. Berkas MP4-nya dihasilkan
dengan merender tiap gambar satu per satu lalu menggabungkannya, bukan
dengan merekam layar, sehingga tidak ada gambar yang hilang.

---

## 8. Menggunakan Library atau Komponen Pre-Existing

> Unit **J.620100.019.02** — Menggunakan library atau komponen
> pre-existing.

Empat library pihak ketiga dipakai untuk mengerjakan hal yang sudah ada
penyelesaiannya, sehingga usaha dapat dipusatkan pada kebutuhan khas situs
ini.

| Library | Alasan dipilih | Penyesuaian yang dilakukan |
|---|---|---|
| **Swiper** | Pergantian gambar sampul yang mendukung sentuh dan papan ketik | Perputaran otomatis 5 detik, titik navigasi diberi warna sekolah, dijeda saat kursor menyentuh |
| **GLightbox** | Memperbesar foto tanpa berpindah halaman | Instansinya dibuat ulang setiap penyaringan berubah, supaya tombol berikutnya hanya berpindah di antara foto yang sedang terlihat |
| **AOS** | Animasi elemen saat masuk layar | Durasi dan jeda disetel per bagian; dimatikan bila pengguna meminta gerak dikurangi |
| **Chart.js** | Grafik pada `<canvas>` | Jenis doughnut, potongan tengah 62 %, keterangan diubah agar menampilkan jumlah siswa beserta persentasenya |

---

## 9. Hasil Debugging dan Penyelesaian Masalah Eror

Bagian ini mencatat masalah nyata yang ditemukan selama pengembangan
beserta penyebab dan penyelesaiannya.

| No | Gejala | Penyebab | Penyelesaian |
|---|---|---|---|
| 1 | Pada halaman selain beranda, menu utama tidak terbaca — teks putih di atas latar putih | Kelas `.solid` yang dipakai halaman dalam hanya menyetel warna latar. Aturan warna teks hanya ditulis untuk kelas `.scrolled` milik beranda, sehingga teksnya tetap putih | Pemilih `.scrolled` dan `.solid` digabung pada seluruh aturan warna teks, dan diberi komentar peringatan agar keduanya selalu diubah bersamaan |
| 2 | Setiap kartu galeri menyisakan strip terang di bagian bawahnya, di beranda maupun halaman galeri | Berkas gaya GLightbox memuat `img { height: auto }` **tanpa `@layer`**. Aturan tanpa layer selalu menang atas seluruh kelas utilitas Tailwind yang berlapis, berapa pun kekhususannya, sehingga `h-full` pada gambar tidak pernah berlaku dan gambar memakai tinggi alaminya | Ditelusuri dengan menghitung aturan mana yang benar-benar cocok pada elemen tersebut, lalu tinggi gambar dipaksa dengan penanda `!` pada lima gambar yang terdampak |
| 3 | Keterangan "Foto Kepala Sekolah" tidak terlihat pada gambar sementara | Teksnya berwarna putih namun diletakkan di atas siluet yang juga putih | Warna teks diubah menjadi biru tua |
| 4 | Judul foto tampil dua kali, dan membesar tidak wajar saat foto dibuka lewat lightbox | Judul kegiatan ikut digambar ke dalam berkas SVG, padahal kartu dan keterangan lightbox sudah menampilkannya | Teks dihapus dari sembilan berkas SVG galeri; ikonnya dipindah ke tengah dan diperbesar |
| 5 | Judul foto hanya muncul ketika kursor menyentuh kartu | Keterangan hanya ditampilkan pada keadaan `hover`, yang tidak pernah terjadi pada layar sentuh | Keterangan dibuat selalu terlihat di atas gradasi gelap |
| 6 | Audit Astro Dev Toolbar melaporkan "Unoptimized loading attribute" | Sebagian gambar belum menyatakan cara pemuatannya | Sembilan gambar ditinjau satu per satu: yang di bawah lipatan diberi `lazy`, yang di atas lipatan diberi `eager` beserta `fetchpriority="high"` |
| 7 | Pada animasi video profil, angka jumlah peserta didik dan dua label melenceng dari tengah bidang | Pemusatan dilakukan lewat `transform: translateX(-50%)` di CSS, sedangkan pustaka animasi menuliskan `transform` miliknya sendiri sehingga menimpanya | Pemusatan dipindahkan ke properti `xPercent` milik pustaka animasi, agar keduanya tidak saling menimpa |
| 8 | Sambungan antar adegan pada video terlihat sebagai kedipan kosong | Adegan berikutnya baru dimunculkan setelah efek sapuan selesai, sehingga yang tersapu adalah bidang kosong | Waktu masuk tiap adegan dimajukan sehingga isinya sudah ada di bawah sapuan |

### Penanganan galat yang disiapkan sejak awal

| Keadaan | Penanganan |
|---|---|
| Alamat tidak ditemukan | Halaman `404.astro` berbahasa Indonesia beserta tautan kembali ke menu utama, tanpa memunculkan pesan teknis |
| Berkas video belum tersedia | Pemanggilan `play()` ditangkap kegagalannya, lalu diganti keterangan yang ramah — bukan pesan galat di konsol |
| Kategori yang tidak dikenal | Pemetaan warna lencana memiliki nilai cadangan sehingga kategori baru tetap tampil rapi |
| Hasil penyaringan kosong | Setiap daftar yang dapat disaring punya pesan "belum ada data" tersendiri |
| Isian formulir tidak sah | Validasi dilakukan di sisi peramban dengan pesan galat spesifik per isian, bukan satu pesan umum |

---

## 10. Cara Menjalankan

Prasyarat: Bun atau Node.js terpasang.

```bash
# 1. Memasang seluruh library
bun install

# 2. Menjalankan mode pengembangan
bun run dev
# lalu buka http://localhost:4321

# 3. Membangun versi produksi
bun run build

# 4. Meninjau hasil build
bun run preview
```

Hasil `bun run build` berupa berkas HTML, CSS, JS, dan gambar statis di
dalam folder `dist/`, siap diunggah ke peladen mana pun tanpa memerlukan
basis data.

---

## 11. Tampilan Situs

---

## 12. Potongan Source Code

Bagian ini memuat potongan kode yang menjadi bukti langsung tiap unit
kompetensi.

### 12.1 User Interface — Menu Utama yang Interaktif

Daftar menu ditulis **sekali** sebagai array, lalu dipakai oleh menu layar
lebar maupun menu seluler. Halaman yang sedang dibuka ditandai dengan
membandingkan alamat saat ini terhadap alamat menu.

```astro
---
/** Daftar menu utama. Satu sumber kebenaran untuk navbar dan footer. */
const menu = [
  { label: 'Beranda', href: '/' },
  { label: 'Profil Sekolah', href: '/profil' },
  { label: 'Program Keahlian', href: '/program-keahlian' },
  { label: 'Ekstrakurikuler', href: '/ekstrakurikuler' },
  { label: 'Galeri', href: '/galeri' },
  { label: 'Berita', href: '/berita' },
  { label: 'Kontak', href: '/kontak' },
];

/**
 * Menentukan apakah sebuah menu sedang aktif.
 *
 * Perbandingan dilakukan tanpa garis miring di akhir supaya "/profil" dan
 * "/profil/" dianggap sama.
 */
const path = Astro.url.pathname.replace(/\/+$/, '') || '/';
const isActive = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));
---

<ul id="menu-desktop" class="hidden items-center gap-1 lg:flex">
  {menu.map((item) => (
    <li>
      <a href={item.href} class="nav-link" data-active={isActive(item.href)}>
        {item.label}
      </a>
    </li>
  ))}
</ul>
```

### 12.2 User Interface — Menu Berubah Saat Digulir

```ts
/**
 * Perilaku interaktif navbar.
 *
 * Dibungkus dalam satu fungsi agar tidak mencemari lingkup global, dan
 * dijalankan ulang pada setiap perpindahan halaman.
 */
function setupNavbar(): void {
  const navbar = document.getElementById('navbar');
  const toggle = document.getElementById('menu-toggle');
  const panel = document.getElementById('menu-mobile');
  const openIcon = document.getElementById('icon-open');
  const closeIcon = document.getElementById('icon-close');

  if (!navbar || !toggle || !panel || !openIcon || !closeIcon) return;

  // Halaman selain beranda tidak punya gambar sampul, sehingga navbar
  // harus langsung solid agar tulisannya terbaca.
  const onHome = (window.location.pathname.replace(/\/+$/, '') || '/') === '/';
  if (!onHome) navbar.classList.add('solid');

  /** Menambah latar solid begitu halaman digulir melewati 20 piksel. */
  function updateBackground(): void {
    if (!onHome) return;
    navbar!.classList.toggle('scrolled', window.scrollY > 20);
  }

  /** Membuka atau menutup panel menu pada layar sempit. */
  function toggleMenu(): void {
    const isOpen = !panel!.classList.contains('hidden');
    panel!.classList.toggle('hidden', isOpen);
    openIcon!.classList.toggle('hidden', !isOpen);
    closeIcon!.classList.toggle('hidden', isOpen);
    toggle!.setAttribute('aria-expanded', String(!isOpen));

    // Saat panel terbuka, navbar wajib solid agar menu terbaca.
    if (!isOpen) navbar!.classList.add('scrolled');
    else updateBackground();
  }

  updateBackground();
  window.addEventListener('scroll', updateBackground, { passive: true });
  toggle.addEventListener('click', toggleMenu);
}
```

> Catatan perbaikan: aturan warna teks harus ditulis untuk `.scrolled`
> **dan** `.solid` sekaligus. Sempat terjadi teks putih di atas latar putih
> karena `.solid` hanya mengubah warna latar.

### 12.3 Pemrograman Terstruktur — Fungsi Murni

```ts
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/**
 * Mengubah tanggal ISO menjadi bentuk yang lazim dibaca di Indonesia.
 *
 * @param isoDate Tanggal dalam bentuk `YYYY-MM-DD`.
 * @returns Contoh: `19 Agustus 2026`.
 */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

/**
 * Memotong teks yang terlalu panjang dan menambahkan elipsis.
 *
 * Pemotongan dilakukan pada batas kata terdekat agar tidak memutus kata
 * di tengah-tengah.
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
 */
export function sortByNewest<T extends { tanggal: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}
```

### 12.4 Pemrograman Terstruktur — Tabel Informasi Profil Sekolah

Tabel 22 baris tidak ditulis satu per satu, melainkan dihasilkan lewat
perulangan atas sebuah array.

```astro
---
/**
 * Isi Tabel Informasi Profil Sekolah.
 *
 * Disusun sebagai array objek agar tabelnya dihasilkan lewat perulangan.
 * Inilah penerapan pemrograman terstruktur pada sisi tampilan.
 */
const profileRows = [
  { label: 'Nama Sekolah', value: identitas.nama },
  { label: 'NPSN', value: identitas.npsn },
  { label: 'Bentuk Pendidikan', value: identitas.bentukPendidikan },
  { label: 'Status Sekolah', value: identitas.statusSekolah },
  { label: 'Akreditasi', value: identitas.akreditasi, highlight: true },
  { label: 'Tahun Berdiri', value: String(identitas.tahunBerdiri) },
  // ... 16 baris lainnya
];
---

<table class="w-full border-collapse text-left text-[14.5px]">
  <caption class="sr-only">Tabel informasi profil {identitas.nama}</caption>

  <thead>
    <tr class="bg-navy-800 text-white">
      <th scope="col" class="w-16 px-5 py-3.5 text-center font-semibold">No</th>
      <th scope="col" class="px-5 py-3.5 font-semibold">Keterangan</th>
      <th scope="col" class="px-5 py-3.5 font-semibold">Informasi</th>
    </tr>
  </thead>

  <tbody>
    {profileRows.map((row, i) => (
      <tr class={`border-t border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/70' : ''}`}>
        <td class="px-5 py-3 text-center text-slate-500">{i + 1}</td>
        <th scope="row" class="px-5 py-3 font-semibold text-navy-900">
          {row.label}
        </th>
        <td class={`px-5 py-3 ${row.highlight ? 'font-bold text-amber-deep' : 'text-slate-700'}`}>
          {row.value}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

### 12.5 Grafik — Chart.js pada Elemen `<canvas>`

Grafik baru digambar ketika elemennya masuk layar, agar peramban tidak
mengerjakan sesuatu yang belum terlihat pengunjung.

```ts
import Chart from 'chart.js/auto';

const canvas = document.getElementById('grafik-siswa') as HTMLCanvasElement | null;
if (!canvas) return;

const male = Number(canvas.dataset.male ?? 0);
const female = Number(canvas.dataset.female ?? 0);

const chartObserver = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;

      new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: ['Laki-male', 'Perempuan'],
          datasets: [{
            data: [male, female],
            backgroundColor: ['#38bdf8', '#f5a524'],
            borderWidth: 0,
            hoverOffset: 10,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '62%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#c6d8ef', boxWidth: 12, padding: 16, font: { size: 12 } },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const value = ctx.parsed as number;
                  const percent = ((value / (male + female)) * 100).toFixed(1);
                  return ` ${ctx.label}: ${value} siswa (${percent}%)`;
                },
              },
            },
          },
        },
      });

      chartObserver.unobserve(e.target);
    }
  },
  { threshold: 0.3 },
);

chartObserver.observe(canvas);
```

### 12.6 Teks — Angka yang Menghitung Naik

```ts
/**
 * Menghitung angka dari nol sampai nilai tujuan.
 *
 * @param element Elemen tempat angka ditampilkan.
 */
function countUp(element: HTMLElement): void {
  const target = Number(element.dataset.value ?? 0);
  const duration = 1400;
  const start = performance.now();

  function step(now: number): void {
    const progress = Math.min((now - start) / duration, 1);
    // Perlambatan di akhir agar terasa halus.
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(target * eased).toLocaleString('id-ID');

    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}
```

### 12.7 Library — GLightbox Disegarkan Mengikuti Penyaringan

Ini penyesuaian yang paling menentukan pada penggunaan library: tanpa
membuat ulang instansinya, tombol "berikutnya" tetap berpindah ke foto yang
sedang disembunyikan.

```ts
import GLightbox from 'glightbox';
import 'glightbox/dist/css/glightbox.min.css';

let lightbox = GLightbox({ selector: '.item-galeri:not(.hidden)', touchNavigation: true, loop: true });

/**
 * Menyaring foto berdasarkan kategori terpilih.
 *
 * @param choice Nama kategori, atau "Semua".
 */
function applyFilter(choice: string): void {
  let visible = 0;

  items.forEach((item) => {
    const matches = choice === 'Semua' || item.dataset.category === choice;
    item.classList.toggle('hidden', !matches);
    if (matches) visible += 1;
  });

  emptyMessage!.classList.toggle('hidden', visible > 0);

  // Segarkan daftar foto yang dikenali lightbox.
  lightbox.destroy();
  lightbox = GLightbox({ selector: '.item-galeri:not(.hidden)', touchNavigation: true, loop: true });
}
```

### 12.8 Library — Pencarian Berita dengan Penundaan

```ts
let debounceTimer: number | undefined;

function applyFilter(keyword: string): void {
  const query = keyword.trim().toLowerCase();
  let visible = 0;

  items.forEach((item) => {
    const title = item.dataset.title ?? '';
    const category = item.dataset.category ?? '';
    const matches = query === '' || title.includes(query) || category.includes(query);

    item.classList.toggle('hidden', !matches);
    if (matches) visible += 1;
  });

  info!.textContent = query === ''
    ? `Menampilkan ${items.length} berita.`
    : `Ditemukan ${visible} berita untuk "${keyword.trim()}".`;

  emptyMessage!.classList.toggle('hidden', visible > 0);
}

// Penyaringan ditunda agar tidak dijalankan pada setiap ketukan tombol.
input.addEventListener('input', () => {
  window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => applyFilter(input.value), 180);
});
```

### 12.9 Validasi Formulir Kontak

Validasi ditulis sebagai aturan berupa data, bukan sebagai rentetan
percabangan. Menambah isian baru berarti menambah satu baris aturan.

```ts
/** Aturan validasi per nama kolom. */
const rules: Record<string, (value: string) => string | null> = {
  nama: (value) => {
    if (value.trim() === '') return 'Nama lengkap wajib diisi.';
    if (value.trim().length < 3) return 'Nama lengkap minimal 3 karakter.';
    return null;
  },
  email: (value) => {
    if (value.trim() === '') return 'Alamat surel wajib diisi.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()))
      return 'Format alamat surel tidak valid.';
    return null;
  },
  subjek: (value) => (value === '' ? 'Keperluan wajib dipilih.' : null),
  pesan: (value) => {
    if (value.trim() === '') return 'Pesan wajib diisi.';
    if (value.trim().length < 10) return 'Pesan minimal 10 karakter.';
    return null;
  },
};
```

### 12.10 Multimedia — Pemutar Video dengan Tombol Buatan Sendiri

```ts
/**
 * Menghubungkan tombol putar buatan sendiri dengan elemen <video> bawaan.
 *
 * Tombol disembunyikan saat video berjalan dan ditampilkan lagi ketika
 * video dijeda atau selesai, sehingga tampilannya selalu sesuai keadaan.
 */
function setupVideo(): void {
  const video = document.getElementById('video-profil') as HTMLVideoElement | null;
  const button = document.getElementById('button-putar');

  if (!video || !button) return;

  /** Menyembunyikan atau menampilkan tombol putar. */
  function toggleOverlay(hide: boolean): void {
    button!.classList.toggle('hidden', hide);
  }

  button.addEventListener('click', () => {
    // play() mengembalikan Promise; kegagalannya ditangkap agar tidak
    // memunculkan pesan error di konsol ketika berkas video belum ada.
    video.play().catch(() => {
      button.innerHTML =
        '<span class="...">Berkas video belum tersedia</span>';
    });
  });

  video.addEventListener('play', () => toggleOverlay(true));
  video.addEventListener('pause', () => toggleOverlay(false));
  video.addEventListener('ended', () => toggleOverlay(false));
}
```

---

## 13. Penutup

Seluruh ketentuan pada skenario Tugas Praktik Demonstrasi telah dipenuhi:
situs sekolah dengan menu utama yang interaktif, tujuh menu yang
masing-masing memiliki halaman tersendiri, halaman utama yang memuat berita
kegiatan, galeri, serta informasi jumlah guru dan siswa, dan Tabel Informasi
Profil Sekolah pada menu Profil Sekolah.

Di luar itu, keenam unit kompetensi pada Kelompok Pekerjaan 1 dan 2 memiliki
bukti langsung di dalam kode: antarmuka yang interaktif, perintah eksekusi
berbasis teks, grafik, dan multimedia, organisasi berkas yang dipisahkan
menurut peran, penulisan kode yang mengikuti guidelines, pemrograman
terstruktur lewat fungsi murni dan perulangan, serta pemanfaatan enam
library pre-existing.
