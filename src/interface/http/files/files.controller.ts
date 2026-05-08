import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Res,
  UnauthorizedException,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Response } from 'express'
import * as path from 'path'
import { Public } from '@interface/decorators/public.decorator'
import { FileStorageService } from '@infrastructure/storage/file-storage.service'

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly fileStorage: FileStorageService) {}

  @Get('receipts/:filename')
  @Public()
  @ApiOperation({ summary: 'Serve receipt file with signed token' })
  serveFile(
    @Param('filename') filename: string,
    @Query('token') token: string,
    @Res() res: Response
  ) {
    if (!token) throw new UnauthorizedException('Token required to access file')

    try {
      this.fileStorage.validateToken(token)
    } catch {
      throw new UnauthorizedException('Invalid or expired token')
    }

    if (!this.fileStorage.fileExists(filename)) {
      throw new NotFoundException('File not found')
    }

    const filePath = this.fileStorage.getFilePath(filename)
    res.sendFile(path.resolve(filePath))
  }
}
