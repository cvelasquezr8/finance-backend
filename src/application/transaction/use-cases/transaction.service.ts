import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { TransactionRepository } from '@domain/repositories/transaction.repository'
import { TransactionEntity } from '@domain/entities/transaction.entity'
import { CreateTransactionDto } from '@interface/http/transaction/dto/create-transaction.dto'
import { UpdateTransactionDto } from '@interface/http/transaction/dto/update-transaction.dto'

@Injectable()
export class TransactionService {
  constructor(private readonly txRepo: TransactionRepository) {}

  async listCategories() {
    return this.txRepo.listCategories()
  }

  async list(
    userId: string,
    month: number,
    year: number,
    quincena?: string,
    type?: string,
    cardId?: string
  ) {
    // The frontend uses cardId='cc-only' as a virtual filter for credit-card items.
    const isCC = cardId === 'cc-only' ? true : undefined
    const realCardId = cardId && cardId !== 'cc-only' ? cardId : undefined
    const normalizedType = type && type !== 'all' ? type : undefined
    const txs = await this.txRepo.findByFilter({
      userId,
      month,
      year,
      quincena,
      type: normalizedType,
      cardId: realCardId,
      isCC,
    })
    return {
      data: txs.map(TransactionService.toDto),
      total: txs.length,
      page: 1,
      pageSize: txs.length,
      hasMore: false,
    }
  }

  async create(userId: string, dto: CreateTransactionDto, userTimezone: string): Promise<object> {
    const now = new Date()
    const status = dto.type === 'income' || dto.type === 'daily' ? 'confirmed' : 'pending'
    const categoryId = await this.txRepo.findCategoryIdByCode(dto.category)
    if (!categoryId) throw new NotFoundException(`Category '${dto.category}' not found`)
    const tx = await this.txRepo.create({
      userId,
      description: dto.description,
      amount: dto.amount,
      type: dto.type,
      categoryId,
      quincena: dto.quincena,
      dueDay: dto.dueDay,
      month: dto.month,
      year: dto.year,
      isRecurring: dto.isRecurring,
      isCC: dto.isCC,
      cardId: dto.cardId ?? null,
      eventId: dto.eventId ?? null,
      status,
      receiptUrl: null,
      confirmedAt: status === 'confirmed' ? now : null,
      deletedAt: null,
      createdLocalTimeAt: this.localNow(userTimezone),
      updatedLocalTimeAt: this.localNow(userTimezone),
      deletedLocalTimeAt: null,
    })
    return TransactionService.toDto(tx)
  }

  async confirm(
    userId: string,
    txId: string,
    confirmed: boolean,
    userTimezone: string
  ): Promise<object> {
    const tx = await this.txRepo.findById(txId)
    if (!tx) throw new NotFoundException('Transaction not found')
    if (tx.userId !== userId) throw new ForbiddenException()
    const updated = await this.txRepo.update(txId, {
      status: confirmed ? 'confirmed' : 'pending',
      confirmedAt: confirmed ? new Date() : null,
      updatedLocalTimeAt: this.localNow(userTimezone),
    })
    return TransactionService.toDto(updated)
  }

  async update(
    userId: string,
    txId: string,
    dto: UpdateTransactionDto,
    userTimezone: string
  ): Promise<object> {
    const tx = await this.txRepo.findById(txId)
    if (!tx) throw new NotFoundException('Transaction not found')
    if (tx.userId !== userId) throw new ForbiddenException()
    const { category, ...rest } = dto
    let categoryId: number | undefined
    if (category) {
      const found = await this.txRepo.findCategoryIdByCode(category)
      if (!found) throw new NotFoundException(`Category '${category}' not found`)
      categoryId = found
    }
    const updated = await this.txRepo.update(txId, {
      ...rest,
      ...(categoryId !== undefined && { categoryId }),
      updatedLocalTimeAt: this.localNow(userTimezone),
    })
    return TransactionService.toDto(updated)
  }

  async remove(userId: string, txId: string, userTimezone: string): Promise<void> {
    const tx = await this.txRepo.findById(txId)
    if (!tx) throw new NotFoundException('Transaction not found')
    if (tx.userId !== userId) throw new ForbiddenException()
    await this.txRepo.softDelete(txId, this.localNow(userTimezone))
  }

  async listHistory(userId: string, year: number, type?: string, category?: string) {
    const txs = await this.txRepo.findHistory(userId, year, type, category)
    return {
      data: txs.map(TransactionService.toDto),
      total: txs.length,
      page: 1,
      pageSize: txs.length,
      hasMore: false,
    }
  }

  async updateReceipt(userId: string, txId: string, receiptUrl: string): Promise<object> {
    const tx = await this.txRepo.findById(txId)
    if (!tx) throw new NotFoundException('Transaction not found')
    if (tx.userId !== userId) throw new ForbiddenException()
    const updated = await this.txRepo.update(txId, { receiptUrl })
    return TransactionService.toDto(updated)
  }

  private static toDto(tx: TransactionEntity): object {
    return {
      id: tx.id,
      numericId: tx.numericId,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      category: tx.categoryCode,
      categoryId: tx.categoryId,
      status: tx.status,
      quincena: tx.quincena,
      dueDay: tx.dueDay,
      month: tx.month,
      year: tx.year,
      isRecurring: tx.isRecurring,
      isCC: tx.isCC,
      cardId: tx.cardId ?? null,
      eventId: tx.eventId ?? null,
      userId: tx.userId ?? null,
      receiptUrl: tx.receiptUrl ?? null,
      confirmedAt: tx.confirmedAt?.toISOString() ?? null,
      createdAt: tx.createdAt.toISOString(),
      updatedAt: tx.updatedAt.toISOString(),
    }
  }

  private localNow(timezone: string): Date {
    const offsets: Record<string, number> = {
      'America/Mexico_City': -6,
      'America/New_York': -5,
      'America/Los_Angeles': -8,
    }
    const offset = offsets[timezone] ?? 0
    return new Date(Date.now() + offset * 60 * 60 * 1000)
  }
}
