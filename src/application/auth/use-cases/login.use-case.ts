import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import dayjs from 'dayjs'
import * as argon2 from 'argon2'
import { UserRepository } from '@domain/repositories'
import { PrismaService } from '@infrastructure/database'
import { toUserDto, UserDto } from '@application/user/user.mapper'

export interface AuthResponsePayload {
  token: string
  refreshToken: string
  expiresIn: number
  user: UserDto
}

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService
  ) {}

  async execute(email: string, password: string): Promise<AuthResponsePayload> {
    const user = await this.userRepo.findByEmail(email)
    if (!user) throw new UnauthorizedException('Invalid credentials')
    if (user.status !== 'active') throw new UnauthorizedException('Account is inactive or blocked')

    const valid = await argon2.verify(user.passwordHash, password)
    if (!valid) throw new UnauthorizedException('Invalid credentials')

    const payload = { sub: user.id, email: user.email, role: user.role, lang: user.language }

    const token = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: (this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m') as any,
    })

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d') as any,
    })

    await (this.prisma as any).refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: dayjs().add(7, 'day').toDate() },
    })

    return {
      token,
      refreshToken,
      expiresIn: 900,
      user: toUserDto(user),
    }
  }
}
