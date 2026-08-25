import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book, BookCategory } from '../book/book.entity';
import { Loan, LoanStatus } from '../loan/loan.entity';
import { LoanService } from '../loan/loan.service';
import { addDays } from '../common/date';

/**
 * SeedService — pengisi data contoh (data awal) ke dalam basis data.
 *
 * Kelas ini mengimplementasikan interface `OnApplicationBootstrap`, sehingga
 * method {@link onApplicationBootstrap} otomatis dijalankan satu kali setiap
 * aplikasi selesai dinyalakan. Pengisian hanya dilakukan bila tabel masih
 * kosong, sehingga data yang sudah dimasukkan pengguna tidak pernah tertimpa.
 *
 * Tujuannya: begitu perintah `docker compose up` selesai, aplikasi sudah
 * langsung berisi data dan siap diperagakan tanpa perlu mengetik data manual.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

  /**
   * Dijalankan otomatis oleh NestJS setelah aplikasi selesai dinyalakan.
   */
  async onApplicationBootstrap(): Promise<void> {
    const bookCount = await this.bookRepository.count();

    if (bookCount > 0) {
      this.logger.log('Data sudah tersedia, pengisian data contoh dilewati.');
      return;
    }

    this.logger.log('Basis data masih kosong, mengisi data contoh...');
    const books = await this.seedBooks();
    await this.seedLoans(books);
    this.logger.log('Pengisian data contoh selesai.');
  }

  /**
   * Menyimpan sepuluh judul buku contoh ke tabel `books`.
   *
   * @returns Daftar buku yang sudah tersimpan beserta ID-nya.
   */
  private async seedBooks(): Promise<Book[]> {
    const samples = [
      ['BK-001', 'Clean Code', 'Robert C. Martin', 'Prentice Hall', 2008, BookCategory.TECHNOLOGY, 4],
      ['BK-002', 'The Pragmatic Programmer', 'Andrew Hunt', 'Addison-Wesley', 1999, BookCategory.TECHNOLOGY, 3],
      ['BK-003', 'Design Patterns', 'Erich Gamma', 'Addison-Wesley', 1994, BookCategory.TECHNOLOGY, 2],
      ['BK-004', 'Sapiens', 'Yuval Noah Harari', 'Harper', 2011, BookCategory.HISTORY, 5],
      ['BK-005', 'A Brief History of Time', 'Stephen Hawking', 'Bantam Books', 1988, BookCategory.SCIENCE, 3],
      ['BK-006', 'Cosmos', 'Carl Sagan', 'Random House', 1980, BookCategory.SCIENCE, 2],
      ['BK-007', 'Laskar Pelangi', 'Andrea Hirata', 'Bentang Pustaka', 2005, BookCategory.FICTION, 6],
      ['BK-008', 'Bumi Manusia', 'Pramoedya Ananta Toer', 'Hasta Mitra', 1980, BookCategory.FICTION, 4],
      ['BK-009', 'Sejarah Indonesia Modern', 'M.C. Ricklefs', 'Serambi', 2008, BookCategory.HISTORY, 3],
      ['BK-010', 'Filosofi Teras', 'Henry Manampiring', 'Kompas', 2018, BookCategory.GENERAL, 5],
    ];

    const entities: Book[] = [];

    // Pemrograman terstruktur: perulangan membentuk objek entitas satu per satu.
    for (const [code, title, author, publisher, year, category, stock] of samples) {
      entities.push(
        this.bookRepository.create({
          code: code as string,
          title: title as string,
          author: author as string,
          publisher: publisher as string,
          publishedYear: year as number,
          category: category as BookCategory,
          stock: stock as number,
          available: stock as number,
        }),
      );
    }

    const saved = await this.bookRepository.save(entities);
    this.logger.log(`${saved.length} data buku berhasil dimasukkan.`);
    return saved;
  }

  /**
   * Menyimpan lima transaksi peminjaman contoh dengan kondisi beragam:
   * masih dipinjam, sudah dikembalikan tepat waktu, dan terlambat.
   *
   * Variasi ini penting agar setiap fitur (denda, pengingat surel, filter
   * status) langsung punya data untuk diperagakan.
   *
   * @param books Buku yang sudah tersimpan sebelumnya.
   */
  private async seedLoans(books: Book[]): Promise<void> {
    const today = new Date();

    /**
     * Deskripsi satu transaksi contoh.
     * start/due/returned dinyatakan sebagai selisih hari terhadap hari ini.
     */
    const scenarios = [
      { bookIndex: 0, name: 'Ahmad Fauzi',    email: 'ahmad.fauzi@contoh.id',   start: -14, due: -7, returned: -5 },
      { bookIndex: 3, name: 'Siti Nurhaliza', email: 'siti.n@contoh.id',        start: -12, due: -5, returned: null },
      { bookIndex: 6, name: 'Budi Santoso',   email: 'budi.santoso@contoh.id',  start: -10, due: -3, returned: null },
      { bookIndex: 1, name: 'Dewi Lestari',   email: 'dewi.lestari@contoh.id',  start: -6,  due: 1,  returned: null },
      { bookIndex: 4, name: 'Rizky Pratama',  email: 'rizky.pratama@contoh.id', start: -3,  due: 4,  returned: null },
    ];

    const loans: Loan[] = [];
    let sequence = 1;

    for (const scenario of scenarios) {
      const book = books[scenario.bookIndex];
      const borrowedAt = addDays(today, scenario.start);
      const returnedAt =
        scenario.returned === null ? null : addDays(today, scenario.returned);
      const dueAt = addDays(today, scenario.due);

      // Denda dihitung memakai method statis yang sama dengan yang dipakai
      // aplikasi saat memproses pengembalian sungguhan.
      const fine = returnedAt
        ? LoanService.calculateFine(dueAt, returnedAt, 1000)
        : 0;

      loans.push(
        this.loanRepository.create({
          code: LoanService.buildCode(borrowedAt, sequence),
          borrowerName: scenario.name,
          borrowerEmail: scenario.email,
          bookId: book.id,
          borrowedAt,
          dueAt,
          returnedAt,
          status: returnedAt ? LoanStatus.RETURNED : LoanStatus.BORROWED,
          fine,
        }),
      );

      // Buku yang belum dikembalikan harus mengurangi stok tersedia.
      if (!returnedAt) {
        book.decreaseStock();
        await this.bookRepository.save(book);
      }

      sequence += 1;
    }

    await this.loanRepository.save(loans);
    this.logger.log(`${loans.length} transaksi contoh berhasil dimasukkan.`);
  }
}
