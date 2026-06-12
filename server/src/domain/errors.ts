/** Base class for all expected, domain-level errors (mapped to 4xx responses). */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** A referenced entity does not exist. -> 404 */
export class NotFoundError extends DomainError {}

/** A status change violates the workflow rules. -> 409 */
export class InvalidTransitionError extends DomainError {}

/** Input failed a domain rule (e.g. unknown actor). -> 400 */
export class ValidationError extends DomainError {
  constructor(
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}
