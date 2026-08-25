import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Loan } from './loan.entity';
import { Book } from '../book/book.entity';
import { LoanService } from './loan.service';
import { LoanController } from './loan.controller';
import { BookModule } from '../book/book.module';
import { MailModule } from '../mail/mail.module';

/**
 * LoanModule — modul fitur transaksi peminjaman dan pengembalian buku.
 *
 * Modul ini mengimpor {@link BookModule} dan {@link MailModule} untuk memakai
 * ulang layanan yang sudah ada, sekaligus mendaftarkan repository dua entitas
 * sekaligus karena satu transaksi peminjaman menyentuh tabel `loans`
 * dan tabel `books`.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Loan, Book]), BookModule, MailModule],
  controllers: [LoanController],
  providers: [LoanService],
  exports: [LoanService],
})
export class LoanModule {}
