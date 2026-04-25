import axios from "axios";

// Tells the mapper which "voice" to use for some error messages.
// Example: 401 means "wrong password" on the login page, but "session expired" everywhere else.
export type ErrorScope = "login" | "register" | "auth" | "default";

// Generic messages we show when nothing more specific is available.
const GENERIC_FALLBACK = "Something went wrong. Please try again.";
const NETWORK_FALLBACK = "Failed to connect to server. Please try again.";

// Words/patterns that mean "this is a developer-only message" — never show these to users.
const UNSAFE_PATTERNS = [
    /TypeError/i,
    /Cast to ObjectId failed/i,
    /ReferenceError/i,
    /SyntaxError/i,
    /CastError/i,
    /ValidationError:/i,
    /MongooseError/i,
    /\bat\s+[A-Za-z<].*\(.*:\d+:\d+\)/,
    /node_modules/i,
    /Cannot read propert/i,
];

// Returns true only if a message is short and clean enough to show users.
function isMessageSafeForUser(message: string): boolean {
    if (!message) return false;
    if (message.length > 160) return false;
    return !UNSAFE_PATTERNS.some(pattern => pattern.test(message));
}

// Try to pull a clean error message out of an axios response body.
function readBackendMessage(rawError: unknown): string | null {
    if (!axios.isAxiosError(rawError)) return null;
    const data = rawError.response?.data as unknown;

    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
        const record = data as Record<string, unknown>;
        if (typeof record.message === "string") return record.message;
        if (typeof record.error === "string") return record.error;
    }
    return null;
}

// Pick a friendly message based on the HTTP status code.
function mapByStatus(status: number, scope: ErrorScope, backendMessage: string | null): string {
    switch (status) {
        case 400:
        case 422:
            return backendMessage && isMessageSafeForUser(backendMessage)
                ? backendMessage
                : "Invalid request. Please check your input and try again.";
        case 401:
            if (scope === "login") return "Email or password is incorrect.";
            if (scope === "register") return "We couldn't register that account. Please try again.";
            return "Your session has expired. Please log in again.";
        case 403:
            return "You don't have permission to perform this action.";
        case 404:
            return "The requested item was not found.";
        case 409:
            return backendMessage && isMessageSafeForUser(backendMessage)
                ? backendMessage
                : "This action conflicts with existing data.";
        case 413:
            return "The file you uploaded is too large.";
        case 429:
            return "Too many requests. Please wait a moment and try again.";
        case 500:
        case 502:
        case 503:
        case 504:
            return "Server error. Please try again later.";
        default:
            if (status >= 500) return "Server error. Please try again later.";
            if (status >= 400) {
                return backendMessage && isMessageSafeForUser(backendMessage)
                    ? backendMessage
                    : GENERIC_FALLBACK;
            }
            return GENERIC_FALLBACK;
    }
}

// Turn any error (axios, JS Error, string, anything) into a short user-safe sentence.
// Note: callers should also call console.error(rawError) to keep the full details for devs.
export function mapErrorToUserMessage(rawError: unknown, scope: ErrorScope = "default"): string {
    // Axios error: probably an HTTP response problem.
    if (axios.isAxiosError(rawError)) {
        // No response means the request never reached the server.
        if (!rawError.response) {
            return NETWORK_FALLBACK;
        }
        const backendMessage = readBackendMessage(rawError);
        return mapByStatus(rawError.response.status, scope, backendMessage);
    }

    // A regular JS Error (TypeError, etc.) is dev-only — show the generic message.
    if (rawError instanceof Error) {
        return GENERIC_FALLBACK;
    }

    // A plain string can be shown if it looks safe.
    if (typeof rawError === "string" && isMessageSafeForUser(rawError)) {
        return rawError;
    }

    return GENERIC_FALLBACK;
}

// Get the HTTP status code from an error, or null if it wasn't an HTTP error.
export function getStatusCode(rawError: unknown): number | null {
    if (axios.isAxiosError(rawError)) {
        return rawError.response?.status ?? null;
    }
    return null;
}

// True if the error means "you need to log in again" (401 or 403).
export function isAuthError(rawError: unknown): boolean {
    const status = getStatusCode(rawError);
    return status === 401 || status === 403;
}
