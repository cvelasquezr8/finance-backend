import { SetMetadata } from '@nestjs/common'

export const ALLOW_DURING_PASSWORD_RESET = 'allowDuringPasswordReset'

/**
 * Marks a route as reachable while the authenticated user still has
 * `mustChangePassword: true` (e.g. change-password, logout, GET /users/me).
 * Every other protected route is blocked by MustChangePasswordGuard until the
 * temporary password is changed.
 */
export const AllowDuringPasswordReset = () => SetMetadata(ALLOW_DURING_PASSWORD_RESET, true)
