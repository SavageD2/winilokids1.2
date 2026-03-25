import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateChatbotMessageDto } from './dto/create-chatbot-message.dto';
import { ChatbotService } from './chatbot.service';

@ApiTags('Public Chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('messages')
  reply(@Body() createChatbotMessageDto: CreateChatbotMessageDto) {
    return this.chatbotService.reply(createChatbotMessageDto);
  }
}
