import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from '@nestjs/common';
import { join } from 'path';

// PENTING — jangan ubah menjadi `import * as hbs`.
// Modul `hbs` mengekspor satu objek instance bergaya CommonJS. Bila diimpor
// sebagai namespace, TypeScript membungkusnya dengan `__importStar` sehingga
// method seperti registerPartials() tidak terekspos dan aplikasi gagal menyala.
import hbs from 'hbs';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { registerHbsHelpers } from './common/hbs-helpers';

/**
 * bootstrap — titik masuk (entry point) aplikasi SIPERPUS.
 *
 * Fungsi ini menyalakan server HTTP dan menyiapkan tiga hal pokok:
 *  1. Mesin templat Handlebars beserta lokasi berkas tampilan.
 *  2. Direktori aset statis (CSS, JavaScript, dan font).
 *  3. Penangkap error global untuk keperluan debugging.
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // --- Aset statis: Bootstrap, Chart.js, ikon, dan CSS buatan sendiri ------
  app.useStaticAssets(join(__dirname, '..', 'public'), { prefix: '/aset' });

  // --- Mesin templat Handlebars -------------------------------------------
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');
  hbs.registerPartials(join(__dirname, '..', 'views', 'partials'));
  registerHbsHelpers();

  // Seluruh halaman memakai kerangka yang sama (sidebar + navbar);
  // isi tiap halaman disisipkan ke dalamnya lewat penanda {{{body}}}.
  app.set('view options', { layout: 'layouts/main' });

  // --- Penangkap error global (unit kompetensi: Melakukan Debugging) ------
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');

  logger.log(`SIPERPUS berjalan pada http://localhost:${port}`);
}

// Menangkap kegagalan saat proses penyalaan aplikasi agar penyebabnya
// tercetak jelas di log, bukan berhenti tanpa keterangan.
bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Gagal menyalakan aplikasi SIPERPUS:', error);
  process.exit(1);
});
