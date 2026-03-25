import { PartialType } from '@nestjs/swagger';
import { CreateFaqEntryDto } from './create-faq-entry.dto';

export class UpdateFaqEntryDto extends PartialType(CreateFaqEntryDto) {}
