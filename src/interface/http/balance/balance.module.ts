import { Module } from '@nestjs/common'
import { BalanceController } from './balance.controller'
import { BalanceService } from '@application/balance/use-cases/balance.service'
import { TransactionRepository } from '@domain/repositories/transaction.repository'
import { PrismaTransactionRepository } from '@infrastructure/repositories/prisma-transaction.repository'

@Module({
  controllers: [BalanceController],
  providers: [
    BalanceService,
    { provide: TransactionRepository, useClass: PrismaTransactionRepository },
  ],
})
export class BalanceModule {}
