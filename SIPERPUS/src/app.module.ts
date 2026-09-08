import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Book } from './book/book.entity';
import { Loan } from './loan/loan.entity';

import { BookModule } from './book/book.module';
import { LoanModule } from './loan/loan.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportModule } from './report/report.module';
import { MailModule } from './mail/mail.module';
import { SeedModule } from './seed/seed.module';

/**
 * AppModule — modul akar (root module) aplikasi SIPERPUS.
 *
 * Modul ini bertugas merangkai seluruh modul fitur dan mengatur koneksi ke
 * basis data PostgreSQL. Konfigurasi koneksi dibaca dari variabel lingkungan
 * (environment variable) melalui `ConfigService`, sehingga nilai sensitif
 * seperti kata sandi basis data tidak pernah ditulis langsung di dalam kode.
 */
@Module({
  imports: [
    // Membaca berkas .env dan menyediakan ConfigService ke seluruh aplikasi.
    ConfigModule.forRoot({ isGlobal: true }),

    // Koneksi basis data dibangun secara asinkron karena membutuhkan
    // ConfigService yang baru tersedia setelah ConfigModule selesai dimuat.
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST') ?? 'localhost',
        port: Number(config.get<string>('DB_PORT') ?? 5432),
        username: config.get<string>('DB_USER') ?? 'siperpus',
        password: config.get<string>('DB_PASS') ?? 'siperpus',
        database: config.get<string>('DB_NAME') ?? 'siperpus',
        entities: [Book, Loan],

        // `synchronize` membuat struktur tabel dibentuk otomatis dari definisi
        // entitas saat aplikasi dinyalakan. Sangat praktis untuk keperluan
        // demonstrasi; pada sistem produksi sebaiknya diganti dengan migrasi.
        synchronize: true,
        logging: ['error', 'warn'],
      }),
    }),

    BookModule,
    LoanModule,
    DashboardModule,
    ReportModule,
    MailModule,
    SeedModule,
  ],
})
export class AppModule {}
