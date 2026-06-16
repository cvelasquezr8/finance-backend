import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { FileStorageService } from '../../src/infrastructure/storage/file-storage.service'

describe('FileStorageService', () => {
  let service: FileStorageService
  let jwt: { sign: jest.Mock; verify: jest.Mock }

  beforeEach(async () => {
    jwt = {
      sign: jest.fn().mockReturnValue('signed-token'),
      verify: jest.fn().mockReturnValue({ filename: 'r.pdf', userId: 'u1' }),
    }
    const config = {
      get: jest.fn((k: string) => (k === 'app.app.port' ? 3000 : 'secret')),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileStorageService,
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
      ],
    }).compile()
    service = module.get(FileStorageService)
  })

  it('builds a signed url that embeds filename and token', () => {
    const url = service.generateSignedUrl('r.pdf', 'u1')
    expect(url).toContain('/files/receipts/r.pdf')
    expect(url).toContain('token=signed-token')
    expect(jwt.sign).toHaveBeenCalled()
  })

  it('validates a token and returns its payload', () => {
    expect(service.validateToken('signed-token')).toEqual({ filename: 'r.pdf', userId: 'u1' })
  })

  it('resolves the file path under receipts', () => {
    expect(service.getFilePath('r.pdf').replace(/\\/g, '/')).toContain('receipts/r.pdf')
  })
})
