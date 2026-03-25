import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Workshop } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';

type WorkshopWithRegistrationCount = Workshop & {
  _count: {
    registrations: number;
  };
};

@Injectable()
export class WorkshopsService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublished() {
    const workshops = await this.prisma.workshop.findMany({
      where: { isPublished: true },
      orderBy: { startAt: 'asc' },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    return workshops.map((workshop) => this.serializeWorkshop(workshop));
  }

  async findPublishedBySlug(slug: string) {
    const workshop = await this.prisma.workshop.findFirst({
      where: {
        slug,
        isPublished: true,
      },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!workshop) {
      throw new NotFoundException('Workshop not found');
    }

    return this.serializeWorkshop(workshop);
  }

  async findAll() {
    const workshops = await this.prisma.workshop.findMany({
      orderBy: { startAt: 'asc' },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    return workshops.map((workshop) => this.serializeWorkshop(workshop));
  }

  async findOne(id: number) {
    const workshop = await this.prisma.workshop.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!workshop) {
      throw new NotFoundException('Workshop not found');
    }

    return this.serializeWorkshop(workshop);
  }

  async create(createWorkshopDto: CreateWorkshopDto) {
    this.validateBusinessRules(createWorkshopDto);
    await this.ensureSlugIsAvailable(createWorkshopDto.slug);

    const workshop = await this.prisma.workshop.create({
      data: {
        ...createWorkshopDto,
        isPublished: createWorkshopDto.isPublished ?? false,
      },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    return this.serializeWorkshop(workshop);
  }

  async update(id: number, updateWorkshopDto: UpdateWorkshopDto) {
    await this.ensureWorkshopExists(id);
    this.validateBusinessRules(updateWorkshopDto);

    if (updateWorkshopDto.slug) {
      await this.ensureSlugIsAvailable(updateWorkshopDto.slug, id);
    }

    const workshop = await this.prisma.workshop.update({
      where: { id },
      data: updateWorkshopDto,
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    return this.serializeWorkshop(workshop);
  }

  async remove(id: number) {
    await this.ensureWorkshopExists(id);

    await this.prisma.workshop.delete({
      where: { id },
    });

    return {
      message: 'Workshop deleted successfully',
    };
  }

  async ensurePublishedWorkshopExists(id: number) {
    const workshop = await this.prisma.workshop.findFirst({
      where: {
        id,
        isPublished: true,
      },
    });

    if (!workshop) {
      throw new NotFoundException('Workshop not found');
    }

    return workshop;
  }

  private async ensureWorkshopExists(id: number) {
    const workshop = await this.prisma.workshop.findUnique({
      where: { id },
    });

    if (!workshop) {
      throw new NotFoundException('Workshop not found');
    }

    return workshop;
  }

  private async ensureSlugIsAvailable(slug: string, workshopId?: number) {
    const existingWorkshop = await this.prisma.workshop.findUnique({
      where: { slug },
    });

    if (existingWorkshop && existingWorkshop.id !== workshopId) {
      throw new ConflictException('A workshop with this slug already exists');
    }
  }

  private validateBusinessRules(
    workshopDto: Partial<CreateWorkshopDto> & { startAt?: Date; endAt?: Date },
  ) {
    if (
      workshopDto.recommendedAgeMin !== undefined &&
      workshopDto.recommendedAgeMax !== undefined &&
      workshopDto.recommendedAgeMin > workshopDto.recommendedAgeMax
    ) {
      throw new BadRequestException('recommendedAgeMin cannot be greater than recommendedAgeMax');
    }

    if (workshopDto.startAt && workshopDto.endAt && workshopDto.endAt <= workshopDto.startAt) {
      throw new BadRequestException('endAt must be after startAt');
    }
  }

  private serializeWorkshop(workshop: WorkshopWithRegistrationCount) {
    const registrationsCount = workshop._count.registrations;
    const availablePlaces =
      workshop.capacity === null ? null : Math.max(workshop.capacity - registrationsCount, 0);

    return {
      ...workshop,
      registrationsCount,
      availablePlaces,
    };
  }
}
