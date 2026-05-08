import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Get,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { PartialType } from '@nestjs/mapped-types'
import { CurrentUser } from '@interface/decorators/current-user.decorator'
import { UserEntity } from '@domain/entities/user.entity'
import { CardService } from '@application/card/use-cases/card.service'
import { CreateCardDto } from './dto/card.dto'

class UpdateCardDto extends PartialType(CreateCardDto) {}

@ApiTags('Cards')
@Controller('cards')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Get()
  @ApiOperation({ summary: 'List user cards' })
  list(@CurrentUser() user: UserEntity) {
    return this.cardService.listCards(user.id)
  }

  @Post()
  @ApiOperation({ summary: 'Add card' })
  create(@CurrentUser() user: UserEntity, @Body() dto: CreateCardDto) {
    return this.cardService.createCard(user.id, dto)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update card' })
  update(@CurrentUser() user: UserEntity, @Param('id') id: string, @Body() dto: UpdateCardDto) {
    return this.cardService.updateCard(user.id, id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete card' })
  remove(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.cardService.deleteCard(user.id, id)
  }
}
