import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '@interface/decorators/current-user.decorator'
import { UserEntity } from '@domain/entities/user.entity'
import { NotificationService } from '@application/notifications/notification.service'
import { PaginationQueryDto } from '@interface/http/common/pagination-query.dto'

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications + unread count' })
  list(@CurrentUser() user: UserEntity, @Query() query: PaginationQueryDto) {
    return this.service.list(user.id, query)
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark a notification as read' })
  read(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.service.markRead(user.id, id)
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  readAll(@CurrentUser() user: UserEntity) {
    return this.service.markAllRead(user.id)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a notification' })
  remove(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.service.remove(user.id, id)
  }
}
