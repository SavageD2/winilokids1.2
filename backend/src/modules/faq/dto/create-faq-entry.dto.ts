import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateFaqEntryDto {
  @ApiProperty({ example: 'Comment choisir un atelier selon l age de mon enfant ?' })
  @IsString()
  @MinLength(10)
  @MaxLength(255)
  question: string;

  @ApiProperty({
    example:
      'Chaque fiche atelier indique une tranche d age recommandee. Si ton enfant est entre deux ages, la FAQ ou le formulaire de contact peuvent t aider a confirmer le bon choix.',
  })
  @IsString()
  @MinLength(20)
  @MaxLength(3000)
  answer: string;

  @ApiPropertyOptional({ example: 'Choisir un atelier' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @ApiPropertyOptional({ example: 10, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(999)
  displayOrder?: number;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPublished?: boolean;
}
