import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class GoogleParentLoginDto {
  @ApiProperty({
    description: 'Google Identity Services ID token returned by the frontend',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...',
  })
  @IsString()
  @MinLength(20)
  @MaxLength(4096)
  idToken: string;
}
