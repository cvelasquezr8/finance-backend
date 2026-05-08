import { SetMetadata } from '@nestjs/common'
import { UserRole } from '@domain/entities'

export const ROLES_KEY = 'roles'

/** Restricts a route to the specified roles. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles)
