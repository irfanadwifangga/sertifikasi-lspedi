import { CreateBookDto } from './create-book.dto';

/**
 * UpdateBookDto — DTO untuk pengubahan data buku.
 *
 * Penerapan konsep OOP (pewarisan): seluruh aturan validasi diwarisi dari
 * {@link CreateBookDto} melalui `extends`, sehingga aturan tidak perlu
 * ditulis ulang (prinsip DRY — Don't Repeat Yourself).
 */
export class UpdateBookDto extends CreateBookDto {}
