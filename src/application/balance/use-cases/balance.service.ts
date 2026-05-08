import { Injectable } from '@nestjs/common'
import dayjs from 'dayjs'
import { TransactionRepository } from '@domain/repositories/transaction.repository'
import { PrismaService } from '@infrastructure/database'

@Injectable()
export class BalanceService {
  constructor(
    private readonly txRepo: TransactionRepository,
    private readonly prisma: PrismaService
  ) {}

  async getSummary(userId: string, month: number, year: number, quincena: string) {
    const sums = await this.txRepo.sumByType(userId, month, year, quincena)

    const income = sums['income_confirmed_cash'] ?? 0
    const confirmedScheduled = sums['scheduled_confirmed_cash'] ?? 0
    const pendingScheduled = sums['scheduled_pending_cash'] ?? 0
    const dailyExpenses = sums['daily_confirmed_cash'] ?? 0
    const ccDebt = Object.entries(sums)
      .filter(([k]) => k.endsWith('_cc'))
      .reduce((acc, [, v]) => acc + v, 0)

    const adjustments = await this.prisma.balanceAdjustment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 1,
    })
    const initialBalance = adjustments[0] ? Number(adjustments[0].newBalance) : 0
    const currentBalance = initialBalance + income - confirmedScheduled - dailyExpenses
    const projectedBalance = currentBalance - pendingScheduled

    const today = dayjs()
    const daysInPeriod = quincena === 'primera' ? 15 : dayjs(`${year}-${month}`).daysInMonth() - 15
    const dayOfPeriod =
      quincena === 'primera' ? Math.min(today.date(), 15) : Math.max(today.date() - 15, 0)
    const remainingDays = Math.max(daysInPeriod - dayOfPeriod, 0)
    const dailyAllowance = remainingDays > 0 ? projectedBalance / remainingDays : 0

    return {
      currentBalance,
      initialBalance,
      projectedBalance,
      dailyAllowance: Math.round(dailyAllowance * 100) / 100,
      totalDebt: ccDebt,
      totalPendingScheduled: pendingScheduled,
      totalConfirmedScheduled: confirmedScheduled,
      totalDailyExpenses: dailyExpenses,
      expectedIncome: income,
      remainingDays,
      month,
      year,
      quincena,
    }
  }

  async adjust(
    userId: string,
    newBalance: number,
    reason: string,
    adjustmentDate: string,
    timezone: string
  ) {
    const last = await this.prisma.balanceAdjustment.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    await this.prisma.balanceAdjustment.create({
      data: {
        userId,
        previousBalance: last ? last.newBalance : 0,
        newBalance,
        reason,
        adjustmentDate: new Date(adjustmentDate),
        createdLocalTimeAt: this.localNow(timezone),
      },
    })

    return this.getSummary(userId, dayjs().month() + 1, dayjs().year(), 'primera')
  }

  async addIncome(userId: string, description: string, amount: number, timezone: string) {
    const now = dayjs()
    await this.txRepo.create({
      userId,
      description,
      amount,
      type: 'income',
      category: 'otros',
      status: 'confirmed',
      quincena: now.date() <= 15 ? 'primera' : 'segunda',
      dueDay: now.date(),
      month: now.month() + 1,
      year: now.year(),
      isRecurring: false,
      isCC: false,
      cardId: null,
      eventId: null,
      receiptUrl: null,
      confirmedAt: new Date(),
      deletedAt: null,
      createdLocalTimeAt: this.localNow(timezone),
      updatedLocalTimeAt: this.localNow(timezone),
      deletedLocalTimeAt: null,
    })
    return this.getSummary(
      userId,
      now.month() + 1,
      now.year(),
      now.date() <= 15 ? 'primera' : 'segunda'
    )
  }

  async getMonthlyTrend(userId: string, months = 6) {
    const result = []
    for (let i = months - 1; i >= 0; i--) {
      const d = dayjs().subtract(i, 'month')
      const m = d.month() + 1
      const y = d.year()
      const sums = await this.txRepo.sumByType(userId, m, y, 'primera')
      const sums2 = await this.txRepo.sumByType(userId, m, y, 'segunda')
      const income = (sums['income_confirmed_cash'] ?? 0) + (sums2['income_confirmed_cash'] ?? 0)
      const expenses =
        (sums['scheduled_confirmed_cash'] ?? 0) +
        (sums['daily_confirmed_cash'] ?? 0) +
        (sums2['scheduled_confirmed_cash'] ?? 0) +
        (sums2['daily_confirmed_cash'] ?? 0)
      result.push({ month: m, year: y, monthLabel: d.format('MMM YYYY'), income, expenses })
    }
    return result
  }

  private localNow(timezone: string): Date {
    const offsets: Record<string, number> = { 'America/Mexico_City': -6, 'America/New_York': -5 }
    const offset = offsets[timezone] ?? 0
    return new Date(Date.now() + offset * 60 * 60 * 1000)
  }
}
