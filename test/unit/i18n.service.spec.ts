import { Request } from 'express'
import { I18nService } from '../../src/shared/i18n/i18n.service'

describe('I18nService', () => {
  const i18n = new I18nService()

  it('returns the key itself when no translation exists', () => {
    expect(i18n.t('this.key.does.not.exist', 'es')).toBe('this.key.does.not.exist')
  })

  it('langFromRequest prefers the authenticated user language', () => {
    const req = { user: { language: 'en' }, headers: {} } as unknown as Request
    expect(i18n.langFromRequest(req)).toBe('en')
  })

  it('langFromRequest falls back to Accept-Language', () => {
    const req = { headers: { 'accept-language': 'en-US' } } as unknown as Request
    expect(i18n.langFromRequest(req)).toBe('en')
  })

  it('langFromRequest defaults to es', () => {
    const req = { headers: {} } as unknown as Request
    expect(i18n.langFromRequest(req)).toBe('es')
  })
})
