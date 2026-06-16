import { ExecutionContext, CallHandler } from '@nestjs/common'
import { of, firstValueFrom } from 'rxjs'
import { IdempotencyInterceptor } from '../../src/interface/interceptors/idempotency.interceptor'

function makeCtx(headers: Record<string, string>, method = 'POST') {
  const res = { status: jest.fn(), statusCode: 201 }
  const req = { headers, method, path: '/x', user: { id: 'u1' } }
  const ctx = {
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
  } as unknown as ExecutionContext
  return { ctx, res }
}

describe('IdempotencyInterceptor', () => {
  let prisma: { idempotencyKey: { findUnique: jest.Mock; create: jest.Mock; delete: jest.Mock } }
  let interceptor: IdempotencyInterceptor
  const next: CallHandler = { handle: jest.fn(() => of('FRESH')) }

  beforeEach(() => {
    prisma = {
      idempotencyKey: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
      },
    }
    interceptor = new IdempotencyInterceptor(prisma as never)
    ;(next.handle as jest.Mock).mockClear()
  })

  it('passes through when no idempotency key is present', async () => {
    const { ctx } = makeCtx({})
    const obs = await interceptor.intercept(ctx, next)
    expect(await firstValueFrom(obs)).toBe('FRESH')
    expect(next.handle).toHaveBeenCalled()
  })

  it('returns the cached response for a known, non-expired key', async () => {
    prisma.idempotencyKey.findUnique.mockResolvedValueOnce({
      statusCode: 200,
      response: 'CACHED',
      expiresAt: new Date(Date.now() + 60_000),
    })
    const { ctx, res } = makeCtx({ 'x-idempotency-key': 'k1' })
    const obs = await interceptor.intercept(ctx, next)
    expect(await firstValueFrom(obs)).toBe('CACHED')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(next.handle).not.toHaveBeenCalled()
  })

  it('executes and stores the response for a new key', async () => {
    const { ctx } = makeCtx({ 'x-idempotency-key': 'k2' })
    const obs = await interceptor.intercept(ctx, next)
    expect(await firstValueFrom(obs)).toBe('FRESH')
    expect(prisma.idempotencyKey.create).toHaveBeenCalled()
  })
})
