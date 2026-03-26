import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type CreateParentAccountInput = {
  email: string;
  passwordHash?: string | null;
  googleSubject?: string | null;
  googleEmailVerified?: boolean;
  googleLinkedAt?: Date | null;
  firstName: string;
  lastName: string;
  phone?: string | null;
};

type UpdateParentAccountInput = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
};

type UpdateParentIdentityInput = {
  firstName: string;
  lastName: string;
};

@Injectable()
export class ParentAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateParentAccountInput) {
    const normalizedEmail = this.normalizeEmail(input.email);
    const existingParent = await this.findByEmail(normalizedEmail);

    if (existingParent) {
      throw new ConflictException(
        'A parent account already exists with this email',
      );
    }

    if (input.googleSubject) {
      const existingGoogleParent = await this.findByGoogleSubject(
        input.googleSubject,
      );

      if (existingGoogleParent) {
        throw new ConflictException(
          'This Google account is already linked to a parent profile',
        );
      }
    }

    return this.prisma.parentAccount.create({
      data: {
        email: normalizedEmail,
        passwordHash: input.passwordHash ?? null,
        googleSubject: input.googleSubject ?? null,
        googleEmailVerified: input.googleEmailVerified ?? false,
        googleLinkedAt: input.googleLinkedAt ?? null,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone ?? null,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.parentAccount.findUnique({
      where: { email: this.normalizeEmail(email) },
    });
  }

  async findByGoogleSubject(googleSubject: string) {
    return this.prisma.parentAccount.findUnique({
      where: { googleSubject },
    });
  }

  async findById(id: number) {
    const parent = await this.prisma.parentAccount.findUnique({
      where: { id },
    });

    if (!parent) {
      throw new NotFoundException('Parent account not found');
    }

    return parent;
  }

  async update(id: number, input: UpdateParentAccountInput) {
    const currentParent = await this.findById(id);
    const normalizedEmail = this.normalizeEmail(input.email);

    if (currentParent.email !== normalizedEmail) {
      const existingParent = await this.findByEmail(normalizedEmail);

      if (existingParent && existingParent.id !== id) {
        throw new ConflictException(
          'A parent account already exists with this email',
        );
      }
    }

    return this.prisma.parentAccount.update({
      where: { id },
      data: {
        email: normalizedEmail,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone ?? null,
      },
    });
  }

  async setPassword(
    id: number,
    input: {
      passwordHash: string;
      firstName: string;
      lastName: string;
      phone?: string | null;
    },
  ) {
    await this.findById(id);

    return this.prisma.parentAccount.update({
      where: { id },
      data: {
        passwordHash: input.passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone ?? null,
      },
    });
  }

  async setLocalPassword(id: number, passwordHash: string) {
    await this.findById(id);

    return this.prisma.parentAccount.update({
      where: { id },
      data: {
        passwordHash,
      },
    });
  }

  async updateIdentity(id: number, input: UpdateParentIdentityInput) {
    await this.findById(id);

    return this.prisma.parentAccount.update({
      where: { id },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
      },
    });
  }

  async linkGoogleAccount(
    id: number,
    input: {
      googleSubject: string;
      googleEmailVerified: boolean;
      googleLinkedAt?: Date;
    },
  ) {
    const currentParent = await this.findById(id);
    const existingGoogleParent = await this.findByGoogleSubject(
      input.googleSubject,
    );

    if (existingGoogleParent && existingGoogleParent.id !== id) {
      throw new ConflictException(
        'This Google account is already linked to another parent',
      );
    }

    return this.prisma.parentAccount.update({
      where: { id },
      data: {
        googleSubject: input.googleSubject,
        googleEmailVerified: input.googleEmailVerified,
        googleLinkedAt:
          currentParent.googleLinkedAt ?? input.googleLinkedAt ?? new Date(),
      },
    });
  }

  sanitizeParent(parent: {
    id: number;
    email: string;
    passwordHash: string | null;
    googleSubject: string | null;
    firstName: string;
    lastName: string;
    phone: string | null;
  }) {
    return {
      id: parent.id,
      email: parent.email,
      hasPassword: parent.passwordHash !== null,
      hasGoogleAccount: parent.googleSubject !== null,
      firstName: parent.firstName,
      lastName: parent.lastName,
      phone: parent.phone,
    };
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }
}
