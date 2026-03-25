type EnvironmentVariables = {
  PORT: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
};

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const errors: string[] = [];

  const port = config.PORT;
  const databaseUrl = config.DATABASE_URL;
  const jwtSecret = config.JWT_SECRET;
  const jwtExpiresIn = config.JWT_EXPIRES_IN;

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

  if (errors.length > 0) {
    throw new Error(`Invalid environment variables: ${errors.join(', ')}`);
  }

  return {
    PORT: String(port),
    DATABASE_URL: databaseUrl as string,
    JWT_SECRET: jwtSecret as string,
    JWT_EXPIRES_IN: jwtExpiresIn as string,
  };
}
