import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FaqService } from './faq.service';

@ApiTags('Public FAQ')
@Controller('faq')
export class PublicFaqController {
  constructor(private readonly faqService: FaqService) {}

  @Get()
  findPublished() {
    return this.faqService.findPublished();
  }
}
