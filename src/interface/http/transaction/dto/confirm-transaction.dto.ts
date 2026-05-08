import { IsBoolean, IsUUID } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ConfirmTransactionDto {
  @ApiProperty()
  @IsUUID()
  transactionId: string

  @ApiProperty()
  @IsBoolean()
  confirmed: boolean
}
