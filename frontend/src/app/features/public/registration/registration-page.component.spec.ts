import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { ParentAuthService } from '../../../core/services/parent-auth.service';
import { RegistrationsService } from '../../../core/services/registrations.service';
import { WorkshopsService } from '../../../core/services/workshops.service';
import { RegistrationPageComponent } from './registration-page.component';
import { Workshop } from '../../../shared/models/workshop.model';

describe('RegistrationPageComponent', () => {
  const workshops: Workshop[] = [
    {
      id: 2,
      title: 'Peinture sensorielle',
      slug: 'peinture-sensorielle',
      shortDescription: 'Explorer les couleurs',
      description: 'Atelier peinture pour les plus jeunes.',
      startAt: '2026-04-12T10:00:00.000Z',
      endAt: '2026-04-12T11:30:00.000Z',
      location: 'Paris',
      recommendedAgeMin: 4,
      recommendedAgeMax: 6,
      capacity: 10,
      isPublished: true,
      registrationsCount: 4,
      availablePlaces: 6,
    },
    {
      id: 7,
      title: 'Robotique junior',
      slug: 'robotique-junior',
      shortDescription: 'Premier atelier robotique',
      description: 'Decouverte ludique des robots.',
      startAt: '2026-04-20T14:00:00.000Z',
      endAt: '2026-04-20T15:30:00.000Z',
      location: 'Lyon',
      recommendedAgeMin: 7,
      recommendedAgeMax: 10,
      capacity: 12,
      isPublished: true,
      registrationsCount: 5,
      availablePlaces: 7,
    },
  ];

  const parentAuthServiceMock = {
    parent: signal(null),
    isAuthenticated: signal(false),
  };

  const workshopsServiceMock = {
    getPublished: vi.fn(),
  };

  const registrationsServiceMock = {
    create: vi.fn(),
  };

  beforeEach(async () => {
    workshopsServiceMock.getPublished.mockReset();
    registrationsServiceMock.create.mockReset();

    await TestBed.configureTestingModule({
      imports: [RegistrationPageComponent],
      providers: [
        ...provideTranslateService({
          fallbackLang: 'fr',
          lang: 'fr',
        }),
        provideRouter([]),
        {
          provide: ParentAuthService,
          useValue: parentAuthServiceMock,
        },
        {
          provide: WorkshopsService,
          useValue: workshopsServiceMock,
        },
        {
          provide: RegistrationsService,
          useValue: registrationsServiceMock,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ workshopId: '7' }),
            },
          },
        },
      ],
    }).compileComponents();

    const translateService = TestBed.inject(TranslateService);
    translateService.setTranslation(
      'fr',
      {
        registration: {
          success:
            'Demande enregistrée pour l\'atelier "{{workshopTitle}}". Nous reviendrons vers vous rapidement.',
          error: {
            workshops: 'Impossible de charger la liste des ateliers.',
            submit:
              "Impossible d'envoyer l'inscription pour le moment. Merci de réessayer dans quelques instants.",
          },
        },
      },
      true,
    );
    translateService.use('fr');
  });

  it('prefills the workshop from the query string after loading workshops', () => {
    workshopsServiceMock.getPublished.mockReturnValue(of(workshops));

    const fixture = TestBed.createComponent(RegistrationPageComponent);
    const component = fixture.componentInstance as any;

    expect(component.workshops()).toEqual(workshops);
    expect(component.loadingWorkshops()).toBe(false);
    expect(component.registrationForm.controls.workshopId.value).toBe(7);
  });

  it('shows an error when workshop loading fails', () => {
    workshopsServiceMock.getPublished.mockReturnValue(
      throwError(() => new Error('load failed')),
    );

    const fixture = TestBed.createComponent(RegistrationPageComponent);
    const component = fixture.componentInstance as any;

    expect(component.loadingWorkshops()).toBe(false);
    expect(component.errorMessage()).toBe('Impossible de charger la liste des ateliers.');
  });

  it('submits a registration and resets the child fields after success', () => {
    workshopsServiceMock.getPublished.mockReturnValue(of(workshops));
    registrationsServiceMock.create.mockReturnValue(
      of({
        id: 31,
        childFirstName: 'Lina',
        childAge: 7,
        workshopId: 7,
        message: null,
        parentName: 'Camille Martin',
        parentEmail: 'camille@example.com',
        parentPhone: null,
        status: 'PENDING',
        createdAt: '2026-03-25T10:00:00.000Z',
        updatedAt: '2026-03-25T10:00:00.000Z',
        workshop: {
          id: 7,
          title: 'Robotique junior',
          slug: 'robotique-junior',
          startAt: '2026-04-20T14:00:00.000Z',
          location: 'Lyon',
        },
      }),
    );

    const fixture = TestBed.createComponent(RegistrationPageComponent);
    const component = fixture.componentInstance as any;

    component.registrationForm.setValue({
      childFirstName: 'Lina',
      childAge: 7,
      workshopId: 7,
      message: '',
    });

    component.submit();

    expect(registrationsServiceMock.create).toHaveBeenCalledWith({
      childFirstName: 'Lina',
      childAge: 7,
      workshopId: 7,
      message: null,
    });
    expect(component.submitting()).toBe(false);
    expect(component.successMessage()).toContain('Robotique junior');
    expect(component.errorMessage()).toBeNull();
    expect(component.registrationForm.getRawValue()).toEqual({
      childFirstName: '',
      childAge: 5,
      workshopId: 7,
      message: '',
    });
  });

  it('marks the form as touched instead of submitting invalid data', () => {
    workshopsServiceMock.getPublished.mockReturnValue(of(workshops));

    const fixture = TestBed.createComponent(RegistrationPageComponent);
    const component = fixture.componentInstance as any;

    component.registrationForm.setValue({
      childFirstName: '',
      childAge: 5,
      workshopId: 0,
      message: '',
    });

    component.submit();

    expect(registrationsServiceMock.create).not.toHaveBeenCalled();
    expect(component.registrationForm.controls.childFirstName.touched).toBe(true);
    expect(component.registrationForm.controls.workshopId.touched).toBe(true);
  });
});
