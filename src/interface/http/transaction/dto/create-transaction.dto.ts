import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  TransactionCategory,
  TransactionType,
  QuincenaType,
} from '@domain/entities/transaction.entity'

export class CreateTransactionDto {
  @ApiProperty({ example: 'Renta mensual' })
  @IsString()
  description: string

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @IsPositive({ message: 'Amount must be greater than 0' })
  amount: number

  @ApiProperty({ enum: ['scheduled', 'daily', 'income', 'adjustment'] })
  @IsEnum(['scheduled', 'daily', 'income', 'adjustment'] as TransactionType[])
  type: TransactionType

  @ApiProperty({
    enum: [
      'vivienda',
      'servicios',
      'alimentacion',
      'transporte',
      'salud',
      'entretenimiento',
      'educacion',
      'deuda',
      'otros',
    ],
  })
  @IsEnum([
    'vivienda',
    'servicios',
    'alimentacion',
    'transporte',
    'salud',
    'entretenimiento',
    'educacion',
    'deuda',
    'otros',
  ] as TransactionCategory[])
  category: TransactionCategory

  @ApiProperty({ enum: ['primera', 'segunda'] })
  @IsEnum(['primera', 'segunda'] as QuincenaType[])
  quincena: QuincenaType

  @ApiProperty({ example: 15, minimum: 1, maximum: 31 })
  @IsInt()
  @Min(1)
  @Max(31)
  dueDay: number

  @ApiProperty({ example: 5, minimum: 1, maximum: 12 })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number

  @ApiProperty({ example: 2026 })
  @IsInt()
  @Min(2020)
  year: number

  @ApiProperty({ example: false })
  @IsBoolean()
  isRecurring: boolean

  @ApiProperty({ example: false })
  @IsBoolean()
  isCC: boolean

  @ApiPropertyOptional({ example: 'uuid-of-card' })
  @IsOptional()
  @IsUUID()
  cardId?: string | null

  @ApiPropertyOptional({ example: 'uuid-of-event' })
  @IsOptional()
  @IsUUID()
  eventId?: string | null
}
