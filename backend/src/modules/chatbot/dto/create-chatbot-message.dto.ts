import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

class ChatbotContextDto {
  @ApiPropertyOptional({ example: '/ateliers' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  currentRoute?: string;

  @ApiPropertyOptional({ example: 'atelier-peinture-sensorielle' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  workshopSlug?: string;
}

export class CreateChatbotMessageDto {
  @ApiProperty({ example: 'Je cherche un atelier pour un enfant de 5 ans.' })
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  message: string;

  @ApiPropertyOptional({ type: ChatbotContextDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChatbotContextDto)
  context?: ChatbotContextDto;
}
