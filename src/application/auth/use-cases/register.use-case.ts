import { Injectable } from '@nestjs/common'
import * as argon2 from 'argon2'
import { UserRepository } from '@domain/repositories'
import { DuplicateEntityException } from '@domain/exceptions'

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

export interface RegisterResult {
  message: string
}

@Injectable()
export class RegisterUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(input: RegisterInput): Promise<RegisterResult> {
    const [byEmail, byAlias] = await Promise.all([
      this.userRepo.findByEmail(input.email),
      this.userRepo.findByAlias(input.alias),
    ])

    if (byEmail) throw new DuplicateEntityException('User', 'email')
    if (byAlias) throw new DuplicateEntityException('User', 'alias')

    const passwordHash = await argon2.hash(input.password)

    await this.userRepo.create({
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
      status: 'blocked',
      mustChangePassword: false,
      invitedBy: null,
      invitedAt: null,
      deletedAt: null,
      createdLocalTimeAt: null,
      updatedLocalTimeAt: null,
      deletedLocalTimeAt: null,
    })

    return { message: 'registration_pending' }
  }
}
