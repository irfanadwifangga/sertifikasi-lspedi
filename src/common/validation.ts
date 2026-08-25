import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

/**
 * Hasil proses validasi: objek DTO yang sudah dikonversi tipenya beserta
 * daftar pesan error yang ditemukan.
 */
export interface ValidationResult<T> {
  dto: T;
  errors: string[];
}

/**
 * validateDto — fungsi bantu untuk memvalidasi data mentah dari form HTML.
 *
 * Fungsi ini membungkus dua library pihak ketiga:
 *  1. `class-transformer` -> mengubah objek biasa (seluruh nilainya bertipe
 *     string, karena berasal dari form HTML) menjadi instance kelas DTO
 *     dengan tipe data yang benar.
 *  2. `class-validator`   -> memeriksa instance tersebut terhadap aturan
 *     decorator yang menempel pada atributnya.
 *
 * Pola ini dipakai (alih-alih ValidationPipe global) supaya ketika validasi
 * gagal, aplikasi dapat menampilkan kembali halaman form beserta pesan error
 * dan data yang tadi sudah diketik pengguna — bukan sekadar melempar JSON.
 *
 * @typeParam T Tipe kelas DTO yang dituju.
 * @param cls  Konstruktor kelas DTO.
 * @param data Data mentah hasil submit form (req.body).
 * @returns Objek berisi DTO hasil konversi dan array pesan error.
 */
export async function validateDto<T extends object>(
  cls: new () => T,
  data: Record<string, unknown>,
): Promise<ValidationResult<T>> {
  const dto = plainToInstance(cls, data, {
    enableImplicitConversion: false,
  });

  const failures = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: false,
  });

  // Pemrograman terstruktur: perulangan bersarang untuk meratakan
  // struktur error menjadi array pesan yang siap ditampilkan.
  const errors: string[] = [];
  for (const failure of failures) {
    for (const message of Object.values(failure.constraints ?? {})) {
      errors.push(message);
    }
  }

  return { dto, errors };
}
