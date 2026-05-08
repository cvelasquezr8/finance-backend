import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { AdminService } from '@application/admin/use-cases/admin.service'
import { UserRepository } from '@domain/repositories/user.repository'
import { PrismaUserRepository } from '@infrastructure/repositories/prisma-user.repository'

@Module({
  controllers: [AdminController],
  providers: [AdminService, { provide: UserRepository, useClass: PrismaUserRepository }],
})
export class AdminModule {}
