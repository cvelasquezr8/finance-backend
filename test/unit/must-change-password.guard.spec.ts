import { ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { MustChangePasswordGuard } from '../../src/interface/guards/must-change-password.guard'

function ctx(user: unknown): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext
}

describe('MustChangePasswordGuard', () => {
  let reflector: Reflector
  let guard: MustChangePasswordGuard

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector
    guard = new MustChangePasswordGuard(reflector)
  })

  it('allows routes flagged @AllowDuringPasswordReset', () => {
    ;(reflector.getAllAndOverride as jest.Mock).mockReturnValue(true)
    expect(guard.canActivate(ctx({ mustChangePassword: true }))).toBe(true)
  })

  it('blocks when the user must change their password', () => {
    ;(reflector.getAllAndOverride as jest.Mock).mockReturnValue(false)
    expect(() => guard.canActivate(ctx({ mustChangePassword: true }))).toThrow(ForbiddenException)
  })

  it('allows a normal user', () => {
    ;(reflector.getAllAndOverride as jest.Mock).mockReturnValue(false)
    expect(guard.canActivate(ctx({ mustChangePassword: false }))).toBe(true)
  })

  it('allows when there is no authenticated user (public route)', () => {
    ;(reflector.getAllAndOverride as jest.Mock).mockReturnValue(false)
    expect(guard.canActivate(ctx(undefined))).toBe(true)
  })
})
