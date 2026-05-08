import { Injectable } from '@nestjs/common'
import { AppLogger } from '@shared/logger'

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

interface CircuitConfig {
  /** Number of consecutive failures before opening the circuit. */
  failureThreshold: number
  /** Milliseconds to wait before moving from OPEN to HALF_OPEN. */
  recoveryTimeout: number
  /** Maximum milliseconds to wait for a single call. */
  callTimeout: number
}

interface CircuitStats {
  state: CircuitState
  failures: number
  lastFailureAt: number | null
  successCount: number
}

const DEFAULT_CONFIG: CircuitConfig = {
  failureThreshold: 5,
  recoveryTimeout: 30_000,
  callTimeout: 5_000,
}

/**
 * Simple in-process circuit breaker.
 *
 * Usage:
 *   const result = await this.circuitBreaker.run('payment-api', () => fetch(...))
 */
@Injectable()
export class CircuitBreakerService {
  private readonly circuits = new Map<string, CircuitStats>()
  private readonly logger = new AppLogger()

  constructor() {
    this.logger.setContext('CircuitBreaker')
  }

  async run<T>(
    name: string,
    fn: () => Promise<T>,
    config: Partial<CircuitConfig> = {}
  ): Promise<T> {
    const cfg = { ...DEFAULT_CONFIG, ...config }
    const stats = this.getOrCreate(name)

    if (stats.state === 'OPEN') {
      const elapsed = Date.now() - (stats.lastFailureAt ?? 0)
      if (elapsed >= cfg.recoveryTimeout) {
        stats.state = 'HALF_OPEN'
        this.logger.warn(`Circuit ${name} moved to HALF_OPEN after ${elapsed}ms`)
      } else {
        throw new Error(
          `Circuit breaker [${name}] is OPEN. Retry in ${cfg.recoveryTimeout - elapsed}ms.`
        )
      }
    }

    try {
      const result = await Promise.race([fn(), this.timeout(cfg.callTimeout, name)])

      this.onSuccess(name, stats)
      return result
    } catch (err) {
      this.onFailure(name, stats, cfg)
      throw err
    }
  }

  getState(name: string): CircuitState {
    return this.circuits.get(name)?.state ?? 'CLOSED'
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private getOrCreate(name: string): CircuitStats {
    if (!this.circuits.has(name)) {
      this.circuits.set(name, {
        state: 'CLOSED',
        failures: 0,
        lastFailureAt: null,
        successCount: 0,
      })
    }
    return this.circuits.get(name)!
  }

  private onSuccess(name: string, stats: CircuitStats) {
    if (stats.state === 'HALF_OPEN') {
      stats.successCount++
      if (stats.successCount >= 2) {
        stats.state = 'CLOSED'
        stats.failures = 0
        stats.successCount = 0
        this.logger.log(`Circuit ${name} CLOSED after recovery`)
      }
    } else {
      stats.failures = 0
    }
  }

  private onFailure(name: string, stats: CircuitStats, cfg: CircuitConfig) {
    stats.failures++
    stats.lastFailureAt = Date.now()
    this.logger.warn(`Circuit ${name} failure ${stats.failures}/${cfg.failureThreshold}`)

    if (stats.failures >= cfg.failureThreshold || stats.state === 'HALF_OPEN') {
      stats.state = 'OPEN'
      stats.successCount = 0
      this.logger.error(`Circuit ${name} OPENED after ${stats.failures} failures`)
    }
  }

  private timeout(ms: number, name: string): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Circuit breaker [${name}] timed out after ${ms}ms`)), ms)
    )
  }
}
