import { ContactStatus } from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { ListContactsQueryDto } from './dto/list-contacts-query.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createContactDto: CreateContactDto) {
    return this.prisma.contact.create({
      data: createContactDto,
    });
  }

  async findAll(query: ListContactsQueryDto = {}) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const search = query.search?.trim();
    const status = query.status;
    const where = search
      ? {
          status,
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
            { message: { contains: search, mode: 'insensitive' as const } },
            { adminNotes: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : status
        ? { status }
        : undefined;

    const [items, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.contact.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async update(id: number, updateContactDto: UpdateContactDto) {
    const data: {
      status?: ContactStatus;
      adminNotes?: string | null;
      handledAt?: Date | null;
    } = {};

    if (updateContactDto.status !== undefined) {
      data.status = updateContactDto.status;
      data.handledAt =
        updateContactDto.status === ContactStatus.NEW ? null : new Date();
    }

    if (updateContactDto.adminNotes !== undefined) {
      data.adminNotes = updateContactDto.adminNotes.trim() || null;
    }

    try {
      return await this.prisma.contact.update({
        where: { id },
        data,
      });
    } catch {
      throw new NotFoundException(`Contact ${id} not found`);
    }
  }
}
