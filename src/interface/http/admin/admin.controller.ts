import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Roles } from '@interface/decorators/roles.decorator'
import { CurrentUser } from '@interface/decorators/current-user.decorator'
import { UserEntity } from '@domain/entities/user.entity'
import { AdminService } from '@application/admin/use-cases/admin.service'
import { InviteUserUseCase } from '@application/admin/use-cases/invite-user.use-case'
import { toUserDto } from '@application/user/user.mapper'
import { UpdateRoleDto, UpdateStatusDto, InviteUserDto } from './dto/admin.dto'
import { PaginationQueryDto } from '@interface/http/common/pagination-query.dto'

@ApiTags('Admin')
@Controller('admin')
@Roles('ADMIN')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly inviteUserUseCase: InviteUserUseCase
  ) {}

  @Get('users')
  @ApiOperation({ summary: 'List all users (paginated)' })
  listUsers(@Query() query: PaginationQueryDto) {
    return this.adminService.listUsers(query)
  }

  @Post('users/invite')
  @ApiOperation({ summary: 'Invite a user with a temporary password (emailed)' })
  async invite(@CurrentUser() admin: UserEntity, @Body() dto: InviteUserDto) {
    const user = await this.inviteUserUseCase.execute(admin.id, dto)
    return toUserDto(user)
  }

  @Patch('users/:userId/role')
  @ApiOperation({ summary: 'Update user role' })
  updateRole(@Param('userId') userId: string, @Body() dto: UpdateRoleDto) {
    return this.adminService.updateRole(userId, dto.role)
  }

  @Patch('users/:userId/status')
  @ApiOperation({ summary: 'Update user status' })
  updateStatus(@Param('userId') userId: string, @Body() dto: UpdateStatusDto) {
    return this.adminService.updateStatus(userId, dto.status)
  }
}
