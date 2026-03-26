import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcrypt';
import { ParentAccountsService } from '../parent-accounts/parent-accounts.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { GoogleParentLoginDto } from './dto/google-parent-login.dto';
import { LoginParentDto } from './dto/login-parent.dto';
import { RegisterParentDto } from './dto/register-parent.dto';
import { SetParentPasswordDto } from './dto/set-parent-password.dto';
import { UpdateParentProfileDto } from './dto/update-parent-profile.dto';

type VerifiedGoogleProfile = {
  sub: string;
  email: string;
  givenName?: string;
  familyName?: string;
  name?: string;
};

@Injectable()
export class ParentAuthService {
  private readonly googleClient = new OAuth2Client();

  constructor(
    private readonly parentAccountsService: ParentAccountsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerParentDto: RegisterParentDto) {
    const passwordHash = await bcrypt.hash(registerParentDto.password, 10);
    const existingParent = await this.parentAccountsService.findByEmail(
      registerParentDto.email,
    );

    if (existingParent) {
      if (existingParent.passwordHash) {
        throw new ConflictException(
          'A parent account already exists with this email',
        );
      }

      const parent = await this.parentAccountsService.setPassword(
        existingParent.id,
        {
          passwordHash,
          firstName: registerParentDto.firstName,
          lastName: registerParentDto.lastName,
          phone: registerParentDto.phone ?? null,
        },
      );

      return this.buildSession(parent.id);
    }

    const parent = await this.parentAccountsService.create({
      email: registerParentDto.email,
      passwordHash,
      firstName: registerParentDto.firstName,
      lastName: registerParentDto.lastName,
      phone: registerParentDto.phone ?? null,
    });

    return this.buildSession(parent.id);
  }

  async login(loginParentDto: LoginParentDto) {
    const parent = await this.parentAccountsService.findByEmail(
      loginParentDto.email,
    );

    if (!parent || !parent.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginParentDto.password,
      parent.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildSession(parent.id);
  }

  async loginWithGoogle(googleParentLoginDto: GoogleParentLoginDto) {
    const googleProfile = await this.verifyGoogleIdToken(
      googleParentLoginDto.idToken,
    );
    const parentByGoogle = await this.parentAccountsService.findByGoogleSubject(
      googleProfile.sub,
    );

    if (parentByGoogle) {
      await this.refreshGoogleParentIdentity(parentByGoogle, googleProfile);
      return this.buildSession(parentByGoogle.id);
    }

    const parentByEmail = await this.parentAccountsService.findByEmail(
      googleProfile.email,
    );

    if (parentByEmail) {
      const linkedParent = await this.parentAccountsService.linkGoogleAccount(
        parentByEmail.id,
        {
          googleSubject: googleProfile.sub,
          googleEmailVerified: true,
        },
      );

      return this.buildSession(linkedParent.id);
    }

    const derivedName = this.extractName(googleProfile);
    const parent = await this.parentAccountsService.create({
      email: googleProfile.email,
      passwordHash: null,
      googleSubject: googleProfile.sub,
      googleEmailVerified: true,
      googleLinkedAt: new Date(),
      firstName: derivedName.firstName,
      lastName: derivedName.lastName,
      phone: null,
    });

    return this.buildSession(parent.id);
  }

  async getProfile(parentAccountId: number) {
    const parent = await this.parentAccountsService.findById(parentAccountId);
    return this.parentAccountsService.sanitizeParent(parent);
  }

  async updateProfile(
    parentAccountId: number,
    updateParentProfileDto: UpdateParentProfileDto,
  ) {
    const parent = await this.parentAccountsService.update(parentAccountId, {
      email: updateParentProfileDto.email,
      firstName: updateParentProfileDto.firstName,
      lastName: updateParentProfileDto.lastName,
      phone: updateParentProfileDto.phone ?? null,
    });

    return this.parentAccountsService.sanitizeParent(parent);
  }

  async setPassword(
    parentAccountId: number,
    setParentPasswordDto: SetParentPasswordDto,
  ) {
    const parent = await this.parentAccountsService.findById(parentAccountId);

    if (parent.passwordHash) {
      throw new ConflictException('A local password is already configured');
    }

    const passwordHash = await bcrypt.hash(setParentPasswordDto.password, 10);
    const updatedParent = await this.parentAccountsService.setLocalPassword(
      parentAccountId,
      passwordHash,
    );

    return this.parentAccountsService.sanitizeParent(updatedParent);
  }

  private async buildSession(parentAccountId: number) {
    const parent = await this.parentAccountsService.findById(parentAccountId);
    const payload: JwtPayload = {
      sub: parent.id,
      email: parent.email,
      role: 'parent',
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      parent: this.parentAccountsService.sanitizeParent(parent),
    };
  }

  private async verifyGoogleIdToken(
    idToken: string,
  ): Promise<VerifiedGoogleProfile> {
    const googleClientId = this.configService
      .get<string>('GOOGLE_CLIENT_ID')
      ?.trim();

    if (!googleClientId) {
      throw new ServiceUnavailableException('Google sign-in is not configured');
    }

    try {
      const loginTicket = await this.googleClient.verifyIdToken({
        idToken,
        audience: googleClientId,
      });
      const payload = loginTicket.getPayload();

      if (!payload?.sub || !payload.email || !payload.email_verified) {
        throw new UnauthorizedException('Google account could not be verified');
      }

      return {
        sub: payload.sub,
        email: payload.email,
        givenName: payload.given_name,
        familyName: payload.family_name,
        name: payload.name,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Google authentication failed');
    }
  }

  private extractName(payload: VerifiedGoogleProfile) {
    const firstName =
      this.sanitizeNamePart(payload.givenName) ??
      this.extractFirstName(payload.name);
    const lastName =
      this.sanitizeNamePart(payload.familyName) ??
      this.extractLastName(payload.name);

    return {
      firstName: firstName ?? 'Parent',
      lastName: lastName ?? '',
    };
  }

  private async refreshGoogleParentIdentity(
    parent: {
      id: number;
      firstName: string;
      lastName: string;
    },
    googleProfile: VerifiedGoogleProfile,
  ) {
    const derivedName = this.extractName(googleProfile);
    const shouldUpdateFirstName =
      derivedName.firstName.length > 0 &&
      derivedName.firstName !== parent.firstName;
    const shouldClearLegacyGoogleLastName =
      parent.lastName === 'Google' && derivedName.lastName.length === 0;
    const shouldUpdateLastName =
      derivedName.lastName !== parent.lastName &&
      (derivedName.lastName.length > 0 || shouldClearLegacyGoogleLastName);

    if (!shouldUpdateFirstName && !shouldUpdateLastName) {
      return;
    }

    await this.parentAccountsService.updateIdentity(parent.id, {
      firstName: shouldUpdateFirstName
        ? derivedName.firstName
        : parent.firstName,
      lastName: shouldUpdateLastName ? derivedName.lastName : parent.lastName,
    });
  }

  private extractFirstName(fullName?: string) {
    const trimmedFullName = fullName?.trim();

    if (!trimmedFullName) {
      return null;
    }

    const [firstPart] = trimmedFullName.split(/\s+/);
    return this.sanitizeNamePart(firstPart);
  }

  private extractLastName(fullName?: string) {
    const trimmedFullName = fullName?.trim();

    if (!trimmedFullName) {
      return null;
    }

    const [, ...remainingParts] = trimmedFullName.split(/\s+/);
    return this.sanitizeNamePart(remainingParts.join(' '));
  }

  private sanitizeNamePart(value?: string | null) {
    const trimmedValue = value?.trim();

    if (!trimmedValue) {
      return null;
    }

    return trimmedValue.slice(0, 80);
  }
}
