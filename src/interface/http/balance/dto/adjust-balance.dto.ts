import { IsDateString, IsNumber, IsPositive, IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class AdjustBalanceDto {
  @ApiProperty({ example: 10000 })
  @IsNumber()
  @IsPositive()
  newBalance: number

  @ApiProperty({ example: 'Corrección de saldo inicial' })
  @IsString()
  @MinLength(3)
  reason: string

  @ApiProperty({ example: '2026-05-01' })
  @IsDateString()
  adjustmentDate: string
}

export class AddIncomeDto {
  @ApiProperty({ example: 'Sueldo quincenal' })
  @IsString()
  @MinLength(2)
  description: string

  @ApiProperty({ example: 8000 })
  @IsNumber()
  @IsPositive()
  amount: number
}
