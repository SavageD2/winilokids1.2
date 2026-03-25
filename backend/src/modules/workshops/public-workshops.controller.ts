import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WorkshopsService } from './workshops.service';

@ApiTags('Public Workshops')
@Controller('workshops')
export class PublicWorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Get()
  findPublished() {
    return this.workshopsService.findPublished();
  }

  @Get(':slug')
  findPublishedBySlug(@Param('slug') slug: string) {
    return this.workshopsService.findPublishedBySlug(slug);
  }
}
