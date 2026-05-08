import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '@interface/decorators/current-user.decorator'
import { UserEntity } from '@domain/entities/user.entity'
import { BalanceService } from '@application/balance/use-cases/balance.service'
import { AdjustBalanceDto, AddIncomeDto } from './dto/adjust-balance.dto'

@ApiTags('Balance')
@Controller('balance')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get()
  @ApiOperation({ summary: 'Get balance summary by quincena' })
  getSummary(
    @CurrentUser() user: UserEntity,
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('quincena') quincena = 'primera'
  ) {
    return this.balanceService.getSummary(user.id, Number(month), Number(year), quincena)
  }

  @Post('adjust')
  @ApiOperation({ summary: 'Manually adjust balance' })
  adjust(@CurrentUser() user: UserEntity, @Body() dto: AdjustBalanceDto) {
    return this.balanceService.adjust(
      user.id,
      dto.newBalance,
      dto.reason,
      dto.adjustmentDate,
      user.timezone
    )
  }

  @Post('income')
  @ApiOperation({ summary: 'Quick income entry' })
  addIncome(@CurrentUser() user: UserEntity, @Body() dto: AddIncomeDto) {
    return this.balanceService.addIncome(user.id, dto.description, dto.amount, user.timezone)
  }

  @Get('trend')
  @ApiOperation({ summary: 'Monthly income vs expenses trend' })
  trend(@CurrentUser() user: UserEntity, @Query('months') months = '6') {
    return this.balanceService.getMonthlyTrend(user.id, Number(months))
  }
}
