import { Body, Controller, Get, Patch } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '@interface/decorators/current-user.decorator'
import { AllowDuringPasswordReset } from '@interface/decorators/allow-during-password-reset.decorator'
import { UserEntity } from '@domain/entities/user.entity'
import { UserProfileService } from '@application/user/use-cases/user-profile.service'
import { toUserDto } from '@application/user/user.mapper'
import { UpdateProfileDto } from './dto/update-profile.dto'

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly profileService: UserProfileService) {}

  @Get('me')
  @AllowDuringPasswordReset()
  @ApiOperation({ summary: 'Get current user profile' })
  me(@CurrentUser() user: UserEntity) {
    return toUserDto(user)
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  updateMe(@CurrentUser() user: UserEntity, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(user.id, dto)
  }
}
