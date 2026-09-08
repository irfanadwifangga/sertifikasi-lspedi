import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Render,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { LoanService } from './loan.service';
import { BookService } from '../book/book.service';
import { MailService } from '../mail/mail.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { LoanStatus } from './loan.entity';
import { validateDto } from '../common/validation';
import { errorMessage } from '../common/error';
import { formatIsoDate } from '../common/date';

/**
 * LoanController — pengendali request HTTP untuk rute `/loans`
 * (HALAMAN 4, 5, 6, dan 8 aplikasi).
 *
 * Penerapan konsep OOP: tiga buah service berbeda disuntikkan lewat
 * constructor (Dependency Injection), sehingga controller ini dapat
 * memanfaatkan ulang logika yang sudah ditulis di modul lain tanpa
 * menyalin kodenya.
 */
@Controller('loans')
export class LoanController {
  constructor(
    private readonly loanService: LoanService,
    private readonly bookService: BookService,
    private readonly mailService: MailService,
  ) {}

  /**
   * HALAMAN 4 — Transaksi Peminjaman.
   * Menampilkan seluruh transaksi beserta filter status.
   *
   * @param status  Filter status: `borrowed` atau `returned`.
   * @param success Pesan notifikasi hasil operasi sebelumnya.
   */
  @Get()
  @Render('loan/index')
  async index(
    @Query('status') status?: string,
    @Query('success') success?: string,
  ) {
    const loans = await this.loanService.findAll(status);
    const summary = await this.loanService.summarize();

    return {
      title: 'Transaksi Peminjaman',
      menu: 'loans',
      loans: loans.map((loan) => loan.toView()),
      status: status ?? '',
      summary,
      success,
    };
  }

  /**
   * HALAMAN 5 — Form Peminjaman Buku.
   * Hanya buku dengan stok tersedia yang ditawarkan pada daftar pilihan.
   */
  @Get('new')
  @Render('loan/form')
  async newForm() {
    const books = await this.bookService.findAll();

    return {
      title: 'Pinjam Buku',
      menu: 'loans',
      books: books.filter((book) => book.isBorrowable()),
      defaultLoanDays: this.loanService.defaultLoanDays(),
      finePerDay: this.loanService.finePerDay(),
      form: {},
      errors: [],
    };
  }

  /**
   * Memproses pencatatan transaksi peminjaman baru.
   *
   * Bila transaksi berhasil, aplikasi langsung mengirimkan surel bukti
   * peminjaman kepada peminjam memakai library Nodemailer.
   */
  @Post()
  async store(@Body() body: Record<string, unknown>, @Res() res: Response) {
    const rerender = async (messages: string[]) => {
      const books = await this.bookService.findAll();
      return res.render('loan/form', {
        title: 'Pinjam Buku',
        menu: 'loans',
        books: books.filter((book) => book.isBorrowable()),
        defaultLoanDays: this.loanService.defaultLoanDays(),
        finePerDay: this.loanService.finePerDay(),
        form: body,
        errors: messages,
      });
    };

    const { dto, errors } = await validateDto(CreateLoanDto, body);
    if (errors.length > 0) {
      return rerender(errors);
    }

    try {
      const loan = await this.loanService.borrow(dto);
      const complete = await this.loanService.findOne(loan.id);

      // Pengiriman surel sengaja tidak dibuat menggagalkan transaksi:
      // bila server surel bermasalah, data peminjaman tetap tersimpan.
      await this.mailService.sendLoanReceipt(complete);

      return res.redirect(
        '/loans?success=' +
          encodeURIComponent(
            `Peminjaman ${loan.code} tercatat. Bukti peminjaman telah dikirim ke ${loan.borrowerEmail}.`,
          ),
      );
    } catch (error) {
      return rerender([errorMessage(error)]);
    }
  }

  /**
   * HALAMAN 6 — Detail Transaksi Peminjaman.
   */
  @Get(':id')
  @Render('loan/detail')
  async detail(
    @Param('id', ParseIntPipe) id: number,
    @Query('success') success?: string,
  ) {
    const loan = await this.loanService.findOne(id);

    return {
      title: 'Detail Peminjaman',
      menu: 'loans',
      loan: loan.toView(),
      finePerDay: this.loanService.finePerDay(),
      success,
    };
  }

  /**
   * HALAMAN 8 — Form Ubah Transaksi Peminjaman.
   *
   * Menampilkan formulir untuk mengoreksi identitas peminjam, memperpanjang
   * tanggal jatuh tempo, atau mengubah status peminjaman secara manual.
   *
   * @param id ID transaksi yang akan diubah.
   */
  @Get(':id/edit')
  @Render('loan/form-edit')
  async editForm(@Param('id', ParseIntPipe) id: number) {
    const loan = await this.loanService.findOne(id);

    return {
      title: 'Ubah Transaksi Peminjaman',
      menu: 'loans',
      loan: loan.toView(),
      form: {
        borrowerName: loan.borrowerName,
        borrowerEmail: loan.borrowerEmail,
        dueAt: formatIsoDate(loan.dueAt),
        status: loan.status,
      },
      statuses: Object.values(LoanStatus),
      finePerDay: this.loanService.finePerDay(),
      errors: [],
    };
  }

  /**
   * Memproses pengubahan data transaksi peminjaman (operasi UPDATE).
   *
   * Perubahan status ikut menyesuaikan stok buku, dan seluruhnya dijalankan
   * dalam satu transaksi basis data di lapisan service.
   */
  @Post(':id/edit')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
    @Res() res: Response,
  ) {
    const rerender = async (messages: string[]) => {
      const loan = await this.loanService.findOne(id);
      return res.render('loan/form-edit', {
        title: 'Ubah Transaksi Peminjaman',
        menu: 'loans',
        loan: loan.toView(),
        form: body,
        statuses: Object.values(LoanStatus),
        finePerDay: this.loanService.finePerDay(),
        errors: messages,
      });
    };

    const { dto, errors } = await validateDto(UpdateLoanDto, body);
    if (errors.length > 0) {
      return rerender(errors);
    }

    try {
      const saved = await this.loanService.update(id, dto);
      return res.redirect(
        `/loans/${id}?success=` +
          encodeURIComponent(
            `Transaksi ${saved.code} berhasil diperbarui. Status sekarang: ${saved.status}.`,
          ),
      );
    } catch (error) {
      return rerender([errorMessage(error)]);
    }
  }

  /**
   * Memproses pengembalian buku dan menghitung dendanya.
   */
  @Post(':id/return')
  async returnBook(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    try {
      const saved = await this.loanService.returnBook(id);
      const message =
        saved.fine > 0
          ? `Buku dikembalikan. Denda keterlambatan sebesar Rp ${saved.fine.toLocaleString('id-ID')} telah dicatat.`
          : 'Buku berhasil dikembalikan tepat waktu, tanpa denda.';

      return res.redirect(`/loans/${id}?success=` + encodeURIComponent(message));
    } catch (error) {
      return res.redirect(
        `/loans/${id}?success=` + encodeURIComponent(errorMessage(error)),
      );
    }
  }

  /**
   * Mengirim ulang surel pengingat jatuh tempo untuk satu transaksi.
   */
  @Post(':id/remind')
  async remind(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const loan = await this.loanService.findOne(id);
    await this.mailService.sendOverdueReminders([loan]);

    return res.redirect(
      `/loans/${id}?success=` +
        encodeURIComponent(
          `Surel pengingat telah dikirim ke ${loan.borrowerEmail}.`,
        ),
    );
  }
}
