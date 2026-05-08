import { Injectable, LoggerService, Scope } from '@nestjs/common'
import dayjs from 'dayjs'

export interface LogContext {
  userId?: string
  ip?: string
  path?: string
  method?: string
  requestId?: string
  executionTimeMs?: number
  [key: string]: unknown
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

@Injectable({ scope: Scope.DEFAULT })
export class AppLogger implements LoggerService {
  private context = 'App'

  setContext(context: string) {
    this.context = context
    return this
  }

  log(message: string, ctx?: LogContext) {
    this.write('info', message, ctx)
  }

  error(message: string, trace?: string, ctx?: LogContext) {
    this.write('error', message, { ...ctx, stack: trace })
  }

  warn(message: string, ctx?: LogContext) {
    this.write('warn', message, ctx)
  }

  debug(message: string, ctx?: LogContext) {
    this.write('debug', message, ctx)
  }

  verbose(message: string, ctx?: LogContext) {
    this.write('debug', message, ctx)
  }

  fatal(message: string, ctx?: LogContext) {
    this.write('fatal', message, ctx)
  }

  private write(level: LogLevel, message: string, ctx?: Record<string, unknown>) {
    const entry = {
      timestamp: dayjs().toISOString(),
      level,
      context: this.context,
      message,
      ...ctx,
    }

    const output = JSON.stringify(entry)

    if (level === 'error' || level === 'fatal') {
      console.error(output)
    } else if (level === 'warn') {
      console.warn(output)
    } else {
      console.log(output)
    }
  }
}
