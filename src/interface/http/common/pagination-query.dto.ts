import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * Shared query params for paginated list endpoints. Mirrors the frontend's
 * PaginationQueryDTO (finance-pwa/src/core/dtos) so list responses stay in sync.
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @ApiPropertyOptional({ minimum: 1, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc'
}
