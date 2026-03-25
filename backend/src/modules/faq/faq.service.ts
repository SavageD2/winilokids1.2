import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFaqEntryDto } from './dto/create-faq-entry.dto';
import { UpdateFaqEntryDto } from './dto/update-faq-entry.dto';

@Injectable()
export class FaqService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublished() {
    return this.prisma.faqEntry.findMany({
      where: {
        isPublished: true,
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findAll() {
    return this.prisma.faqEntry.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(createFaqEntryDto: CreateFaqEntryDto) {
    return this.prisma.faqEntry.create({
      data: {
        question: createFaqEntryDto.question.trim(),
        answer: createFaqEntryDto.answer.trim(),
        category: createFaqEntryDto.category?.trim() || null,
        displayOrder: createFaqEntryDto.displayOrder ?? 0,
        isPublished: createFaqEntryDto.isPublished ?? false,
      },
    });
  }

  async update(id: number, updateFaqEntryDto: UpdateFaqEntryDto) {
    await this.ensureExists(id);

    return this.prisma.faqEntry.update({
      where: { id },
      data: {
        ...(updateFaqEntryDto.question !== undefined
          ? { question: updateFaqEntryDto.question.trim() }
          : {}),
        ...(updateFaqEntryDto.answer !== undefined
          ? { answer: updateFaqEntryDto.answer.trim() }
          : {}),
        ...(updateFaqEntryDto.category !== undefined
          ? { category: updateFaqEntryDto.category?.trim() || null }
          : {}),
        ...(updateFaqEntryDto.displayOrder !== undefined
          ? { displayOrder: updateFaqEntryDto.displayOrder }
          : {}),
        ...(updateFaqEntryDto.isPublished !== undefined
          ? { isPublished: updateFaqEntryDto.isPublished }
          : {}),
      },
    });
  }

  async remove(id: number) {
    await this.ensureExists(id);

    await this.prisma.faqEntry.delete({
      where: { id },
    });

    return {
      message: 'Faq entry deleted successfully',
    };
  }

  private async ensureExists(id: number) {
    const faqEntry = await this.prisma.faqEntry.findUnique({
      where: { id },
    });

    if (!faqEntry) {
      throw new NotFoundException('Faq entry not found');
    }

    return faqEntry;
  }
}
