import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable, tap } from 'rxjs'
import { Request, Response } from 'express'
import dayjs from 'dayjs'
import { PrismaService } from '@infrastructure/database'

const IDEMPOTENT_METHODS = new Set(['POST', 'PUT', 'PATCH'])

/**
 * Intercepts requests that include an `x-idempotency-key` header.
 * If a matching key exists and has not expired, returns the cached response.
 * Otherwise, executes the handler and stores the result.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const req = context.switchToHttp().getRequest<Request & { user?: { id: string } }>()
    const res = context.switchToHttp().getResponse<Response>()
    const key = req.headers['x-idempotency-key'] as string | undefined

    if (!key || !IDEMPOTENT_METHODS.has(req.method)) {
      return next.handle()
    }

    const userId = req.user?.id ?? 'anonymous'
    const existing = await this.prisma.idempotencyKey.findUnique({ where: { key } })

    if (existing) {
      if (dayjs().isAfter(dayjs(existing.expiresAt))) {
        await this.prisma.idempotencyKey.delete({ where: { key } })
      } else {
        res.status(existing.statusCode)
        return new Observable((subscriber) => {
          subscriber.next(existing.response)
          subscriber.complete()
        })
      }
    }

    return next.handle().pipe(
      tap((body) => {
        void this.prisma.idempotencyKey.create({
          data: {
            key,
            userId,
            endpoint: `${req.method}:${req.path}`,
            statusCode: res.statusCode,
            response: body as object,
            expiresAt: dayjs().add(24, 'hour').toDate(),
          },
        })
      })
    )
  }
}
