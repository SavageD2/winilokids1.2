type EnvironmentVariables = {
  PORT: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CALENDAR_ID?: string;
  GOOGLE_SERVICE_ACCOUNT_EMAIL?: string;
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?: string;
  GOOGLE_SERVICE_ACCOUNT_KEY_FILE?: string;
  GOOGLE_CALENDAR_TIME_ZONE?: string;
};

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const errors: string[] = [];

  const port = config.PORT;
  const databaseUrl = config.DATABASE_URL;
  const jwtSecret = config.JWT_SECRET;
  const jwtExpiresIn = config.JWT_EXPIRES_IN;
  const googleClientId = config.GOOGLE_CLIENT_ID;
  const googleCalendarId = config.GOOGLE_CALENDAR_ID;
  const googleServiceAccountEmail = config.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const googleServiceAccountPrivateKey =
    config.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const googleServiceAccountKeyFile = config.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
  const googleCalendarTimeZone = config.GOOGLE_CALENDAR_TIME_ZONE;

  if (!port || Number.isNaN(Number(port))) {
    errors.push('PORT must be a valid number');
  }

  if (!databaseUrl || typeof databaseUrl !== 'string') {
    errors.push('DATABASE_URL is required');
  }

  if (!jwtSecret || typeof jwtSecret !== 'string' || jwtSecret.length < 16) {
    errors.push('JWT_SECRET must be at least 16 characters long');
  }

  if (!jwtExpiresIn || typeof jwtExpiresIn !== 'string') {
    errors.push('JWT_EXPIRES_IN is required');
  }

  if (googleClientId !== undefined && typeof googleClientId !== 'string') {
    errors.push('GOOGLE_CLIENT_ID must be a string when provided');
  }

  if (googleCalendarId !== undefined && typeof googleCalendarId !== 'string') {
    errors.push('GOOGLE_CALENDAR_ID must be a string when provided');
  }

  if (
    googleServiceAccountEmail !== undefined &&
    typeof googleServiceAccountEmail !== 'string'
  ) {
    errors.push('GOOGLE_SERVICE_ACCOUNT_EMAIL must be a string when provided');
  }

  if (
    googleServiceAccountPrivateKey !== undefined &&
    typeof googleServiceAccountPrivateKey !== 'string'
  ) {
    errors.push(
      'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY must be a string when provided',
    );
  }

  if (
    googleServiceAccountKeyFile !== undefined &&
    typeof googleServiceAccountKeyFile !== 'string'
  ) {
    errors.push(
      'GOOGLE_SERVICE_ACCOUNT_KEY_FILE must be a string when provided',
    );
  }

  if (
    googleCalendarTimeZone !== undefined &&
    typeof googleCalendarTimeZone !== 'string'
  ) {
    errors.push('GOOGLE_CALENDAR_TIME_ZONE must be a string when provided');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment variables: ${errors.join(', ')}`);
  }

  return {
    PORT: String(port),
    DATABASE_URL: databaseUrl as string,
    JWT_SECRET: jwtSecret as string,
    JWT_EXPIRES_IN: jwtExpiresIn as string,
    GOOGLE_CLIENT_ID:
      typeof googleClientId === 'string' ? googleClientId : undefined,
    GOOGLE_CALENDAR_ID:
      typeof googleCalendarId === 'string' ? googleCalendarId : undefined,
    GOOGLE_SERVICE_ACCOUNT_EMAIL:
      typeof googleServiceAccountEmail === 'string'
        ? googleServiceAccountEmail
        : undefined,
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY:
      typeof googleServiceAccountPrivateKey === 'string'
        ? googleServiceAccountPrivateKey
        : undefined,
    GOOGLE_SERVICE_ACCOUNT_KEY_FILE:
      typeof googleServiceAccountKeyFile === 'string'
        ? googleServiceAccountKeyFile
        : undefined,
    GOOGLE_CALENDAR_TIME_ZONE:
      typeof googleCalendarTimeZone === 'string'
        ? googleCalendarTimeZone
        : undefined,
  };
}
