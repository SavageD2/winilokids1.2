import { ChatbotService } from './chatbot.service';

describe('ChatbotService', () => {
  const prismaService = {
    chatbotMessageLog: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };
  const faqService = {
    findPublished: jest.fn(),
  };

  const workshopsService = {
    findPublished: jest.fn(),
  };

  let service: ChatbotService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ChatbotService(prismaService as never, faqService as never, workshopsService as never);
  });

  it('recommends published workshops when an age is provided', async () => {
    faqService.findPublished.mockResolvedValue([]);
    workshopsService.findPublished.mockResolvedValue([
      {
        id: 1,
        title: 'Atelier peinture sensorielle',
        slug: 'atelier-peinture-sensorielle',
        shortDescription: 'Peinture',
        description: 'Peinture et textures',
        startAt: '2026-04-01T10:00:00.000Z',
        endAt: null,
        location: 'Lille',
        recommendedAgeMin: 4,
        recommendedAgeMax: 7,
        capacity: 12,
        isPublished: true,
        registrationsCount: 1,
        availablePlaces: 11,
      },
    ]);

    const reply = await service.reply({
      message: 'Je cherche un atelier pour 5 ans',
    });

    expect(reply.sourceType).toBe('workshop');
    expect(reply.matchedWorkshopIds).toEqual([1]);
    expect(reply.suggestions.some((suggestion) => suggestion.route === '/ateliers/atelier-peinture-sensorielle')).toBe(true);
    expect(prismaService.chatbotMessageLog.create).toHaveBeenCalled();
  });

  it('uses FAQ content when a frequent question is matched', async () => {
    faqService.findPublished.mockResolvedValue([
      {
        id: 10,
        question: 'Faut-il creer un compte parent pour reserver ?',
        answer: 'Oui. Le compte parent permet de reserver un atelier.',
        category: 'Inscription',
        displayOrder: 20,
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    workshopsService.findPublished.mockResolvedValue([]);

    const reply = await service.reply({
      message: 'Faut il un compte parent pour reserver ?',
    });

    expect(reply.sourceType).toBe('faq');
    expect(reply.matchedFaqIds).toEqual([10]);
    expect(reply.reply).toContain('compte parent');
  });
});
