import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminsService } from '../admins/admins.service';
import { LoginAdminDto } from './dto/login-admin.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly adminsService: AdminsService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginAdminDto: LoginAdminDto) {
    const admin = await this.adminsService.findByEmail(loginAdminDto.email);

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginAdminDto.password, admin.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: admin.id,
      email: admin.email,
      role: 'admin',
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      admin: this.adminsService.sanitizeAdmin(admin),
    };
  }

  async getProfile(adminId: number) {
    const admin = await this.adminsService.findById(adminId);

    return this.adminsService.sanitizeAdmin(admin);
  }
}
