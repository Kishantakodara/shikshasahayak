// ============================================================
// SHIKSHA SAHAYAK OS - STANDARDIZED DOMAIN ERROR CLASSES
// ============================================================

export class ShikshaSahayakBaseError extends Error {
  public statusCode: number;
  public errorCode: string;

  constructor(message: string, statusCode = 500, errorCode = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AuthenticationError extends ShikshaSahayakBaseError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class AuthorizationError extends ShikshaSahayakBaseError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends ShikshaSahayakBaseError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends ShikshaSahayakBaseError {
  public details?: Record<string, unknown>;

  constructor(message = 'Validation failed', details?: Record<string, unknown>) {
    super(message, 400, 'BAD_REQUEST');
    this.details = details;
  }
}
