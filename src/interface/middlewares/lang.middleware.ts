import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { SupportedLang, DEFAULT_LANG } from '@shared/i18n'
import * as jwt from 'jsonwebtoken'

/**
 * Middleware that reads the preferred language from the JWT payload
 * or the Accept-Language header, then attaches it to `req.lang`.
 *
 * Resolution order: JWT.lang > authenticated user > Accept-Language > default (es)
 */
@Injectable()
export class LangMiddleware implements NestMiddleware {
  use(req: Request & Record<string, unknown>, _res: Response, next: NextFunction) {
    req['lang'] = this.detectLang(req)
    next()
  }

  private detectLang(req: Request): SupportedLang {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (token) {
      try {
        const decoded = jwt.decode(token) as Record<string, unknown> | null
        const lang = decoded?.['lang'] as string | undefined
        if (lang === 'en' || lang === 'es') return lang
      } catch {
        /* ignore decode errors — auth guard will handle invalid tokens */
      }
    }

    const accept = (req.headers['accept-language'] ?? '').toLowerCase()
    if (accept.startsWith('en')) return 'en'

    return DEFAULT_LANG
  }
}
