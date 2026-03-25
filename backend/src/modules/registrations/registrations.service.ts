import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RegistrationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ParentAccountsService } from '../parent-accounts/parent-accounts.service';
import { WorkshopsService } from '../workshops/workshops.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { ListRegistrationsQueryDto } from './dto/list-registrations-query.dto';
import { UpdateRegistrationStatusDto } from './dto/update-registration-status.dto';

@Injectable()
export class RegistrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workshopsService: WorkshopsService,
    private readonly parentAccountsService: ParentAccountsService,
  ) {}

  async create(createRegistrationDto: CreateRegistrationDto, parentAccountId: number) {
    const workshop = await this.workshopsService.ensurePublishedWorkshopExists(
      createRegistrationDto.workshopId,
    );
    const parentAccount = await this.parentAccountsService.findById(parentAccountId);

    await this.ensureCapacity(workshop.id, workshop.capacity);

    return this.prisma.registration.create({
      data: {
        ...createRegistrationDto,
        parentName: `${parentAccount.firstName} ${parentAccount.lastName}`.trim(),
        parentEmail: parentAccount.email,
        parentPhone: parentAccount.phone,
        parentAccountId: parentAccount.id,
      },
      include: {
        workshop: {
          select: {
            id: true,
            title: true,
            slug: true,
            startAt: true,
            location: true,
          },
        },
      },
    });
  }

  async findByParent(parentAccountId: number) {
    await this.parentAccountsService.findById(parentAccountId);

    return this.prisma.registration.findMany({
      where: { parentAccountId },
      orderBy: { createdAt: 'desc' },
      include: this.parentRegistrationInclude,
    });
  }

  async cancelByParent(id: number, parentAccountId: number) {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
      include: this.parentRegistrationInclude,
    });

    if (!registration || registration.parentAccountId !== parentAccountId) {
      throw new NotFoundException('Registration not found');
    }

    if (
      registration.status !== RegistrationStatus.PENDING &&
      registration.status !== RegistrationStatus.CONFIRMED
    ) {
      throw new BadRequestException('This registration can no longer be cancelled');
    }

    return this.prisma.registration.update({
      where: { id },
      data: {
        status: RegistrationStatus.CANCELLED,
      },
      include: this.parentRegistrationInclude,
    });
  }

  async findAll(query: ListRegistrationsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const where = {
      workshopId: query.workshopId,
      status: query.status,
      ...(query.search
        ? {
            OR: [
              { parentName: { contains: query.search, mode: 'insensitive' as const } },
              { parentEmail: { contains: query.search, mode: 'insensitive' as const } },
              { childFirstName: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.registration.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          parentAccount: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          workshop: {
            select: {
              id: true,
              title: true,
              slug: true,
              startAt: true,
              location: true,
            },
          },
        },
      }),
      this.prisma.registration.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findByWorkshop(workshopId: number) {
    await this.workshopsService.findOne(workshopId);

    return this.prisma.registration.findMany({
      where: { workshopId },
      orderBy: { createdAt: 'desc' },
      include: {
        parentAccount: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        workshop: {
          select: {
            id: true,
            title: true,
            slug: true,
            startAt: true,
          },
        },
      },
    });
  }

  async updateStatus(id: number, updateRegistrationStatusDto: UpdateRegistrationStatusDto) {
    await this.ensureRegistrationExists(id);

    return this.prisma.registration.update({
      where: { id },
      data: {
        status: updateRegistrationStatusDto.status,
      },
      include: {
        parentAccount: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        workshop: {
          select: {
            id: true,
            title: true,
            slug: true,
            startAt: true,
          },
        },
      },
    });
  }

  private async ensureRegistrationExists(id: number) {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    return registration;
  }

  private async ensureCapacity(workshopId: number, capacity: number | null) {
    if (capacity === null) {
      return;
    }

    const activeRegistrationsCount = await this.prisma.registration.count({
      where: {
        workshopId,
        status: {
          in: [
            RegistrationStatus.PENDING,
            RegistrationStatus.CONFIRMED,
            RegistrationStatus.ATTENDED,
          ],
        },
      },
    });

    if (activeRegistrationsCount >= capacity) {
      throw new BadRequestException('No places available for this workshop');
    }
  }

  private readonly parentRegistrationInclude = {
    workshop: {
      select: {
        id: true,
        title: true,
        slug: true,
        startAt: true,
        location: true,
      },
    },
  } as const;
}
