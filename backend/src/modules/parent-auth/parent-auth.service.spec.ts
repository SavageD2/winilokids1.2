import { ConflictException, ServiceUnavailableException } from '@nestjs/common';
import { ParentAuthService } from './parent-auth.service';

describe('ParentAuthService', () => {
  const parentAccountsService = {
    findByEmail: jest.fn(),
    findByGoogleSubject: jest.fn(),
    setPassword: jest.fn(),
    setLocalPassword: jest.fn(),
    updateIdentity: jest.fn(),
    create: jest.fn(),
    linkGoogleAccount: jest.fn(),
    findById: jest.fn(),
    sanitizeParent: jest.fn(),
    update: jest.fn(),
  };

  const jwtService = {
    signAsync: jest.fn(),
  };

  const configService = {
    get: jest.fn(),
  };

  let service: ParentAuthService;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new ParentAuthService(
      parentAccountsService as never,
      jwtService as never,
      configService as never,
    );

    jwtService.signAsync.mockResolvedValue('parent-access-token');
    parentAccountsService.sanitizeParent.mockImplementation((parent) => ({
      id: parent.id,
      email: parent.email,
      hasPassword: parent.passwordHash !== null,
      hasGoogleAccount: parent.googleSubject !== null,
      firstName: parent.firstName,
      lastName: parent.lastName,
      phone: parent.phone,
    }));
  });

  it('upgrades an existing Google-only parent account with a local password on register', async () => {
    parentAccountsService.findByEmail.mockResolvedValue({
      id: 4,
      email: 'camille@example.com',
      passwordHash: null,
      googleSubject: 'google-subject-4',
    });
    parentAccountsService.setPassword.mockResolvedValue({ id: 4 });
    parentAccountsService.findById.mockResolvedValue({
      id: 4,
      email: 'camille@example.com',
      passwordHash: 'hashed-password',
      googleSubject: 'google-subject-4',
      firstName: 'Camille',
      lastName: 'Martin',
      phone: null,
    });

    const session = await service.register({
      firstName: 'Camille',
      lastName: 'Martin',
      email: 'camille@example.com',
      phone: undefined,
      password: 'DemoParent123!',
    });

    expect(parentAccountsService.setPassword).toHaveBeenCalledWith(4, {
      passwordHash: expect.any(String),
      firstName: 'Camille',
      lastName: 'Martin',
      phone: null,
    });
    expect(session).toEqual({
      accessToken: 'parent-access-token',
      parent: {
        id: 4,
        email: 'camille@example.com',
        hasPassword: true,
        hasGoogleAccount: true,
        firstName: 'Camille',
        lastName: 'Martin',
        phone: null,
      },
    });
  });

  it('throws a conflict when registering an already local parent account', async () => {
    parentAccountsService.findByEmail.mockResolvedValue({
      id: 8,
      email: 'camille@example.com',
      passwordHash: 'hashed-password',
      googleSubject: null,
    });

    await expect(
      service.register({
        firstName: 'Camille',
        lastName: 'Martin',
        email: 'camille@example.com',
        phone: null,
        password: 'DemoParent123!',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('links Google auth to an existing local parent account with the same email', async () => {
    configService.get.mockReturnValue('google-client-id');
    parentAccountsService.findByGoogleSubject.mockResolvedValue(null);
    parentAccountsService.findByEmail.mockResolvedValue({
      id: 12,
      email: 'camille@example.com',
      passwordHash: 'hashed-password',
      googleSubject: null,
      firstName: 'Camille',
      lastName: 'Martin',
      phone: '0601020304',
    });
    parentAccountsService.linkGoogleAccount.mockResolvedValue({ id: 12 });
    parentAccountsService.findById.mockResolvedValue({
      id: 12,
      email: 'camille@example.com',
      passwordHash: 'hashed-password',
      googleSubject: 'google-subject-12',
      firstName: 'Camille',
      lastName: 'Martin',
      phone: '0601020304',
    });

    jest.spyOn(service as never, 'verifyGoogleIdToken').mockResolvedValue({
      sub: 'google-subject-12',
      email: 'camille@example.com',
      givenName: 'Camille',
      familyName: 'Martin',
      name: 'Camille Martin',
    });

    const session = await service.loginWithGoogle({
      idToken: 'google-id-token',
    });

    expect(parentAccountsService.linkGoogleAccount).toHaveBeenCalledWith(12, {
      googleSubject: 'google-subject-12',
      googleEmailVerified: true,
    });
    expect(session.parent.hasPassword).toBe(true);
    expect(session.parent.hasGoogleAccount).toBe(true);
  });

  it('does not invent the surname Google when Google profile has no family name', async () => {
    configService.get.mockReturnValue('google-client-id');
    parentAccountsService.findByGoogleSubject.mockResolvedValue(null);
    parentAccountsService.findByEmail.mockResolvedValue(null);
    parentAccountsService.create.mockResolvedValue({ id: 31 });
    parentAccountsService.findById.mockResolvedValue({
      id: 31,
      email: 'orewing20@gmail.com',
      passwordHash: null,
      googleSubject: 'google-subject-31',
      firstName: 'Orewing',
      lastName: '',
      phone: null,
    });

    jest.spyOn(service as never, 'verifyGoogleIdToken').mockResolvedValue({
      sub: 'google-subject-31',
      email: 'orewing20@gmail.com',
      givenName: 'Orewing',
      familyName: undefined,
      name: 'Orewing',
    });

    const session = await service.loginWithGoogle({
      idToken: 'google-id-token',
    });

    expect(parentAccountsService.create).toHaveBeenCalledWith({
      email: 'orewing20@gmail.com',
      passwordHash: null,
      googleSubject: 'google-subject-31',
      googleEmailVerified: true,
      googleLinkedAt: expect.any(Date),
      firstName: 'Orewing',
      lastName: '',
      phone: null,
    });
    expect(session.parent.lastName).toBe('');
  });

  it('repairs legacy Google placeholder surnames when the profile has no family name', async () => {
    configService.get.mockReturnValue('google-client-id');
    parentAccountsService.findByGoogleSubject.mockResolvedValue({
      id: 44,
      email: 'orewing20@gmail.com',
      passwordHash: null,
      googleSubject: 'google-subject-44',
      firstName: 'Orewing',
      lastName: 'Google',
      phone: null,
    });
    parentAccountsService.findById.mockResolvedValue({
      id: 44,
      email: 'orewing20@gmail.com',
      passwordHash: null,
      googleSubject: 'google-subject-44',
      firstName: 'Orewing',
      lastName: '',
      phone: null,
    });

    jest.spyOn(service as never, 'verifyGoogleIdToken').mockResolvedValue({
      sub: 'google-subject-44',
      email: 'orewing20@gmail.com',
      givenName: 'Orewing',
      familyName: undefined,
      name: 'Orewing',
    });

    const session = await service.loginWithGoogle({
      idToken: 'google-id-token',
    });

    expect(parentAccountsService.updateIdentity).toHaveBeenCalledWith(44, {
      firstName: 'Orewing',
      lastName: '',
    });
    expect(session.parent.lastName).toBe('');
  });

  it('creates a new parent account when Google login is used for a new email', async () => {
    configService.get.mockReturnValue('google-client-id');
    parentAccountsService.findByGoogleSubject.mockResolvedValue(null);
    parentAccountsService.findByEmail.mockResolvedValue(null);
    parentAccountsService.create.mockResolvedValue({ id: 22 });
    parentAccountsService.findById.mockResolvedValue({
      id: 22,
      email: 'nora@example.com',
      passwordHash: null,
      googleSubject: 'google-subject-22',
      firstName: 'Nora',
      lastName: 'Bernard',
      phone: null,
    });

    jest.spyOn(service as never, 'verifyGoogleIdToken').mockResolvedValue({
      sub: 'google-subject-22',
      email: 'nora@example.com',
      givenName: 'Nora',
      familyName: 'Bernard',
      name: 'Nora Bernard',
    });

    const session = await service.loginWithGoogle({
      idToken: 'google-id-token',
    });

    expect(parentAccountsService.create).toHaveBeenCalledWith({
      email: 'nora@example.com',
      passwordHash: null,
      googleSubject: 'google-subject-22',
      googleEmailVerified: true,
      googleLinkedAt: expect.any(Date),
      firstName: 'Nora',
      lastName: 'Bernard',
      phone: null,
    });
    expect(session.parent.hasPassword).toBe(false);
    expect(session.parent.hasGoogleAccount).toBe(true);
  });

  it('fails fast when Google sign-in is not configured', async () => {
    configService.get.mockReturnValue(undefined);

    await expect(
      (service as never).verifyGoogleIdToken('google-id-token'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('allows a Google-only parent account to define a local password', async () => {
    parentAccountsService.findById.mockResolvedValueOnce({
      id: 51,
      email: 'marvin@example.com',
      passwordHash: null,
      googleSubject: 'google-subject-51',
      firstName: 'Marvin',
      lastName: '',
      phone: null,
    });
    parentAccountsService.setLocalPassword.mockResolvedValue({
      id: 51,
      email: 'marvin@example.com',
      passwordHash: 'hashed-password',
      googleSubject: 'google-subject-51',
      firstName: 'Marvin',
      lastName: '',
      phone: null,
    });

    const parent = await service.setPassword(51, {
      password: 'DemoParent123!',
    });

    expect(parentAccountsService.setLocalPassword).toHaveBeenCalledWith(
      51,
      expect.any(String),
    );
    expect(parent.hasPassword).toBe(true);
    expect(parent.hasGoogleAccount).toBe(true);
  });

  it('rejects local password creation when a password already exists', async () => {
    parentAccountsService.findById.mockResolvedValue({
      id: 52,
      email: 'camille@example.com',
      passwordHash: 'hashed-password',
      googleSubject: 'google-subject-52',
      firstName: 'Camille',
      lastName: 'Martin',
      phone: null,
    });

    await expect(
      service.setPassword(52, {
        password: 'DemoParent123!',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
