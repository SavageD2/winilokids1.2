import 'dotenv/config';
import { PrismaClient, RegistrationStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createPrismaClientOptions } from '../src/prisma/prisma-client-options';

const prisma = new PrismaClient(createPrismaClientOptions());
const DEMO_PARENT_PASSWORD = 'DemoParent123!';

function atLocalHour(date: Date, hour: number, minutes = 0) {
  const next = new Date(date);
  next.setHours(hour, minutes, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

async function main() {
  const today = new Date();

  const workshops = [
    {
      title: 'Atelier peinture sensorielle',
      slug: 'atelier-peinture-sensorielle',
      shortDescription:
        'Un temps creatif pour explorer les couleurs, les textures et la motricite fine.',
      description:
        'Cet atelier propose une experience ludique autour de la peinture, avec un cadre rassurant, du materiel adapte et des consignes simples pour aider chaque enfant a creer a son rythme.',
      startAt: atLocalHour(addDays(today, 7), 10, 0),
      endAt: atLocalHour(addDays(today, 7), 11, 30),
      location: 'Maison des familles, Lille',
      recommendedAgeMin: 4,
      recommendedAgeMax: 7,
      capacity: 12,
      isPublished: true,
    },
    {
      title: 'Parcours motricite et jeux cooperatifs',
      slug: 'parcours-motricite-jeux-cooperatifs',
      shortDescription:
        'Un atelier pour bouger, cooperer et gagner en confiance dans un cadre bienveillant.',
      description:
        'Les enfants evoluent sur un parcours progressif puis participent a des jeux collectifs pensés pour travailler l attention, la coordination et l entraide.',
      startAt: atLocalHour(addDays(today, 14), 14, 30),
      endAt: atLocalHour(addDays(today, 14), 16, 0),
      location: 'Salle polyvalente, Roubaix',
      recommendedAgeMin: 5,
      recommendedAgeMax: 8,
      capacity: 14,
      isPublished: true,
    },
    {
      title: 'Initiation musique et rythme',
      slug: 'initiation-musique-et-rythme',
      shortDescription:
        'Une decouverte joyeuse du rythme, de l ecoute et des premiers instruments.',
      description:
        'Cet atelier aide les enfants a experimenter les sons, les percussions et les jeux de rythme a travers des sequences courtes, accessibles et tres vivantes.',
      startAt: atLocalHour(addDays(today, 21), 10, 30),
      endAt: atLocalHour(addDays(today, 21), 12, 0),
      location: 'Studio associatif, Tourcoing',
      recommendedAgeMin: 6,
      recommendedAgeMax: 10,
      capacity: 10,
      isPublished: true,
    },
    {
      title: 'Laboratoire nature et petites experiences',
      slug: 'laboratoire-nature-petites-experiences',
      shortDescription:
        'Une session brouillon pour preparer les prochaines ouvertures de reservations.',
      description:
        'Cet atelier melange petites observations, manipulations simples et temps d echange autour de la nature. Il reste volontairement en brouillon pour permettre la verification du back-office admin.',
      startAt: atLocalHour(addDays(today, 28), 15, 0),
      endAt: atLocalHour(addDays(today, 28), 16, 30),
      location: 'Maison de quartier, Croix',
      recommendedAgeMin: 7,
      recommendedAgeMax: 10,
      capacity: 10,
      isPublished: false,
    },
  ];

  const demoParents = [
    {
      email: 'camille.martin@example.com',
      firstName: 'Camille',
      lastName: 'Martin',
      phone: '0611223344',
    },
    {
      email: 'nora.bernard@example.com',
      firstName: 'Nora',
      lastName: 'Bernard',
      phone: '0677889900',
    },
    {
      email: 'julien.robert@example.com',
      firstName: 'Julien',
      lastName: 'Robert',
      phone: '0622334455',
    },
  ];

  const demoContacts = [
    {
      name: 'Camille Martin',
      email: 'camille.martin@example.com',
      phone: '0611223344',
      message:
        'Bonjour, je voudrais savoir si vous proposez un accompagnement pour les enfants un peu timides lors du premier atelier.',
    },
    {
      name: 'Sophie Leroy',
      email: 'sophie.leroy@example.com',
      phone: '0699001122',
      message:
        'Bonjour, avez-vous deja les dates prevues pour les ateliers des vacances de printemps et faut-il prevoir une tenue particuliere ?',
    },
    {
      name: 'Julien Robert',
      email: 'julien.robert@example.com',
      phone: '0622334455',
      message:
        'Bonjour, mon fils a une sensibilite au bruit. Pouvez-vous me dire combien d enfants sont accueillis en moyenne sur les ateliers musique ?',
    },
  ];

  const faqEntries = [
    {
      question: 'Comment choisir un atelier selon l age de mon enfant ?',
      answer:
        'Chaque atelier indique une tranche d age recommandee sur sa fiche. Si ton enfant se situe entre deux tranches, la FAQ peut t aider a comparer et le formulaire de contact permet de demander une confirmation plus fine.',
      category: 'Choisir un atelier',
      displayOrder: 10,
      isPublished: true,
    },
    {
      question: 'Faut-il creer un compte parent pour reserver ?',
      answer:
        'Oui. Le compte parent permet de reserver un atelier, retrouver les inscriptions en cours, annuler une demande autorisee et garder des informations de contact coherentes.',
      category: 'Inscription',
      displayOrder: 20,
      isPublished: true,
    },
    {
      question: 'Que se passe-t-il apres une reservation ?',
      answer:
        'Une fois la reservation enregistree, elle apparait dans ton espace parent avec son statut. Selon l organisation de l atelier, elle peut ensuite rester en attente, etre confirmee, annulee ou marquee comme presence.',
      category: 'Inscription',
      displayOrder: 30,
      isPublished: true,
    },
    {
      question: 'Comment savoir s il reste des places ?',
      answer:
        'Lorsqu une capacite est definie pour un atelier publie, le site affiche le nombre de places restantes. Si tu as un doute ou un besoin particulier, le formulaire de contact reste la meilleure option.',
      category: 'Organisation',
      displayOrder: 40,
      isPublished: true,
    },
    {
      question: 'Puis-je poser une question avant de reserver ?',
      answer:
        'Oui. Le formulaire de contact est prevu pour ca. Il est utile si tu hesites entre plusieurs ateliers, si tu veux verifier l adequation a l age de ton enfant ou si tu as besoin d une precision organisationnelle.',
      category: 'Organisation',
      displayOrder: 50,
      isPublished: true,
    },
    {
      question: 'Proposez-vous un accompagnement pour des besoins tres specifiques ?',
      answer:
        'Certaines situations necessitent une reponse humaine plus precise. Cette question reste volontairement en brouillon pour preparer de futures variantes de contenu dans l admin.',
      category: 'Cas particuliers',
      displayOrder: 60,
      isPublished: false,
    },
  ];

  const demoPasswordHash = await bcrypt.hash(DEMO_PARENT_PASSWORD, 10);

  for (const workshop of workshops) {
    await prisma.workshop.upsert({
      where: { slug: workshop.slug },
      update: workshop,
      create: workshop,
    });
  }

  for (const parent of demoParents) {
    await prisma.parentAccount.upsert({
      where: { email: parent.email },
      update: {
        firstName: parent.firstName,
        lastName: parent.lastName,
        phone: parent.phone,
        passwordHash: demoPasswordHash,
      },
      create: {
        ...parent,
        passwordHash: demoPasswordHash,
      },
    });
  }

  const workshopRecords = await prisma.workshop.findMany({
    where: {
      slug: {
        in: workshops.map((workshop) => workshop.slug),
      },
    },
  });
  const parents = await prisma.parentAccount.findMany({
    where: {
      email: {
        in: demoParents.map((parent) => parent.email),
      },
    },
  });

  const workshopBySlug = new Map(workshopRecords.map((workshop) => [workshop.slug, workshop]));
  const parentByEmail = new Map(parents.map((parent) => [parent.email, parent]));

  await prisma.registration.deleteMany({
    where: {
      parentAccountId: {
        in: parents.map((parent) => parent.id),
      },
    },
  });

  await prisma.contact.deleteMany({
    where: {
      email: {
        in: demoContacts.map((contact) => contact.email),
      },
    },
  });

  const registrations = [
    {
      parentEmail: 'camille.martin@example.com',
      workshopSlug: 'atelier-peinture-sensorielle',
      childFirstName: 'Lina',
      childAge: 5,
      message:
        'Lina adore les activites manuelles et sera ravie de participer a un petit groupe.',
      status: RegistrationStatus.CONFIRMED,
    },
    {
      parentEmail: 'camille.martin@example.com',
      workshopSlug: 'initiation-musique-et-rythme',
      childFirstName: 'Lina',
      childAge: 5,
      message: 'Premiere decouverte musicale pour elle, nous sommes curieux du format.',
      status: RegistrationStatus.PENDING,
    },
    {
      parentEmail: 'nora.bernard@example.com',
      workshopSlug: 'parcours-motricite-jeux-cooperatifs',
      childFirstName: 'Yanis',
      childAge: 7,
      message: 'Yanis aime beaucoup les jeux d equipe et les parcours moteurs.',
      status: RegistrationStatus.ATTENDED,
    },
    {
      parentEmail: 'julien.robert@example.com',
      workshopSlug: 'atelier-peinture-sensorielle',
      childFirstName: 'Milo',
      childAge: 6,
      message: 'Reservation annulee apres un changement de planning familial.',
      status: RegistrationStatus.CANCELLED,
    },
  ];

  for (const registration of registrations) {
    const parent = parentByEmail.get(registration.parentEmail);
    const workshop = workshopBySlug.get(registration.workshopSlug);

    if (!parent || !workshop) {
      throw new Error(
        `Missing demo relation for ${registration.parentEmail} / ${registration.workshopSlug}`,
      );
    }

    await prisma.registration.create({
      data: {
        parentName: `${parent.firstName} ${parent.lastName}`.trim(),
        parentEmail: parent.email,
        parentPhone: parent.phone,
        parentAccountId: parent.id,
        workshopId: workshop.id,
        childFirstName: registration.childFirstName,
        childAge: registration.childAge,
        message: registration.message,
        status: registration.status,
      },
    });
  }

  await prisma.contact.createMany({
    data: demoContacts,
  });

  await prisma.faqEntry.deleteMany({
    where: {
      question: {
        in: faqEntries.map((entry) => entry.question),
      },
    },
  });

  await prisma.faqEntry.createMany({
    data: faqEntries,
  });

  console.log(`Demo workshops ready: ${workshops.length}`);
  console.log(`Demo parent accounts ready: ${demoParents.length}`);
  console.log(`Demo registrations ready: ${registrations.length}`);
  console.log(`Demo contacts ready: ${demoContacts.length}`);
  console.log(`Demo FAQ entries ready: ${faqEntries.length}`);
  console.log(`Demo parent password: ${DEMO_PARENT_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
