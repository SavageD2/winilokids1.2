import { ContactStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateContactDto {
  @ApiPropertyOptional({ enum: ContactStatus, example: ContactStatus.IN_PROGRESS })
  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus;

  @ApiPropertyOptional({
    example: 'Parent recontacte par telephone, attente de confirmation sur le prochain atelier.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNotes?: string;
}
