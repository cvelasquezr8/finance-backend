import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Request, Response } from 'express'
import { ConfigService } from '@nestjs/config'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { LoginUseCase } from '@application/auth/use-cases/login.use-case'
import { RegisterUseCase } from '@application/auth/use-cases/register.use-case'
import { ChangePasswordUseCase } from '@application/auth/use-cases/change-password.use-case'
import { RefreshTokenUseCase } from '@application/auth/use-cases/refresh-token.use-case'
import { Public } from '@interface/decorators/public.decorator'
import { CurrentUser } from '@interface/decorators/current-user.decorator'
import { AllowDuringPasswordReset } from '@interface/decorators/allow-during-password-reset.decorator'
import { UserEntity } from '@domain/entities/user.entity'
import { PrismaService } from '@infrastructure/database'

const REFRESH_COOKIE = 'finance_refresh'
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService
  ) {}

  private setRefreshCookie(res: Response, refreshToken: string): void {
    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get<string>('NODE_ENV') === 'production',
      path: '/',
      maxAge: REFRESH_MAX_AGE_MS,
    })
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.loginUseCase.execute(dto.email, dto.password)
    this.setRefreshCookie(res, result.refreshToken)
    return result
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user — account starts blocked until admin approves' })
  async register(@Body() dto: RegisterDto) {
    return this.registerUseCase.execute(dto)
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Issue a new access token from the refresh cookie' })
  async refresh(@Req() req: Request) {
    const cookies = req.cookies as Record<string, string> | undefined
    return this.refreshTokenUseCase.execute(cookies?.[REFRESH_COOKIE])
  }

  @Post('change-password')
  @AllowDuringPasswordReset()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change own password (clears mustChangePassword)' })
  async changePassword(@CurrentUser() user: UserEntity, @Body() dto: ChangePasswordDto) {
    await this.changePasswordUseCase.execute(user.id, dto.currentPassword, dto.newPassword)
  }

  @Post('logout')
  @AllowDuringPasswordReset()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  async logout(@CurrentUser() user: UserEntity, @Res({ passthrough: true }) res: Response) {
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    res.clearCookie(REFRESH_COOKIE, { path: '/' })
  }
}
