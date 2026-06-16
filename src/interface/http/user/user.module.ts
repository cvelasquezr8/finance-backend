import { Module } from '@nestjs/common'
import { UserController } from './user.controller'
import { UserProfileService } from '@application/user/use-cases/user-profile.service'
import { UserRepository } from '@domain/repositories/user.repository'
import { PrismaUserRepository } from '@infrastructure/repositories/prisma-user.repository'

@Module({
  controllers: [UserController],
  providers: [UserProfileService, { provide: UserRepository, useClass: PrismaUserRepository }],
})
export class UserModule {}
