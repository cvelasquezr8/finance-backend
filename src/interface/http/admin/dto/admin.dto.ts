import { IsEnum } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { UserRole, UserStatus } from '@domain/entities/user.entity'

export class UpdateRoleDto {
  @ApiProperty({ enum: ['ADMIN', 'USER'] })
  @IsEnum(['ADMIN', 'USER'] as UserRole[])
  role: UserRole
}

export class UpdateStatusDto {
  @ApiProperty({ enum: ['active', 'blocked', 'deleted'] })
  @IsEnum(['active', 'blocked', 'deleted'] as UserStatus[])
  status: UserStatus
}
