import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { EventEmitter2 } from '@nestjs/event-emitter'
import dayjs from 'dayjs'
import * as argon2 from 'argon2'
import { UserRepository } from '@domain/repositories'
import {
  InvalidCredentialsException,
  AccountLockedException,
  AccountPendingException,
} from '@domain/exceptions'
import { PrismaService } from '@infrastructure/database'
import { toUserDto, UserDto } from '@application/user/user.mapper'
import { NOTIFICATION_EVENTS } from '@application/notifications/notification.events'

/** Consecutive failed logins that trigger an automatic account block. */
const MAX_FAILED_LOGIN_ATTEMPTS = 3

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
    private readonly prisma: PrismaService,
    private readonly emitter: EventEmitter2
  ) {}

  async execute(email: string, password: string): Promise<AuthResponsePayload> {
    const user = await this.userRepo.findByEmail(email)
    if (!user) throw new UnauthorizedException('Invalid credentials')
    if (user.status === 'blocked') {
      if (user.failedLoginAttempts > 0) throw new AccountLockedException()
      throw new AccountPendingException()
    }
    if (user.status !== 'active') throw new UnauthorizedException('Account is inactive or blocked')

    const valid = await argon2.verify(user.passwordHash, password)
    if (!valid) {
      const next = user.failedLoginAttempts + 1
      if (next >= MAX_FAILED_LOGIN_ATTEMPTS) {
        await this.userRepo.update(user.id, { status: 'blocked', failedLoginAttempts: next })
        this.emitter.emit(NOTIFICATION_EVENTS.accountBlocked, {
          recipientUserId: user.id,
          reason: 'failed_login',
        })
        throw new AccountLockedException()
      }
      await this.userRepo.update(user.id, { failedLoginAttempts: next })
      throw new InvalidCredentialsException(MAX_FAILED_LOGIN_ATTEMPTS - next)
    }

    // Successful login: clear any prior failed-attempt streak.
    if (user.failedLoginAttempts > 0) {
      await this.userRepo.update(user.id, { failedLoginAttempts: 0 })
    }

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
