import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { BookCategory } from '../book.entity';

/**
 * CreateBookDto — Data Transfer Object untuk penambahan data buku baru.
 *
 * Kelas ini memakai library pihak ketiga `class-validator` dan
 * `class-transformer`. Aturan validasi ditempelkan langsung pada atribut
 * dalam bentuk DECORATOR, sehingga aturan bisnis tersimpan menyatu dengan
 * struktur datanya (penerapan enkapsulasi).
 *
 * Pesan errornya sengaja tetap Bahasa Indonesia, sebab pesan tersebut
 * ditampilkan langsung kepada pengguna.
 */
export class CreateBookDto {
  @IsNotEmpty({ message: 'Kode buku wajib diisi.' })
  @IsString()
  @MaxLength(20, { message: 'Kode buku maksimal 20 karakter.' })
  code: string;

  @IsNotEmpty({ message: 'Judul buku wajib diisi.' })
  @IsString()
  @MaxLength(150, { message: 'Judul buku maksimal 150 karakter.' })
  title: string;

  @IsNotEmpty({ message: 'Nama pengarang wajib diisi.' })
  @IsString()
  @MaxLength(100)
  author: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  publisher?: string;

  @Type(() => Number)
  @IsInt({ message: 'Tahun terbit harus berupa angka.' })
  @Min(1900, { message: 'Tahun terbit minimal 1900.' })
  @Max(2100, { message: 'Tahun terbit tidak masuk akal.' })
  publishedYear: number;

  @IsEnum(BookCategory, { message: 'Kategori buku tidak dikenali.' })
  category: BookCategory;

  @Type(() => Number)
  @IsInt({ message: 'Stok harus berupa angka.' })
  @Min(1, { message: 'Stok minimal 1 eksemplar.' })
  stock: number;
}
