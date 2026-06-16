import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthController } from './auth.controller'
import { LoginUseCase } from '@application/auth/use-cases/login.use-case'
import { RegisterUseCase } from '@application/auth/use-cases/register.use-case'
import { ChangePasswordUseCase } from '@application/auth/use-cases/change-password.use-case'
import { RefreshTokenUseCase } from '@application/auth/use-cases/refresh-token.use-case'
import { JwtStrategy } from '@infrastructure/auth/jwt.strategy'
import { UserRepository } from '@domain/repositories/user.repository'
import { PrismaUserRepository } from '@infrastructure/repositories/prisma-user.repository'

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RegisterUseCase,
    ChangePasswordUseCase,
    RefreshTokenUseCase,
    JwtStrategy,
    { provide: UserRepository, useClass: PrismaUserRepository },
  ],
  exports: [UserRepository, JwtModule],
})
export class AuthModule {}
