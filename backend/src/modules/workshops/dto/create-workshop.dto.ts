import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateWorkshopDto {
  @ApiProperty({ example: 'Atelier Montessori du mercredi' })
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title: string;

  @ApiProperty({ example: 'atelier-montessori-mercredi' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(180)
  slug: string;

  @ApiProperty({ example: 'Un atelier sensoriel et ludique pour les 4-6 ans.' })
  @IsString()
  @MinLength(10)
  @MaxLength(255)
  shortDescription: string;

  @ApiProperty({
    example:
      'Un moment de decouverte autour de la motricite fine, des couleurs et de la concentration.',
  })
  @IsString()
  @MinLength(20)
  description: string;

  @ApiProperty({ example: '2026-04-08T14:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  startAt: Date;

  @ApiPropertyOptional({ example: '2026-04-08T15:30:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endAt?: Date;

  @ApiProperty({ example: 'Maison des familles, Lille' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  location: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(17)
  recommendedAgeMin?: number;

  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(17)
  recommendedAgeMax?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  capacity?: number;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPublished?: boolean;
}
