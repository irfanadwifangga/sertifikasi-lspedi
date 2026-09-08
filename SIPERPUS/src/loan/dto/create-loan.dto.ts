import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * CreateLoanDto — DTO untuk pencatatan transaksi peminjaman baru.
 *
 * Memakai library `class-validator` untuk memastikan data yang masuk sudah
 * benar sebelum menyentuh basis data, misalnya memastikan alamat surel valid
 * agar notifikasi jatuh tempo dapat terkirim.
 */
export class CreateLoanDto {
  @IsNotEmpty({ message: 'Nama peminjam wajib diisi.' })
  @IsString()
  @MaxLength(100, { message: 'Nama peminjam maksimal 100 karakter.' })
  borrowerName: string;

  @IsNotEmpty({ message: 'Email peminjam wajib diisi.' })
  @IsEmail({}, { message: 'Format email peminjam tidak valid.' })
  @MaxLength(120)
  borrowerEmail: string;

  @Type(() => Number)
  @IsInt({ message: 'Buku yang dipinjam wajib dipilih.' })
  @Min(1, { message: 'Buku yang dipinjam wajib dipilih.' })
  bookId: number;

  @Type(() => Number)
  @IsInt({ message: 'Lama peminjaman harus berupa angka.' })
  @Min(1, { message: 'Lama peminjaman minimal 1 hari.' })
  loanDays: number;
}
