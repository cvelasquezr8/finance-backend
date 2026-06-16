import { Module } from '@nestjs/common'
import { FilesController } from './files.controller'
import { FileStorageService } from '@infrastructure/storage/file-storage.service'

@Module({
  controllers: [FilesController],
  providers: [FileStorageService],
  exports: [FileStorageService],
})
export class FilesModule {}
