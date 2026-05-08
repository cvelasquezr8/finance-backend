import { IsEnum, IsString, Matches, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { CardType } from '@domain/entities/card.entity'

export class CreateCardDto {
  @ApiProperty({ example: 'BBVA Débito' })
  @IsString()
  @MinLength(2)
  name: string

  @ApiProperty({ example: '1234' })
  @IsString()
  @Matches(/^\d{4}$/, { message: 'Must be exactly 4 digits' })
  lastFour: string

  @ApiProperty({ enum: ['CREDIT', 'DEBIT'] })
  @IsEnum(['CREDIT', 'DEBIT'] as CardType[])
  type: CardType
}
