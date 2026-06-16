import { Injectable } from '@nestjs/common'
import { randomBytes } from 'node:crypto'
import * as argon2 from 'argon2'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { UserRepository } from '@domain/repositories/user.repository'
import { UserRole } from '@domain/entities/user.entity'
import { DuplicateEntityException } from '@domain/exceptions'
import { MailService } from '@infrastructure/mail/mail.service'
import { NOTIFICATION_EVENTS } from '@application/notifications/notification.events'

export interface InviteUserInput {
  email: string
  firstName: string
  lastName: string
  alias: string
  role?: UserRole
}

function generateTempPassword(): string {
  // url-safe random + guaranteed upper/lower/digit so it passes change-password rules
  return `${randomBytes(12).toString('base64url')}A1`
}

@Injectable()
export class InviteUserUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly mail: MailService,
    private readonly emitter: EventEmitter2
  ) {}

  async execute(adminId: string, input: InviteUserInput) {
    const [byEmail, byAlias] = await Promise.all([
      this.userRepo.findByEmail(input.email),
      this.userRepo.findByAlias(input.alias),
    ])
    if (byEmail) throw new DuplicateEntityException('User', 'email')
    if (byAlias) throw new DuplicateEntityException('User', 'alias')

    const tempPassword = generateTempPassword()
    const passwordHash = await argon2.hash(tempPassword)

    const user = await this.userRepo.create({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      middleName: null,
      secondLastName: null,
      phone: null,
      alias: input.alias,
      currency: 'MXN',
      timezone: 'America/Mexico_City',
      language: 'es',
      theme: 'dark',
      avatarUrl: null,
      monthlyNotifications: true,
      role: input.role ?? 'USER',
      status: 'active',
      mustChangePassword: true,
      invitedBy: adminId,
      invitedAt: new Date(),
      deletedAt: null,
      createdLocalTimeAt: null,
      updatedLocalTimeAt: null,
      deletedLocalTimeAt: null,
    })

    await this.mail.sendInvitation(user.email, `${user.firstName} ${user.lastName}`, tempPassword)
    this.emitter.emit(NOTIFICATION_EVENTS.accountInvited, { recipientUserId: user.id })
    return user
  }
}
