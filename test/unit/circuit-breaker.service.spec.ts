import { CircuitBreakerService } from '../../src/shared/circuit-breaker/circuit-breaker.service'

describe('CircuitBreakerService', () => {
  let cb: CircuitBreakerService

  beforeEach(() => {
    cb = new CircuitBreakerService()
  })

  it('runs successfully and stays CLOSED', async () => {
    const res = await cb.run('svc', () => Promise.resolve('ok'))
    expect(res).toBe('ok')
    expect(cb.getState('svc')).toBe('CLOSED')
  })

  it('opens after reaching the failure threshold', async () => {
    const cfg = { failureThreshold: 2, recoveryTimeout: 30_000, callTimeout: 1_000 }
    const boom = () => Promise.reject(new Error('boom'))
    await expect(cb.run('svc', boom, cfg)).rejects.toThrow('boom')
    await expect(cb.run('svc', boom, cfg)).rejects.toThrow('boom')
    expect(cb.getState('svc')).toBe('OPEN')
  })

  it('rejects immediately while OPEN', async () => {
    const cfg = { failureThreshold: 1, recoveryTimeout: 30_000, callTimeout: 1_000 }
    await expect(cb.run('svc', () => Promise.reject(new Error('x')), cfg)).rejects.toThrow()
    await expect(cb.run('svc', () => Promise.resolve('never'), cfg)).rejects.toThrow(/OPEN/)
  })
})
