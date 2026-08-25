import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from './book.entity';
import { BookService } from './book.service';
import { BookController } from './book.controller';

/**
 * BookModule — modul yang mengelompokkan seluruh komponen fitur "Data Buku".
 *
 * Modul mendaftarkan repository entitas {@link Book}, controller, dan service.
 * `BookService` diekspor agar dapat dipakai ulang oleh modul lain
 * (Loan, Dashboard, dan Report) — penerapan prinsip reusability.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Book])],
  controllers: [BookController],
  providers: [BookService],
  exports: [BookService],
})
export class BookModule {}
