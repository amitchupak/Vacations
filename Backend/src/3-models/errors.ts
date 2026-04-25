import { StatusCode } from "./enums";

// Base class for all "the user did something wrong" errors.
// Each subclass adds a specific status code and message.
abstract class ClientError {
    public status: StatusCode;
    public message: string;
    public constructor(status: StatusCode, message: string) {
        this.status = status;
        this.message = message;
    }
}

// Throw when the URL doesn't match any of our routes (404).
export class RouteNotFoundError extends ClientError {
    public constructor(route: string, method: string) {
        super(StatusCode.NotFound, `Route ${route} on method ${method} not found.`);
    }
}

// Throw when a database row with the given id doesn't exist (404).
export class ResourceNotFoundError extends ClientError {
    public constructor(id: number | string) {
        super(StatusCode.NotFound, `id ${id} not found.`);
    }
}

// Throw when input data fails validation (400).
export class ValidationError extends ClientError {
    public constructor(message: string) {
        super(StatusCode.BadRequest, message);
    }
}

// Throw when the request has no/invalid login token (401).
export class UnauthorizedError extends ClientError {
    public constructor(message: string) {
        super(StatusCode.Unauthorized, message);
    }
}

// Throw when the user is logged in but isn't allowed to do this (403).
export class ForbiddenError extends ClientError {
    public constructor(message: string) {
        super(StatusCode.Forbidden, message);
    }
}

// Throw when someone tries to register with an email that's already used.
export class DuplicateEmailError extends ClientError {
    public constructor() {
        super(StatusCode.BadRequest, "Email already registered.");
    }
}

// Throw when email or password is wrong on login.
export class InvalidCredentialsError extends ClientError {
    public constructor() {
        super(StatusCode.Unauthorized, "Invalid email or password.");
    }
}
