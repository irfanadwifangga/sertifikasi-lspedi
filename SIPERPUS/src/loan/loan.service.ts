import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, Repository } from 'typeorm';
import { Loan, LoanStatus } from './loan.entity';
import { Book } from '../book/book.entity';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { addDays, diffInDays, endOfDay, startOfDay } from '../common/date';

/**
 * LoanService — kelas layanan yang menampung logika bisnis transaksi
 * peminjaman dan pengembalian buku.
 *
 * Kelas ini adalah inti aplikasi: di sinilah aturan denda, pengurangan stok,
 * dan penentuan jatuh tempo dijalankan. Seluruh operasi yang menyentuh lebih
 * dari satu tabel dibungkus dalam TRANSAKSI BASIS DATA agar data tidak pernah
 * berada dalam kondisi setengah jadi.
 *
 * Penerapan konsep OOP:
 *  - Dependency Injection : Repository dan ConfigService disuntikkan lewat
 *                           constructor.
 *  - Method statis        : {@link calculateFine}, {@link buildCode}, dan
 *                           {@link stockEffect} adalah method milik KELAS
 *                           (bukan milik objek), karena tidak membutuhkan
 *                           state instance apa pun. Sifat murni ini pula yang
 *                           membuat ketiganya mudah diuji secara unit.
 */
@Injectable()
export class LoanService {
  private readonly logger = new Logger(LoanService.name);

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  // =========================================================================
  //  METHOD STATIS — fungsi murni, tidak menyentuh basis data
  // =========================================================================

  /**
   * Menghitung denda keterlambatan pengembalian buku.
   *
   * Aturan bisnis:
   *  - Dikembalikan tepat waktu atau lebih awal -> denda Rp 0.
   *  - Terlambat -> denda = jumlah hari keterlambatan x tarif per hari.
   *
   * @param dueAt       Batas akhir pengembalian.
   * @param returnedAt  Tanggal buku benar-benar dikembalikan.
   * @param ratePerDay  Besaran denda per hari keterlambatan (rupiah).
   * @returns Total denda dalam rupiah, minimal 0.
   *
   * @example
   * // Terlambat 3 hari dengan tarif Rp 1.000 per hari
   * LoanService.calculateFine(
   *   new Date('2026-08-01'), new Date('2026-08-04'), 1000,
   * ); // => 3000
   */
  static calculateFine(
    dueAt: Date,
    returnedAt: Date,
    ratePerDay: number,
  ): number {
    const lateDays = diffInDays(dueAt, returnedAt);

    if (lateDays <= 0) {
      return 0;
    }
    return lateDays * ratePerDay;
  }

  /**
   * Membentuk kode transaksi yang unik dan mudah dibaca manusia.
   *
   * Format: PJM-YYYYMMDD-NNN, contoh "PJM-20260825-007".
   *
   * @param date     Tanggal transaksi.
   * @param sequence Nomor urut transaksi pada hari tersebut.
   */
  static buildCode(date: Date, sequence: number): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const number = String(sequence).padStart(3, '0');
    return `PJM-${year}${month}${day}-${number}`;
  }

  /**
   * Menentukan pengaruh perubahan status transaksi terhadap stok buku.
   *
   * Aturannya berpasangan dengan makna status itu sendiri:
   *  - Dipinjam -> Dikembalikan : buku kembali ke rak, stok BERTAMBAH.
   *  - Dikembalikan -> Dipinjam : buku keluar lagi dari rak, stok BERKURANG.
   *  - Status tidak berubah     : stok TETAP.
   *
   * Logika ini sengaja dipisahkan menjadi method statis yang murni agar dapat
   * diuji tanpa menyentuh basis data, sekaligus memastikan tidak ada jalur
   * perubahan status yang membuat jumlah stok melenceng dari kenyataan.
   *
   * @param oldStatus Status transaksi sebelum diubah.
   * @param newStatus Status transaksi yang dikehendaki.
   * @returns Tindakan yang harus dilakukan terhadap stok buku.
   */
  static stockEffect(
    oldStatus: LoanStatus,
    newStatus: LoanStatus,
  ): 'increase' | 'decrease' | 'none' {
    if (oldStatus === newStatus) {
      return 'none';
    }
    return newStatus === LoanStatus.RETURNED ? 'increase' : 'decrease';
  }

  // =========================================================================
  //  OPERASI BASIS DATA
  // =========================================================================

  /**
   * Mengambil daftar transaksi peminjaman beserta data bukunya (JOIN).
   *
   * @param status Filter status transaksi (opsional).
   * @returns Daftar transaksi terurut dari yang terbaru.
   */
  async findAll(status?: string): Promise<Loan[]> {
    const query = this.loanRepository
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.book', 'b')
      .orderBy('l.id', 'DESC');

    if (status === 'borrowed') {
      query.where('l.status = :status', { status: LoanStatus.BORROWED });
    } else if (status === 'returned') {
      query.where('l.status = :status', { status: LoanStatus.RETURNED });
    }

    return query.getMany();
  }

  /**
   * Mencari satu transaksi berdasarkan ID, lengkap dengan relasi bukunya.
   *
   * @throws {NotFoundException} bila transaksi tidak ditemukan.
   */
  async findOne(id: number): Promise<Loan> {
    const loan = await this.loanRepository.findOne({
      where: { id },
      relations: { book: true },
    });

    if (!loan) {
      throw new NotFoundException(`Transaksi dengan ID ${id} tidak ditemukan.`);
    }
    return loan;
  }

  /**
   * Mencatat transaksi peminjaman baru.
   *
   * Seluruh langkah dijalankan dalam satu TRANSAKSI BASIS DATA:
   *  1. Kunci baris buku, pastikan stoknya masih tersedia.
   *  2. Kurangi stok tersedia sebanyak satu eksemplar.
   *  3. Simpan baris transaksi peminjaman.
   *
   * Bila salah satu langkah gagal, seluruh perubahan dibatalkan (rollback)
   * sehingga stok buku tidak pernah berkurang tanpa transaksi pasangannya.
   *
   * @param dto Data peminjaman yang sudah lolos validasi.
   * @throws {BadRequestException} bila stok buku habis.
   */
  async borrow(dto: CreateLoanDto): Promise<Loan> {
    return this.dataSource.transaction(async (manager) => {
      const book = await manager.findOne(Book, { where: { id: dto.bookId } });

      if (!book) {
        throw new NotFoundException('Buku yang dipilih tidak ditemukan.');
      }
      if (!book.isBorrowable()) {
        throw new BadRequestException(
          `Stok buku "${book.title}" sedang habis dipinjam.`,
        );
      }

      // Panggil method domain milik entitas untuk mengubah stok.
      book.decreaseStock();
      await manager.save(Book, book);

      const borrowedAt = new Date();

      // Hitung transaksi yang sudah tercatat hari ini untuk menentukan
      // nomor urut pada kode transaksi.
      const todayCount = await manager.count(Loan, {
        where: {
          borrowedAt: Between(startOfDay(borrowedAt), endOfDay(borrowedAt)),
        },
      });

      const loan = manager.create(Loan, {
        code: LoanService.buildCode(borrowedAt, todayCount + 1),
        borrowerName: dto.borrowerName,
        borrowerEmail: dto.borrowerEmail,
        bookId: book.id,
        borrowedAt,
        dueAt: addDays(borrowedAt, dto.loanDays),
        status: LoanStatus.BORROWED,
        fine: 0,
      });

      const saved = await manager.save(Loan, loan);
      this.logger.log(
        `Peminjaman tercatat: ${saved.code} oleh ${saved.borrowerName}`,
      );
      return saved;
    });
  }

  /**
   * Memproses pengembalian buku.
   *
   * Langkah di dalam satu transaksi basis data:
   *  1. Pastikan transaksi belum pernah dikembalikan.
   *  2. Hitung denda memakai {@link calculateFine}.
   *  3. Kembalikan stok buku sebanyak satu eksemplar.
   *  4. Perbarui status dan tanggal kembali.
   *
   * @param id ID transaksi peminjaman.
   * @returns Transaksi yang sudah diperbarui.
   * @throws {BadRequestException} bila buku sudah pernah dikembalikan.
   */
  async returnBook(id: number): Promise<Loan> {
    return this.dataSource.transaction(async (manager) => {
      const loan = await manager.findOne(Loan, {
        where: { id },
        relations: { book: true },
      });

      if (!loan) {
        throw new NotFoundException(
          `Transaksi dengan ID ${id} tidak ditemukan.`,
        );
      }
      if (!loan.isOngoing()) {
        throw new BadRequestException(
          `Transaksi ${loan.code} sudah dikembalikan sebelumnya.`,
        );
      }

      const returnedAt = new Date();
      loan.returnedAt = returnedAt;
      loan.status = LoanStatus.RETURNED;
      loan.fine = LoanService.calculateFine(
        loan.dueAt,
        returnedAt,
        this.finePerDay(),
      );

      const book = await manager.findOne(Book, { where: { id: loan.bookId } });
      if (book) {
        book.increaseStock();
        await manager.save(Book, book);
      }

      const saved = await manager.save(Loan, loan);
      this.logger.log(`Pengembalian: ${saved.code}, denda ${saved.fine} rupiah`);
      return saved;
    });
  }

  /**
   * Memperbarui data transaksi peminjaman (operasi UPDATE).
   *
   * Method ini menangani tiga jenis perubahan sekaligus:
   *  1. Koreksi identitas peminjam (nama dan surel).
   *  2. Perpanjangan atau perubahan tanggal jatuh tempo.
   *  3. Perubahan status peminjaman secara manual oleh petugas.
   *
   * Perubahan status adalah bagian paling rawan, karena ikut memengaruhi stok
   * buku. Karena itu seluruh langkah dibungkus dalam satu TRANSAKSI BASIS DATA
   * dan pengaruhnya terhadap stok ditentukan oleh {@link stockEffect}. Bila
   * stok tidak mencukupi saat status dikembalikan menjadi "Dipinjam", seluruh
   * perubahan dibatalkan (rollback) sehingga data tidak pernah setengah jadi.
   *
   * Denda selalu dihitung ULANG dari data terkini, sebab memundurkan atau
   * memajukan tanggal jatuh tempo semestinya mengubah besaran dendanya juga.
   *
   * @param id  ID transaksi yang akan diubah.
   * @param dto Data baru yang sudah lolos validasi.
   * @throws {NotFoundException}   bila transaksi tidak ditemukan.
   * @throws {BadRequestException} bila tanggal tidak masuk akal atau stok habis.
   */
  async update(id: number, dto: UpdateLoanDto): Promise<Loan> {
    return this.dataSource.transaction(async (manager) => {
      const loan = await manager.findOne(Loan, {
        where: { id },
        relations: { book: true },
      });

      if (!loan) {
        throw new NotFoundException(
          `Transaksi dengan ID ${id} tidak ditemukan.`,
        );
      }

      const newDueAt = new Date(`${dto.dueAt}T00:00:00`);
      if (diffInDays(loan.borrowedAt, newDueAt) < 0) {
        throw new BadRequestException(
          'Tanggal jatuh tempo tidak boleh mendahului tanggal peminjaman.',
        );
      }

      const oldStatus = loan.status;
      const effect = LoanService.stockEffect(oldStatus, dto.status);

      // --- Sesuaikan stok buku bila statusnya berpindah ---------------------
      if (effect !== 'none') {
        const book = await manager.findOne(Book, {
          where: { id: loan.bookId },
        });

        if (!book) {
          throw new NotFoundException('Data buku terkait tidak ditemukan.');
        }

        if (effect === 'increase') {
          book.increaseStock();
          loan.returnedAt = new Date();
        } else {
          if (!book.isBorrowable()) {
            throw new BadRequestException(
              `Status tidak dapat dikembalikan menjadi "Dipinjam" karena stok ` +
                `buku "${book.title}" sedang habis.`,
            );
          }
          book.decreaseStock();
          loan.returnedAt = null;
        }

        await manager.save(Book, book);
      }

      // --- Terapkan perubahan pada transaksi --------------------------------
      loan.borrowerName = dto.borrowerName;
      loan.borrowerEmail = dto.borrowerEmail;
      loan.dueAt = newDueAt;
      loan.status = dto.status;

      // Denda hanya berlaku untuk transaksi yang sudah dikembalikan.
      loan.fine = loan.returnedAt
        ? LoanService.calculateFine(
            loan.dueAt,
            loan.returnedAt,
            this.finePerDay(),
          )
        : 0;

      const saved = await manager.save(Loan, loan);
      this.logger.log(
        `Transaksi diperbarui: ${saved.code} (${oldStatus} -> ${saved.status}), ` +
          `denda ${saved.fine} rupiah`,
      );
      return saved;
    });
  }

  /**
   * Mengambil transaksi yang masih dipinjam dan sudah melewati jatuh tempo.
   * Dipakai oleh fitur pengiriman notifikasi surel.
   */
  async findOverdue(): Promise<Loan[]> {
    return this.loanRepository
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.book', 'b')
      .where('l.status = :status', { status: LoanStatus.BORROWED })
      .andWhere('l.due_at < CURRENT_DATE')
      .orderBy('l.due_at', 'ASC')
      .getMany();
  }

  /**
   * Mengambil transaksi dalam rentang tanggal tertentu untuk keperluan laporan.
   *
   * @param from Tanggal awal periode.
   * @param to   Tanggal akhir periode.
   */
  async findByPeriod(from: Date, to: Date): Promise<Loan[]> {
    return this.loanRepository
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.book', 'b')
      .where('l.borrowed_at BETWEEN :from AND :to', { from, to })
      .orderBy('l.borrowed_at', 'ASC')
      .addOrderBy('l.id', 'ASC')
      .getMany();
  }

  /**
   * Menghitung ringkasan transaksi untuk dashboard dan laporan.
   */
  async summarize(): Promise<{
    totalLoans: number;
    ongoing: number;
    returned: number;
    overdue: number;
    totalFine: number;
  }> {
    const loans = await this.loanRepository.find();
    const reference = new Date();

    // Pemrograman terstruktur: satu kali perulangan untuk semua akumulator.
    let ongoing = 0;
    let returned = 0;
    let overdue = 0;
    let totalFine = 0;

    for (const loan of loans) {
      // Data hasil find() adalah instance kelas Loan,
      // sehingga method domainnya dapat langsung dipanggil.
      if (loan.isOngoing()) {
        ongoing += 1;
        if (loan.isOverdue(reference)) {
          overdue += 1;
        }
      } else {
        returned += 1;
      }
      totalFine += loan.fine;
    }

    return { totalLoans: loans.length, ongoing, returned, overdue, totalFine };
  }

  /**
   * Menghitung jumlah peminjaman per bulan pada tahun berjalan.
   * Hasilnya dipakai sebagai sumber data grafik Chart.js di dashboard.
   *
   * @returns Array 12 elemen, indeks 0 = Januari.
   */
  async countByMonth(): Promise<number[]> {
    const year = new Date().getFullYear();
    const rows = await this.loanRepository
      .createQueryBuilder('l')
      .select('EXTRACT(MONTH FROM l.borrowed_at)', 'month')
      .addSelect('COUNT(l.id)', 'total')
      .where('EXTRACT(YEAR FROM l.borrowed_at) = :year', { year })
      .groupBy('month')
      .getRawMany();

    const data = new Array(12).fill(0);
    for (const row of rows) {
      data[Number(row.month) - 1] = Number(row.total);
    }
    return data;
  }

  /**
   * Mengambil transaksi terbaru untuk ditampilkan di dashboard.
   *
   * @param limit Banyaknya baris yang diambil.
   */
  async findRecent(limit = 5): Promise<Loan[]> {
    return this.loanRepository.find({
      relations: { book: true },
      order: { id: 'DESC' },
      take: limit,
    });
  }

  /**
   * Membaca tarif denda per hari dari konfigurasi lingkungan.
   */
  finePerDay(): number {
    return Number(this.configService.get<string>('DENDA_PER_HARI') ?? 1000);
  }

  /**
   * Membaca lama peminjaman baku (dalam hari) dari konfigurasi lingkungan.
   */
  defaultLoanDays(): number {
    return Number(this.configService.get<string>('LAMA_PINJAM_HARI') ?? 7);
  }
}
