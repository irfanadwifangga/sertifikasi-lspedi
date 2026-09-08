import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Loan } from '../loan/loan.entity';

/**
 * Daftar kategori buku yang tersedia di perpustakaan.
 *
 * Nama anggota enum memakai Bahasa Inggris (bagian dari kode), sedangkan
 * NILAI-nya tetap Bahasa Indonesia karena nilai inilah yang tersimpan di
 * basis data dan ditampilkan langsung kepada pengguna.
 */
export enum BookCategory {
  GENERAL = 'Umum',
  TECHNOLOGY = 'Teknologi',
  SCIENCE = 'Sains',
  HISTORY = 'Sejarah',
  FICTION = 'Fiksi',
}

/**
 * Book — entitas yang memetakan tabel `books` di basis data.
 *
 * Penerapan konsep OOP:
 *  - Pewarisan  : `extends BaseEntity` mewarisi id, createdAt, updatedAt.
 *  - Enkapsulasi: atribut `stock`/`available` hanya boleh diubah lewat method
 *                 {@link decreaseStock} dan {@link increaseStock}, bukan
 *                 diubah sembarangan dari luar kelas.
 *  - Relasi     : satu buku memiliki banyak transaksi peminjaman (One-to-Many).
 */
@Entity('books')
export class Book extends BaseEntity {
  /** Kode unik buku, contoh: BK-001. */
  @Index({ unique: true })
  @Column({ length: 20, unique: true })
  code: string;

  @Column({ length: 150 })
  title: string;

  @Column({ length: 100 })
  author: string;

  @Column({ length: 100, nullable: true })
  publisher: string;

  @Column({ name: 'published_year', type: 'int' })
  publishedYear: number;

  @Column({ type: 'enum', enum: BookCategory, default: BookCategory.GENERAL })
  category: BookCategory;

  /** Jumlah total eksemplar yang dimiliki perpustakaan. */
  @Column({ type: 'int', default: 1 })
  stock: number;

  /** Jumlah eksemplar yang sedang berada di rak (siap dipinjam). */
  @Column({ type: 'int', default: 1 })
  available: number;

  /**
   * Relasi One-to-Many ke entitas {@link Loan}.
   * Satu judul buku dapat muncul pada banyak transaksi peminjaman.
   */
  @OneToMany(() => Loan, (loan) => loan.book)
  loans: Loan[];

  // ----- Method domain (perilaku objek) -------------------------------------

  /**
   * Memeriksa apakah buku masih dapat dipinjam saat ini.
   * @returns `true` bila stok tersedia lebih dari nol.
   */
  isBorrowable(): boolean {
    return this.available > 0;
  }

  /**
   * Mengurangi stok tersedia sebanyak satu eksemplar saat buku dipinjam.
   * @throws {Error} bila stok tersedia sudah habis.
   */
  decreaseStock(): void {
    if (!this.isBorrowable()) {
      throw new Error(`Stok buku "${this.title}" sudah habis.`);
    }
    this.available -= 1;
  }

  /**
   * Menambah stok tersedia sebanyak satu eksemplar saat buku dikembalikan.
   * Penambahan dibatasi agar tidak pernah melebihi stok total.
   */
  increaseStock(): void {
    if (this.available < this.stock) {
      this.available += 1;
    }
  }

  /**
   * Menghitung berapa eksemplar yang sedang berada di tangan peminjam.
   * @returns Selisih antara stok total dan stok tersedia.
   */
  borrowedCount(): number {
    return this.stock - this.available;
  }
}
