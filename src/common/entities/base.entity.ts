import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * BaseEntity — kelas abstrak induk untuk seluruh entitas basis data.
 *
 * Kelas ini menampung atribut yang dimiliki oleh SEMUA tabel (primary key dan
 * kolom audit waktu), sehingga entitas turunan cukup mendeklarasikan atribut
 * yang khas miliknya sendiri.
 *
 * Penerapan konsep OOP:
 *  - Abstraksi : dideklarasikan `abstract`, tidak pernah diinstansiasi langsung.
 *  - Pewarisan : diturunkan oleh {@link Buku} dan {@link Peminjaman}
 *                melalui kata kunci `extends`.
 *  - Enkapsulasi: detail kolom audit disembunyikan dari kelas turunan.
 */
export abstract class BaseEntity {
  /** Primary key auto increment. */
  @PrimaryGeneratedColumn()
  id: number;

  /** Waktu baris data pertama kali dibuat (diisi otomatis oleh ORM). */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /** Waktu baris data terakhir diubah (diisi otomatis oleh ORM). */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
