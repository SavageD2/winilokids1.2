import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SetParentPasswordDto {
  @ApiProperty({ example: 'MonMotDePasse123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(120)
  password: string;
}
