import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FaqModule } from '../faq/faq.module';
import { WorkshopsModule } from '../workshops/workshops.module';
import { AdminChatbotController } from './admin-chatbot.controller';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';

@Module({
  imports: [AuthModule, FaqModule, WorkshopsModule],
  controllers: [ChatbotController, AdminChatbotController],
  providers: [ChatbotService],
  exports: [ChatbotService],
})
export class ChatbotModule {}
