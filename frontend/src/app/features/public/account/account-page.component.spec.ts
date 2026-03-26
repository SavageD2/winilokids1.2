import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
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

  beforeEach(async () => {
    parentSignal.set(parent);
    isAuthenticatedSignal.set(true);
    parentAuthServiceMock.register.mockReset();
    parentAuthServiceMock.login.mockReset();
    parentAuthServiceMock.updateProfile.mockReset();
    parentAuthServiceMock.logout.mockReset();
    parentRegistrationsServiceMock.getMine.mockReset();
    parentRegistrationsServiceMock.cancel.mockReset();
    routerMock.navigateByUrl.mockClear();

    await TestBed.configureTestingModule({
      imports: [AccountPageComponent],
      providers: [
        { provide: ParentAuthService, useValue: parentAuthServiceMock },
        {
          provide: ParentRegistrationsService,
          useValue: parentRegistrationsServiceMock,
        },
        { provide: Router, useValue: routerMock },
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
      'Impossible de mettre a jour le profil pour le moment.',
    );
    expect(component.profileSuccessMessage()).toBeNull();
  });
});
