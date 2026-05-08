import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { UserEntity } from '@domain/entities'

/** Extracts the authenticated user from the request object. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserEntity => {
    return ctx.switchToHttp().getRequest<{ user: UserEntity }>().user
  }
)
