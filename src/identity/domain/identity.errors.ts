import {
  AuthenticationError,
  ConflictError,
  InvalidInputError,
  NotFoundError,
  TooManyRequestsError,
} from '../../shared/domain/domain-error';

export class InvalidEmailError extends InvalidInputError {
  readonly code = 'INVALID_EMAIL';

  constructor() {
    super('El correo electrónico no es válido');
  }
}

export class EmailAlreadyRegisteredError extends ConflictError {
  readonly code = 'EMAIL_ALREADY_REGISTERED';

  constructor() {
    super('Ya existe una cuenta registrada con este correo electrónico');
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  readonly code = 'INVALID_CREDENTIALS';

  constructor() {
    super('Correo electrónico o contraseña incorrectos');
  }
}

export class MissingTokenError extends AuthenticationError {
  readonly code = 'MISSING_TOKEN';

  constructor() {
    super('Debes enviar un token de acceso en el header Authorization');
  }
}

export class InvalidTokenError extends AuthenticationError {
  readonly code = 'INVALID_TOKEN';

  constructor() {
    super('El token de acceso es inválido o ha expirado');
  }
}

export class TooManyLoginAttemptsError extends TooManyRequestsError {
  readonly code = 'TOO_MANY_LOGIN_ATTEMPTS';

  constructor() {
    super('Demasiados intentos fallidos de inicio de sesión, inténtalo de nuevo más tarde');
  }
}

export class UserNotFoundError extends NotFoundError {
  readonly code = 'USER_NOT_FOUND';

  constructor() {
    super('No existe un usuario con ese correo electrónico');
  }
}
