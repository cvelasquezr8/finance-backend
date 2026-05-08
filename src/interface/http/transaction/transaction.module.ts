import { Module } from '@nestjs/common'
import { TransactionController } from './transaction.controller'
import { TransactionService } from '@application/transaction/use-cases/transaction.service'
import { TransactionRepository } from '@domain/repositories/transaction.repository'
import { PrismaTransactionRepository } from '@infrastructure/repositories/prisma-transaction.repository'

@Module({
  controllers: [TransactionController],
  providers: [
    TransactionService,
    { provide: TransactionRepository, useClass: PrismaTransactionRepository },
  ],
})
export class TransactionModule {}
