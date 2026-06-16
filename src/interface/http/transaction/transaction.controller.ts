import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { diskStorage } from 'multer'
import { extname } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { CurrentUser } from '@interface/decorators/current-user.decorator'
import { UserEntity } from '@domain/entities/user.entity'
import { TransactionService } from '@application/transaction/use-cases/transaction.service'
import { CreateTransactionDto } from './dto/create-transaction.dto'
import { UpdateTransactionDto } from './dto/update-transaction.dto'
import { ConfirmTransactionDto } from './dto/confirm-transaction.dto'

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionController {
  constructor(private readonly txService: TransactionService) {}

  @Get()
  @ApiOperation({ summary: 'List transactions by quincena/month' })
  list(
    @CurrentUser() user: UserEntity,
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('quincena') quincena?: string,
    @Query('type') type?: string,
    @Query('cardId') cardId?: string
  ) {
    return this.txService.list(user.id, Number(month), Number(year), quincena, type, cardId)
  }

  @Post()
  @ApiOperation({ summary: 'Create transaction' })
  create(@CurrentUser() user: UserEntity, @Body() dto: CreateTransactionDto) {
    return this.txService.create(user.id, dto, user.timezone)
  }

  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Confirm or revert transaction' })
  confirm(
    @CurrentUser() user: UserEntity,
    @Param('id') id: string,
    @Body() dto: ConfirmTransactionDto
  ) {
    return this.txService.confirm(user.id, id, dto.confirmed, user.timezone)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update transaction' })
  update(
    @CurrentUser() user: UserEntity,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto
  ) {
    return this.txService.update(user.id, id, dto, user.timezone)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete transaction' })
  remove(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.txService.remove(user.id, id, user.timezone)
  }

  @Get('history')
  @ApiOperation({ summary: 'Annual transaction history' })
  history(
    @CurrentUser() user: UserEntity,
    @Query('year') year: string,
    @Query('type') type?: string,
    @Query('category') category?: string
  ) {
    return this.txService.listHistory(user.id, Number(year), type, category)
  }

  @Post(':id/receipt')
  @ApiOperation({ summary: 'Upload transaction receipt' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('receipt', {
      storage: diskStorage({
        destination: './uploads/receipts',
        filename: (_req, file, cb) => {
          cb(null, `${uuidv4()}${extname(file.originalname)}`)
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = /jpeg|jpg|png|pdf/
        cb(null, allowed.test(extname(file.originalname).toLowerCase()))
      },
    })
  )
  uploadReceipt(
    @CurrentUser() user: UserEntity,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    const receiptUrl = `/api/v1/files/receipts/${file.filename}`
    return this.txService.updateReceipt(user.id, id, receiptUrl)
  }
}
