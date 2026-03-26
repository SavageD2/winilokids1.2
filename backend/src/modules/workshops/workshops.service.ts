import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RegistrationStatus, Workshop } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import {
  GoogleCalendarSyncService,
  WorkshopCalendarSyncMetadata,
} from './google-calendar-sync.service';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';

type WorkshopWithRegistrationCount = Workshop & {
  _count: {
    registrations: number;
  };
  registrations: Array<{
    status: RegistrationStatus;
  }>;
};

const ACTIVE_REGISTRATION_STATUSES: RegistrationStatus[] = [
  RegistrationStatus.PENDING,
  RegistrationStatus.CONFIRMED,
  RegistrationStatus.ATTENDED,
];

const workshopInclude = {
  _count: {
    select: {
      registrations: true,
    },
  },
  registrations: {
    select: {
      status: true,
    },
  },
} as const;

@Injectable()
export class WorkshopsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly googleCalendarSyncService: GoogleCalendarSyncService,
  ) {}

  async findPublished() {
    const workshops = await this.prisma.workshop.findMany({
      where: { isPublished: true },
      orderBy: { startAt: 'asc' },
      include: workshopInclude,
    });

    return workshops.map((workshop) => this.serializeWorkshop(workshop, false));
  }

  async findPublishedBySlug(slug: string) {
    const workshop = await this.prisma.workshop.findFirst({
      where: {
        slug,
        isPublished: true,
      },
      include: workshopInclude,
    });

    if (!workshop) {
      throw new NotFoundException('Workshop not found');
    }

    return this.serializeWorkshop(workshop, false);
  }

  async findAll() {
    const workshops = await this.prisma.workshop.findMany({
      orderBy: { startAt: 'asc' },
      include: workshopInclude,
    });

    return workshops.map((workshop) => this.serializeWorkshop(workshop, true));
  }

  async findOne(id: number) {
    const workshop = await this.prisma.workshop.findUnique({
      where: { id },
      include: workshopInclude,
    });

    if (!workshop) {
      throw new NotFoundException('Workshop not found');
    }

    return this.serializeWorkshop(workshop, true);
  }

  async create(createWorkshopDto: CreateWorkshopDto) {
    this.validateBusinessRules(createWorkshopDto);
    await this.ensureSlugIsAvailable(createWorkshopDto.slug);

    const workshop = await this.prisma.workshop.create({
      data: {
        ...createWorkshopDto,
        isPublished: createWorkshopDto.isPublished ?? false,
      },
      include: workshopInclude,
    });

    const syncedWorkshop = await this.applyCalendarSync(workshop);

    return this.serializeWorkshop(syncedWorkshop, true);
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
      include: workshopInclude,
    });

    const syncedWorkshop = await this.applyCalendarSync(workshop);

    return this.serializeWorkshop(syncedWorkshop, true);
  }

  async remove(id: number) {
    const workshop = await this.ensureWorkshopExists(id);
    await this.googleCalendarSyncService.deleteWorkshopEvent(workshop);

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
      throw new BadRequestException(
        'recommendedAgeMin cannot be greater than recommendedAgeMax',
      );
    }

    if (
      workshopDto.startAt &&
      workshopDto.endAt &&
      workshopDto.endAt <= workshopDto.startAt
    ) {
      throw new BadRequestException('endAt must be after startAt');
    }
  }

  private async applyCalendarSync(workshop: WorkshopWithRegistrationCount) {
    const syncMetadata =
      await this.googleCalendarSyncService.synchronizeWorkshop(workshop);

    if (
      !syncMetadata ||
      this.isCalendarMetadataUnchanged(workshop, syncMetadata)
    ) {
      return workshop;
    }

    return this.prisma.workshop.update({
      where: { id: workshop.id },
      data: syncMetadata,
      include: workshopInclude,
    });
  }

  private isCalendarMetadataUnchanged(
    workshop: Workshop,
    syncMetadata: WorkshopCalendarSyncMetadata,
  ) {
    const currentSyncedAt = workshop.googleCalendarSyncedAt?.getTime() ?? null;
    const nextSyncedAt = syncMetadata.googleCalendarSyncedAt?.getTime() ?? null;

    return (
      workshop.googleCalendarEventId === syncMetadata.googleCalendarEventId &&
      workshop.googleCalendarEventUrl === syncMetadata.googleCalendarEventUrl &&
      currentSyncedAt === nextSyncedAt &&
      workshop.googleCalendarSyncError === syncMetadata.googleCalendarSyncError
    );
  }

  private serializeWorkshop(
    workshop: WorkshopWithRegistrationCount,
    includeCalendarMetadata: boolean,
  ) {
    const {
      _count,
      registrations,
      googleCalendarEventId,
      googleCalendarEventUrl,
      googleCalendarSyncedAt,
      googleCalendarSyncError,
      ...workshopData
    } = workshop;
    const registrationsCount = _count.registrations;
    const activeRegistrationsCount = registrations.filter((registration) =>
      ACTIVE_REGISTRATION_STATUSES.includes(registration.status),
    ).length;
    const availablePlaces =
      workshopData.capacity === null
        ? null
        : Math.max(workshopData.capacity - activeRegistrationsCount, 0);

    const serializedWorkshop = {
      ...workshopData,
      registrationsCount,
      availablePlaces,
    };

    if (!includeCalendarMetadata) {
      return serializedWorkshop;
    }

    return {
      ...serializedWorkshop,
      googleCalendarEventUrl,
      googleCalendarSyncedAt,
      googleCalendarSyncError,
      googleCalendarSyncStatus:
        this.googleCalendarSyncService.getSyncStatus(workshop),
    };
  }
}
