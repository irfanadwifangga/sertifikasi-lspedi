# SIPERPUS — Sistem Informasi Peminjaman Buku

Aplikasi web untuk **Tugas Praktik Demonstrasi (FR.IA.02)**
Skema Sertifikasi **Pemrogram Junior (Junior Coder)** — LSP Entrepreneur Digital Indonesia
Nomor Skema: 16-05/SSO/020502/X/2021 (Okupasi, Level KKNI 2)

---

## Cara Menjalankan

Hanya butuh Docker. Tidak perlu memasang Node, PostgreSQL, atau server surel.

```bash
docker compose up --build
```

Tunggu sampai log menampilkan `SIPERPUS berjalan pada http://localhost:3000`, lalu buka:

| Alamat | Keterangan |
|---|---|
| <http://localhost> | Aplikasi (lewat web server Nginx) |
| <http://localhost:8025> | Kotak masuk surel (Mailpit) |
| `localhost:5432` | PostgreSQL (user/pass/db: `siperpus`) |

Data contoh (10 buku + 5 transaksi) terisi otomatis saat pertama kali dijalankan,
sehingga aplikasi langsung siap diperagakan.

### Mengulang dari data bersih

```bash
docker compose down -v && docker compose up --build
```

### Menghentikan

```bash
docker compose down
```

---

## Menjalankan Pengujian Unit

```bash
bun install && bun run test
```

Hasil yang diharapkan: **55 pengujian lolos** pada 4 berkas uji.

---

## Arsitektur Container

```
                    ┌──────────────┐
   Browser  ──:80──▶│    nginx     │  web server / reverse proxy
                    └──────┬───────┘
                           │ :3000
                    ┌──────▼───────┐
                    │     app      │  NestJS + TypeORM (Node 22)
                    └───┬──────┬───┘
                 :5432  │      │  :1025 (SMTP)
                 ┌──────▼──┐ ┌─▼──────────┐
                 │   db    │ │  mailpit   │
                 │Postgres │ │ SMTP+Inbox │
                 └─────────┘ └────────────┘
```

---

## Daftar Halaman

| # | Halaman | Rute |
|---|---|---|
| 1 | Dashboard | `/` |
| 2 | Data Buku | `/books` |
| 3 | Form Buku (tambah & ubah) | `/books/new`, `/books/:id/edit` |
| 4 | Transaksi Peminjaman | `/loans` |
| 5 | Form Peminjaman | `/loans/new` |
| 6 | Detail Peminjaman | `/loans/:id` |
| 7 | Laporan & Cetak | `/reports` |
| 8 | Form Ubah Transaksi | `/loans/:id/edit` |

---

## Pemetaan Unit Kompetensi

| Kode Unit | Judul Unit | Bukti di dalam kode |
|---|---|---|
| J.620100.009.01 | Menggunakan Spesifikasi Program | 8 halaman sesuai skenario; entitas & alur mengikuti spesifikasi tugas |
| J.620100.016.01 | Menulis Kode Sesuai Guidelines | Penamaan konsisten (Inggris untuk kode, Indonesia untuk konten), TSDoc di seluruh kelas, format terkunci lewat `.prettierrc` |
| J.620100.017.02 | Pemrograman Terstruktur | `src/common/date.ts`, perulangan akumulator di service |
| J.620100.018.02 | Pemrograman Berorientasi Objek | `BaseEntity` abstrak, pewarisan, method domain, DI, interface |
| J.620100.019.02 | Library / Komponen Pre-Existing | pdfmake, Nodemailer, class-validator, Bootstrap, Chart.js |
| J.620100.021.02 | Menerapkan Akses Basis Data | TypeORM Repository, Query Builder, relasi & transaksi ACID |
| J.620100.023.02 | Membuat Dokumen Kode Program | TSDoc + `docs/DOKUMENTASI.md` |
| J.620100.025.02 | Melakukan Debugging | `AllExceptionsFilter`, Logger, halaman error |
| J.620100.033.02 | Pengujian Unit Program | 55 pengujian Jest pada 4 berkas `*.spec.ts` |

Rincian lengkap ada di [`docs/DOKUMENTASI.md`](docs/DOKUMENTASI.md).
