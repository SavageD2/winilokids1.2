import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateFaqEntryDto } from './dto/create-faq-entry.dto';
import { UpdateFaqEntryDto } from './dto/update-faq-entry.dto';
import { FaqService } from './faq.service';

@ApiTags('Admin FAQ')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/faq')
export class AdminFaqController {
  constructor(private readonly faqService: FaqService) {}

  @Get()
  findAll() {
    return this.faqService.findAll();
  }

  @Post()
  create(@Body() createFaqEntryDto: CreateFaqEntryDto) {
    return this.faqService.create(createFaqEntryDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFaqEntryDto: UpdateFaqEntryDto,
  ) {
    return this.faqService.update(id, updateFaqEntryDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.faqService.remove(id);
  }
}
