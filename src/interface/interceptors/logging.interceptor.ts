import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable, tap } from 'rxjs'
import { Request } from 'express'
import { AppLogger } from '@shared/logger'

/** Logs every HTTP request with method, path, userId, IP, and execution time. */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new AppLogger()

  constructor() {
    this.logger.setContext('HTTP')
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { user?: { id: string } }>()
    const start = Date.now()

    return next.handle().pipe(
      tap(() => {
        this.logger.log(`${req.method} ${req.path}`, {
          userId: req.user?.id,
          ip: req.ip,
          path: req.path,
          method: req.method,
          executionTimeMs: Date.now() - start,
        })
      })
    )
  }
}
