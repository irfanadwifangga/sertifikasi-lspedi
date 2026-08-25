import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { BookModule } from '../book/book.module';
import { LoanModule } from '../loan/loan.module';

/**
 * DashboardModule — modul halaman muka aplikasi.
 *
 * Tidak mendaftarkan provider baru; seluruh datanya dipinjam dari
 * {@link BookModule} dan {@link LoanModule}.
 */
@Module({
  imports: [BookModule, LoanModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
