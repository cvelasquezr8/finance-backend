import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import { Request, Response } from 'express'
import dayjs from 'dayjs'
import { AppLogger } from '@shared/logger'
import { I18nService, SupportedLang, DEFAULT_LANG } from '@shared/i18n'
import {
  DomainException,
  EntityNotFoundException,
  DuplicateEntityException,
  BusinessRuleViolationException,
} from '@domain/exceptions'

interface ErrorShape {
  status: number
  code: string
  messageKey: string
  vars?: Record<string, string>
  details?: Record<string, string[]>
}

/** Unified error response envelope sent to clients. */
export interface ErrorEnvelope {
  success: false
  code: string
  message: string
  details: Record<string, string[]> | null
  timestamp: string
  path: string
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new AppLogger()

  constructor(private readonly i18n: I18nService) {
    this.logger.setContext('GlobalExceptionFilter')
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse<Response>()
    const req = ctx.getRequest<Request>()

    const lang: SupportedLang =
      ((req as Request & Record<string, unknown>)['lang'] as SupportedLang) ?? DEFAULT_LANG
    const shape = this.classify(exception)
    const message = this.i18n.t(shape.messageKey, lang, shape.vars)

    const logCtx = {
      userId: (req as any).user?.id,
      ip: req.ip,
      path: req.path,
      method: req.method,
      stack: exception instanceof Error ? exception.stack : undefined,
    }

    if (shape.status >= 500) {
      this.logger.error(`[${shape.status}] ${message}`, (exception as Error)?.stack, logCtx)
    } else {
      this.logger.warn(`[${shape.status}] ${shape.code}`, logCtx)
    }

    const envelope: ErrorEnvelope = {
      success: false,
      code: shape.code,
      message,
      details: shape.details ?? null,
      timestamp: dayjs().toISOString(),
      path: req.path,
    }

    res.status(shape.status).json(envelope)
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private classify(exception: unknown): ErrorShape {
    if (exception instanceof HttpException) {
      return this.fromHttpException(exception)
    }

    if (exception instanceof EntityNotFoundException) {
      return {
        status: HttpStatus.NOT_FOUND,
        code: exception.code,
        messageKey: 'errors.ENTITY_NOT_FOUND',
        vars: { entity: exception.message.split(' with id')[0] },
      }
    }

    if (exception instanceof DuplicateEntityException) {
      return {
        status: HttpStatus.CONFLICT,
        code: exception.code,
        messageKey: 'errors.DUPLICATE_ENTITY',
        vars: {
          entity: exception.message.split(' with this')[0],
          field: exception.message.split('this ')[1] ?? '',
        },
      }
    }

    if (exception instanceof BusinessRuleViolationException) {
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        code: exception.code,
        messageKey: 'errors.BUSINESS_RULE_VIOLATION',
        vars: { message: exception.message },
      }
    }

    if (exception instanceof DomainException) {
      return {
        status: HttpStatus.BAD_REQUEST,
        code: exception.code,
        messageKey: 'errors.UNAUTHORIZED',
      }
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      messageKey: 'errors.INTERNAL_SERVER_ERROR',
    }
  }

  private fromHttpException(exception: HttpException): ErrorShape {
    const status = exception.getStatus()
    const resp = exception.getResponse()

    if (typeof resp === 'object' && resp !== null) {
      const r = resp as Record<string, unknown>
      const rawMessage = r['message']
      const isValidation = Array.isArray(rawMessage)

      return {
        status,
        code: typeof r['error'] === 'string' ? r['error'] : `HTTP_${status}`,
        messageKey: isValidation ? 'errors.VALIDATION' : 'errors.UNAUTHORIZED',
        vars: isValidation ? { details: (rawMessage as string[]).join(', ') } : undefined,
        details: isValidation ? { validation: rawMessage as string[] } : undefined,
      }
    }

    return { status, code: `HTTP_${status}`, messageKey: 'errors.UNAUTHORIZED' }
  }
}
