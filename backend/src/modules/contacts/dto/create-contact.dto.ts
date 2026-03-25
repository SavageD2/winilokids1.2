import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ example: 'Claire Dupont' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'claire@example.com' })
  @IsEmail()
  @MaxLength(180)
  email: string;

  @ApiPropertyOptional({ example: '0611223344' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiProperty({ example: 'Je souhaite en savoir plus sur les ateliers du samedi.' })
  @IsString()
  @MinLength(10)
  @MaxLength(1500)
  message: string;
}
