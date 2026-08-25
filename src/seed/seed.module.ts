import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from '../book/book.entity';
import { Loan } from '../loan/loan.entity';
import { SeedService } from './seed.service';

/**
 * SeedModule — modul pengisian data contoh saat aplikasi pertama dijalankan.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Book, Loan])],
  providers: [SeedService],
})
export class SeedModule {}
