import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { GoogleIdentityService } from '../../../core/services/google-identity.service';
import { ParentAuthService } from '../../../core/services/parent-auth.service';
import { ParentRegistrationsService } from '../../../core/services/parent-registrations.service';
import { ParentProfile } from '../../../shared/models/parent-auth.model';
import { RegistrationRecord } from '../../../shared/models/registration.model';
import { AccountPageComponent } from './account-page.component';

describe('AccountPageComponent', () => {
  beforeAll(() => {
    registerLocaleData(localeFr);
  });

  const parent: ParentProfile = {
    id: 9,
    firstName: 'Camille',
    lastName: 'Martin',
    email: 'camille@example.com',
    hasGoogleAccount: false,
    hasPassword: true,
    phone: '0601020304',
  };

  const reservations: RegistrationRecord[] = [
    {
      id: 4,
      childFirstName: 'Lina',
      childAge: 7,
      workshopId: 12,
      message: null,
      parentName: 'Camille Martin',
      parentEmail: 'camille@example.com',
      parentPhone: '0601020304',
      status: 'PENDING',
      createdAt: '2026-03-25T10:00:00.000Z',
      updatedAt: '2026-03-25T10:00:00.000Z',
      workshop: {
        id: 12,
        title: 'Robotique junior',
        slug: 'robotique-junior',
        startAt: '2026-04-20T14:00:00.000Z',
        location: 'Lyon',
      },
      parentAccount: {
        id: 9,
        firstName: 'Camille',
        lastName: 'Martin',
        email: 'camille@example.com',
        phone: '0601020304',
      },
    },
  ];

  const parentSignal = signal<ParentProfile | null>(parent);
  const isAuthenticatedSignal = signal(true);

  const parentAuthServiceMock = {
    parent: parentSignal,
    isAuthenticated: isAuthenticatedSignal,
    register: vi.fn(),
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
    setPassword: vi.fn(),
    updateProfile: vi.fn(),
    logout: vi.fn(),
  };

  const parentRegistrationsServiceMock = {
    getMine: vi.fn(),
    cancel: vi.fn(),
  };

  const routerMock = {
    navigateByUrl: vi.fn().mockResolvedValue(true),
  };

  const googleIdentityServiceMock = {
    isConfigured: vi.fn().mockReturnValue(true),
    renderButton: vi.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    parentSignal.set(parent);
    isAuthenticatedSignal.set(true);
    parentAuthServiceMock.register.mockReset();
    parentAuthServiceMock.login.mockReset();
    parentAuthServiceMock.loginWithGoogle.mockReset();
    parentAuthServiceMock.setPassword.mockReset();
    parentAuthServiceMock.updateProfile.mockReset();
    parentAuthServiceMock.logout.mockReset();
    parentRegistrationsServiceMock.getMine.mockReset();
    parentRegistrationsServiceMock.cancel.mockReset();
    routerMock.navigateByUrl.mockClear();
    googleIdentityServiceMock.renderButton.mockClear();

    await TestBed.configureTestingModule({
      imports: [AccountPageComponent],
      providers: [
        ...provideTranslateService({
          fallbackLang: 'fr',
          lang: 'fr',
        }),
        { provide: ParentAuthService, useValue: parentAuthServiceMock },
        {
          provide: ParentRegistrationsService,
          useValue: parentRegistrationsServiceMock,
        },
        { provide: Router, useValue: routerMock },
        { provide: GoogleIdentityService, useValue: googleIdentityServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ redirectUrl: '/mon-compte' }),
            },
          },
        },
      ],
    }).compileComponents();

    const translateService = TestBed.inject(TranslateService);
    translateService.setTranslation(
      'fr',
      {
        account: {
          auth: {
            methods: {
              password: 'mot de passe',
              google: 'Google',
              parentLogin: 'connexion parent',
            },
            errors: {
              register:
                'Création du compte impossible pour le moment. Vérifie les informations et réessaie.',
              login: 'Connexion impossible. Vérifie ton email et ton mot de passe.',
              google:
                'Connexion Google impossible pour le moment. Vérifie la configuration et réessaie.',
            },
          },
          profile: {
            success: 'Profil mis à jour avec succès.',
            error: 'Impossible de mettre à jour le profil pour le moment.',
          },
          password: {
            success: 'Connexion par mot de passe activée avec succès.',
            errors: {
              mismatch: 'Les deux mots de passe doivent être identiques.',
              unavailable: "Impossible d'activer le mot de passe pour le moment.",
            },
          },
          reservations: {
            error: 'Impossible de charger tes réservations pour le moment.',
            childSummary: 'Enfant: {{childFirstName}} · {{childAge}} ans',
            status: {
              pending: 'En attente',
              confirmed: 'Confirmée',
              cancelled: 'Annulée',
              attended: 'Présente',
            },
            cancel: {
              confirm:
                'Annuler la réservation pour "{{workshopTitle}}" au nom de {{childFirstName}} ?',
              error: "Impossible d'annuler cette réservation pour le moment.",
            },
          },
        },
      },
      true,
    );
    translateService.use('fr');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads reservations and mirrors the connected parent into the profile form', () => {
    parentRegistrationsServiceMock.getMine.mockReturnValue(of(reservations));

    const fixture = TestBed.createComponent(AccountPageComponent);
    const component = fixture.componentInstance as any;
    fixture.detectChanges();

    expect(parentRegistrationsServiceMock.getMine).toHaveBeenCalledOnce();
    expect(component.loadingReservations()).toBe(false);
    expect(component.reservations()).toEqual(reservations);
    expect(component.profileForm.getRawValue()).toEqual({
      firstName: 'Camille',
      lastName: 'Martin',
      email: 'camille@example.com',
      phone: '0601020304',
    });
  });

  it('renders a clean display name when the parent has no last name', () => {
    parentSignal.set({
      ...parent,
      firstName: 'Orewing',
      lastName: '',
      email: 'orewing20@gmail.com',
      hasGoogleAccount: true,
      hasPassword: false,
    });
    parentRegistrationsServiceMock.getMine.mockReturnValue(of([]));

    const fixture = TestBed.createComponent(AccountPageComponent);
    fixture.detectChanges();

    const heading = fixture.nativeElement.querySelector('.connected-card h2');
    expect(heading?.textContent?.trim()).toBe('Orewing');
  });

  it('logs in, reloads reservations and redirects to the requested path', async () => {
    parentRegistrationsServiceMock.getMine.mockReturnValue(of(reservations));
    parentAuthServiceMock.login.mockReturnValue(
      of({
        accessToken: 'token',
        parent,
      }),
    );

    const fixture = TestBed.createComponent(AccountPageComponent);
    const component = fixture.componentInstance as any;

    component.loginForm.setValue({
      email: 'camille@example.com',
      password: 'DemoParent123!',
    });

    component.submitLogin();
    await Promise.resolve();

    expect(parentAuthServiceMock.login).toHaveBeenCalledWith({
      email: 'camille@example.com',
      password: 'DemoParent123!',
    });
    expect(parentRegistrationsServiceMock.getMine).toHaveBeenCalledTimes(2);
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/mon-compte');
    expect(component.loginSubmitting()).toBe(false);
    expect(component.loginErrorMessage()).toBeNull();
  });

  it('logs in with Google, reloads reservations and redirects to the requested path', async () => {
    isAuthenticatedSignal.set(false);
    parentSignal.set(null);
    parentRegistrationsServiceMock.getMine.mockReturnValue(of(reservations));
    parentAuthServiceMock.loginWithGoogle.mockReturnValue(
      of({
        accessToken: 'token',
        parent,
      }),
    );

    const fixture = TestBed.createComponent(AccountPageComponent);
    const component = fixture.componentInstance as any;
    fixture.detectChanges();

    component.submitGoogleLogin('google-id-token');
    await Promise.resolve();

    expect(parentAuthServiceMock.loginWithGoogle).toHaveBeenCalledWith({
      idToken: 'google-id-token',
    });
    expect(parentRegistrationsServiceMock.getMine).toHaveBeenCalledTimes(1);
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/mon-compte');
    expect(component.googleSubmitting()).toBe(false);
    expect(component.googleErrorMessage()).toBeNull();
  });

  it('updates a cancellable reservation after confirmation', () => {
    parentRegistrationsServiceMock.getMine.mockReturnValue(of(reservations));
    parentRegistrationsServiceMock.cancel.mockReturnValue(
      of({
        ...reservations[0],
        status: 'CANCELLED',
      }),
    );
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const fixture = TestBed.createComponent(AccountPageComponent);
    const component = fixture.componentInstance as any;

    component.cancelReservation(reservations[0]);

    expect(parentRegistrationsServiceMock.cancel).toHaveBeenCalledWith(4);
    expect(component.cancellingReservationId()).toBeNull();
    expect(component.reservations()[0].status).toBe('CANCELLED');
  });

  it('does not call the API when the cancellation is refused', () => {
    parentRegistrationsServiceMock.getMine.mockReturnValue(of(reservations));
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    const fixture = TestBed.createComponent(AccountPageComponent);
    const component = fixture.componentInstance as any;

    component.cancelReservation(reservations[0]);

    expect(parentRegistrationsServiceMock.cancel).not.toHaveBeenCalled();
  });

  it('shows an error when the profile update fails', () => {
    parentRegistrationsServiceMock.getMine.mockReturnValue(of(reservations));
    parentAuthServiceMock.updateProfile.mockReturnValue(
      throwError(() => new Error('update failed')),
    );

    const fixture = TestBed.createComponent(AccountPageComponent);
    const component = fixture.componentInstance as any;

    component.profileForm.setValue({
      firstName: 'Camille',
      lastName: 'Martin',
      email: 'camille@example.com',
      phone: '',
    });

    component.saveProfile();

    expect(parentAuthServiceMock.updateProfile).toHaveBeenCalledWith({
      firstName: 'Camille',
      lastName: 'Martin',
      email: 'camille@example.com',
      phone: null,
    });
    expect(component.savingProfile()).toBe(false);
    expect(component.profileErrorMessage()).toBe(
      'Impossible de mettre à jour le profil pour le moment.',
    );
    expect(component.profileSuccessMessage()).toBeNull();
  });

  it('allows a Google-only parent to activate local password login', () => {
    parentSignal.set({
      ...parent,
      firstName: 'Orewing',
      lastName: '',
      email: 'orewing20@gmail.com',
      hasGoogleAccount: true,
      hasPassword: false,
    });
    parentRegistrationsServiceMock.getMine.mockReturnValue(of([]));
    parentAuthServiceMock.setPassword.mockReturnValue(
      of({
        id: 9,
        firstName: 'Orewing',
        lastName: '',
        email: 'orewing20@gmail.com',
        hasGoogleAccount: true,
        hasPassword: true,
        phone: '0601020304',
      }),
    );

    const fixture = TestBed.createComponent(AccountPageComponent);
    const component = fixture.componentInstance as any;
    fixture.detectChanges();

    component.passwordForm.setValue({
      password: 'DemoParent123!',
      confirmPassword: 'DemoParent123!',
    });

    component.setPassword();

    expect(parentAuthServiceMock.setPassword).toHaveBeenCalledWith({
      password: 'DemoParent123!',
    });
    expect(component.passwordSuccessMessage()).toBe(
      'Connexion par mot de passe activée avec succès.',
    );
  });
});
