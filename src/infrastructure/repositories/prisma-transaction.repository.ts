import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '@infrastructure/database'
import {
  TransactionRepository,
  TransactionFilter,
} from '@domain/repositories/transaction.repository'
import { TransactionEntity } from '@domain/entities/transaction.entity'
import { EntityNotFoundException } from '@domain/exceptions/domain.exception'

@Injectable()
export class PrismaTransactionRepository extends TransactionRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findById(id: string): Promise<TransactionEntity | null> {
    const tx = await this.prisma.transaction.findFirst({ where: { id, deletedAt: null } })
    return tx ? PrismaTransactionRepository.toEntity(tx) : null
  }

  async findByFilter(filter: TransactionFilter): Promise<TransactionEntity[]> {
    const where: Prisma.TransactionWhereInput = {
      userId: filter.userId,
      deletedAt: null,
      ...(filter.month && { month: filter.month }),
      ...(filter.year && { year: filter.year }),
      ...(filter.quincena && { quincena: filter.quincena as any }),
      ...(filter.type && { type: filter.type as any }),
      ...(filter.category && { category: filter.category as any }),
      ...(filter.cardId && { cardId: filter.cardId }),
      ...(filter.isCC !== undefined && { isCC: filter.isCC }),
    }
    const txs = await this.prisma.transaction.findMany({
      where,
      orderBy: [{ dueDay: 'asc' }, { createdAt: 'desc' }],
    })
    return txs.map(PrismaTransactionRepository.toEntity)
  }

  async findByEventId(eventId: string): Promise<TransactionEntity[]> {
    const txs = await this.prisma.transaction.findMany({
      where: { eventId, deletedAt: null },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { dueDay: 'desc' }],
    })
    return txs.map(PrismaTransactionRepository.toEntity)
  }

  async findHistory(
    userId: string,
    year: number,
    type?: string,
    category?: string
  ): Promise<TransactionEntity[]> {
    const txs = await this.prisma.transaction.findMany({
      where: {
        userId,
        year,
        deletedAt: null,
        ...(type && { type: type as any }),
        ...(category && { category: category as any }),
      },
      orderBy: [{ month: 'desc' }, { dueDay: 'desc' }],
    })
    return txs.map(PrismaTransactionRepository.toEntity)
  }

  async create(
    data: Omit<TransactionEntity, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<TransactionEntity> {
    const tx = await this.prisma.transaction.create({
      data: { ...data, amount: new Prisma.Decimal(data.amount) } as any,
    })
    return PrismaTransactionRepository.toEntity(tx)
  }

  async update(id: string, data: Partial<TransactionEntity>): Promise<TransactionEntity> {
    const updateData: any = { ...data }
    if (data.amount !== undefined) updateData.amount = new Prisma.Decimal(data.amount)
    const tx = await this.prisma.transaction.update({ where: { id }, data: updateData })
    return PrismaTransactionRepository.toEntity(tx)
  }

  async softDelete(id: string, localTime?: Date): Promise<TransactionEntity> {
    const now = new Date()
    const tx = await this.prisma.transaction.findFirst({ where: { id } })
    if (!tx) throw new EntityNotFoundException('Transaction', id)
    const updated = await this.prisma.transaction.update({
      where: { id },
      data: { deletedAt: now, deletedLocalTimeAt: localTime ?? now, updatedAt: now },
    })
    return PrismaTransactionRepository.toEntity(updated)
  }

  async sumByType(
    userId: string,
    month: number,
    year: number,
    quincena: string
  ): Promise<Record<string, number>> {
    const results = await this.prisma.transaction.groupBy({
      by: ['type', 'status', 'isCC'],
      where: { userId, month, year, quincena: quincena as any, deletedAt: null },
      _sum: { amount: true },
    })
    const sums: Record<string, number> = {}
    for (const r of results) {
      const key = `${r.type}_${r.status}_${r.isCC ? 'cc' : 'cash'}`
      sums[key] = Number(r._sum.amount ?? 0)
    }
    return sums
  }

  private static toEntity(tx: any): TransactionEntity {
    return {
      id: tx.id,
      userId: tx.userId,
      description: tx.description,
      amount: Number(tx.amount),
      type: tx.type,
      category: tx.category,
      status: tx.status,
      quincena: tx.quincena,
      dueDay: tx.dueDay,
      month: tx.month,
      year: tx.year,
      isRecurring: tx.isRecurring,
      isCC: tx.isCC,
      cardId: tx.cardId,
      eventId: tx.eventId,
      receiptUrl: tx.receiptUrl,
      confirmedAt: tx.confirmedAt,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt,
      deletedAt: tx.deletedAt,
      createdLocalTimeAt: tx.createdLocalTimeAt,
      updatedLocalTimeAt: tx.updatedLocalTimeAt,
      deletedLocalTimeAt: tx.deletedLocalTimeAt,
    }
  }
}
