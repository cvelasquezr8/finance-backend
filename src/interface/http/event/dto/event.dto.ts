import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateEventDto {
  @ApiProperty({ example: 'Viaje a Cancún' })
  @IsString()
  @MinLength(2)
  title: string

  @ApiPropertyOptional({ example: 'Vacaciones de verano' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ example: 15000 })
  @IsNumber()
  @IsPositive()
  goalAmount: number

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  deadline?: string
}

export class InviteParticipantDto {
  @ApiProperty({ example: '@amigo_viaje' })
  @IsString()
  alias: string

  @ApiProperty({ example: 50, minimum: 1, maximum: 100 })
  @IsNumber()
  @Min(1)
  @Max(100)
  assignedPct: number
}

export class RespondInvitationDto {
  @ApiProperty({ enum: ['CONFIRMED', 'DECLINED'] })
  @IsEnum(['CONFIRMED', 'DECLINED'])
  status: 'CONFIRMED' | 'DECLINED'
}

export class AddShoppingItemDto {
  @ApiProperty({ example: 'Vuelos' })
  @IsString()
  @MinLength(2)
  name: string

  @ApiPropertyOptional({ example: 4000 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  estimatedCost?: number

  @ApiPropertyOptional({ example: '@carlos_v' })
  @IsOptional()
  @IsString()
  assignedTo?: string
}

export class ToggleShoppingItemDto {
  @ApiProperty()
  @IsBoolean()
  bought: boolean
}
