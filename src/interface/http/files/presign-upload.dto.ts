import { IsIn, IsInt, Max, Min } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export class PresignUploadDto {
  @ApiProperty({ enum: ALLOWED_MIME_TYPES })
  @IsIn(ALLOWED_MIME_TYPES)
  mimeType: AllowedMimeType

  @ApiProperty({ description: 'File size in bytes (max 10 MB)', example: 204800 })
  @IsInt()
  @Min(1)
  @Max(MAX_FILE_SIZE_BYTES)
  sizeBytes: number
}
