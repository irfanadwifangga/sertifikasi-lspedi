# DOKUMENTASI KODE PROGRAM

**Tugas Praktik Demonstrasi (TPD)** Kelompok Pekerjaan 2 — Debugging & Dokumentasi Program

|                       |                                                                |
| --------------------- | -------------------------------------------------------------- |
| **Nama Asesi**        | Irfana Dwi Fangga                                              |
| **Nama Aplikasi**     | SIPERPUS — Sistem Informasi Peminjaman Buku                    |
| **Skema Sertifikasi** | Pemrogram Junior (Junior Coder) |
| **Nomor Skema** | 16-05/SSO/020502/X/2021 |
| **Jenis Skema** | Okupasi — Level KKNI 2 |
| **Lembaga Sertifikasi** | LSP Entrepreneur Digital Indonesia |
| **Tempat Uji Kompetensi** | POLINELA, Bandar Lampung |
| **Tanggal** | 26 Agustus 2026                                                |
| **Repository**        | https://github.com/irfanadwifangga/sertifikasi-lspedi                                     |

---

## 1. Ringkasan Aplikasi

SIPERPUS adalah aplikasi web pengelolaan peminjaman buku perpustakaan yang dibangun memakai framework **NestJS** dengan bahasa **TypeScript**. Aplikasi terdiri atas **8 halaman** (melebihi syarat minimal 5 halaman) dan menyimpan datanya pada basis data **PostgreSQL** melalui ORM **TypeORM**.

Aplikasi mengelola dua entitas yang saling berelasi — **Buku** dan **Peminjaman** — sehingga operasi basis datanya mencakup relasi antar tabel (JOIN), kunci asing (foreign key), serta transaksi ACID untuk menjaga konsistensi stok buku.

Fitur utama:

- Dashboard berisi kartu statistik dan dua grafik interaktif (Chart.js)
- Manajemen data buku lengkap (Create, Read, Update, Delete) dengan pencarian
- Pencatatan transaksi peminjaman dengan pengurangan stok otomatis
- Pemrosesan pengembalian buku disertai **perhitungan denda keterlambatan**
- Pengubahan transaksi: koreksi identitas, perpanjangan jatuh tempo, dan
  **perubahan status peminjaman** yang ikut menyesuaikan stok buku
- Pencetakan **Laporan Peminjaman dalam format PDF** per periode
- Pengiriman **notifikasi surel** (bukti peminjaman & pengingat jatuh tempo)

Seluruh sistem dijalankan melalui **Docker Compose** yang terdiri atas empat container: web server Nginx, aplikasi NestJS, database server PostgreSQL, dan server surel Mailpit.

---

## 2. Hasil Debugging dan Pengujian

### 2.1 Bug yang ditemukan dan diperbaiki selama pengembangan

| No | Gejala | Penyebab | Perbaikan |
| --- | --- | --- | --- |
| 1 | Aplikasi gagal menyala dengan error `hbs.registerPartials is not a function` | Modul `hbs` bergaya CommonJS diimpor sebagai namespace (`import * as hbs`), sehingga TypeScript membungkusnya dengan `__importStar` dan method aslinya tidak terekspos | Diubah menjadi default import (`import hbs from 'hbs'`) pada `main.ts` dan `hbs-helpers.ts` |
| 2 | Kolom Kode dan tanggal pada laporan PDF terpotong menjadi dua baris | Lebar kolom tabel PDF lebih sempit daripada teks terpanjang (`PJM-20260811-001`, `1 September 2026`) | Lebar kolom disesuaikan dan ukuran huruf tabel diturunkan menjadi 8pt pada `pdf.service.ts` |
| 3 | Objek `Date` acuan penomoran kode transaksi ikut termutasi | Pemanggilan `setHours()` mengubah objek tanggal aslinya | Ditambahkan fungsi murni `awalHari()` dan `akhirHari()` yang selalu mengembalikan objek `Date` baru |
| 4 | Kedua grafik dashboard mati setelah berkas diformat ulang | Prettier memperlakukan isi `<script>` di dalam berkas `.hbs` sebagai teks biasa dan mengalirkannya seperti paragraf, sehingga tidak lagi berupa JavaScript valid | Skrip dipindahkan ke berkas `public/js/dashboard.js`; data dikirim lewat atribut `data-*` pada elemen `<canvas>` |
| 5 | Pesan error PostgreSQL berbahasa Inggris bocor ke layar pengguna saat menghapus buku | Penjaga penghapusan hanya memeriksa buku yang *sedang* dipinjam, padahal batasan `ON DELETE RESTRICT` juga menolak buku yang punya riwayat transaksi selesai | Ditambahkan pemeriksaan lapis kedua atas jumlah riwayat transaksi pada `book.service.ts`, dengan pesan berbahasa Indonesia |
| 6 | Error kompilasi `Property 'stack' does not exist on type 'unknown'` | Variabel pada blok `catch` bertipe `unknown`; mengakses `.message`/`.stack` secara langsung tidak aman karena JavaScript mengizinkan `throw` atas nilai apa pun | Dibuat fungsi bantu `errorMessage()` dan `errorStack()` di `common/error.ts`; opsi `useUnknownInCatchVariables` diaktifkan agar kesalahan sejenis tertangkap saat build |
| 7 | Setiap permintaan ke alamat yang tidak ada (termasuk `/favicon.ico`) tercatat di log sebagai ERROR beserta stack trace penuh | Penangkap error memperlakukan seluruh status secara sama, padahal 4xx adalah kesalahan sisi permintaan dan bukan kegagalan server | Bobot log dipisah: 4xx dicatat sebagai peringatan satu baris, 5xx tetap lengkap dengan stack trace. Ikon `favicon.svg` juga ditambahkan dan dirujuk eksplisit dari `<head>` |
| 8 | Badge status pada seluruh tabel selalu berwarna abu-abu, dan halaman detail transaksi yang masih dipinjam justru menampilkan keterangan "sudah dikembalikan" | Templat memanggil method entitas secara langsung. Handlebars 4.6+ memblokir akses ke anggota di prototype (`{{#if loan.isOngoing}}` bernilai `undefined`), dan argumen helper menerima FUNGSI-nya, bukan hasil pemanggilan (`{{statusColor this.displayStatus}}`) | Ditambahkan method `toView()` pada entitas Loan yang mengubah hasil method domain menjadi properti biasa; seluruh controller memetakan entitas melalui method ini sebelum mengirimkannya ke templat |
| 9 | Halaman error menampilkan pesan campur dua bahasa ("Error 404" dengan "Cannot GET /alamat"), memajang perintah `docker compose logs -f app` kepada pengguna akhir, dan berpotensi membocorkan pesan error basis data | Penangkap error meneruskan `exception.message` apa adanya ke tampilan, termasuk pesan bawaan framework berbahasa Inggris dan pesan error internal PostgreSQL | Ditambahkan pemetaan judul dan keterangan berbahasa Indonesia per kode status; pesan bawaan framework disaring, error 5xx tidak pernah menampilkan pesan aslinya, dan blok perintah Docker dihapus dari tampilan |

### 2.2 Mekanisme penanganan error

Aplikasi memasang **penangkap error terpusat** (`AllExceptionsFilter`) yang mencatat setiap error ke log server lengkap dengan metode HTTP, URL, dan stack trace, lalu menampilkan halaman error yang ramah kepada pengguna. Log dapat ditelusuri dengan perintah:

```bash
docker compose logs -f app
```

### 2.3 Hasil pengujian unit otomatis

Pengujian dijalankan dengan `bun run test` dan seluruhnya berhasil:

```
PASS src/common/error.spec.ts
PASS src/common/date.spec.ts
PASS src/book/book.entity.spec.ts
PASS src/loan/loan.service.spec.ts

Test Suites: 4 passed, 4 total
Tests:       55 passed, 55 total
```

Cakupan pengujian:

| Berkas Uji | Jml | Yang diuji |
| --- | --- | --- |
| `loan.service.spec.ts` | 26 | Perhitungan denda (tepat waktu, lebih awal, terlambat, lintas bulan, tarif berbeda), pembentukan kode transaksi, perilaku entitas Loan, pengaruh perubahan status terhadap stok, dan penyiapan data untuk templat (`toView`) |
| `book.entity.spec.ts` | 8 | Aturan stok: tidak boleh negatif, tidak boleh melebihi stok total, konsistensi setelah rangkaian pinjam–kembali |
| `date.spec.ts` | 13 | Selisih hari, penambahan hari, normalisasi jam, format tanggal Indonesia, format Rupiah |
| `error.spec.ts` | 8 | Ketahanan penanganan error terhadap nilai selain `Error` (string, angka, null, objek biasa) |

### 2.4 Hasil pengujian manual (black box)

| No | Skenario | Hasil yang Diharapkan | Status |
| --- | --- | --- | --- |
| 1 | Buka seluruh 7 halaman | Semua merespons HTTP 200 | ✅ |
| 2 | Simpan buku dengan form kosong | Muncul 5 pesan validasi, data tidak tersimpan | ✅ |
| 3 | Simpan buku dengan kode duplikat | Ditolak dengan pesan "Kode buku sudah digunakan" | ✅ |
| 4 | Simpan buku dengan data valid | Tersimpan, dialihkan ke daftar buku | ✅ |
| 5 | Pinjam buku | Stok tersedia berkurang 1, kode transaksi terbentuk otomatis | ✅ |
| 6 | Pinjam dengan email tidak valid | Ditolak dengan pesan "Format email tidak valid" | ✅ |
| 7 | Kembalikan buku terlambat 5 hari | Denda tercatat Rp 5.000, stok bertambah 1 | ✅ |
| 8 | Kembalikan buku yang sudah dikembalikan | Ditolak dengan pesan peringatan | ✅ |
| 8a | Ubah status Dipinjam → Dikembalikan | Tanggal kembali terisi, denda dihitung, stok +1 | ✅ |
| 8b | Perpanjang jatuh tempo pada transaksi selesai | Denda dihitung ulang (Rp 3.000 → Rp 0) | ✅ |
| 8c | Ubah status Dikembalikan → Dipinjam | Tanggal kembali dikosongkan, denda direset, stok −1 | ✅ |
| 8d | Ubah status ke Dipinjam saat stok habis | Ditolak, seluruh perubahan di-rollback | ✅ |
| 8e | Ubah jatuh tempo mendahului tanggal pinjam | Ditolak dengan pesan validasi | ✅ |
| 9 | Hapus buku yang sedang dipinjam | Ditolak dengan pesan "sedang dipinjam" | ✅ |
| 10 | Hapus buku yang punya riwayat transaksi selesai | Ditolak dengan pesan berbahasa Indonesia, bukan error PostgreSQL | ✅ |
| 11 | Hapus buku tanpa riwayat transaksi | Berhasil dihapus | ✅ |
| 12 | Cetak laporan PDF | Berkas PDF terunduh, isi tabel dan ringkasan sesuai | ✅ |
| 13 | Kirim surel pengingat | Surel masuk ke kotak masuk Mailpit | ✅ |
| 14 | Akses alamat yang tidak ada | Tampil "Halaman Tidak Ditemukan" berbahasa Indonesia | ✅ |
| 14a | Akses ID transaksi yang tidak ada | Menampilkan pesan buatan aplikasi: "Transaksi dengan ID 9999 tidak ditemukan." | ✅ |
| 14b | Akses ID transaksi bukan angka | Pesan bawaan framework disaring, diganti keterangan Bahasa Indonesia | ✅ |
| 14c | Error 5xx pada sisi server | Pengguna hanya menerima keterangan umum; pesan asli PostgreSQL tetap tercatat di log | ✅ |
| 15 | Badge status pada dashboard, tabel transaksi, dan laporan | Hijau (Dikembalikan), kuning (Dipinjam), merah (Terlambat) | ✅ |
| 16 | Detail transaksi pada tiga kondisi berbeda | Alert kuning/merah/hijau sesuai kondisi, tombol aksi muncul hanya saat masih dipinjam | ✅ |

---

## 3. Dokumentasi Program

### a. Tools Software Pemrograman yang Digunakan

| Kategori           | Perangkat Lunak         | Versi           |
| ------------------ | ----------------------- | --------------- |
| Framework Utama    | NestJS                  | 11.2.1          |
| Runtime            | Node.js                 | 22 (Alpine)     |
| Manajer Paket      | Bun                     | 1.3.14          |
| Database Server    | PostgreSQL              | 16 (Alpine)     |
| Web Server         | Nginx                   | 1.27 (Alpine)   |
| Server Surel (uji) | Mailpit                 | 1.31.0          |
| Kontainerisasi     | Docker & Docker Compose | 29.7.2 / v5.4.0 |
| Kerangka Pengujian | Jest                    | 29.7            |
| Kompilator         | TypeScript              | 5.9.3           |
| Text Editor        | Visual Studio Code      | 1.134           |
| Version Control    | Git                     | 2.55            |

### b. Bahasa Pemrograman yang Digunakan

| Lapisan | Bahasa | Keterangan |
| --- | --- | --- |
| Backend / Logika Inti | **TypeScript 5.9** | Menerapkan OOP penuh: kelas abstrak, pewarisan, enkapsulasi, interface, decorator, dan dependency injection |
| Basis Data | **SQL (PostgreSQL)** | Diakses lewat TypeORM Repository & Query Builder (prepared statement) |
| Tampilan | **HTML5 + Handlebars (.hbs)** | Server-Side Rendering |
| Gaya Tampilan | **CSS3** | 286 baris gaya kustom di atas Bootstrap 5 |
| Interaksi Peramban | **JavaScript (Vanilla)** | Inisialisasi grafik Chart.js |
| Infrastruktur | **Dockerfile & YAML** | Definisi container dan orkestrasi |

**Statistik kode:** 3.176 baris TypeScript (29 berkas), 538 baris kode uji (4 berkas), 1.240 baris templat Handlebars (10 berkas), serta CSS, JavaScript, dan SVG sisi peramban (3 berkas).

### c. Library, Komponen Pre-Existing, dan Framework yang Digunakan

| No | Library / Komponen | Versi | Fungsi dalam Aplikasi |
| --- | --- | --- | --- |
| 1 | **pdfmake** | 0.2.23 | Mencetak Laporan Peminjaman menjadi berkas PDF (`pdf.service.ts`) |
| 2 | **Nodemailer** | 6.10.1 | Mengirim surel bukti peminjaman dan pengingat jatuh tempo (`mail.service.ts`) |
| 3 | **class-validator** | 0.14.4 | Validasi input berbasis decorator pada kelas DTO |
| 4 | **class-transformer** | 0.5.1 | Konversi data mentah form HTML menjadi instance kelas DTO bertipe benar |
| 5 | **TypeORM** | 0.3.31 | Object-Relational Mapping, relasi antar tabel, dan transaksi basis data |
| 6 | **@nestjs/core, common, platform-express** | 11.2.1 | Framework aplikasi: routing, modul, dependency injection |
| 7 | **@nestjs/config** | 4.0.4 | Pembacaan variabel lingkungan (kredensial basis data & surel) |
| 8 | **hbs (Handlebars)** | 4.2.1 | Mesin templat untuk merender halaman HTML di sisi server |
| 9 | **pg** | 8.23.0 | Driver koneksi PostgreSQL |
| 10 | **Bootstrap** | 5.3.3 | Kerangka kerja CSS untuk tata letak dan komponen antarmuka |
| 11 | **Bootstrap Icons** | 1.11.3 | Kumpulan ikon antarmuka |
| 12 | **Chart.js** | 4.5.1 | Grafik batang dan grafik lingkaran pada dashboard |
| 13 | **Jest + ts-jest** | 29.x | Kerangka kerja pengujian unit |

> **Catatan teknis:** Bootstrap, Bootstrap Icons, dan Chart.js **tidak dimuat dari CDN**, melainkan disalin ke direktori `public/vendor/` saat proses build Docker. Dengan begitu tampilan aplikasi tetap utuh walaupun lokasi uji tidak memiliki koneksi internet.

### d. Dokumen Kode Program yang Dibuat

#### A. Lapisan Entitas & Basis Data

| No | Nama Berkas | Deskripsi / Fungsi |
| --- | --- | --- |
| 1 | `src/common/entities/base.entity.ts` | Kelas **abstrak** induk berisi `id`, `createdAt`, `updatedAt`. Diwarisi seluruh entitas |
| 2 | `src/book/book.entity.ts` | Entitas tabel `books`. Berisi enum `BookCategory`, relasi One-to-Many, serta method domain `isBorrowable()`, `decreaseStock()`, `increaseStock()`, `borrowedCount()` |
| 3 | `src/loan/loan.entity.ts` | Entitas tabel `loans`. Relasi Many-to-One ke Book dengan `onDelete: RESTRICT`, serta method `overdueDays()`, `isOverdue()`, `displayStatus()` |

#### B. Lapisan Logika Bisnis (Service)

| No | Nama Berkas | Deskripsi / Fungsi |
| --- | --- | --- |
| 4 | `src/book/book.service.ts` | CRUD buku, pencarian, agregasi per kategori (`GROUP BY`), validasi stok saat perubahan data |
| 5 | `src/loan/loan.service.ts` | Inti aplikasi. Method **statis** `calculateFine()`, `buildCode()`, dan `stockEffect()`; `borrow()`, `returnBook()`, dan `update()` dibungkus **transaksi basis data** |
| 6 | `src/mail/mail.service.ts` | Pembungkus library Nodemailer. Mengirim bukti peminjaman dan pengingat jatuh tempo |
| 7 | `src/report/pdf.service.ts` | Pembungkus library pdfmake. Menyusun struktur dokumen dan mencetaknya menjadi Buffer PDF |
| 8 | `src/seed/seed.service.ts` | Mengisi 10 buku dan 5 transaksi contoh saat aplikasi pertama dijalankan |

#### C. Lapisan Pengendali (Controller) — 7 Halaman

| No | Nama Berkas | Halaman yang Ditangani |
| --- | --- | --- |
| 9 | `src/dashboard/dashboard.controller.ts` | **Halaman 1** — Dashboard |
| 10 | `src/book/book.controller.ts` | **Halaman 2** — Data Buku, **Halaman 3** — Form Buku |
| 11 | `src/loan/loan.controller.ts` | **Halaman 4** — Transaksi, **Halaman 5** — Form Peminjaman, **Halaman 6** — Detail, **Halaman 8** — Form Ubah Transaksi |
| 12 | `src/report/report.controller.ts` | **Halaman 7** — Laporan & Cetak PDF |

#### D. Lapisan DTO (Data Transfer Object)

| No | Nama Berkas | Deskripsi / Fungsi |
| --- | --- | --- |
| 13 | `src/book/dto/create-book.dto.ts` | Aturan validasi penambahan buku (decorator `@IsNotEmpty`, `@IsInt`, `@Min`, `@Max`, `@IsEnum`) |
| 14 | `src/book/dto/update-book.dto.ts` | **Mewarisi** `CreateBookDto` dengan `extends` (prinsip DRY) |
| 15 | `src/loan/dto/create-loan.dto.ts` | Aturan validasi transaksi peminjaman termasuk `@IsEmail` |
| 16 | `src/loan/dto/update-loan.dto.ts` | Aturan validasi pengubahan transaksi: identitas, jatuh tempo (`@IsISO8601`), dan status (`@IsEnum`) |

#### E. Modul & Titik Masuk

| No | Nama Berkas | Deskripsi / Fungsi |
| --- | --- | --- |
| 17 | `src/app.module.ts` | Modul akar. Konfigurasi koneksi PostgreSQL dari variabel lingkungan |
| 18 | `src/main.ts` | Titik masuk. Menyiapkan Handlebars, aset statis, dan penangkap error global |
| 19–24 | `book.module.ts`, `loan.module.ts`, `dashboard.module.ts`, `report.module.ts`, `mail.module.ts`, `seed.module.ts` | Pengelompokan komponen per fitur |

#### F. Komponen Bersama (Common)

| No | Nama Berkas | Deskripsi / Fungsi |
| --- | --- | --- |
| 25 | `src/common/date.ts` | Fungsi murni: `startOfDay`, `endOfDay`, `addDays`, `diffInDays`, `formatDate`, `formatIsoDate`, `formatCurrency`, dan `DateTransformer` |
| 26 | `src/common/validation.ts` | Pembungkus class-validator + class-transformer untuk validasi form HTML |
| 27 | `src/common/error.ts` | Fungsi `errorMessage()` dan `errorStack()` — penanganan aman atas nilai bertipe `unknown` pada blok `catch` |
| 28 | `src/common/hbs-helpers.ts` | 10 helper Handlebars: `eq`, `ne`, `gt`, `inc`, `multiply`, `formatDate`, `isoDate`, `currency`, `statusColor`, `categoryColor`, `stockColor` |
| 29 | `src/common/filters/all-exceptions.filter.ts` | Penangkap error terpusat — bukti unit **Melakukan Debugging** |

#### G. Lapisan Tampilan (Views) & Aset

| No | Nama Berkas | Deskripsi / Fungsi |
| --- | --- | --- |
| 30 | `views/layouts/main.hbs` | Kerangka utama: sidebar, topbar, area notifikasi, footer |
| 31 | `views/dashboard.hbs` | Halaman 1 — kartu statistik, 2 grafik Chart.js, transaksi terbaru |
| 32 | `views/book/index.hbs` | Halaman 2 — tabel koleksi buku + pencarian |
| 33 | `views/book/form.hbs` | Halaman 3 — form tambah **dan** ubah (satu templat dua fungsi) |
| 34 | `views/loan/index.hbs` | Halaman 4 — tabel transaksi + filter status |
| 35 | `views/loan/form.hbs` | Halaman 5 — form peminjaman buku |
| 36 | `views/loan/detail.hbs` | Halaman 6 — detail transaksi + aksi pengembalian |
| 37 | `views/loan/form-edit.hbs` | Halaman 8 — form ubah transaksi (identitas, jatuh tempo, status) |
| 38 | `views/report/index.hbs` | Halaman 7 — filter periode, cetak PDF, kirim pengingat |
| 39 | `views/error.hbs` | Halaman error |
| 40 | `public/css/app.css` | Gaya kustom aplikasi (tata letak sidebar, kartu, tabel) |
| 41 | `public/js/dashboard.js` | Skrip Chart.js halaman dashboard, dipisahkan dari templat agar tetap berupa JavaScript murni |
| 42 | `public/img/favicon.svg` | Ikon tab peramban, dirujuk eksplisit dari `<head>` |

#### H. Pengujian Unit

| No | Nama Berkas | Jml Uji |
| --- | --- | --- |
| 43 | `src/loan/loan.service.spec.ts` | 26 |
| 44 | `src/common/date.spec.ts` | 13 |
| 45 | `src/book/book.entity.spec.ts` | 8 |
| 46 | `src/common/error.spec.ts` | 8 |

#### I. Konfigurasi & Infrastruktur

| No | Nama Berkas | Deskripsi / Fungsi |
| --- | --- | --- |
| 47 | `docker-compose.yml` | Orkestrasi 4 container: nginx, app, db, mailpit |
| 48 | `Dockerfile` | Build 4 tahap: dependensi (Bun) → dependensi produksi → kompilasi → image akhir |
| 49 | `nginx/default.conf` | Konfigurasi web server sebagai reverse proxy ke port 3000 |
| 50 | `jest.config.js` | Konfigurasi kerangka pengujian |
| 51 | `tsconfig.json` | Konfigurasi kompilator TypeScript (decorator, metadata, dan `useUnknownInCatchVariables` aktif) |
| 52 | `.prettierrc`, `.prettierignore` | Penyeragaman gaya penulisan kode; direktori `views/` dikecualikan agar sintaks templat tidak rusak |

---

## 4. Struktur Basis Data

### Tabel `books`

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | integer | Primary key, auto increment |
| `code` | varchar(20) | **UNIQUE** — contoh: BK-001 |
| `title` | varchar(150) | NOT NULL — judul buku |
| `author` | varchar(100) | NOT NULL — pengarang |
| `publisher` | varchar(100) | NULL — penerbit |
| `published_year` | integer | NOT NULL — tahun terbit |
| `category` | enum | Umum, Teknologi, Sains, Sejarah, Fiksi |
| `stock` | integer | Total eksemplar |
| `available` | integer | Eksemplar yang siap dipinjam |
| `created_at`, `updated_at` | timestamp | Kolom audit dari `BaseEntity` |

### Tabel `loans`

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | integer | Primary key, auto increment |
| `code` | varchar(30) | **UNIQUE** — contoh: PJM-20260825-001 |
| `borrower_name` | varchar(100) | NOT NULL — nama peminjam |
| `borrower_email` | varchar(120) | NOT NULL — surel peminjam |
| `book_id` | integer | **FOREIGN KEY** → `books(id)` ON DELETE RESTRICT |
| `borrowed_at` | date | NOT NULL — tanggal pinjam |
| `due_at` | date | NOT NULL — tanggal jatuh tempo |
| `returned_at` | date | NULL selama buku belum dikembalikan |
| `status` | enum | Dipinjam, Dikembalikan |
| `fine` | integer | Denda keterlambatan dalam rupiah |
| `created_at`, `updated_at` | timestamp | Kolom audit dari `BaseEntity` |

**Relasi:** satu baris `books` memiliki banyak baris `loans` (One-to-Many);
satu baris `loans` merujuk tepat satu baris `books` (Many-to-One). Batasan
`ON DELETE RESTRICT` mencegah penghapusan buku yang masih memiliki riwayat
transaksi, sehingga integritas referensial terjaga di tingkat basis data.

> **Catatan penamaan.** Nama tabel dan kolom memakai Bahasa Inggris mengikuti
> konvensi penulisan kode, sedangkan NILAI yang tersimpan di kolom `category`
> dan `status` tetap Bahasa Indonesia karena nilai itulah yang langsung
> ditampilkan kepada pengguna.

---

## 5. Penerapan Pemrograman Berorientasi Objek

| Konsep OOP | Penerapan Nyata dalam Kode |
| --- | --- |
| **Kelas & Objek** | Seluruh berkas `.entity.ts`, `.service.ts`, `.controller.ts`, `.dto.ts` |
| **Abstraksi** | `BaseEntity` dideklarasikan `abstract` dan tidak pernah diinstansiasi langsung |
| **Pewarisan** | `Book extends BaseEntity`, `Loan extends BaseEntity`, `UpdateBookDto extends CreateBookDto` |
| **Enkapsulasi** | Stok hanya boleh diubah lewat `decreaseStock()`/`increaseStock()`; atribut `private readonly logger` dan method `private` pada service |
| **Polimorfisme** | `displayStatus()` menghasilkan label berbeda ("Dipinjam" vs "Terlambat") untuk data status yang sama, bergantung kondisi jatuh tempo |
| **Pemisahan Lapisan** | `toView()` mengubah entitas menjadi objek biasa berisi hasil perhitungan, sehingga lapisan tampilan tidak perlu memanggil method domain |
| **Interface** | `AllExceptionsFilter implements ExceptionFilter`, `MailService implements OnModuleInit`, `SeedService implements OnApplicationBootstrap` |
| **Method Statis** | `LoanService.calculateFine()`, `.buildCode()`, dan `.stockEffect()` — milik kelas, bukan instance |
| **Dependency Injection** | Seluruh Repository dan Service disuntikkan lewat constructor, bukan dibuat sendiri di dalam kelas |
| **Decorator** | `@Entity`, `@Column`, `@ManyToOne`, `@Injectable`, `@Controller`, `@Get`, `@Post`, `@IsNotEmpty` |

---

## 6. Penerapan Akses Basis Data

| Teknik | Berkas | Contoh |
| --- | --- | --- |
| Repository Pattern | `book.service.ts` | `this.bookRepository.find({ order: { code: 'ASC' } })` |
| Prepared Statement | seluruh service | Parameter selalu diikat (`:status`, `:year`) — aman dari SQL Injection |
| Query Builder + JOIN | `loan.service.ts` | `.leftJoinAndSelect('l.book', 'b')` |
| Agregasi & GROUP BY | `book.service.ts` | `SUM(b.stock)` dikelompokkan per kategori |
| Fungsi SQL | `loan.service.ts` | `EXTRACT(MONTH FROM p.tanggal_pinjam)` untuk grafik bulanan |
| **Transaksi ACID** | `loan.service.ts` | `this.dataSource.transaction(...)` membungkus pengurangan stok + penyimpanan transaksi; bila salah satu gagal, seluruhnya dibatalkan |
| Value Transformer | `common/date.ts` | Konversi kolom `date` PostgreSQL ↔ objek `Date` JavaScript |

---

## 7. Cara Menjalankan Aplikasi

```bash
docker compose up --build
```

| Alamat                  | Keterangan                                      |
| ----------------------- | ----------------------------------------------- |
| <http://localhost>      | Aplikasi (melalui web server Nginx)             |
| <http://localhost:8025> | Kotak masuk surel (Mailpit)                     |
| `localhost:5432`        | PostgreSQL — user/password/database: `siperpus` |

Menjalankan pengujian unit:

```bash
bun install && bun run test
```

---

## 8. Tampilan Aplikasi

> _Sisipkan tangkapan layar untuk masing-masing halaman berikut:_
>
> 1. Halaman 1 — Dashboard — `http://localhost/`
> 2. Halaman 2 — Data Buku — `http://localhost/books`
> 3. Halaman 3 — Form Buku — `http://localhost/books/new`
> 4. Halaman 4 — Transaksi Peminjaman — `http://localhost/loans`
> 5. Halaman 5 — Form Peminjaman — `http://localhost/loans/new`
> 6. Halaman 6 — Detail Peminjaman — `http://localhost/loans/1`
> 7. Halaman 7 — Laporan & Cetak — `http://localhost/reports`
> 8. Halaman 8 — Form Ubah Transaksi — `http://localhost/loans/1/edit`
> 9. Contoh berkas PDF hasil cetak
> 10. Kotak masuk surel Mailpit — `http://localhost:8025`
> 11. Hasil `bun run test` (55 pengujian lolos)
> 12. Halaman error 404 — `http://localhost/alamat-salah`

---

## 9. Potongan Source Code (CRUD dan Library)

Bagian ini menampilkan potongan kode inti sebagai bukti penerapan unit
kompetensi. Kode lengkapnya tersedia pada repository di bagian 10.

> **Catatan penamaan.** Seluruh pengenal di dalam kode (nama kelas, method,
> variabel, berkas, tabel, dan kolom) memakai Bahasa Inggris mengikuti
> konvensi penulisan kode. Sementara itu komentar, pesan validasi, dan seluruh
> teks yang tampil di layar tetap Bahasa Indonesia.

### 9.1 CREATE — Menyimpan Data Buku

```typescript
// src/book/book.service.ts
async create(dto: CreateBookDto): Promise<Book> {
  const duplicate = await this.bookRepository.findOne({
    where: { code: dto.code },
  });
  if (duplicate) {
    throw new BadRequestException(`Kode buku "${dto.code}" sudah digunakan.`);
  }

  const book = this.bookRepository.create({ ...dto, available: dto.stock });
  const saved = await this.bookRepository.save(book);
  this.logger.log(`Buku baru tersimpan: ${saved.code} - ${saved.title}`);
  return saved;
}
```

**Keterangan:**

- `findOne()` — memeriksa keunikan kode buku sebelum penyimpanan.
- `create()` — membentuk instance entitas `Book` dari DTO.
- `save()` — menjalankan perintah `INSERT` sebagai prepared statement.
- Saat pertama dibuat, `available` disamakan dengan `stock` karena belum ada
  eksemplar yang dipinjam.

### 9.2 READ — Membaca Data dengan Pencarian dan Agregasi

```typescript
// src/book/book.service.ts
async findAll(search?: string): Promise<Book[]> {
  if (search && search.trim() !== '') {
    const keyword = `%${search.trim()}%`;
    return this.bookRepository.find({
      where: [
        { title: ILike(keyword) },
        { author: ILike(keyword) },
        { code: ILike(keyword) },
      ],
      order: { code: 'ASC' },
    });
  }
  return this.bookRepository.find({ order: { code: 'ASC' } });
}

async countByCategory(): Promise<{ category: string; total: number }[]> {
  const rows = await this.bookRepository
    .createQueryBuilder('b')
    .select('b.category', 'category')
    .addSelect('SUM(b.stock)', 'total')
    .groupBy('b.category')
    .orderBy('b.category', 'ASC')
    .getRawMany();

  return rows.map((row) => ({
    category: row.category,
    total: Number(row.total),
  }));
}
```

**Keterangan:**

- `ILike` — pencarian tanpa membedakan huruf besar/kecil pada tiga kolom.
- Array pada `where` bermakna **OR**, sedangkan objek bermakna **AND**.
- Query Builder dipakai untuk agregasi `SUM` dengan `GROUP BY`, yang hasilnya
  menjadi sumber data grafik lingkaran di dashboard.

### 9.3 READ — Relasi Antar Tabel (JOIN)

```typescript
// src/loan/loan.service.ts
async findAll(status?: string): Promise<Loan[]> {
  const query = this.loanRepository
    .createQueryBuilder('l')
    .leftJoinAndSelect('l.book', 'b')
    .orderBy('l.id', 'DESC');

  if (status === 'borrowed') {
    query.where('l.status = :status', { status: LoanStatus.BORROWED });
  } else if (status === 'returned') {
    query.where('l.status = :status', { status: LoanStatus.RETURNED });
  }

  return query.getMany();
}
```

**Keterangan:**

- `leftJoinAndSelect` — menggabungkan tabel `loans` dan `books` dalam satu
  kueri, sehingga judul buku tampil tanpa perlu kueri tambahan.
- `:status` adalah **parameter terikat** (prepared statement), bukan
  penyambungan string, sehingga aman dari serangan SQL Injection.

### 9.4 CREATE — Transaksi Peminjaman dengan Transaksi Basis Data

```typescript
// src/loan/loan.service.ts
async borrow(dto: CreateLoanDto): Promise<Loan> {
  return this.dataSource.transaction(async (manager) => {
    const book = await manager.findOne(Book, { where: { id: dto.bookId } });

    if (!book) {
      throw new NotFoundException('Buku yang dipilih tidak ditemukan.');
    }
    if (!book.isBorrowable()) {
      throw new BadRequestException(
        `Stok buku "${book.title}" sedang habis dipinjam.`,
      );
    }

    book.decreaseStock();              // method domain milik entitas Book
    await manager.save(Book, book);

    const borrowedAt = new Date();
    const loan = manager.create(Loan, {
      code: LoanService.buildCode(borrowedAt, todayCount + 1),
      borrowerName: dto.borrowerName,
      borrowerEmail: dto.borrowerEmail,
      bookId: book.id,
      borrowedAt,
      dueAt: addDays(borrowedAt, dto.loanDays),
      status: LoanStatus.BORROWED,
      fine: 0,
    });

    return manager.save(Loan, loan);
  });
}
```

**Keterangan:**

- `dataSource.transaction()` — membungkus dua operasi tulis (perubahan stok buku
  dan penyimpanan transaksi) menjadi satu kesatuan **ACID**.
- Bila salah satu langkah gagal, seluruh perubahan dibatalkan (**rollback**),
  sehingga stok buku tidak pernah berkurang tanpa transaksi pasangannya.
- `book.decreaseStock()` — pemanggilan **method domain** milik entitas, bukan
  pengubahan atribut secara langsung (penerapan enkapsulasi).

### 9.5 UPDATE — Mengubah Status Peminjaman

```typescript
// src/loan/loan.service.ts

/** Method STATIS — murni, tidak menyentuh basis data, mudah diuji. */
static stockEffect(
  oldStatus: LoanStatus,
  newStatus: LoanStatus,
): 'increase' | 'decrease' | 'none' {
  if (oldStatus === newStatus) {
    return 'none';
  }
  return newStatus === LoanStatus.RETURNED ? 'increase' : 'decrease';
}

async update(id: number, dto: UpdateLoanDto): Promise<Loan> {
  return this.dataSource.transaction(async (manager) => {
    const loan = await manager.findOne(Loan, {
      where: { id },
      relations: { book: true },
    });

    const newDueAt = new Date(`${dto.dueAt}T00:00:00`);
    if (diffInDays(loan.borrowedAt, newDueAt) < 0) {
      throw new BadRequestException(
        'Tanggal jatuh tempo tidak boleh mendahului tanggal peminjaman.',
      );
    }

    const effect = LoanService.stockEffect(loan.status, dto.status);

    if (effect !== 'none') {
      const book = await manager.findOne(Book, {
        where: { id: loan.bookId },
      });

      if (effect === 'increase') {
        book.increaseStock();
        loan.returnedAt = new Date();
      } else {
        if (!book.isBorrowable()) {
          throw new BadRequestException(
            `Status tidak dapat dikembalikan menjadi "Dipinjam" karena stok ` +
              `buku "${book.title}" sedang habis.`,
          );
        }
        book.decreaseStock();
        loan.returnedAt = null;
      }

      await manager.save(Book, book);
    }

    loan.borrowerName = dto.borrowerName;
    loan.borrowerEmail = dto.borrowerEmail;
    loan.dueAt = newDueAt;
    loan.status = dto.status;

    loan.fine = loan.returnedAt
      ? LoanService.calculateFine(loan.dueAt, loan.returnedAt, this.finePerDay())
      : 0;

    return manager.save(Loan, loan);
  });
}
```

**Keterangan:**

- `stockEffect()` — method **statis** yang memutuskan pengaruh perpindahan
  status terhadap stok buku. Karena sifatnya murni, logikanya dapat diuji
  secara unit tanpa menyentuh basis data.
- `Dipinjam → Dikembalikan` menambah stok dan mengisi tanggal kembali;
  `Dikembalikan → Dipinjam` mengurangi stok dan mengosongkannya kembali.
- Denda selalu **dihitung ulang**, sebab memajukan atau memundurkan tanggal
  jatuh tempo semestinya mengubah besaran dendanya juga.
- Bila stok tidak mencukupi, seluruh perubahan dibatalkan (rollback).

### 9.6 UPDATE — Pengembalian Buku dan Perhitungan Denda

```typescript
// src/loan/loan.service.ts

/** Method STATIS — fungsi murni penghitung denda keterlambatan. */
static calculateFine(
  dueAt: Date,
  returnedAt: Date,
  ratePerDay: number,
): number {
  const lateDays = diffInDays(dueAt, returnedAt);

  if (lateDays <= 0) {
    return 0;
  }
  return lateDays * ratePerDay;
}

async returnBook(id: number): Promise<Loan> {
  return this.dataSource.transaction(async (manager) => {
    const loan = await manager.findOne(Loan, {
      where: { id },
      relations: { book: true },
    });

    if (!loan.isOngoing()) {
      throw new BadRequestException(
        `Transaksi ${loan.code} sudah dikembalikan sebelumnya.`,
      );
    }

    const returnedAt = new Date();
    loan.returnedAt = returnedAt;
    loan.status = LoanStatus.RETURNED;
    loan.fine = LoanService.calculateFine(
      loan.dueAt,
      returnedAt,
      this.finePerDay(),
    );

    const book = await manager.findOne(Book, { where: { id: loan.bookId } });
    if (book) {
      book.increaseStock();
      await manager.save(Book, book);
    }

    return manager.save(Loan, loan);
  });
}
```

**Keterangan:**

- `isOngoing()` — method domain entitas yang mencegah pengembalian ganda.
- Denda dihitung otomatis: jumlah hari keterlambatan dikalikan tarif per hari
  yang dibaca dari variabel lingkungan `DENDA_PER_HARI`.

### 9.7 DELETE — Menghapus Data Buku dengan Penjagaan Integritas

```typescript
// src/book/book.service.ts
async remove(id: number): Promise<void> {
  const book = await this.bookRepository.findOne({
    where: { id },
    relations: { loans: true },
  });

  if (!book) {
    throw new NotFoundException(`Buku dengan ID ${id} tidak ditemukan.`);
  }

  if (book.borrowedCount() > 0) {
    throw new BadRequestException(
      `Buku "${book.title}" tidak dapat dihapus karena sedang dipinjam.`,
    );
  }

  const historyCount = book.loans?.length ?? 0;
  if (historyCount > 0) {
    throw new BadRequestException(
      `Buku "${book.title}" tidak dapat dihapus karena memiliki ` +
        `${historyCount} riwayat transaksi peminjaman. ` +
        `Riwayat transaksi wajib dipertahankan sebagai arsip perpustakaan.`,
    );
  }

  await this.bookRepository.remove(book);
}
```

**Keterangan:**

- Pemeriksaan dilakukan **dua lapis**: buku yang sedang dipinjam, dan buku yang
  memiliki riwayat transaksi meski transaksinya sudah selesai.
- Lapis kedua diperlukan karena kolom `book_id` memakai batasan
  `ON DELETE RESTRICT`. Tanpa pemeriksaan ini, penghapusan ditolak langsung oleh
  PostgreSQL dan pengguna menerima pesan teknis berbahasa Inggris.
- `remove()` — menjalankan perintah `DELETE` pada basis data.

### 9.8 LIBRARY — pdfmake (Cetak Laporan PDF)

```typescript
// src/report/pdf.service.ts
const PdfPrinter = require('pdfmake/src/printer');

@Injectable()
export class PdfService {
  private readonly printer = new PdfPrinter(STANDARD_FONTS);

  async buildLoanReport(
    loans: Loan[],
    summary: ReportSummary,
    from: Date,
    to: Date,
  ): Promise<Buffer> {
    const definition = this.buildDocDefinition(loans, summary, from, to);
    return this.render(definition);
  }

  /** PDFMake bekerja dengan aliran data, jadi potongannya digabung dahulu. */
  private render(definition: TDocumentDefinitions): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = this.printer.createPdfKitDocument(definition);
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (error: Error) => reject(error));

      doc.end();
    });
  }
}
```

```typescript
// src/report/report.controller.ts
@Get('pdf')
async downloadPdf(
  @Res() res: Response,
  @Query('from') from?: string,
  @Query('to') to?: string,
) {
  const { startDate, endDate } = this.resolvePeriod(from, to);
  const loans = await this.loanService.findByPeriod(startDate, endDate);
  const file = await this.pdfService.buildLoanReport(
    loans, this.summarize(loans), startDate, endDate,
  );

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="laporan-peminjaman.pdf"`,
    'Content-Length': file.length,
  });
  return res.end(file);
}
```

**Keterangan:**

- `PdfService` **membungkus** library pdfmake, sehingga controller tidak perlu
  mengetahui detail penyusunan dokumen (penerapan abstraksi).
- Memakai font bawaan standar PDF (Helvetica), sehingga tidak perlu menyertakan
  berkas `.ttf` — image Docker tetap ramping dan tidak mungkin gagal cetak.
- Header `Content-Disposition: attachment` membuat peramban langsung menawarkan
  kotak dialog penyimpanan berkas.

### 9.9 LIBRARY — Nodemailer (Pengiriman Surel)

```typescript
// src/mail/mail.service.ts
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private transporter: Transporter;

  onModuleInit(): void {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST') ?? 'localhost',
      port: Number(this.configService.get<string>('MAIL_PORT') ?? 1025),
      secure: false,
      ignoreTLS: true,
    });
  }

  private async send(
    to: string,
    subject: string,
    html: string,
  ): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM'),
        to,
        subject,
        html,
      });
      this.logger.log(`Surel terkirim ke ${to}: ${subject}`);
      return true;
    } catch (error) {
      this.logger.error(`Gagal mengirim surel ke ${to}`, errorStack(error));
      return false;
    }
  }
}
```

**Keterangan:**

- `OnModuleInit` — interface milik NestJS; koneksi SMTP dibangun **satu kali**
  saat aplikasi dinyalakan, bukan setiap kali surel dikirim.
- Kegagalan pengiriman sengaja **ditangkap dan hanya dicatat ke log**, tidak
  dilempar ulang, supaya masalah pada server surel tidak ikut menggagalkan
  transaksi peminjaman yang datanya sudah tersimpan.
- Kredensial dibaca dari variabel lingkungan, tidak ditulis di dalam kode.

### 9.10 LIBRARY — class-validator dan class-transformer (Validasi)

```typescript
// src/loan/dto/update-loan.dto.ts
export class UpdateLoanDto {
  @IsNotEmpty({ message: 'Nama peminjam wajib diisi.' })
  @IsString()
  @MaxLength(100, { message: 'Nama peminjam maksimal 100 karakter.' })
  borrowerName: string;

  @IsEmail({}, { message: 'Format email peminjam tidak valid.' })
  borrowerEmail: string;

  @IsISO8601({}, { message: 'Tanggal jatuh tempo tidak valid.' })
  dueAt: string;

  @IsEnum(LoanStatus, { message: 'Status peminjaman tidak dikenali.' })
  status: LoanStatus;
}
```

```typescript
// src/common/validation.ts
export async function validateDto<T extends object>(
  cls: new () => T,
  data: Record<string, unknown>,
): Promise<ValidationResult<T>> {
  const dto = plainToInstance(cls, data);
  const failures = await validate(dto, { whitelist: true });

  const errors: string[] = [];
  for (const failure of failures) {
    for (const message of Object.values(failure.constraints ?? {})) {
      errors.push(message);
    }
  }

  return { dto, errors };
}
```

**Keterangan:**

- Aturan validasi ditempelkan langsung pada atribut dalam bentuk **decorator**,
  sehingga aturan bisnis menyatu dengan struktur datanya (enkapsulasi).
- Nama atribut memakai Bahasa Inggris, sedangkan PESAN errornya tetap Bahasa
  Indonesia karena pesan itulah yang dibaca pengguna.
- `plainToInstance` — mengubah data form HTML (yang seluruh nilainya bertipe
  string) menjadi instance kelas DTO dengan tipe data yang benar.
- Validasi dijalankan **di sisi server**, sehingga data tetap aman walaupun
  validasi bawaan peramban dilewati pengguna.

### 9.11 Penyiapan Data untuk Templat

```typescript
// src/loan/loan.entity.ts
toView(reference: Date = new Date()) {
  return {
    ...this,
    displayStatus: this.displayStatus(reference),
    isOngoing: this.isOngoing(),
    overdueDays: this.overdueDays(reference),
    isOverdue: this.isOverdue(reference),
  };
}
```

**Keterangan:**

- Mesin templat Handlebars tidak dapat diandalkan untuk memanggil method sebuah
  kelas. `{{loan.displayStatus}}` memang dipanggil, tetapi
  `{{statusColor loan.displayStatus}}` justru menerima FUNGSI-nya, dan
  `{{#if loan.isOngoing}}` diblokir sama sekali oleh Handlebars 4.6+ karena
  method berada di prototype, bukan properti objek.
- `toView()` mengubah hasil method domain menjadi properti biasa, sehingga
  seluruh bentuk pemakaian di templat berperilaku sama dan dapat diprediksi.
- Seluruh controller memetakan entitas melalui method ini sebelum
  mengirimkannya ke templat.

---

## 10. Source Code Lengkap

Seluruh berkas source code sebagaimana tercantum pada tabel bagian **3.d**
dipublikasikan pada repository berikut, dan dapat dijalankan kembali hanya
dengan perintah `docker compose up --build`:

**Repository:** https://github.com/irfanadwifangga/sertifikasi-lspedi
