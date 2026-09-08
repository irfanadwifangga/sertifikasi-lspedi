import {
  IsEmail,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { LoanStatus } from '../loan.entity';

/**
 * UpdateLoanDto — DTO untuk pengubahan data transaksi peminjaman.
 *
 * Berbeda dengan {@link CreateLoanDto} yang memilih buku dan lama pinjam,
 * DTO ini dipakai untuk MEMPERBAIKI transaksi yang sudah berjalan: mengoreksi
 * identitas peminjam, memperpanjang tanggal jatuh tempo, atau mengubah status
 * peminjaman secara manual.
 *
 * Buku yang dipinjam sengaja TIDAK dapat diubah di sini. Menukar buku pada
 * transaksi yang sudah berjalan akan mengacaukan stok kedua buku sekaligus;
 * tindakan yang benar adalah mengembalikan buku lama lalu membuat transaksi
 * baru.
 */
export class UpdateLoanDto {
  @IsNotEmpty({ message: 'Nama peminjam wajib diisi.' })
  @IsString()
  @MaxLength(100, { message: 'Nama peminjam maksimal 100 karakter.' })
  borrowerName: string;

  @IsNotEmpty({ message: 'Email peminjam wajib diisi.' })
  @IsEmail({}, { message: 'Format email peminjam tidak valid.' })
  @MaxLength(120)
  borrowerEmail: string;

  @IsNotEmpty({ message: 'Tanggal jatuh tempo wajib diisi.' })
  @IsISO8601({}, { message: 'Tanggal jatuh tempo tidak valid.' })
  dueAt: string;

  @IsEnum(LoanStatus, { message: 'Status peminjaman tidak dikenali.' })
  status: LoanStatus;
}
