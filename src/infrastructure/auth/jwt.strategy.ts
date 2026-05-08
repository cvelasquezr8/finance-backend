import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { UserRepository } from '@domain/repositories'

export interface JwtPayload {
  sub: string
  email: string
  role: string
  lang?: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly userRepo: UserRepository
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('database.jwt.accessSecret') ?? 'fallback-secret',
    })
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepo.findById(payload.sub)
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('User not found or inactive')
    }
    return user
  }
}
