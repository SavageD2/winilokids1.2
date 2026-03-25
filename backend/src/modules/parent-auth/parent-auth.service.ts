import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ParentAccountsService } from '../parent-accounts/parent-accounts.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { LoginParentDto } from './dto/login-parent.dto';
import { RegisterParentDto } from './dto/register-parent.dto';
import { UpdateParentProfileDto } from './dto/update-parent-profile.dto';

@Injectable()
export class ParentAuthService {
  constructor(
    private readonly parentAccountsService: ParentAccountsService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerParentDto: RegisterParentDto) {
    const passwordHash = await bcrypt.hash(registerParentDto.password, 10);

    const parent = await this.parentAccountsService.create({
      email: registerParentDto.email,
      passwordHash,
      firstName: registerParentDto.firstName,
      lastName: registerParentDto.lastName,
      phone: registerParentDto.phone ?? null,
    });

    return this.buildSession(parent.id, parent.email);
  }

  async login(loginParentDto: LoginParentDto) {
    const parent = await this.parentAccountsService.findByEmail(loginParentDto.email);

    if (!parent) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginParentDto.password, parent.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildSession(parent.id, parent.email);
  }

  async getProfile(parentAccountId: number) {
    const parent = await this.parentAccountsService.findById(parentAccountId);
    return this.parentAccountsService.sanitizeParent(parent);
  }

  async updateProfile(parentAccountId: number, updateParentProfileDto: UpdateParentProfileDto) {
    const parent = await this.parentAccountsService.update(parentAccountId, {
      email: updateParentProfileDto.email,
      firstName: updateParentProfileDto.firstName,
      lastName: updateParentProfileDto.lastName,
      phone: updateParentProfileDto.phone ?? null,
    });

    return this.parentAccountsService.sanitizeParent(parent);
  }

  private async buildSession(parentAccountId: number, email: string) {
    const parent = await this.parentAccountsService.findById(parentAccountId);
    const payload: JwtPayload = {
      sub: parent.id,
      email,
      role: 'parent',
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      parent: this.parentAccountsService.sanitizeParent(parent),
    };
  }
}
