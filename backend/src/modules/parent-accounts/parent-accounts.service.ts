import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type CreateParentAccountInput = {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
};

@Injectable()
export class ParentAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateParentAccountInput) {
    const existingParent = await this.findByEmail(input.email);

    if (existingParent) {
      throw new ConflictException('A parent account already exists with this email');
    }

    return this.prisma.parentAccount.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone ?? null,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.parentAccount.findUnique({
      where: { email },
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

  sanitizeParent(parent: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  }) {
    return {
      id: parent.id,
      email: parent.email,
      firstName: parent.firstName,
      lastName: parent.lastName,
      phone: parent.phone,
    };
  }
}
