import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ParentJwtAuthGuard } from '../auth/parent-jwt-auth.guard';
import { LoginParentDto } from './dto/login-parent.dto';
import { RegisterParentDto } from './dto/register-parent.dto';
import { ParentAuthService } from './parent-auth.service';
import { UpdateParentProfileDto } from './dto/update-parent-profile.dto';

type AuthenticatedParentRequest = Request & {
  user: {
    parentAccountId: number;
    email: string;
    role: 'parent';
  };
};

@ApiTags('Parent Auth')
@Controller('parent/auth')
export class ParentAuthController {
  constructor(private readonly parentAuthService: ParentAuthService) {}

  @Post('register')
  register(@Body() registerParentDto: RegisterParentDto) {
    return this.parentAuthService.register(registerParentDto);
  }

  @Post('login')
  login(@Body() loginParentDto: LoginParentDto) {
    return this.parentAuthService.login(loginParentDto);
  }

  @ApiBearerAuth()
  @UseGuards(ParentJwtAuthGuard)
  @Get('me')
  getProfile(@Req() req: AuthenticatedParentRequest) {
    return this.parentAuthService.getProfile(req.user.parentAccountId);
  }

  @ApiBearerAuth()
  @UseGuards(ParentJwtAuthGuard)
  @Patch('me')
  updateProfile(
    @Req() req: AuthenticatedParentRequest,
    @Body() updateParentProfileDto: UpdateParentProfileDto,
  ) {
    return this.parentAuthService.updateProfile(req.user.parentAccountId, updateParentProfileDto);
  }
}
