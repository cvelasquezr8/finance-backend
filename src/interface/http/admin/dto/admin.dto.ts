import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { UserRole, UserStatus } from '@domain/entities/user.entity'

export class InviteUserDto {
  @ApiProperty()
  @IsEmail()
  email: string

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  firstName: string

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  lastName: string

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  alias: string

  @ApiPropertyOptional({ enum: ['ADMIN', 'USER'] })
  @IsOptional()
  @IsEnum(['ADMIN', 'USER'] as UserRole[])
  role?: UserRole
}

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
