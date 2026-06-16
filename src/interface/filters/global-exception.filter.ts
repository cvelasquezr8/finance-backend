import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import { Request, Response } from 'express'
import dayjs from 'dayjs'
import { AppLogger } from '@shared/logger'
import { I18nService, SupportedLang, DEFAULT_LANG } from '@shared/i18n'
import { PrismaService } from '@infrastructure/database'
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

/** Fields that should never be logged even in sanitized form. */
const SENSITIVE_BODY_KEYS = new Set([
  'password',
  'passwordHash',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'token',
  'refreshToken',
  'accessToken',
  'secret',
  'authorization',
  'cvv',
  'cardNumber',
  'pan',
])

/** Returns a deep-sanitized copy of an object, redacting sensitive fields. */
function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || value === undefined) return value
  if (typeof value !== 'object') return value
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => sanitize(v, depth + 1))

  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    result[k] = SENSITIVE_BODY_KEYS.has(k) ? '[REDACTED]' : sanitize(v, depth + 1)
  }
  return result
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new AppLogger()

  constructor(
    private readonly i18n: I18nService,
    private readonly prisma: PrismaService
  ) {
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

    const userId: string | undefined = (req as any).user?.id
    const stack = exception instanceof Error ? exception.stack : undefined
    const errorType =
      exception instanceof Error
        ? exception.constructor.name
        : typeof exception === 'object' && exception !== null
          ? ((exception as any).constructor?.name ?? 'UnknownError')
          : 'UnknownError'

    const logCtx = {
      userId,
      ip: req.ip,
      path: req.path,
      method: req.method,
      statusCode: shape.status,
      errorType,
    }

    // ── Console log ────────────────────────────────────────────────────────────
    if (shape.status >= 500) {
      this.logger.error(`[${shape.status}] ${shape.messageKey}`, stack, logCtx)
    } else {
      this.logger.warn(
        `[${shape.status}] ${shape.code}${shape.details ? ` — ${JSON.stringify(shape.details)}` : ''}`,
        logCtx
      )
    }

    // ── Persist to DB (ALL errors) ──────────────────────────────────────────
    this.persistLog({
      status: shape.status,
      code: shape.code,
      message: exception instanceof Error ? exception.message : String(exception),
      errorType,
      userId,
      req,
      stack,
    })

    // ── HTTP response ──────────────────────────────────────────────────────────
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

  /** Writes the error record to the DB without blocking the HTTP response. */
  private persistLog(params: {
    status: number
    code: string
    message: string
    errorType: string
    userId: string | undefined
    req: Request
    stack: string | undefined
  }) {
    const { status, code, message, errorType, userId, req, stack } = params

    let sanitizedBody: unknown = undefined
    if (req.body && typeof req.body === 'object' && Object.keys(req.body as object).length > 0) {
      sanitizedBody = sanitize(req.body)
    }

    let sanitizedQuery: unknown = undefined
    if (req.query && typeof req.query === 'object' && Object.keys(req.query).length > 0) {
      sanitizedQuery = sanitize(req.query)
    }

    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info'

    this.prisma.errorLog
      .create({
        data: {
          level,
          statusCode: status,
          errorType,
          message: `[${code}] ${message}`,
          context: 'GlobalExceptionFilter',
          userId: userId ?? null,
          ip: req.ip ?? null,
          path: req.path,
          method: req.method,
          stack: stack ?? null,
          requestBody: sanitizedBody !== undefined ? (sanitizedBody as any) : undefined,
          requestQuery: sanitizedQuery !== undefined ? (sanitizedQuery as any) : undefined,
        },
      })
      .catch((err) => {
        // best-effort — never crash the response on logging failure
        this.logger.error('Failed to persist error log to DB', String(err))
      })
  }

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
