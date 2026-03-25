import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const now = new Date();

    const [workshopsCount, registrationsCount, contactsCount, upcomingWorkshops] = await Promise.all([
      this.prisma.workshop.count(),
      this.prisma.registration.count(),
      this.prisma.contact.count(),
      this.prisma.workshop.findMany({
        where: {
          startAt: {
            gte: now,
          },
        },
        orderBy: { startAt: 'asc' },
        take: 5,
        include: {
          _count: {
            select: {
              registrations: true,
            },
          },
        },
      }),
    ]);

    return {
      workshopsCount,
      registrationsCount,
      contactsCount,
      upcomingWorkshops: upcomingWorkshops.map((workshop) => ({
        id: workshop.id,
        title: workshop.title,
        slug: workshop.slug,
        startAt: workshop.startAt,
        location: workshop.location,
        registrationsCount: workshop._count.registrations,
        capacity: workshop.capacity,
      })),
    };
  }
}
