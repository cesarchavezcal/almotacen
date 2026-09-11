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
