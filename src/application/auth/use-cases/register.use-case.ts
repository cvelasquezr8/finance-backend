import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import dayjs from 'dayjs'
import * as argon2 from 'argon2'
import { UserRepository } from '@domain/repositories'
import { DuplicateEntityException } from '@domain/exceptions'
import { PrismaService } from '@infrastructure/database'
import { AuthResponsePayload } from './login.use-case'
import { toUserDto } from '@application/user/user.mapper'

export interface RegisterInput {
  firstName: string
  lastName: string
  middleName?: string
  secondLastName?: string
  email: string
  password: string
  alias: string
  phone?: string
}

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService
  ) {}

  async execute(input: RegisterInput): Promise<AuthResponsePayload> {
    const [byEmail, byAlias] = await Promise.all([
      this.userRepo.findByEmail(input.email),
      this.userRepo.findByAlias(input.alias),
    ])

    if (byEmail) throw new DuplicateEntityException('User', 'email')
    if (byAlias) throw new DuplicateEntityException('User', 'alias')

    const passwordHash = await argon2.hash(input.password)

    const user = await this.userRepo.create({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      middleName: input.middleName ?? null,
      secondLastName: input.secondLastName ?? null,
      phone: input.phone ?? null,
      alias: input.alias,
      currency: 'MXN',
      timezone: 'America/Mexico_City',
      language: 'es',
      theme: 'dark',
      avatarUrl: null,
      monthlyNotifications: true,
      role: 'USER',
      status: 'active',
      mustChangePassword: false,
      invitedBy: null,
      invitedAt: null,
      deletedAt: null,
      createdLocalTimeAt: null,
      updatedLocalTimeAt: null,
      deletedLocalTimeAt: null,
    })

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
