import { Module } from '@nestjs/common'
import { EventController } from './event.controller'
import { EventService } from '@application/event/use-cases/event.service'
import { BudgetEventRepository } from '@domain/repositories/budget-event.repository'
import { PrismaEventRepository } from '@infrastructure/repositories/prisma-event.repository'

@Module({
  controllers: [EventController],
  providers: [EventService, { provide: BudgetEventRepository, useClass: PrismaEventRepository }],
})
export class EventModule {}
