import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

/** Self-service profile fields editable from the frontend UserProfileModal. */
export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  firstName?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  lastName?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  middleName?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  secondLastName?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  monthlyNotifications?: boolean

  @ApiPropertyOptional({ enum: ['es', 'en'] })
  @IsOptional()
  @IsIn(['es', 'en'])
  language?: string

  @ApiPropertyOptional({ enum: ['dark', 'light'] })
  @IsOptional()
  @IsIn(['dark', 'light'])
  theme?: string
}
