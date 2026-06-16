import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { UserRepository } from '@domain/repositories'
import { PrismaService } from '@infrastructure/database'

interface RefreshPayload {
  sub: string
  email: string
  role: string
  lang?: string
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService
  ) {}

  async execute(refreshToken: string | undefined): Promise<{ token: string; expiresIn: number }> {
    if (!refreshToken) throw new UnauthorizedException('Missing refresh token')

    let payload: RefreshPayload
    try {
      payload = await this.jwtService.verifyAsync<RefreshPayload>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      })
    } catch {
      throw new UnauthorizedException('Invalid refresh token')
    }

    const stored = await this.prisma.refreshToken.findUnique({ where: { token: refreshToken } })
    if (!stored || stored.revokedAt || stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token revoked or expired')
    }

    const user = await this.userRepo.findById(payload.sub)
    if (!user || user.status !== 'active') throw new UnauthorizedException('Account is inactive')

    const token = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role, lang: user.language },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: (this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m') as unknown as number,
      }
    )
    return { token, expiresIn: 900 }
  }
}
