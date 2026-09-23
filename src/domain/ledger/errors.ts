export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class LedgerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LedgerError';
  }
}

export class LedgerDomainError extends LedgerError {
  constructor(message: string) {
    super(message);
    this.name = 'LedgerDomainError';
  }
}

export class EntityNotFoundError extends LedgerDomainError {
  constructor(entityName: string, id: string) {
    super(`${entityName} not found: ${id}`);
    this.name = 'EntityNotFoundError';
  }
}

export class EntityIntegrityError extends LedgerDomainError {
  constructor(message: string) {
    super(message);
    this.name = 'EntityIntegrityError';
  }
}

export class ProtectedEntityError extends LedgerDomainError {
  constructor(message: string) {
    super(message);
    this.name = 'ProtectedEntityError';
  }
}

