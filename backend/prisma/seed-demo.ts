import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createPrismaClientOptions } from '../src/prisma/prisma-client-options';

const prisma = new PrismaClient(createPrismaClientOptions());

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
  ];

  for (const workshop of workshops) {
    await prisma.workshop.upsert({
      where: { slug: workshop.slug },
      update: workshop,
      create: workshop,
    });
  }

  console.log(`Demo workshops ready: ${workshops.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
