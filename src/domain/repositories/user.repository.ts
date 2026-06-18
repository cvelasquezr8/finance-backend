import { UserEntity } from '../entities/user.entity'

export abstract class UserRepository {
  abstract findById(id: string): Promise<UserEntity | null>
  abstract findByEmail(email: string): Promise<UserEntity | null>
  abstract findByAlias(alias: string): Promise<UserEntity | null>
  abstract findAll(): Promise<UserEntity[]>
  abstract create(
    data: Omit<UserEntity, 'id' | 'numericId' | 'createdAt' | 'updatedAt' | 'failedLoginAttempts'>
  ): Promise<UserEntity>
  abstract update(id: string, data: Partial<UserEntity>): Promise<UserEntity>
  abstract softDelete(id: string, localTime?: Date): Promise<UserEntity>
}
