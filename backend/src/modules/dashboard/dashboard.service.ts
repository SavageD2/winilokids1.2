import { Injectable } from '@nestjs/common';
import { ChatbotSourceType, RegistrationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const ACTIVE_REGISTRATION_STATUSES: RegistrationStatus[] = [
  RegistrationStatus.PENDING,
  RegistrationStatus.CONFIRMED,
  RegistrationStatus.ATTENDED,
];

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const now = new Date();

    const [
      workshopsCount,
      publishedWorkshopsCount,
      registrationsCount,
      pendingRegistrationsCount,
      confirmedRegistrationsCount,
      cancelledRegistrationsCount,
      attendedRegistrationsCount,
      contactsCount,
      chatbotMessagesCount,
      chatbotFallbackCount,
      chatbotFaqMessagesCount,
      chatbotWorkshopMessagesCount,
      upcomingWorkshops,
    ] = await Promise.all([
      this.prisma.workshop.count(),
      this.prisma.workshop.count({
        where: {
          isPublished: true,
        },
      }),
      this.prisma.registration.count(),
      this.prisma.registration.count({
        where: {
          status: RegistrationStatus.PENDING,
        },
      }),
      this.prisma.registration.count({
        where: {
          status: RegistrationStatus.CONFIRMED,
        },
      }),
      this.prisma.registration.count({
        where: {
          status: RegistrationStatus.CANCELLED,
        },
      }),
      this.prisma.registration.count({
        where: {
          status: RegistrationStatus.ATTENDED,
        },
      }),
      this.prisma.contact.count(),
      this.prisma.chatbotMessageLog.count(),
      this.prisma.chatbotMessageLog.count({
        where: {
          fallbackToContact: true,
        },
      }),
      this.prisma.chatbotMessageLog.count({
        where: {
          sourceType: ChatbotSourceType.FAQ,
        },
      }),
      this.prisma.chatbotMessageLog.count({
        where: {
          sourceType: ChatbotSourceType.WORKSHOP,
        },
      }),
      this.prisma.workshop.findMany({
        where: {
          startAt: {
            gte: now,
          },
        },
        orderBy: { startAt: 'asc' },
        take: 5,
        include: {
          registrations: {
            select: {
              status: true,
            },
          },
        },
      }),
    ]);

    return {
      workshopsCount,
      publishedWorkshopsCount,
      draftWorkshopsCount: workshopsCount - publishedWorkshopsCount,
      registrationsCount,
      pendingRegistrationsCount,
      confirmedRegistrationsCount,
      cancelledRegistrationsCount,
      attendedRegistrationsCount,
      contactsCount,
      chatbotMessagesCount,
      chatbotFallbackCount,
      chatbotFaqMessagesCount,
      chatbotWorkshopMessagesCount,
      upcomingWorkshops: upcomingWorkshops.map((workshop) => ({
        id: workshop.id,
        title: workshop.title,
        slug: workshop.slug,
        startAt: workshop.startAt,
        location: workshop.location,
        registrationsCount: workshop.registrations.filter((registration) =>
          ACTIVE_REGISTRATION_STATUSES.includes(registration.status),
        ).length,
        capacity: workshop.capacity,
        availablePlaces:
          workshop.capacity === null
            ? null
            : Math.max(
                workshop.capacity -
                  workshop.registrations.filter((registration) =>
                    ACTIVE_REGISTRATION_STATUSES.includes(registration.status),
                  ).length,
                0,
              ),
      })),
    };
  }
}
