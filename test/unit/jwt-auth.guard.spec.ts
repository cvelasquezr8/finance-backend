import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtAuthGuard } from '../../src/interface/guards/jwt-auth.guard'

function ctx(): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext
}

describe('JwtAuthGuard', () => {
  let reflector: Reflector
  let guard: JwtAuthGuard

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector
    guard = new JwtAuthGuard(reflector)
  })

  it('allows @Public routes without invoking passport', () => {
    ;(reflector.getAllAndOverride as jest.Mock).mockReturnValue(true)
    expect(guard.canActivate(ctx())).toBe(true)
  })

  it('handleRequest returns the user when present', () => {
    const user = { id: 'u1' }
    expect(guard.handleRequest(null, user)).toBe(user)
  })

  it('handleRequest throws Unauthorized when no user', () => {
    expect(() => guard.handleRequest(null, null)).toThrow(UnauthorizedException)
  })
})
