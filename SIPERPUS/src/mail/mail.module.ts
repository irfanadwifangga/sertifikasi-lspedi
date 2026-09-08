import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

/**
 * MailModule — modul yang menyediakan layanan pengiriman surel.
 *
 * Modul ini tidak memiliki controller karena tidak melayani halaman apa pun;
 * tugasnya semata menyediakan {@link MailService} bagi modul lain.
 */
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
