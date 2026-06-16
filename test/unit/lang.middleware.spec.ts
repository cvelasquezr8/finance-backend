import { Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import { LangMiddleware } from '../../src/interface/middlewares/lang.middleware'

jest.mock('jsonwebtoken')

function req(headers: Record<string, string>): Request & Record<string, unknown> {
  return { headers } as unknown as Request & Record<string, unknown>
}

describe('LangMiddleware', () => {
  let mw: LangMiddleware
  const next = jest.fn()
  const res = {} as Response

  beforeEach(() => {
    mw = new LangMiddleware()
    ;(jwt.decode as jest.Mock).mockReturnValue(null)
    next.mockClear()
  })

  it('uses the JWT lang claim when present', () => {
    ;(jwt.decode as jest.Mock).mockReturnValue({ lang: 'en' })
    const r = req({ authorization: 'Bearer x' })
    mw.use(r, res, next)
    expect(r['lang']).toBe('en')
    expect(next).toHaveBeenCalled()
  })

  it('falls back to Accept-Language', () => {
    const r = req({ 'accept-language': 'en-US,en;q=0.9' })
    mw.use(r, res, next)
    expect(r['lang']).toBe('en')
  })

  it('defaults to es', () => {
    const r = req({})
    mw.use(r, res, next)
    expect(r['lang']).toBe('es')
  })
})
