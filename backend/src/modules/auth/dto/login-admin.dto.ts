import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginAdminDto {
  @ApiProperty({ example: 'admin@winilo-kids.fr' })
  @IsEmail()
  @MaxLength(180)
  email: string;

  @ApiProperty({ example: 'MotDePasseTresSolide123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  password: string;
}
