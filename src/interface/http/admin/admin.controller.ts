import { Body, Controller, Get, Param, Patch } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Roles } from '@interface/decorators/roles.decorator'
import { AdminService } from '@application/admin/use-cases/admin.service'
import { UpdateRoleDto, UpdateStatusDto } from './dto/admin.dto'

@ApiTags('Admin')
@Controller('admin')
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  listUsers() {
    return this.adminService.listUsers()
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
