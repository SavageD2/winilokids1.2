import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateParentProfileDto {
  @ApiProperty({ example: 'Camille' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  firstName: string;

  @ApiProperty({ example: 'Martin' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  lastName: string;

  @ApiProperty({ example: 'camille@example.com' })
  @IsEmail()
  @MaxLength(180)
  email: string;

  @ApiPropertyOptional({ example: '0612345678' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}
