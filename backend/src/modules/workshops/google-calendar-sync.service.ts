import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Workshop } from '@prisma/client';
import { JWT } from 'google-auth-library';
import { existsSync, readFileSync } from 'node:fs';

type ServiceAccountCredentials = {
  clientEmail: string;
  privateKey: string;
};

export type WorkshopCalendarSyncStatus =
  | 'INACTIVE'
  | 'DISABLED'
  | 'PENDING'
  | 'SYNCED'
  | 'FAILED';

export type WorkshopCalendarSyncMetadata = {
  googleCalendarEventId: string | null;
  googleCalendarEventUrl: string | null;
  googleCalendarSyncedAt: Date | null;
  googleCalendarSyncError: string | null;
};

type CalendarEventResponse = {
  id: string;
  htmlLink?: string;
};

type CalendarWorkshop = Pick<
  Workshop,
  | 'id'
  | 'slug'
  | 'title'
  | 'shortDescription'
  | 'description'
  | 'startAt'
  | 'endAt'
  | 'location'
  | 'recommendedAgeMin'
  | 'recommendedAgeMax'
  | 'capacity'
  | 'isPublished'
  | 'googleCalendarEventId'
  | 'googleCalendarEventUrl'
  | 'googleCalendarSyncedAt'
  | 'googleCalendarSyncError'
>;

const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';
const DEFAULT_EVENT_DURATION_IN_MINUTES = 90;

@Injectable()
export class GoogleCalendarSyncService {
  private readonly logger = new Logger(GoogleCalendarSyncService.name);
  private serviceAccountCredentials:
    | ServiceAccountCredentials
    | null
    | undefined;

  constructor(private readonly configService: ConfigService) {}

  isEnabled() {
    return Boolean(
      this.getCalendarId() &&
      this.getServiceAccountEmail() &&
      this.getServiceAccountPrivateKey(),
    );
  }

  getSyncStatus(workshop: CalendarWorkshop): WorkshopCalendarSyncStatus {
    if (workshop.googleCalendarSyncError) {
      return 'FAILED';
    }

    if (!workshop.isPublished) {
      return 'INACTIVE';
    }

    if (!this.isEnabled()) {
      return 'DISABLED';
    }

    if (workshop.googleCalendarEventId && workshop.googleCalendarSyncedAt) {
      return 'SYNCED';
    }

    return 'PENDING';
  }

  async synchronizeWorkshop(
    workshop: CalendarWorkshop,
  ): Promise<WorkshopCalendarSyncMetadata | null> {
    if (!this.isEnabled()) {
      return null;
    }

    if (!workshop.isPublished) {
      return this.removePublishedEvent(workshop);
    }

    try {
      return await this.upsertPublishedEvent(workshop);
    } catch (error) {
      const syncError = this.formatError(error);
      this.logger.warn(
        `Google Calendar sync failed for workshop ${workshop.id}: ${syncError}`,
      );

      return {
        googleCalendarEventId: workshop.googleCalendarEventId,
        googleCalendarEventUrl: workshop.googleCalendarEventUrl,
        googleCalendarSyncedAt: workshop.googleCalendarSyncedAt,
        googleCalendarSyncError: syncError,
      };
    }
  }

  async deleteWorkshopEvent(workshop: CalendarWorkshop) {
    if (!this.isEnabled() || !workshop.googleCalendarEventId) {
      return;
    }

    try {
      await this.requestCalendar(
        'DELETE',
        `/calendars/${encodeURIComponent(this.getCalendarId())}/events/${encodeURIComponent(
          workshop.googleCalendarEventId,
        )}`,
      );
    } catch (error) {
      this.logger.warn(
        `Unable to delete Google Calendar event for workshop ${workshop.id}: ${this.formatError(error)}`,
      );
    }
  }

  private async removePublishedEvent(
    workshop: CalendarWorkshop,
  ): Promise<WorkshopCalendarSyncMetadata> {
    if (!workshop.googleCalendarEventId) {
      return this.clearMetadata();
    }

    try {
      await this.requestCalendar(
        'DELETE',
        `/calendars/${encodeURIComponent(this.getCalendarId())}/events/${encodeURIComponent(
          workshop.googleCalendarEventId,
        )}`,
      );

      return this.clearMetadata();
    } catch (error) {
      return {
        googleCalendarEventId: workshop.googleCalendarEventId,
        googleCalendarEventUrl: workshop.googleCalendarEventUrl,
        googleCalendarSyncedAt: workshop.googleCalendarSyncedAt,
        googleCalendarSyncError: this.formatError(error),
      };
    }
  }

  private async upsertPublishedEvent(
    workshop: CalendarWorkshop,
  ): Promise<WorkshopCalendarSyncMetadata> {
    const path = workshop.googleCalendarEventId
      ? `/calendars/${encodeURIComponent(this.getCalendarId())}/events/${encodeURIComponent(
          workshop.googleCalendarEventId,
        )}`
      : `/calendars/${encodeURIComponent(this.getCalendarId())}/events`;
    const method = workshop.googleCalendarEventId ? 'PUT' : 'POST';

    const event =
      (await this.requestCalendar<CalendarEventResponse>(
        method,
        path,
        this.buildEventPayload(workshop),
        { allowNotFound: method === 'PUT' },
      )) ??
      (await this.requestCalendar<CalendarEventResponse>(
        'POST',
        `/calendars/${encodeURIComponent(this.getCalendarId())}/events`,
        this.buildEventPayload(workshop),
      ));

    if (!event) {
      throw new Error('Google Calendar did not return an event payload');
    }

    return {
      googleCalendarEventId: event.id,
      googleCalendarEventUrl: event.htmlLink ?? workshop.googleCalendarEventUrl,
      googleCalendarSyncedAt: new Date(),
      googleCalendarSyncError: null,
    };
  }

  private clearMetadata(): WorkshopCalendarSyncMetadata {
    return {
      googleCalendarEventId: null,
      googleCalendarEventUrl: null,
      googleCalendarSyncedAt: null,
      googleCalendarSyncError: null,
    };
  }

  private buildEventPayload(workshop: CalendarWorkshop) {
    const endAt =
      workshop.endAt ??
      new Date(
        workshop.startAt.getTime() + DEFAULT_EVENT_DURATION_IN_MINUTES * 60_000,
      );
    const timeZone = this.getCalendarTimeZone();

    return {
      summary: workshop.title,
      location: workshop.location,
      description: this.buildDescription(workshop),
      start: {
        dateTime: workshop.startAt.toISOString(),
        timeZone,
      },
      end: {
        dateTime: endAt.toISOString(),
        timeZone,
      },
      extendedProperties: {
        private: {
          workshopId: String(workshop.id),
          workshopSlug: workshop.slug,
        },
      },
    };
  }

  private buildDescription(workshop: CalendarWorkshop) {
    const details = [
      workshop.shortDescription.trim(),
      '',
      workshop.description.trim(),
      '',
      `Lieu: ${workshop.location}`,
    ];

    if (
      workshop.recommendedAgeMin !== null ||
      workshop.recommendedAgeMax !== null
    ) {
      details.push(`Age recommande: ${this.formatAgeRange(workshop)}`);
    }

    if (workshop.capacity !== null) {
      details.push(`Capacite: ${workshop.capacity} places`);
    }

    details.push('');
    details.push(`Reference atelier: ${workshop.slug}`);

    return details.join('\n').trim();
  }

  private formatAgeRange(workshop: CalendarWorkshop) {
    if (
      workshop.recommendedAgeMin !== null &&
      workshop.recommendedAgeMax !== null
    ) {
      return `${workshop.recommendedAgeMin} a ${workshop.recommendedAgeMax} ans`;
    }

    if (workshop.recommendedAgeMin !== null) {
      return `a partir de ${workshop.recommendedAgeMin} ans`;
    }

    return `jusqu a ${workshop.recommendedAgeMax} ans`;
  }

  private async requestCalendar<T>(
    method: 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: Record<string, unknown>,
    options: { allowNotFound?: boolean } = {},
  ): Promise<T | null> {
    const accessToken = await this.getAccessToken();
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3${path}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      },
    );

    if (options.allowNotFound && response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(await this.extractApiError(response));
    }

    if (response.status === 204) {
      return null;
    }

    return (await response.json()) as T;
  }

  private async getAccessToken() {
    const client = new JWT({
      email: this.getServiceAccountEmail(),
      key: this.getServiceAccountPrivateKey(),
      scopes: [GOOGLE_CALENDAR_SCOPE],
    });
    const credentials = await client.authorize();

    if (!credentials.access_token) {
      throw new Error('Unable to obtain a Google Calendar access token');
    }

    return credentials.access_token;
  }

  private async extractApiError(response: Response) {
    const rawText = await response.text();

    try {
      const parsed = JSON.parse(rawText) as {
        error?: { message?: string };
      };

      if (parsed.error?.message) {
        return parsed.error.message;
      }
    } catch {
      // Keep the raw payload when Google does not return JSON.
    }

    return (
      rawText || `Google Calendar request failed with status ${response.status}`
    );
  }

  private formatError(error: unknown) {
    if (error instanceof Error) {
      return error.message.slice(0, 500);
    }

    return 'Unknown Google Calendar synchronization error';
  }

  private getCalendarId() {
    return this.configService.get<string>('GOOGLE_CALENDAR_ID')?.trim() ?? '';
  }

  private getServiceAccountEmail() {
    return this.getServiceAccountCredentials().clientEmail;
  }

  private getServiceAccountPrivateKey() {
    return this.getServiceAccountCredentials().privateKey;
  }

  private getCalendarTimeZone() {
    return (
      this.configService.get<string>('GOOGLE_CALENDAR_TIME_ZONE')?.trim() ||
      'Europe/Paris'
    );
  }

  private getServiceAccountCredentials(): ServiceAccountCredentials {
    if (this.serviceAccountCredentials !== undefined) {
      return (
        this.serviceAccountCredentials ?? { clientEmail: '', privateKey: '' }
      );
    }

    const envEmail =
      this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_EMAIL')?.trim() ??
      '';
    const envPrivateKey =
      this.configService
        .get<string>('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY')
        ?.replace(/\\n/g, '\n')
        ?.trim() ?? '';

    if (envEmail && envPrivateKey) {
      this.serviceAccountCredentials = {
        clientEmail: envEmail,
        privateKey: envPrivateKey,
      };
      return this.serviceAccountCredentials;
    }

    const keyFilePath =
      this.configService
        .get<string>('GOOGLE_SERVICE_ACCOUNT_KEY_FILE')
        ?.trim() ?? '';

    if (!keyFilePath) {
      this.serviceAccountCredentials = null;
      return { clientEmail: '', privateKey: '' };
    }

    if (!existsSync(keyFilePath)) {
      this.logger.warn(
        `Google service account key file not found: ${keyFilePath}`,
      );
      this.serviceAccountCredentials = null;
      return { clientEmail: '', privateKey: '' };
    }

    try {
      const rawFile = readFileSync(keyFilePath, 'utf-8');
      const parsedFile = JSON.parse(rawFile) as {
        client_email?: string;
        private_key?: string;
        type?: string;
      };

      if (
        parsedFile.type !== 'service_account' ||
        !parsedFile.client_email ||
        !parsedFile.private_key
      ) {
        this.logger.warn(
          `Google service account key file is invalid or not a service account JSON: ${keyFilePath}`,
        );
        this.serviceAccountCredentials = null;
        return { clientEmail: '', privateKey: '' };
      }

      this.serviceAccountCredentials = {
        clientEmail: parsedFile.client_email.trim(),
        privateKey: parsedFile.private_key.trim(),
      };
      return this.serviceAccountCredentials;
    } catch (error) {
      this.logger.warn(
        `Unable to read Google service account key file ${keyFilePath}: ${this.formatError(error)}`,
      );
      this.serviceAccountCredentials = null;
      return { clientEmail: '', privateKey: '' };
    }
  }
}
