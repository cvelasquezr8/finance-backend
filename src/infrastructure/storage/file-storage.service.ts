import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'

const EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

const PRESIGN_TTL_SECONDS = 300 // 5 minutes

export interface PresignResult {
  presignedUrl: string
  fileKey: string
  publicUrl: string
}

@Injectable()
export class FileStorageService {
  private readonly client: S3Client
  private readonly bucket: string
  private readonly publicBase: string

  constructor(private readonly configService: ConfigService) {
    const accountId = configService.getOrThrow<string>('R2_ACCOUNT_ID')
    this.bucket = configService.getOrThrow<string>('R2_BUCKET_NAME')
    this.publicBase = configService.getOrThrow<string>('R2_PUBLIC_URL').replace(/\/$/, '')

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: configService.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: configService.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
      },
    })
  }

  async generatePresignedUploadUrl(
    userId: string,
    mimeType: string,
    sizeBytes: number
  ): Promise<PresignResult> {
    const ext = EXTENSION_MAP[mimeType] ?? 'bin'
    const fileKey = `receipts/${userId}/${randomUUID()}.${ext}`

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
      ContentType: mimeType,
      ContentLength: sizeBytes,
    })

    const presignedUrl = await getSignedUrl(this.client, command, {
      expiresIn: PRESIGN_TTL_SECONDS,
    })

    return {
      presignedUrl,
      fileKey,
      publicUrl: `${this.publicBase}/${fileKey}`,
    }
  }
}
