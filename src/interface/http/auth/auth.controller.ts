import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Request } from 'express'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { LoginUseCase } from '@application/auth/use-cases/login.use-case'
import { RegisterUseCase } from '@application/auth/use-cases/register.use-case'
import { Public } from '@interface/decorators/public.decorator'
import { CurrentUser } from '@interface/decorators/current-user.decorator'
import { UserEntity } from '@domain/entities/user.entity'
import { PrismaService } from '@infrastructure/database'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly prisma: PrismaService
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  async login(@Body() dto: LoginDto) {
    return this.loginUseCase.execute(dto.email, dto.password)
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  async register(@Body() dto: RegisterDto) {
    return this.registerUseCase.execute(dto)
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  async logout(@Req() req: Request, @CurrentUser() user: UserEntity) {
    const authHeader = req.headers.authorization
    const token = authHeader?.replace('Bearer ', '')
    if (token) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      })
    }
  }
}
