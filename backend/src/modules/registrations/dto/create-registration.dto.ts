import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateRegistrationDto {
  @ApiProperty({ example: 'Lina' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  childFirstName: string;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(17)
  childAge: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  workshopId: number;

  @ApiPropertyOptional({ example: 'Mon enfant aime beaucoup les activites manuelles.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}
