import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminFaqController } from './admin-faq.controller';
import { FaqService } from './faq.service';
import { PublicFaqController } from './public-faq.controller';

@Module({
  imports: [AuthModule],
  controllers: [PublicFaqController, AdminFaqController],
  providers: [FaqService],
  exports: [FaqService],
})
export class FaqModule {}
