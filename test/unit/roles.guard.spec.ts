import { ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { RolesGuard } from '../../src/interface/guards/roles.guard'

function ctx(user: unknown): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext
}

describe('RolesGuard', () => {
  let reflector: Reflector
  let guard: RolesGuard

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector
    guard = new RolesGuard(reflector)
  })

  it('allows when no roles metadata is present', () => {
    ;(reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined)
    expect(guard.canActivate(ctx({ role: 'USER' }))).toBe(true)
  })

  it('allows when the user role matches', () => {
    ;(reflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN'])
    expect(guard.canActivate(ctx({ role: 'ADMIN' }))).toBe(true)
  })

  it('forbids when the user role is insufficient', () => {
    ;(reflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN'])
    expect(() => guard.canActivate(ctx({ role: 'USER' }))).toThrow(ForbiddenException)
  })
})
