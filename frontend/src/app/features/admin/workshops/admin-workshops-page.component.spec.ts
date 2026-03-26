import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AdminWorkshopsService } from '../../../core/services/admin-workshops.service';
import { Workshop } from '../../../shared/models/workshop.model';
import { AdminWorkshopsPageComponent } from './admin-workshops-page.component';

describe('AdminWorkshopsPageComponent', () => {
  const workshops: Workshop[] = [
    {
      id: 1,
      title: 'Atelier peinture sensorielle',
      slug: 'atelier-peinture-sensorielle',
      shortDescription: 'Explorer librement les couleurs et les textures.',
      description: 'Une seance accompagnee pour decouvrir la peinture a son rythme.',
      startAt: '2026-04-15T09:00:00.000Z',
      endAt: '2026-04-15T10:30:00.000Z',
      location: 'Lille',
      recommendedAgeMin: 4,
      recommendedAgeMax: 7,
      capacity: 12,
      isPublished: true,
      registrationsCount: 3,
      availablePlaces: 9,
    },
  ];

  const workshopsServiceMock = {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    workshopsServiceMock.getAll.mockReset();
    workshopsServiceMock.create.mockReset();
    workshopsServiceMock.update.mockReset();
    workshopsServiceMock.remove.mockReset();

    await TestBed.configureTestingModule({
      imports: [AdminWorkshopsPageComponent],
      providers: [{ provide: AdminWorkshopsService, useValue: workshopsServiceMock }],
    }).compileComponents();
  });

  it('generates a clean slug from the current title', () => {
    workshopsServiceMock.getAll.mockReturnValue(of(workshops));

    const fixture = TestBed.createComponent(AdminWorkshopsPageComponent);
    const component = fixture.componentInstance as any;

    component.workshopForm.controls.title.setValue('Atelier Créatif Été 2026');
    component.generateSlug();

    expect(component.workshopForm.controls.slug.value).toBe('atelier-creatif-ete-2026');
  });

  it('creates a workshop with normalized payload values', () => {
    workshopsServiceMock.getAll.mockReturnValue(of(workshops));
    workshopsServiceMock.create.mockReturnValue(of(workshops[0]));

    const fixture = TestBed.createComponent(AdminWorkshopsPageComponent);
    const component = fixture.componentInstance as any;

    component.workshopForm.setValue({
      title: '  Atelier construction  ',
      slug: '  atelier-construction  ',
      shortDescription: '  Construire ensemble en manipulant plusieurs pieces.  ',
      description:
        '  Un atelier long pour apprendre a construire, cooperer et imaginer plusieurs formes simples.  ',
      startAt: '2026-05-10T14:30',
      endAt: '',
      location: '  Roubaix  ',
      recommendedAgeMin: '',
      recommendedAgeMax: '9',
      capacity: '',
      isPublished: false,
    });

    component.submit();

    expect(workshopsServiceMock.create).toHaveBeenCalledWith({
      title: 'Atelier construction',
      slug: 'atelier-construction',
      shortDescription: 'Construire ensemble en manipulant plusieurs pieces.',
      description:
        'Un atelier long pour apprendre a construire, cooperer et imaginer plusieurs formes simples.',
      startAt: new Date('2026-05-10T14:30').toISOString(),
      endAt: null,
      location: 'Roubaix',
      recommendedAgeMin: null,
      recommendedAgeMax: 9,
      capacity: null,
      isPublished: false,
    });
    expect(component.successMessage()).toBe('Atelier cree avec succes.');
    expect(component.editingWorkshopId()).toBeNull();
  });

  it('loads an existing workshop into the form when editing', () => {
    workshopsServiceMock.getAll.mockReturnValue(of(workshops));

    const fixture = TestBed.createComponent(AdminWorkshopsPageComponent);
    const component = fixture.componentInstance as any;

    component.editWorkshop(workshops[0]);

    expect(component.editingWorkshopId()).toBe(1);
    expect(component.workshopForm.controls.title.value).toBe('Atelier peinture sensorielle');
    expect(component.workshopForm.controls.slug.value).toBe('atelier-peinture-sensorielle');
    expect(component.workshopForm.controls.location.value).toBe('Lille');
  });
});
