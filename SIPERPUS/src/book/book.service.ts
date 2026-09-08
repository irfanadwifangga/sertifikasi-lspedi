import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Book } from './book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

/**
 * BookService — kelas layanan yang menampung seluruh logika bisnis
 * dan seluruh akses basis data untuk entitas {@link Book}.
 *
 * Penerapan konsep OOP:
 *  - Enkapsulasi          : Controller tidak pernah menyentuh basis data
 *                           secara langsung, melainkan selalu melalui
 *                           method publik kelas ini.
 *  - Dependency Injection : objek `Repository<Book>` disuntikkan lewat
 *                           constructor, bukan dibuat sendiri di dalam kelas.
 *
 * Penerapan akses basis data: memakai Repository Pattern milik TypeORM yang
 * seluruh kuerinya dijalankan sebagai PREPARED STATEMENT, sehingga aman dari
 * serangan SQL Injection.
 */
@Injectable()
export class BookService {
  private readonly logger = new Logger(BookService.name);

  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
  ) {}

  /**
   * Mengambil seluruh data buku, dengan opsi pencarian.
   *
   * @param search Kata kunci pencarian pada judul atau pengarang (opsional).
   * @returns Daftar buku terurut berdasarkan kode.
   */
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

  /**
   * Mencari satu buku berdasarkan primary key.
   *
   * @param id ID buku yang dicari.
   * @throws {NotFoundException} bila buku tidak ditemukan.
   */
  async findOne(id: number): Promise<Book> {
    const book = await this.bookRepository.findOne({ where: { id } });
    if (!book) {
      throw new NotFoundException(`Buku dengan ID ${id} tidak ditemukan.`);
    }
    return book;
  }

  /**
   * Menyimpan data buku baru ke basis data.
   *
   * Saat pertama kali dibuat, jumlah stok tersedia disamakan dengan stok total
   * karena belum ada satu pun eksemplar yang dipinjam.
   *
   * @param dto Data buku yang sudah lolos validasi.
   * @throws {BadRequestException} bila kode buku sudah dipakai.
   */
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

  /**
   * Memperbarui data buku yang sudah ada.
   *
   * Bila stok total diubah, jumlah stok tersedia ikut disesuaikan dengan tetap
   * memperhitungkan eksemplar yang sedang berada di tangan peminjam.
   *
   * @param id  ID buku yang akan diubah.
   * @param dto Data baru yang sudah lolos validasi.
   * @throws {BadRequestException} bila stok baru lebih kecil daripada jumlah
   *         eksemplar yang sedang dipinjam.
   */
  async update(id: number, dto: UpdateBookDto): Promise<Book> {
    const book = await this.findOne(id);
    const borrowed = book.borrowedCount();

    if (dto.stock < borrowed) {
      throw new BadRequestException(
        `Stok tidak boleh kurang dari ${borrowed} ` +
          `karena masih ada ${borrowed} eksemplar yang dipinjam.`,
      );
    }

    Object.assign(book, dto);
    book.available = dto.stock - borrowed;

    const saved = await this.bookRepository.save(book);
    this.logger.log(`Buku diperbarui: ${saved.code} - ${saved.title}`);
    return saved;
  }

  /**
   * Menghapus data buku dari basis data.
   *
   * Buku hanya boleh dihapus bila BELUM PERNAH terlibat transaksi peminjaman.
   * Pemeriksaan dilakukan dua lapis:
   *  1. Apakah ada eksemplar yang sedang berada di tangan peminjam.
   *  2. Apakah buku memiliki riwayat transaksi (termasuk yang sudah selesai).
   *
   * Lapis kedua penting karena kolom `book_id` pada tabel `loans` memakai
   * batasan `ON DELETE RESTRICT`. Tanpa pemeriksaan ini, penghapusan akan
   * ditolak langsung oleh PostgreSQL dan pengguna menerima pesan error teknis
   * berbahasa Inggris, bukan keterangan yang dapat dipahami.
   *
   * @param id ID buku yang akan dihapus.
   * @throws {BadRequestException} bila buku masih dipinjam atau punya riwayat.
   */
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
    this.logger.log(`Buku dihapus: ${book.code} - ${book.title}`);
  }

  /**
   * Menghitung ringkasan koleksi buku untuk kebutuhan dashboard.
   *
   * @returns Objek berisi jumlah judul, jumlah eksemplar, dan stok tersedia.
   */
  async summarize(): Promise<{
    totalTitles: number;
    totalCopies: number;
    totalAvailable: number;
  }> {
    const books = await this.bookRepository.find();

    // Pemrograman terstruktur: perulangan untuk mengakumulasi nilai.
    let totalCopies = 0;
    let totalAvailable = 0;
    for (const book of books) {
      totalCopies += book.stock;
      totalAvailable += book.available;
    }

    return { totalTitles: books.length, totalCopies, totalAvailable };
  }

  /**
   * Menghitung jumlah eksemplar buku per kategori (untuk grafik dashboard).
   *
   * Memakai Query Builder TypeORM dengan agregasi `SUM` dan `GROUP BY`.
   */
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
}
