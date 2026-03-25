import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ParentJwtAuthGuard } from '../auth/parent-jwt-auth.guard';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { RegistrationsService } from './registrations.service';

type AuthenticatedParentRequest = Request & {
  user: {
    parentAccountId: number;
    email: string;
    role: 'parent';
  };
};

@ApiTags('Parent Registrations')
@ApiBearerAuth()
@UseGuards(ParentJwtAuthGuard)
@Controller('parent/registrations')
export class ParentRegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Get()
  findMine(@Req() req: AuthenticatedParentRequest) {
    return this.registrationsService.findByParent(req.user.parentAccountId);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedParentRequest,
  ) {
    return this.registrationsService.cancelByParent(id, req.user.parentAccountId);
  }

  @Post()
  create(
    @Body() createRegistrationDto: CreateRegistrationDto,
    @Req() req: AuthenticatedParentRequest,
  ) {
    return this.registrationsService.create(createRegistrationDto, req.user.parentAccountId);
  }
}
