import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import dayjs from 'dayjs'
import * as argon2 from 'argon2'
import { UserRepository } from '@domain/repositories'
import { PrismaService } from '@infrastructure/database'

export interface AuthResponsePayload {
  token: string
  refreshToken: string
  expiresIn: number
  user: {
    id: string
    email: string
    name: string
    firstName: string
    lastName: string
    middleName?: string | null
    secondLastName?: string | null
    phone?: string | null
    currency: string
    timezone: string
    monthlyNotifications: boolean
    role: string
    status: string
    alias: string
    avatarUrl?: string | null
    language: string
    theme: string
    createdAt: string
  }
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
      secret: this.config.get<string>('database.jwt.accessSecret'),
      expiresIn: (this.config.get<string>('database.jwt.accessExpiresIn') ?? '15m') as any,
    })

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('database.jwt.refreshSecret'),
      expiresIn: (this.config.get<string>('database.jwt.refreshExpiresIn') ?? '7d') as any,
    })

    await (this.prisma as any).refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: dayjs().add(7, 'day').toDate() },
    })

    return {
      token,
      refreshToken,
      expiresIn: 900,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        secondLastName: user.secondLastName,
        phone: user.phone,
        currency: user.currency,
        timezone: user.timezone,
        monthlyNotifications: user.monthlyNotifications,
        role: user.role,
        status: user.status,
        alias: user.alias,
        avatarUrl: user.avatarUrl,
        language: user.language,
        theme: user.theme,
        createdAt: user.createdAt.toISOString(),
      },
    }
  }
}
