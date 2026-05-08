import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from '@interface/decorators'
import { UserRole } from '@domain/entities'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!required?.length) return true

    const { user } = context.switchToHttp().getRequest<{ user: { role: UserRole } }>()
    if (!required.includes(user?.role)) {
      throw new ForbiddenException('Insufficient permissions')
    }
    return true
  }
}
