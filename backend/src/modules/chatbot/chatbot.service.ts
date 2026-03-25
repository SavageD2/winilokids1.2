import { Injectable } from '@nestjs/common';
import { ChatbotSourceType, FaqEntry } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { FaqService } from '../faq/faq.service';
import { WorkshopsService } from '../workshops/workshops.service';
import { CreateChatbotMessageDto } from './dto/create-chatbot-message.dto';
import { ListChatbotLogsQueryDto } from './dto/list-chatbot-logs-query.dto';

type ChatbotSuggestion = {
  label: string;
  route: string;
};

type ChatbotReply = {
  reply: string;
  sourceType: 'faq' | 'workshop' | 'guidance' | 'fallback';
  suggestions: ChatbotSuggestion[];
  matchedFaqIds: number[];
  matchedWorkshopIds: number[];
  fallbackToContact: boolean;
};

type PublicWorkshop = Awaited<ReturnType<WorkshopsService['findPublished']>>[number];

type AgeHint =
  | {
      exactAge: number;
      minAge: number;
      maxAge: number;
    }
  | {
      exactAge: null;
      minAge: number;
      maxAge: number;
    };

const STOP_WORDS = new Set([
  'alors',
  'apres',
  'avec',
  'aussi',
  'bonjour',
  'comment',
  'dans',
  'des',
  'donc',
  'elle',
  'elles',
  'enfant',
  'enfants',
  'est',
  'etre',
  'faut',
  'faire',
  'hello',
  'je',
  'j',
  'la',
  'le',
  'les',
  'leur',
  'lui',
  'ma',
  'mes',
  'mon',
  'merci',
  'moi',
  'nous',
  'notre',
  'ou',
  'par',
  'pas',
  'plus',
  'pour',
  'pouvez',
  'puis',
  'quel',
  'quelle',
  'quelles',
  'quels',
  'qui',
  'reservation',
  'reserver',
  'site',
  'son',
  'sur',
  'tes',
  'ton',
  'une',
  'vers',
  'votre',
  'vos',
]);

@Injectable()
export class ChatbotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly faqService: FaqService,
    private readonly workshopsService: WorkshopsService,
  ) {}

  async reply(createChatbotMessageDto: CreateChatbotMessageDto): Promise<ChatbotReply> {
    const message = createChatbotMessageDto.message.trim();

    if (message.length === 0) {
      return this.buildGreetingReply();
    }

    const normalizedMessage = this.normalize(message);
    const [faqEntries, workshops] = await Promise.all([
      this.faqService.findPublished(),
      this.workshopsService.findPublished(),
    ]);

    const ageHint = this.extractAgeHint(normalizedMessage);
    const faqMatches = this.findFaqMatches(normalizedMessage, faqEntries);
    const workshopMatches = this.findWorkshopMatches(normalizedMessage, workshops, ageHint);
    const needsHumanHelp = this.hasAnyKeyword(normalizedMessage, [
      'besoin particulier',
      'handicap',
      'allerg',
      'urgent',
      'situation specifique',
      'cas particulier',
      'accompagnement',
      'sur mesure',
    ]);
    const asksAboutRegistration = this.hasAnyKeyword(normalizedMessage, [
      'inscription',
      'inscrire',
      'reserver',
      'reservation',
      'compte parent',
      'connexion',
      'connecter',
      'annuler',
    ]);
    const asksForWorkshopAdvice =
      ageHint !== null ||
      this.hasAnyKeyword(normalizedMessage, [
        'atelier',
        'ateliers',
        'age',
        'ages',
        'ans',
        'choisir',
        'adapter',
        'adapt',
        'recommande',
        'recommandation',
      ]);

    let response: ChatbotReply;

    if (needsHumanHelp && faqMatches.length === 0 && workshopMatches.length === 0) {
      response = {
        reply:
          "Je peux aider sur les questions frequentes, le choix d'un atelier ou le parcours d'inscription. Pour une situation plus specifique, le formulaire de contact sera plus adapte.",
        sourceType: 'fallback',
        suggestions: this.deduplicateSuggestions([
          { label: 'Poser une question', route: '/contact' },
          { label: 'Voir la FAQ', route: '/faq' },
        ]),
        matchedFaqIds: [],
        matchedWorkshopIds: [],
        fallbackToContact: true,
      };
    } else if (asksForWorkshopAdvice && workshopMatches.length > 0) {
      const topWorkshops = workshopMatches.slice(0, 3);
      const reply =
        ageHint !== null
          ? `Pour ${this.describeAgeHint(ageHint)}, je peux te proposer ${this.formatWorkshopList(topWorkshops)}.`
          : `Je peux te proposer ${this.formatWorkshopList(topWorkshops)}.`;

      response = {
        reply,
        sourceType: 'workshop',
        suggestions: this.deduplicateSuggestions([
          ...topWorkshops.map((workshop) => ({
            label: workshop.title,
            route: `/ateliers/${workshop.slug}`,
          })),
          { label: 'Voir tous les ateliers', route: '/ateliers' },
        ]),
        matchedFaqIds: [],
        matchedWorkshopIds: topWorkshops.map((workshop) => workshop.id),
        fallbackToContact: false,
      };
    } else if (faqMatches.length > 0) {
      const bestMatch = faqMatches[0];
      const suggestions: ChatbotSuggestion[] = [];

      if (this.hasAnyKeyword(this.normalize(bestMatch.category ?? ''), ['inscription'])) {
        suggestions.push({ label: 'Inscription / Connexion', route: '/inscription' });
      }

      if (this.hasAnyKeyword(this.normalize(bestMatch.answer), ['atelier', 'ateliers'])) {
        suggestions.push({ label: 'Voir les ateliers', route: '/ateliers' });
      }

      suggestions.push({ label: 'Voir la FAQ', route: '/faq' });

      response = {
        reply: bestMatch.answer,
        sourceType: 'faq',
        suggestions: this.deduplicateSuggestions(suggestions),
        matchedFaqIds: faqMatches.slice(0, 3).map((entry) => entry.id),
        matchedWorkshopIds: [],
        fallbackToContact: false,
      };
    } else if (asksAboutRegistration) {
      response = {
        reply:
          "Pour reserver, il faut d'abord passer par l'espace Inscription / Connexion afin d'utiliser un compte parent. Ensuite tu peux choisir un atelier publie et finaliser la reservation depuis sa fiche ou le parcours prevu.",
        sourceType: 'guidance',
        suggestions: this.deduplicateSuggestions([
          { label: 'Inscription / Connexion', route: '/inscription' },
          { label: 'Voir les ateliers', route: '/ateliers' },
          { label: 'Voir la FAQ', route: '/faq' },
        ]),
        matchedFaqIds: [],
        matchedWorkshopIds: [],
        fallbackToContact: false,
      };
    } else if (this.hasAnyKeyword(normalizedMessage, ['bonjour', 'hello', 'salut'])) {
      response = this.buildGreetingReply();
    } else {
      response = {
        reply:
          "Je peux t'aider a choisir un atelier, comprendre l'inscription ou retrouver une reponse frequente. Si ta demande depasse ce cadre, le formulaire de contact reste la meilleure option.",
        sourceType: 'fallback',
        suggestions: this.deduplicateSuggestions([
          { label: 'Voir les ateliers', route: '/ateliers' },
          { label: 'Consulter la FAQ', route: '/faq' },
          { label: 'Poser une question', route: '/contact' },
        ]),
        matchedFaqIds: [],
        matchedWorkshopIds: [],
        fallbackToContact: true,
      };
    }

    await this.logReply(message, normalizedMessage, createChatbotMessageDto.context?.currentRoute, response);

    return response;
  }

  async findAll(query: ListChatbotLogsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const search = query.search?.trim();
    const where = {
      sourceType: query.sourceType,
      fallbackToContact: query.fallbackToContact,
      ...(search
        ? {
            OR: [
              { message: { contains: search, mode: 'insensitive' as const } },
              { reply: { contains: search, mode: 'insensitive' as const } },
              { currentRoute: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.chatbotMessageLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.chatbotMessageLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getSummary() {
    const [
      totalMessages,
      fallbackMessages,
      faqMessages,
      workshopMessages,
      guidanceMessages,
      recentMessages,
    ] = await Promise.all([
      this.prisma.chatbotMessageLog.count(),
      this.prisma.chatbotMessageLog.count({
        where: { fallbackToContact: true },
      }),
      this.prisma.chatbotMessageLog.count({
        where: { sourceType: ChatbotSourceType.FAQ },
      }),
      this.prisma.chatbotMessageLog.count({
        where: { sourceType: ChatbotSourceType.WORKSHOP },
      }),
      this.prisma.chatbotMessageLog.count({
        where: { sourceType: ChatbotSourceType.GUIDANCE },
      }),
      this.prisma.chatbotMessageLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      totalMessages,
      fallbackMessages,
      faqMessages,
      workshopMessages,
      guidanceMessages,
      recentMessages,
    };
  }

  private buildGreetingReply(): ChatbotReply {
    return {
      reply:
        "Je peux repondre aux questions frequentes, aider a choisir un atelier selon l'age et expliquer le parcours d'inscription.",
      sourceType: 'guidance',
      suggestions: [
        { label: 'Voir les ateliers', route: '/ateliers' },
        { label: 'Consulter la FAQ', route: '/faq' },
        { label: 'Inscription / Connexion', route: '/inscription' },
      ],
      matchedFaqIds: [],
      matchedWorkshopIds: [],
      fallbackToContact: false,
    };
  }

  private findFaqMatches(message: string, faqEntries: FaqEntry[]) {
    const tokens = this.tokenize(message);

    return faqEntries
      .map((entry) => {
        const question = this.normalize(entry.question);
        const answer = this.normalize(entry.answer);
        const category = this.normalize(entry.category ?? '');

        let score = 0;

        for (const token of tokens) {
          if (question.includes(token)) {
            score += 4;
          }

          if (category.includes(token)) {
            score += 2;
          }

          if (answer.includes(token)) {
            score += 1;
          }
        }

        if (message.includes('place') && answer.includes('place')) {
          score += 3;
        }

        if (message.includes('inscript') && category.includes('inscription')) {
          score += 4;
        }

        return {
          entry,
          score,
        };
      })
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score)
      .map((item) => item.entry);
  }

  private findWorkshopMatches(message: string, workshops: PublicWorkshop[], ageHint: AgeHint | null) {
    const tokens = this.tokenize(message);

    return workshops
      .map((workshop) => {
        const haystack = this.normalize(
          [
            workshop.title,
            workshop.shortDescription,
            workshop.description,
            workshop.location,
          ].join(' '),
        );

        let score = 0;

        for (const token of tokens) {
          if (haystack.includes(token)) {
            score += 2;
          }
        }

        if (ageHint && this.matchesAgeHint(workshop, ageHint)) {
          score += 8;
        }

        if (message.includes('musique') && this.normalize(workshop.title).includes('musique')) {
          score += 3;
        }

        if (message.includes('peinture') && this.normalize(workshop.title).includes('peinture')) {
          score += 3;
        }

        if (message.includes('motricite') && this.normalize(workshop.title).includes('motricite')) {
          score += 3;
        }

        return {
          workshop,
          score,
        };
      })
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score)
      .map((item) => item.workshop);
  }

  private matchesAgeHint(workshop: PublicWorkshop, ageHint: AgeHint) {
    const workshopMin = workshop.recommendedAgeMin ?? 0;
    const workshopMax = workshop.recommendedAgeMax ?? 17;

    return ageHint.maxAge >= workshopMin && ageHint.minAge <= workshopMax;
  }

  private formatWorkshopList(workshops: PublicWorkshop[]) {
    return workshops
      .map((workshop) => {
        const ageLabel = this.workshopAgeLabel(workshop);
        const placesLabel =
          workshop.availablePlaces === null
            ? ''
            : `, ${workshop.availablePlaces} place(s) restante(s)`;

        return `${workshop.title} (${ageLabel}, ${workshop.location}${placesLabel})`;
      })
      .join(' ; ');
  }

  private workshopAgeLabel(workshop: PublicWorkshop) {
    if (workshop.recommendedAgeMin !== null && workshop.recommendedAgeMax !== null) {
      return `${workshop.recommendedAgeMin} a ${workshop.recommendedAgeMax} ans`;
    }

    if (workshop.recommendedAgeMin !== null) {
      return `a partir de ${workshop.recommendedAgeMin} ans`;
    }

    if (workshop.recommendedAgeMax !== null) {
      return `jusqu a ${workshop.recommendedAgeMax} ans`;
    }

    return 'age libre';
  }

  private describeAgeHint(ageHint: AgeHint) {
    if (ageHint.exactAge !== null) {
      return `${ageHint.exactAge} ans`;
    }

    return `une tranche entre ${ageHint.minAge} et ${ageHint.maxAge} ans`;
  }

  private extractAgeHint(message: string): AgeHint | null {
    const matches = [...message.matchAll(/(\d{1,2})\s*ans/g)].map((match) => Number(match[1]));

    if (matches.length === 0) {
      return null;
    }

    if (matches.length === 1) {
      return {
        exactAge: matches[0],
        minAge: matches[0],
        maxAge: matches[0],
      };
    }

    const sortedAges = matches.sort((left, right) => left - right);

    return {
      exactAge: null,
      minAge: sortedAges[0],
      maxAge: sortedAges[sortedAges.length - 1],
    };
  }

  private tokenize(message: string) {
    return this.normalize(message)
      .split(' ')
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
  }

  private hasAnyKeyword(message: string, keywords: string[]) {
    return keywords.some((keyword) => message.includes(this.normalize(keyword)));
  }

  private normalize(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private deduplicateSuggestions(suggestions: ChatbotSuggestion[]) {
    const seen = new Set<string>();

    return suggestions.filter((suggestion) => {
      if (seen.has(suggestion.route)) {
        return false;
      }

      seen.add(suggestion.route);
      return true;
    });
  }

  private async logReply(
    message: string,
    normalizedMessage: string,
    currentRoute: string | undefined,
    response: ChatbotReply,
  ) {
    await this.prisma.chatbotMessageLog.create({
      data: {
        message,
        normalizedMessage,
        currentRoute: currentRoute ?? null,
        sourceType: this.toPrismaSourceType(response.sourceType),
        fallbackToContact: response.fallbackToContact,
        matchedFaqIds: response.matchedFaqIds,
        matchedWorkshopIds: response.matchedWorkshopIds,
        reply: response.reply,
      },
    });
  }

  private toPrismaSourceType(sourceType: ChatbotReply['sourceType']) {
    switch (sourceType) {
      case 'faq':
        return ChatbotSourceType.FAQ;
      case 'workshop':
        return ChatbotSourceType.WORKSHOP;
      case 'guidance':
        return ChatbotSourceType.GUIDANCE;
      case 'fallback':
        return ChatbotSourceType.FALLBACK;
    }
  }
}
