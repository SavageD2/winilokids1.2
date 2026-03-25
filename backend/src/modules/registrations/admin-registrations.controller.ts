import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListRegistrationsQueryDto } from './dto/list-registrations-query.dto';
import { UpdateRegistrationStatusDto } from './dto/update-registration-status.dto';
import { RegistrationsService } from './registrations.service';

@ApiTags('Admin Registrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminRegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Get('registrations')
  findAll(@Query() query: ListRegistrationsQueryDto) {
    return this.registrationsService.findAll(query);
  }

  @Get('workshops/:workshopId/registrations')
  findByWorkshop(@Param('workshopId', ParseIntPipe) workshopId: number) {
    return this.registrationsService.findByWorkshop(workshopId);
  }

  @Patch('registrations/:id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRegistrationStatusDto: UpdateRegistrationStatusDto,
  ) {
    return this.registrationsService.updateStatus(id, updateRegistrationStatusDto);
  }
}
