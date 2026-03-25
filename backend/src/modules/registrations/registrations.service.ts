import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RegistrationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkshopsService } from '../workshops/workshops.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { ListRegistrationsQueryDto } from './dto/list-registrations-query.dto';
import { UpdateRegistrationStatusDto } from './dto/update-registration-status.dto';

@Injectable()
export class RegistrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workshopsService: WorkshopsService,
  ) {}

  async create(createRegistrationDto: CreateRegistrationDto) {
    const workshop = await this.workshopsService.ensurePublishedWorkshopExists(
      createRegistrationDto.workshopId,
    );

    await this.ensureCapacity(workshop.id, workshop.capacity);

    return this.prisma.registration.create({
      data: createRegistrationDto,
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

  async findAll(query: ListRegistrationsQueryDto) {
    const registrations = await this.prisma.registration.findMany({
      where: {
        workshopId: query.workshopId,
        status: query.status,
        ...(query.search
          ? {
              OR: [
                { parentName: { contains: query.search, mode: 'insensitive' } },
                { parentEmail: { contains: query.search, mode: 'insensitive' } },
                { childFirstName: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
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

    return registrations;
  }

  async findByWorkshop(workshopId: number) {
    await this.workshopsService.findOne(workshopId);

    return this.prisma.registration.findMany({
      where: { workshopId },
      orderBy: { createdAt: 'desc' },
      include: {
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
}
