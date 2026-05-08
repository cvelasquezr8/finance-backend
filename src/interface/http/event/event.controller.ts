import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '@interface/decorators/current-user.decorator'
import { UserEntity } from '@domain/entities/user.entity'
import { EventService } from '@application/event/use-cases/event.service'
import {
  CreateEventDto,
  InviteParticipantDto,
  RespondInvitationDto,
  AddShoppingItemDto,
  ToggleShoppingItemDto,
} from './dto/event.dto'

@ApiTags('Events')
@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  @ApiOperation({ summary: 'List user events' })
  list(@CurrentUser() user: UserEntity) {
    return this.eventService.listEvents(user.id)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event detail' })
  get(@Param('id') id: string) {
    return this.eventService.getEvent(id)
  }

  @Post()
  @ApiOperation({ summary: 'Create budget event' })
  create(@CurrentUser() user: UserEntity, @Body() dto: CreateEventDto) {
    return this.eventService.createEvent(user.id, dto)
  }

  @Post(':eventId/invite')
  @ApiOperation({ summary: 'Invite participant' })
  invite(
    @CurrentUser() user: UserEntity,
    @Param('eventId') eventId: string,
    @Body() dto: InviteParticipantDto
  ) {
    return this.eventService.inviteParticipant(eventId, user.id, dto.alias, dto.assignedPct)
  }

  @Post(':eventId/respond')
  @ApiOperation({ summary: 'Respond to invitation' })
  respond(
    @CurrentUser() user: UserEntity,
    @Param('eventId') eventId: string,
    @Body() dto: RespondInvitationDto
  ) {
    return this.eventService.respondInvitation(eventId, user.id, dto.status)
  }

  @Post(':eventId/items')
  @ApiOperation({ summary: 'Add item to shopping list' })
  addItem(@Param('eventId') eventId: string, @Body() dto: AddShoppingItemDto) {
    return this.eventService.addShoppingItem(eventId, dto.name, dto.estimatedCost, dto.assignedTo)
  }

  @Patch(':eventId/items/:itemId')
  @ApiOperation({ summary: 'Toggle shopping item as bought' })
  toggleItem(
    @CurrentUser() user: UserEntity,
    @Param('eventId') eventId: string,
    @Param('itemId') itemId: string,
    @Body() dto: ToggleShoppingItemDto
  ) {
    return this.eventService.toggleShoppingItem(eventId, itemId, user.id, dto.bought)
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel event' })
  cancel(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.eventService.cancelEvent(id, user.id)
  }

  @Get(':eventId/transactions')
  @ApiOperation({ summary: 'Transactions linked to event' })
  getTransactions(@Param('eventId') _eventId: string) {
    return []
  }
}
