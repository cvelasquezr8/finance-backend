import { Module } from '@nestjs/common'
import { CardController } from './card.controller'
import { CardService } from '@application/card/use-cases/card.service'
import { CardRepository } from '@domain/repositories/card.repository'
import { PrismaCardRepository } from '@infrastructure/repositories/prisma-card.repository'

@Module({
  controllers: [CardController],
  providers: [CardService, { provide: CardRepository, useClass: PrismaCardRepository }],
})
export class CardModule {}
