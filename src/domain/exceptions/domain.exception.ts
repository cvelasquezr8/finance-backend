/** Base class for all domain-level exceptions. */
export class DomainException extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message)
    this.name = 'DomainException'
  }
}

/** Thrown when a requested entity does not exist. */
export class EntityNotFoundException extends DomainException {
  constructor(entity: string, id: string) {
    super(`${entity} with id '${id}' not found`, 'ENTITY_NOT_FOUND')
  }
}

/** Thrown when a business invariant is violated. */
export class BusinessRuleViolationException extends DomainException {
  constructor(message: string) {
    super(message, 'BUSINESS_RULE_VIOLATION')
  }
}

/** Thrown when a caller lacks proper authentication. */
export class UnauthorizedException extends DomainException {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED')
  }
}

/** Thrown when a unique constraint would be violated. */
export class DuplicateEntityException extends DomainException {
  constructor(entity: string, field: string) {
    super(`${entity} with this ${field} already exists`, 'DUPLICATE_ENTITY')
  }
}

/**
 * Thrown on a failed login when the account is still active. Carries how many
 * attempts remain before the account is blocked so the client can warn the user.
 */
export class InvalidCredentialsException extends DomainException {
  constructor(public readonly remaining: number) {
    super('Invalid credentials', 'INVALID_CREDENTIALS')
  }
}

/** Thrown when login is attempted against an account blocked by too many failures. */
export class AccountLockedException extends DomainException {
  constructor() {
    super('Account locked due to too many failed login attempts', 'ACCOUNT_LOCKED')
  }
}

/** Thrown when login is attempted against a newly registered account awaiting admin approval. */
export class AccountPendingException extends DomainException {
  constructor() {
    super('Account pending admin approval', 'ACCOUNT_PENDING')
  }
}
