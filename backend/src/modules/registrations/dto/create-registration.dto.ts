import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateRegistrationDto {
  @ApiProperty({ example: 'Camille Martin' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  parentName: string;

  @ApiProperty({ example: 'camille@example.com' })
  @IsEmail()
  @MaxLength(180)
  parentEmail: string;

  @ApiPropertyOptional({ example: '0612345678' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  parentPhone?: string;

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
