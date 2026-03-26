import { RegistrationStatus } from '@prisma/client';
import { WorkshopsService } from './workshops.service';

describe('WorkshopsService', () => {
  const prisma = {
    workshop: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const googleCalendarSyncService = {
    synchronizeWorkshop: jest.fn(),
    deleteWorkshopEvent: jest.fn(),
    getSyncStatus: jest.fn(),
  };

  let service: WorkshopsService;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new WorkshopsService(
      prisma as never,
      googleCalendarSyncService as never,
    );
    googleCalendarSyncService.getSyncStatus.mockReturnValue('SYNCED');
  });

  it('persists Google Calendar metadata after creating a published workshop', async () => {
    const createdWorkshop = buildWorkshopRecord();
    const syncedWorkshop = buildWorkshopRecord({
      googleCalendarEventId: 'calendar-event-1',
      googleCalendarEventUrl: 'https://calendar.google.com/event?eid=1',
      googleCalendarSyncedAt: new Date('2026-04-10T09:15:00.000Z'),
      googleCalendarSyncError: null,
    });

    prisma.workshop.findUnique.mockResolvedValue(null);
    prisma.workshop.create.mockResolvedValue(createdWorkshop);
    prisma.workshop.update.mockResolvedValue(syncedWorkshop);
    googleCalendarSyncService.synchronizeWorkshop.mockResolvedValue({
      googleCalendarEventId: 'calendar-event-1',
      googleCalendarEventUrl: 'https://calendar.google.com/event?eid=1',
      googleCalendarSyncedAt: new Date('2026-04-10T09:15:00.000Z'),
      googleCalendarSyncError: null,
    });

    const result = await service.create({
      title: 'Atelier motricite',
      slug: 'atelier-motricite',
      shortDescription: 'Un atelier ludique pour bouger et explorer.',
      description:
        'Un moment pour stimuler la motricite, la coordination et la confiance des enfants.',
      startAt: new Date('2026-04-10T14:00:00.000Z'),
      endAt: new Date('2026-04-10T15:30:00.000Z'),
      location: 'Maison des familles',
      recommendedAgeMin: 4,
      recommendedAgeMax: 6,
      capacity: 10,
      isPublished: true,
    });

    expect(googleCalendarSyncService.synchronizeWorkshop).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        title: 'Atelier motricite',
        isPublished: true,
      }),
    );
    expect(prisma.workshop.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({
          googleCalendarEventId: 'calendar-event-1',
        }),
      }),
    );
    expect(result.googleCalendarSyncStatus).toBe('SYNCED');
  });

  it('skips the metadata write when Google Calendar sync is disabled', async () => {
    prisma.workshop.findUnique.mockResolvedValue(null);
    prisma.workshop.create.mockResolvedValue(buildWorkshopRecord());
    googleCalendarSyncService.synchronizeWorkshop.mockResolvedValue(null);

    await service.create({
      title: 'Atelier peinture',
      slug: 'atelier-peinture',
      shortDescription: 'Un atelier creatif autour des couleurs.',
      description:
        'Les enfants explorent les textures, les formes et les couleurs dans un cadre accompagne.',
      startAt: new Date('2026-04-11T09:00:00.000Z'),
      location: 'Studio Winilo',
      recommendedAgeMin: 5,
      recommendedAgeMax: 7,
      capacity: 8,
      isPublished: true,
    });

    expect(prisma.workshop.update).not.toHaveBeenCalled();
  });

  it('tries to delete the Google Calendar event before removing a workshop', async () => {
    prisma.workshop.findUnique.mockResolvedValue(
      buildPlainWorkshop({
        googleCalendarEventId: 'calendar-event-2',
      }),
    );
    prisma.workshop.delete.mockResolvedValue({ id: 1 });

    await service.remove(1);

    expect(googleCalendarSyncService.deleteWorkshopEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        googleCalendarEventId: 'calendar-event-2',
      }),
    );
    expect(prisma.workshop.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});

function buildWorkshopRecord(
  overrides: Partial<
    ReturnType<typeof buildPlainWorkshop> & {
      _count: { registrations: number };
      registrations: Array<{ status: RegistrationStatus }>;
    }
  > = {},
) {
  return {
    ...buildPlainWorkshop(),
    _count: { registrations: 1 },
    registrations: [{ status: RegistrationStatus.PENDING }],
    ...overrides,
  };
}

function buildPlainWorkshop(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: 'Atelier motricite',
    slug: 'atelier-motricite',
    shortDescription: 'Un atelier ludique pour bouger et explorer.',
    description:
      'Un moment pour stimuler la motricite, la coordination et la confiance des enfants.',
    startAt: new Date('2026-04-10T14:00:00.000Z'),
    endAt: new Date('2026-04-10T15:30:00.000Z'),
    location: 'Maison des familles',
    recommendedAgeMin: 4,
    recommendedAgeMax: 6,
    capacity: 10,
    isPublished: true,
    googleCalendarEventId: null,
    googleCalendarEventUrl: null,
    googleCalendarSyncedAt: null,
    googleCalendarSyncError: null,
    createdAt: new Date('2026-04-01T09:00:00.000Z'),
    updatedAt: new Date('2026-04-01T09:00:00.000Z'),
    ...overrides,
  };
}
