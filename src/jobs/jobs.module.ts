import { BullModule } from '@nestjs/bull';
import { Global, Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { MailProcessor } from './mail.processor';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'mail',
    }),
  ],
  providers: [JobsService, MailProcessor],
  exports: [BullModule],
})
export class JobsModule {}
