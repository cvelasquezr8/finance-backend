import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { FilesController } from './files.controller'
import { FileStorageService } from '@infrastructure/storage/file-storage.service'

@Module({
  imports: [JwtModule.register({})],
  controllers: [FilesController],
  providers: [FileStorageService],
  exports: [FileStorageService],
})
export class FilesModule {}
