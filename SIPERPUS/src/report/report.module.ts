import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { PdfService } from './pdf.service';
import { LoanModule } from '../loan/loan.module';
import { MailModule } from '../mail/mail.module';

/**
 * ReportModule — modul pelaporan dan pencetakan berkas PDF.
 */
@Module({
  imports: [LoanModule, MailModule],
  controllers: [ReportController],
  providers: [PdfService],
  exports: [PdfService],
})
export class ReportModule {}
