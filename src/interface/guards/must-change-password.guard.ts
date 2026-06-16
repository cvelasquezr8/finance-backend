import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ALLOW_DURING_PASSWORD_RESET } from '@interface/decorators/allow-during-password-reset.decorator'
import { UserEntity } from '@domain/entities/user.entity'

/**
 * Blocks every protected route for users who were invited with a temporary
 * password and have not changed it yet. Runs after JwtAuthGuard (needs req.user).
 * Routes marked @AllowDuringPasswordReset (change-password, logout, GET /users/me)
 * stay reachable so the user can complete the reset.
 */
@Injectable()
export class MustChangePasswordGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowed = this.reflector.getAllAndOverride<boolean>(ALLOW_DURING_PASSWORD_RESET, [
      context.getHandler(),
      context.getClass(),
    ])
    if (allowed) return true

    const req = context.switchToHttp().getRequest<{ user?: UserEntity }>()
    if (req.user?.mustChangePassword) {
      throw new ForbiddenException('PASSWORD_CHANGE_REQUIRED')
    }
    return true
  }
}
