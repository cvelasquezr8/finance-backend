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
