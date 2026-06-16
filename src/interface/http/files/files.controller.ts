import { Body, Controller, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '@interface/decorators/current-user.decorator'
import { FileStorageService } from '@infrastructure/storage/file-storage.service'
import { UserEntity } from '@domain/entities'
import { PresignUploadDto } from './presign-upload.dto'

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly fileStorage: FileStorageService) {}

  @Post('presign')
  @ApiOperation({ summary: 'Request a presigned URL to upload a file directly to R2' })
  async presignUpload(@CurrentUser() user: UserEntity, @Body() dto: PresignUploadDto) {
    return this.fileStorage.generatePresignedUploadUrl(user.id, dto.mimeType, dto.sizeBytes)
  }
}
