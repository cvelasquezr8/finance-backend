import { Module } from '@nestjs/common'
import { EventController } from './event.controller'
import { EventService } from '@application/event/use-cases/event.service'
import { BudgetEventRepository } from '@domain/repositories/budget-event.repository'
import { PrismaEventRepository } from '@infrastructure/repositories/prisma-event.repository'
import { TransactionRepository } from '@domain/repositories/transaction.repository'
import { PrismaTransactionRepository } from '@infrastructure/repositories/prisma-transaction.repository'

@Module({
  controllers: [EventController],
  providers: [
    EventService,
    { provide: BudgetEventRepository, useClass: PrismaEventRepository },
    { provide: TransactionRepository, useClass: PrismaTransactionRepository },
  ],
})
export class EventModule {}
