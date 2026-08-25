import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Book } from '../book/book.entity';
import { diffInDays, DateTransformer } from '../common/date';

/**
 * Status sebuah transaksi peminjaman.
 *
 * Sama seperti {@link BookCategory}, nama anggotanya Bahasa Inggris sedangkan
 * nilainya tetap Bahasa Indonesia karena langsung ditampilkan ke pengguna.
 */
export enum LoanStatus {
  BORROWED = 'Dipinjam',
  RETURNED = 'Dikembalikan',
}

/**
 * Loan — entitas yang memetakan tabel `loans` di basis data.
 *
 * Penerapan konsep OOP:
 *  - Pewarisan  : `extends BaseEntity`.
 *  - Relasi     : Many-to-One ke {@link Book}; banyak transaksi peminjaman
 *                 dapat merujuk pada satu judul buku yang sama. Relasi inilah
 *                 yang menghasilkan operasi JOIN pada kueri basis data.
 *  - Polimorfis : method {@link displayStatus} memberi arti berbeda pada
 *                 status yang sama tergantung kondisi keterlambatan.
 */
@Entity('loans')
export class Loan extends BaseEntity {
  /** Kode unik transaksi, contoh: PJM-20260825-001. */
  @Index({ unique: true })
  @Column({ length: 30, unique: true })
  code: string;

  @Column({ name: 'borrower_name', length: 100 })
  borrowerName: string;

  @Column({ name: 'borrower_email', length: 120 })
  borrowerEmail: string;

  /** Foreign key menuju tabel `books`. */
  @Column({ name: 'book_id', type: 'int' })
  bookId: number;

  /**
   * Relasi Many-to-One ke entitas {@link Book}.
   * `onDelete: RESTRICT` mencegah penghapusan buku yang masih memiliki riwayat
   * transaksi, sehingga integritas referensial basis data tetap terjaga.
   */
  @ManyToOne(() => Book, (book) => book.loans, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'book_id' })
  book: Book;

  @Column({
    name: 'borrowed_at',
    type: 'date',
    transformer: DateTransformer,
  })
  borrowedAt: Date;

  @Column({
    name: 'due_at',
    type: 'date',
    transformer: DateTransformer,
  })
  dueAt: Date;

  @Column({
    name: 'returned_at',
    type: 'date',
    nullable: true,
    transformer: DateTransformer,
  })
  returnedAt: Date | null;

  @Column({ type: 'enum', enum: LoanStatus, default: LoanStatus.BORROWED })
  status: LoanStatus;

  /** Denda keterlambatan dalam rupiah; terisi saat buku dikembalikan. */
  @Column({ type: 'int', default: 0 })
  fine: number;

  // ----- Method domain (perilaku objek) -------------------------------------

  /**
   * Memeriksa apakah transaksi ini masih berstatus dipinjam.
   */
  isOngoing(): boolean {
    return this.status === LoanStatus.BORROWED;
  }

  /**
   * Menghitung berapa hari transaksi ini melewati tanggal jatuh tempo.
   *
   * Bila buku sudah dikembalikan, acuan perhitungan adalah tanggal kembali.
   * Bila belum, acuannya adalah tanggal hari ini.
   *
   * @param reference Tanggal acuan perhitungan (default: hari ini).
   * @returns Jumlah hari keterlambatan; bernilai 0 bila tidak terlambat.
   */
  overdueDays(reference: Date = new Date()): number {
    const comparedTo = this.returnedAt ?? reference;
    const diff = diffInDays(this.dueAt, comparedTo);
    return diff > 0 ? diff : 0;
  }

  /**
   * Memeriksa apakah transaksi ini terlambat.
   *
   * @param reference Tanggal acuan perhitungan (default: hari ini).
   */
  isOverdue(reference: Date = new Date()): boolean {
    return this.overdueDays(reference) > 0;
  }

  /**
   * Menghasilkan label status yang siap ditampilkan di antarmuka.
   *
   * Buku yang belum kembali dan sudah lewat jatuh tempo diberi label khusus
   * "Terlambat" agar mudah dikenali petugas.
   *
   * @param reference Tanggal acuan perhitungan (default: hari ini).
   */
  displayStatus(reference: Date = new Date()): string {
    if (this.isOngoing() && this.isOverdue(reference)) {
      return 'Terlambat';
    }
    return this.status;
  }

  /**
   * Mengubah entitas menjadi objek biasa yang siap dikirim ke templat,
   * lengkap dengan hasil perhitungan method domainnya.
   *
   * Method ini WAJIB dipakai sebelum mengirim entitas ke Handlebars. Mesin
   * templat Handlebars tidak dapat diandalkan untuk memanggil method sebuah
   * kelas, karena perlakuannya berbeda-beda tergantung posisi pemakaiannya:
   *
   *  - `{{loan.displayStatus}}`             -> dipanggil, hasilnya tampil.
   *  - `{{statusColor loan.displayStatus}}` -> yang diterima helper adalah
   *    FUNGSI-nya, bukan hasil pemanggilan, sehingga nilainya salah.
   *  - `{{#if loan.isOngoing}}`             -> diblokir oleh Handlebars 4.6+
   *    karena method berada di prototype, bukan properti objek, lalu bernilai
   *    `undefined` dan kondisinya selalu dianggap salah.
   *
   * Dengan mengubahnya lebih dahulu menjadi properti biasa, ketiga bentuk
   * pemakaian di atas berperilaku sama dan dapat diprediksi.
   *
   * @param reference Tanggal acuan perhitungan keterlambatan (default: hari ini).
   */
  toView(reference: Date = new Date()) {
    return {
      ...this,
      displayStatus: this.displayStatus(reference),
      isOngoing: this.isOngoing(),
      overdueDays: this.overdueDays(reference),
      isOverdue: this.isOverdue(reference),
    };
  }
}
