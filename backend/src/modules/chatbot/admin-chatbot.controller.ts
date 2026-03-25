import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatbotService } from './chatbot.service';
import { ListChatbotLogsQueryDto } from './dto/list-chatbot-logs-query.dto';

@ApiTags('Admin Chatbot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/chatbot')
export class AdminChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Get('summary')
  getSummary() {
    return this.chatbotService.getSummary();
  }

  @Get('logs')
  findAll(@Query() query: ListChatbotLogsQueryDto) {
    return this.chatbotService.findAll(query);
  }
}
