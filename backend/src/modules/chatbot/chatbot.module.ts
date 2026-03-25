import { Module } from '@nestjs/common';
import { FaqModule } from '../faq/faq.module';
import { WorkshopsModule } from '../workshops/workshops.module';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';

@Module({
  imports: [FaqModule, WorkshopsModule],
  controllers: [ChatbotController],
  providers: [ChatbotService],
})
export class ChatbotModule {}
