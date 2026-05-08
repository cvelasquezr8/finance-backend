import { Injectable } from '@nestjs/common'
import { Request } from 'express'
import * as fs from 'fs'
import * as path from 'path'

export type SupportedLang = 'en' | 'es'
export const DEFAULT_LANG: SupportedLang = 'es'

type NestedRecord = { [key: string]: string | NestedRecord }

@Injectable()
export class I18nService {
  private readonly locales: Record<SupportedLang, NestedRecord> = {} as any

  constructor() {
    this.loadLocales()
  }

  /** Translates a dot-notation key with optional interpolation values. */
  t(key: string, lang: SupportedLang = DEFAULT_LANG, vars?: Record<string, string>): string {
    const locale = this.locales[lang] ?? this.locales[DEFAULT_LANG]
    const value = this.resolve(locale, key)
    if (!value) return key
    return vars ? this.interpolate(value, vars) : value
  }

  /** Extracts the preferred language from a request (user > Accept-Language > default). */
  langFromRequest(req: Request): SupportedLang {
    const user = (req as any).user as { language?: string } | undefined
    if (user?.language === 'en' || user?.language === 'es') return user.language
    const header = req.headers['accept-language'] ?? ''
    if (header.startsWith('en')) return 'en'
    return DEFAULT_LANG
  }

  private loadLocales() {
    const dir = path.resolve(__dirname, 'locales')
    const langs: SupportedLang[] = ['en', 'es']
    for (const lang of langs) {
      const file = path.join(dir, `${lang}.json`)
      if (fs.existsSync(file)) {
        this.locales[lang] = JSON.parse(fs.readFileSync(file, 'utf-8')) as NestedRecord
      }
    }
  }

  private resolve(obj: NestedRecord, key: string): string {
    const parts = key.split('.')
    let current: string | NestedRecord = obj
    for (const part of parts) {
      if (typeof current !== 'object' || !(part in current)) return ''
      current = current[part]
    }
    return typeof current === 'string' ? current : ''
  }

  private interpolate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? `{{${key}}}`)
  }
}
