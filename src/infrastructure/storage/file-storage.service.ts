import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as fs from 'fs'
import * as path from 'path'

@Injectable()
export class FileStorageService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  generateSignedUrl(filename: string, userId: string): string {
    const token = this.jwtService.sign(
      { filename, userId, purpose: 'file-access' },
      {
        secret: this.configService.get<string>('database.jwt.accessSecret'),
        expiresIn: '1h',
      }
    )
    const baseUrl = `http://localhost:${this.configService.get('app.app.port') ?? 3000}`
    return `${baseUrl}/api/v1/files/receipts/${filename}?token=${token}`
  }

  validateToken(token: string): { filename: string; userId: string } {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>('database.jwt.accessSecret'),
    })
  }

  getFilePath(filename: string): string {
    const uploadDest = this.configService.get<string>('app.storage.dest') ?? './uploads'
    return path.resolve(uploadDest, 'receipts', filename)
  }

  fileExists(filename: string): boolean {
    return fs.existsSync(this.getFilePath(filename))
  }
}
